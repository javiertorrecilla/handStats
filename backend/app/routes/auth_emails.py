import json
import re
import secrets
import ssl
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from urllib.request import Request as UrlRequest, urlopen

import certifi
from bson import ObjectId
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel

from app.config import settings
from app.database import auth_tokens_collection, user_collection
from app.services.auth_email_service import (
    EmailServiceError,
    build_app_action_url,
    check_rate_limit,
    create_session_token,
    generate_action_token_pair,
    get_email_service_status,
    hash_action_token,
    hash_password,
    sanitize_auth_origin,
    send_transactional_email,
    verify_password,
    verify_session_token,
)
from app.services.email_templates import (
    build_password_reset_email,
    build_verification_email,
    resolve_lang,
)

router = APIRouter(
    prefix="/auth",
    tags=["Auth & Emails"],
)

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
VERIFY_EMAIL_TTL_HOURS = 24
RESET_PASSWORD_TTL_HOURS = 1


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    lang: Optional[str] = "es"
    origin: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class MigrateLegacyRequest(BaseModel):
    email: str
    password: str
    firebase_id_token: str


class SendVerificationRequest(BaseModel):
    lang: Optional[str] = "es"
    name: Optional[str] = None
    origin: Optional[str] = None


class ConfirmVerificationRequest(BaseModel):
    token: str


class SendPasswordResetRequest(BaseModel):
    email: str
    lang: Optional[str] = "es"
    origin: Optional[str] = None


class ConfirmPasswordResetRequest(BaseModel):
    token: str
    new_password: str


def _serialize_user(doc: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(doc)
    out["_id"] = str(out["_id"])
    out.pop("password_hash", None)
    uid = out.get("firebase_uid") or out["_id"]
    out["uid"] = uid
    out["displayName"] = out.get("name") or out.get("email", "")
    if "email_verified" not in out:
        # Las cuentas legadas/Google previas a la columna explícita mantienen compatibilidad si no eran password pendientes
        out["email_verified"] = out.get("auth_provider") == "google"
    else:
        out["email_verified"] = bool(out["email_verified"])
    return out


def _normalize_utc(dt: Any) -> Optional[datetime]:
    if not isinstance(dt, datetime):
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _is_token_expired(expires_at: Any) -> bool:
    norm = _normalize_utc(expires_at)
    if norm is None:
        return True
    return norm <= datetime.now(timezone.utc)


async def _find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    escaped = re.escape(email.strip())
    return await user_collection.find_one(
        {"email": {"$regex": f"^{escaped}$", "$options": "i"}}
    )


async def _issue_and_send_verification_email(
    *,
    user_doc: Dict[str, Any],
    lang: Optional[str],
    origin: Optional[str],
    preferred_name: Optional[str] = None,
    enforce_rate_limit: bool = True,
) -> Dict[str, Any]:
    email = (user_doc.get("email") or "").strip()
    user_id = str(user_doc["_id"])
    full_name = (preferred_name or "").strip() or user_doc.get("name")

    if enforce_rate_limit:
        check_rate_limit("verify_email", email, cooldown_seconds=30)

    status = get_email_service_status()
    if not status["configured"]:
        raise EmailServiceError(
            "El servicio de correo no está configurado (falta RESEND_API_KEY o SMTP_USER + SMTP_PASSWORD).",
            status_code=503,
            code="email_service_not_configured",
        )

    lang_code = resolve_lang(lang)
    trusted_origin = sanitize_auth_origin(origin)

    raw_token, token_hash = generate_action_token_pair()
    now = datetime.now(timezone.utc)

    # Invalidar enlaces anteriores pendientes para este usuario
    await auth_tokens_collection.update_many(
        {"user_id": user_id, "token_type": "verify_email", "used": False},
        {"$set": {"used": True}},
    )

    await auth_tokens_collection.insert_one(
        {
            "token_hash": token_hash,
            "token_type": "verify_email",
            "user_id": user_id,
            "email": email,
            "expires_at": now + timedelta(hours=VERIFY_EMAIL_TTL_HOURS),
            "used": False,
            "created_at": now,
        }
    )

    action_url = build_app_action_url(
        app_origin=trusted_origin,
        mode="verifyEmail",
        token=raw_token,
        lang=lang_code,
    )

    email_doc = build_verification_email(
        recipient_email=email,
        full_name=full_name,
        action_url=action_url,
        brand_url=settings.app_public_url or trusted_origin,
        lang=lang_code,
    )

    return send_transactional_email(
        to_email=email,
        subject=email_doc["subject"],
        html_body=email_doc["html"],
        text_body=email_doc["text"],
        email_type="email_verification",
    )


async def _get_authenticated_user(authorization: Optional[str]) -> Dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401,
            detail={"message": "Falta el token de sesión Bearer.", "code": "invalid_session_token"},
        )

    raw_token = authorization.split(" ", 1)[1].strip()
    try:
        claims = verify_session_token(raw_token)
    except EmailServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"message": exc.message, "code": exc.code})

    user_doc = None
    sub = claims.get("sub")
    if sub and ObjectId.is_valid(sub):
        user_doc = await user_collection.find_one({"_id": ObjectId(sub)})
    if not user_doc and claims.get("uid"):
        user_doc = await user_collection.find_one({"firebase_uid": claims["uid"]})

    if not user_doc:
        raise HTTPException(status_code=404, detail={"message": "Usuario no encontrado.", "code": "auth/user-not-found"})

    return user_doc


@router.get("/email-status")
async def email_service_status():
    return get_email_service_status()


@router.post("/register")
async def register_independent(payload: RegisterRequest):
    clean_name = " ".join((payload.name or "").strip().split())
    clean_email = (payload.email or "").strip().lower()
    password = payload.password or ""

    if not clean_name:
        raise HTTPException(
            status_code=400,
            detail={"message": "Introduce tu nombre.", "code": "auth/missing-name"},
        )
    if not EMAIL_REGEX.match(clean_email):
        raise HTTPException(
            status_code=400,
            detail={"message": "Correo electrónico inválido.", "code": "auth/invalid-email"},
        )
    if len(password) < 6:
        raise HTTPException(
            status_code=400,
            detail={"message": "La contraseña debe tener al menos 6 caracteres.", "code": "auth/weak-password"},
        )

    existing = await _find_user_by_email(clean_email)
    if existing:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Ya existe una cuenta registrada con este correo electrónico.",
                "code": "auth/email-already-in-use",
            },
        )

    uid = f"hs_{secrets.token_hex(12)}"
    now = datetime.now(timezone.utc)
    doc = {
        "firebase_uid": uid,
        "email": clean_email,
        "name": clean_name,
        "password_hash": hash_password(password),
        "email_verified": False,
        "auth_provider": "password",
        "saved_teams": [],
        "created_at": now,
    }

    result = await user_collection.insert_one(doc)
    created = await user_collection.find_one({"_id": result.inserted_id})

    session_token = create_session_token(
        user_id=str(result.inserted_id),
        uid=uid,
        email=clean_email,
    )

    email_sent = False
    email_provider: Optional[str] = None
    email_error: Optional[str] = None
    email_error_code: Optional[str] = None

    try:
        delivery = await _issue_and_send_verification_email(
            user_doc=created,
            lang=payload.lang,
            origin=payload.origin,
            preferred_name=clean_name,
            enforce_rate_limit=False,
        )
        email_sent = True
        email_provider = delivery.get("provider")
    except EmailServiceError as exc:
        email_error = exc.message
        email_error_code = exc.code

    return {
        "token": session_token,
        "user": _serialize_user(created),
        "email_sent": email_sent,
        "provider": email_provider,
        "email_error": email_error,
        "email_error_code": email_error_code,
    }


@router.post("/login")
async def login_independent(payload: LoginRequest):
    clean_email = (payload.email or "").strip()
    password = payload.password or ""

    if not EMAIL_REGEX.match(clean_email) or not password:
        raise HTTPException(
            status_code=400,
            detail={"message": "Introduce correo y contraseña válidos.", "code": "auth/invalid-credential"},
        )

    user_doc = await _find_user_by_email(clean_email)
    if not user_doc:
        raise HTTPException(
            status_code=401,
            detail={"message": "Correo o contraseña incorrectos.", "code": "auth/invalid-credential"},
        )

    stored_hash = user_doc.get("password_hash")
    if not stored_hash:
        raise HTTPException(
            status_code=401,
            detail={
                "message": "Cuenta previa pendiente de sincronización.",
                "code": "auth/legacy-firebase-account",
            },
        )

    if not verify_password(password, stored_hash):
        raise HTTPException(
            status_code=401,
            detail={"message": "Correo o contraseña incorrectos.", "code": "auth/invalid-credential"},
        )

    uid = user_doc.get("firebase_uid") or str(user_doc["_id"])
    session_token = create_session_token(
        user_id=str(user_doc["_id"]),
        uid=uid,
        email=user_doc["email"],
    )

    return {
        "token": session_token,
        "user": _serialize_user(user_doc),
    }


def _verify_firebase_token_with_web_api(id_token: str) -> Optional[Dict[str, Any]]:
    api_key = (settings.firebase_web_api_key or "").strip()
    if not api_key:
        return None
    req = UrlRequest(
        f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={api_key}",
        data=json.dumps({"idToken": id_token}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    ssl_ctx = ssl.create_default_context(cafile=certifi.where())
    with urlopen(req, timeout=8, context=ssl_ctx) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        users = data.get("users") or []
        return users[0] if users else None


@router.post("/migrate-legacy")
async def migrate_legacy_account(payload: MigrateLegacyRequest):
    """
    Migra transparentemente una cuenta antigua creada en Firebase para que a
    partir de este momento utilice el sistema independiente de Handtix.
    """
    clean_email = (payload.email or "").strip()
    if not payload.firebase_id_token or len(payload.password or "") < 6:
        raise HTTPException(status_code=400, detail={"message": "Datos de migración incompletos.", "code": "invalid_request"})

    user_doc = await _find_user_by_email(clean_email)
    if not user_doc:
        raise HTTPException(status_code=404, detail={"message": "Usuario no encontrado.", "code": "auth/user-not-found"})

    if settings.firebase_web_api_key:
        fb_info = _verify_firebase_token_with_web_api(payload.firebase_id_token)
        if not fb_info or (fb_info.get("email") or "").lower() != user_doc["email"].lower():
            raise HTTPException(status_code=401, detail={"message": "Token inválido.", "code": "invalid_firebase_token"})
        email_verified = bool(fb_info.get("emailVerified", user_doc.get("email_verified", False)))
    else:
        email_verified = bool(user_doc.get("email_verified", False))

    await user_collection.update_one(
        {"_id": user_doc["_id"]},
        {
            "$set": {
                "password_hash": hash_password(payload.password),
                "email_verified": email_verified,
                "auth_provider": "password",
            }
        },
    )
    updated = await user_collection.find_one({"_id": user_doc["_id"]})
    uid = updated.get("firebase_uid") or str(updated["_id"])
    session_token = create_session_token(
        user_id=str(updated["_id"]),
        uid=uid,
        email=updated["email"],
    )
    return {
        "token": session_token,
        "user": _serialize_user(updated),
    }


@router.get("/me")
async def get_current_session_user(authorization: Optional[str] = Header(default=None)):
    user_doc = await _get_authenticated_user(authorization)
    return {"user": _serialize_user(user_doc)}


@router.post("/send-verification")
async def send_verification_email_endpoint(
    payload: SendVerificationRequest,
    authorization: Optional[str] = Header(default=None),
):
    user_doc = await _get_authenticated_user(authorization)
    if user_doc.get("email_verified") is True:
        return {"sent": False, "already_verified": True}

    try:
        delivery = await _issue_and_send_verification_email(
            user_doc=user_doc,
            lang=payload.lang,
            origin=payload.origin,
            preferred_name=payload.name,
            enforce_rate_limit=True,
        )
        return {
            "sent": True,
            "provider": delivery["provider"],
            "message_id": delivery.get("message_id"),
        }
    except EmailServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"message": exc.message, "code": exc.code})


@router.post("/confirm-verification")
async def confirm_verification_endpoint(payload: ConfirmVerificationRequest):
    raw_token = (payload.token or "").strip()
    if not raw_token:
        raise HTTPException(
            status_code=400,
            detail={"message": "Falta el token de verificación.", "code": "auth/invalid-action-code"},
        )

    token_hash = hash_action_token(raw_token)
    now = datetime.now(timezone.utc)

    token_doc = await auth_tokens_collection.find_one(
        {"token_hash": token_hash, "token_type": "verify_email"}
    )
    if not token_doc:
        raise HTTPException(
            status_code=400,
            detail={"message": "El enlace de verificación no es válido.", "code": "auth/invalid-action-code"},
        )

    if token_doc.get("used") is True:
        raise HTTPException(
            status_code=400,
            detail={"message": "Este enlace ya ha sido utilizado.", "code": "auth/invalid-action-code"},
        )

    if _is_token_expired(token_doc.get("expires_at")):
        raise HTTPException(
            status_code=400,
            detail={"message": "Este enlace ha caducado. Solicita uno nuevo.", "code": "auth/expired-action-code"},
        )

    consumed = await auth_tokens_collection.find_one_and_update(
        {"_id": token_doc["_id"], "used": False},
        {"$set": {"used": True, "used_at": now}},
    )
    if not consumed:
        raise HTTPException(
            status_code=400,
            detail={"message": "Este enlace ya ha sido utilizado.", "code": "auth/invalid-action-code"},
        )

    user_id = token_doc.get("user_id")
    if user_id and ObjectId.is_valid(user_id):
        await user_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"email_verified": True}},
        )

    return {
        "verified": True,
        "email": token_doc.get("email"),
    }


@router.post("/send-password-reset")
async def send_password_reset_email_endpoint(payload: SendPasswordResetRequest):
    clean_email = (payload.email or "").strip()
    if not EMAIL_REGEX.match(clean_email):
        raise HTTPException(
            status_code=400,
            detail={"message": "Formato de correo electrónico inválido.", "code": "auth/invalid-email"},
        )

    status = get_email_service_status()
    if not status["configured"]:
        raise HTTPException(
            status_code=503,
            detail={
                "message": "El servicio de correo no está configurado (falta RESEND_API_KEY o SMTP_USER + SMTP_PASSWORD).",
                "code": "email_service_not_configured",
            },
        )

    try:
        check_rate_limit("password_reset", clean_email, cooldown_seconds=30)

        user_doc = await _find_user_by_email(clean_email)
        if not user_doc:
            # Respuesta neutra para evitar enumeración de usuarios
            return {"sent": True, "provider": status["provider"]}

        canonical_email = (user_doc.get("email") or clean_email).strip()
        user_id = str(user_doc["_id"])
        full_name = user_doc.get("name")

        lang_code = resolve_lang(payload.lang)
        trusted_origin = sanitize_auth_origin(payload.origin)

        raw_token, token_hash = generate_action_token_pair()
        now = datetime.now(timezone.utc)

        await auth_tokens_collection.update_many(
            {"user_id": user_id, "token_type": "reset_password", "used": False},
            {"$set": {"used": True}},
        )

        await auth_tokens_collection.insert_one(
            {
                "token_hash": token_hash,
                "token_type": "reset_password",
                "user_id": user_id,
                "email": canonical_email,
                "expires_at": now + timedelta(hours=RESET_PASSWORD_TTL_HOURS),
                "used": False,
                "created_at": now,
            }
        )

        action_url = build_app_action_url(
            app_origin=trusted_origin,
            mode="resetPassword",
            token=raw_token,
            lang=lang_code,
        )

        email_doc = build_password_reset_email(
            recipient_email=canonical_email,
            full_name=full_name,
            action_url=action_url,
            brand_url=settings.app_public_url or trusted_origin,
            lang=lang_code,
        )

        delivery = send_transactional_email(
            to_email=canonical_email,
            subject=email_doc["subject"],
            html_body=email_doc["html"],
            text_body=email_doc["text"],
            email_type="password_reset",
        )

        return {
            "sent": True,
            "provider": delivery["provider"],
            "message_id": delivery.get("message_id"),
        }
    except EmailServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"message": exc.message, "code": exc.code})


@router.get("/verify-reset-token")
async def verify_reset_token_endpoint(token: str = Query(...)):
    raw_token = (token or "").strip()
    if not raw_token:
        raise HTTPException(
            status_code=400,
            detail={"message": "Enlace inválido.", "code": "auth/invalid-action-code"},
        )

    token_doc = await auth_tokens_collection.find_one(
        {"token_hash": hash_action_token(raw_token), "token_type": "reset_password"}
    )
    if not token_doc or token_doc.get("used") is True:
        raise HTTPException(
            status_code=400,
            detail={"message": "Este enlace ya fue utilizado o no es válido.", "code": "auth/invalid-action-code"},
        )

    if _is_token_expired(token_doc.get("expires_at")):
        raise HTTPException(
            status_code=400,
            detail={"message": "Este enlace ha caducado. Solicita uno nuevo.", "code": "auth/expired-action-code"},
        )

    return {
        "valid": True,
        "email": token_doc.get("email"),
    }


@router.post("/confirm-password-reset")
async def confirm_password_reset_endpoint(payload: ConfirmPasswordResetRequest):
    raw_token = (payload.token or "").strip()
    new_password = payload.new_password or ""

    if len(new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail={"message": "La contraseña debe tener al menos 6 caracteres.", "code": "auth/weak-password"},
        )

    if not raw_token:
        raise HTTPException(
            status_code=400,
            detail={"message": "Enlace inválido.", "code": "auth/invalid-action-code"},
        )

    token_hash = hash_action_token(raw_token)
    now = datetime.now(timezone.utc)

    token_doc = await auth_tokens_collection.find_one(
        {"token_hash": token_hash, "token_type": "reset_password"}
    )
    if not token_doc or token_doc.get("used") is True:
        raise HTTPException(
            status_code=400,
            detail={"message": "Este enlace ya fue utilizado o no es válido.", "code": "auth/invalid-action-code"},
        )

    if _is_token_expired(token_doc.get("expires_at")):
        raise HTTPException(
            status_code=400,
            detail={"message": "Este enlace ha caducado.", "code": "auth/expired-action-code"},
        )

    consumed = await auth_tokens_collection.find_one_and_update(
        {"_id": token_doc["_id"], "used": False},
        {"$set": {"used": True, "used_at": now}},
    )
    if not consumed:
        raise HTTPException(
            status_code=400,
            detail={"message": "Este enlace ya fue utilizado.", "code": "auth/invalid-action-code"},
        )

    user_id = token_doc.get("user_id")
    if user_id and ObjectId.is_valid(user_id):
        await user_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "password_hash": hash_password(new_password),
                    "email_verified": True,
                    "auth_provider": "password",
                }
            },
        )

    return {
        "reset": True,
        "email": token_doc.get("email"),
    }
