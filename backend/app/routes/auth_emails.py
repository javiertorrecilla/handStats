import re
from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.database import user_collection
from app.services.auth_email_service import (
    EmailServiceError,
    check_rate_limit,
    generate_firebase_action_link,
    get_email_service_status,
    lookup_firebase_user_by_email,
    rewrite_oob_link_to_app,
    sanitize_auth_origin,
    send_via_resend,
    verify_firebase_id_token,
)
from app.services.email_templates import (
    build_password_reset_email,
    build_verification_email,
    resolve_lang,
)

router = APIRouter(
    prefix="/auth",
    tags=["Auth Emails"],
)

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class SendVerificationRequest(BaseModel):
    lang: Optional[str] = "es"
    name: Optional[str] = None
    origin: Optional[str] = None


class SendPasswordResetRequest(BaseModel):
    email: str
    lang: Optional[str] = "es"
    origin: Optional[str] = None


async def _find_user_name_in_mongo(*, firebase_uid: Optional[str] = None, email: Optional[str] = None) -> Optional[str]:
    try:
        if firebase_uid:
            doc = await user_collection.find_one({"firebase_uid": firebase_uid})
            if doc and doc.get("name"):
                return str(doc["name"])
        if email:
            escaped = re.escape(email.strip())
            doc = await user_collection.find_one({"email": {"$regex": f"^{escaped}$", "$options": "i"}})
            if doc and doc.get("name"):
                return str(doc["name"])
    except Exception:
        return None
    return None


@router.get("/email-status")
async def email_service_status():
    return get_email_service_status()


@router.post("/send-verification")
async def send_verification_email_endpoint(
    payload: SendVerificationRequest,
    authorization: Optional[str] = Header(default=None),
):
    status = get_email_service_status()
    if not status["configured"]:
        return {
            "sent": False,
            "fallback_required": True,
            "provider": "firebase_default",
            "missing": status["missing"],
        }

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Falta el token de autenticación Bearer.")

    id_token = authorization.split(" ", 1)[1].strip()
    if not id_token:
        raise HTTPException(status_code=401, detail="Token Bearer vacío.")

    try:
        claims = verify_firebase_id_token(id_token)
        uid = claims.get("uid") or claims.get("user_id") or claims.get("sub")
        email = (claims.get("email") or "").strip()
        if not email:
            raise HTTPException(status_code=400, detail="La cuenta no tiene correo electrónico asociado.")

        if claims.get("email_verified") is True:
            return {"sent": False, "already_verified": True}

        check_rate_limit("verify_email", email, cooldown_seconds=30)

        mongo_name = await _find_user_name_in_mongo(firebase_uid=uid, email=email)
        full_name = (payload.name or "").strip() or mongo_name or claims.get("name")

        lang_code = resolve_lang(payload.lang)
        trusted_origin = sanitize_auth_origin(payload.origin)
        continue_url = f"{trusted_origin}/auth/action"

        oob_link = generate_firebase_action_link(
            request_type="VERIFY_EMAIL",
            email=email,
            continue_url=continue_url,
        )
        action_url = rewrite_oob_link_to_app(oob_link, trusted_origin, lang_code)

        email_doc = build_verification_email(
            recipient_email=email,
            full_name=full_name,
            action_url=action_url,
            brand_url=settings.app_public_url or trusted_origin,
            lang=lang_code,
        )

        resend_res = send_via_resend(
            to_email=email,
            subject=email_doc["subject"],
            html_body=email_doc["html"],
            text_body=email_doc["text"],
            email_type="email_verification",
        )

        return {
            "sent": True,
            "provider": "resend",
            "message_id": resend_res.get("id"),
        }
    except EmailServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"message": exc.message, "code": exc.code})


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
        return {
            "sent": False,
            "fallback_required": True,
            "provider": "firebase_default",
            "missing": status["missing"],
        }

    try:
        check_rate_limit("password_reset", clean_email, cooldown_seconds=30)

        fb_user = lookup_firebase_user_by_email(clean_email)
        if not fb_user:
            # Respuesta neutra para evitar enumeración de cuentas y proteger cuota
            return {"sent": True, "provider": "resend"}

        canonical_email = (fb_user.get("email") or clean_email).strip()
        mongo_name = await _find_user_name_in_mongo(firebase_uid=fb_user.get("localId"), email=canonical_email)
        full_name = mongo_name or fb_user.get("displayName")

        lang_code = resolve_lang(payload.lang)
        trusted_origin = sanitize_auth_origin(payload.origin)
        continue_url = f"{trusted_origin}/auth/action"

        oob_link = generate_firebase_action_link(
            request_type="PASSWORD_RESET",
            email=canonical_email,
            continue_url=continue_url,
        )
        action_url = rewrite_oob_link_to_app(oob_link, trusted_origin, lang_code)

        email_doc = build_password_reset_email(
            recipient_email=canonical_email,
            full_name=full_name,
            action_url=action_url,
            brand_url=settings.app_public_url or trusted_origin,
            lang=lang_code,
        )

        resend_res = send_via_resend(
            to_email=canonical_email,
            subject=email_doc["subject"],
            html_body=email_doc["html"],
            text_body=email_doc["text"],
            email_type="password_reset",
        )

        return {
            "sent": True,
            "provider": "resend",
            "message_id": resend_res.get("id"),
        }
    except EmailServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"message": exc.message, "code": exc.code})

