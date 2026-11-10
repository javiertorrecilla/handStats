import base64
import json
import os
import re
import time
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import parse_qs, urlencode, urlparse

from app.config import settings

try:
    import requests as _requests
    from google.auth.transport.requests import Request as _GoogleAuthRequest
    from google.oauth2 import id_token as _google_id_token
    from google.oauth2 import service_account as _google_service_account

    GOOGLE_AUTH_AVAILABLE = True
except ImportError:
    _requests = None
    _GoogleAuthRequest = None
    _google_id_token = None
    _google_service_account = None
    GOOGLE_AUTH_AVAILABLE = False


IDENTITY_TOOLKIT_SCOPES = [
    "https://www.googleapis.com/auth/identitytoolkit",
    "https://www.googleapis.com/auth/firebase.readonly",
]

RESEND_EMAILS_URL = "https://api.resend.com/emails"
VERCEL_PREVIEW_HOST_RE = re.compile(r"^hand-stats(-[a-z0-9-]+)?\.vercel\.app$")

# Rate-limit ligero en memoria por (tipo_accion, email)
_RATE_LIMIT_STORE: Dict[Tuple[str, str], float] = {}
_MAX_RATE_LIMIT_ENTRIES = 2000


class EmailServiceError(Exception):
    """Error controlado del servicio de envío de correos."""

    def __init__(self, message: str, status_code: int = 500, code: str = "email_service_error"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


def _load_service_account_info() -> Optional[Dict[str, Any]]:
    raw = (settings.firebase_service_account_json or "").strip()
    if raw:
        parsed: Optional[Dict[str, Any]] = None
        if raw.startswith("{"):
            parsed = json.loads(raw)
        else:
            try:
                decoded = base64.b64decode(raw).decode("utf-8")
                parsed = json.loads(decoded)
            except Exception as exc:
                raise EmailServiceError(
                    f"FIREBASE_SERVICE_ACCOUNT_JSON no tiene formato JSON o Base64 válido: {exc}",
                    status_code=500,
                    code="invalid_service_account",
                )
        if parsed and isinstance(parsed.get("private_key"), str):
            parsed["private_key"] = parsed["private_key"].replace("\\n", "\n")
        return parsed

    if settings.firebase_client_email and settings.firebase_private_key:
        return {
            "type": "service_account",
            "project_id": settings.firebase_project_id,
            "client_email": settings.firebase_client_email.strip(),
            "private_key": settings.firebase_private_key.replace("\\n", "\n"),
            "token_uri": "https://oauth2.googleapis.com/token",
        }

    gac_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    if gac_path and os.path.isfile(gac_path):
        with open(gac_path, "r", encoding="utf-8") as fh:
            parsed = json.load(fh)
        if parsed and isinstance(parsed.get("private_key"), str):
            parsed["private_key"] = parsed["private_key"].replace("\\n", "\n")
        return parsed

    return None


def get_email_service_status() -> Dict[str, Any]:
    missing: List[str] = []

    if not GOOGLE_AUTH_AVAILABLE:
        missing.append("google-auth / requests")

    if not (settings.resend_api_key or "").strip():
        missing.append("RESEND_API_KEY")

    try:
        sa_info = _load_service_account_info()
        if not sa_info:
            missing.append("FIREBASE_SERVICE_ACCOUNT_JSON")
    except EmailServiceError:
        missing.append("FIREBASE_SERVICE_ACCOUNT_JSON (formato inválido)")

    configured = len(missing) == 0
    return {
        "configured": configured,
        "provider": "resend" if configured else "firebase_default",
        "missing": missing,
    }


def sanitize_auth_origin(origin: Optional[str]) -> str:
    """
    Valida que el origen solicitado pertenezca a HandStats Pro o entorno local,
    evitando open-redirects en los enlaces de verificación y recuperación.
    """
    default_origin = (settings.app_public_url or "https://hand-stats.vercel.app").rstrip("/")
    if not origin or not isinstance(origin, str):
        return default_origin

    parsed = urlparse(origin.strip())
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return default_origin

    candidate = f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
    hostname = (parsed.hostname or "").lower()

    allowed_exact = {
        default_origin,
        "https://hand-stats.vercel.app",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    }

    if settings.allowed_auth_origins:
        for item in settings.allowed_auth_origins.split(","):
            clean_item = item.strip().rstrip("/")
            if clean_item:
                allowed_exact.add(clean_item)

    if candidate in allowed_exact:
        return candidate

    if parsed.scheme == "https" and VERCEL_PREVIEW_HOST_RE.match(hostname):
        return candidate

    return default_origin


def rewrite_oob_link_to_app(oob_link: str, app_origin: str, lang: str = "es") -> str:
    """
    Transforma el enlace oficial de Firebase Identity Toolkit en un enlace
    directo a /auth/action dentro de HandStats Pro preservando mode y oobCode.
    """
    parsed = urlparse(oob_link)
    query = parse_qs(parsed.query)
    oob_code = (query.get("oobCode") or [None])[0]
    mode = (query.get("mode") or [None])[0]

    if not oob_code or not mode:
        return oob_link

    params = {
        "mode": mode,
        "oobCode": oob_code,
        "lang": lang,
    }
    return f"{app_origin.rstrip('/')}/auth/action?{urlencode(params)}"


def check_rate_limit(action_type: str, email: str, cooldown_seconds: int = 30) -> None:
    now = time.time()
    key = (action_type, (email or "").strip().lower())

    if len(_RATE_LIMIT_STORE) >= _MAX_RATE_LIMIT_ENTRIES:
        expired = [k for k, ts in _RATE_LIMIT_STORE.items() if now - ts > cooldown_seconds * 4]
        for k in expired:
            _RATE_LIMIT_STORE.pop(k, None)

    last_sent = _RATE_LIMIT_STORE.get(key)
    if last_sent is not None and (now - last_sent) < cooldown_seconds:
        remaining = max(1, int(cooldown_seconds - (now - last_sent)))
        raise EmailServiceError(
            f"Espera {remaining}s antes de solicitar otro correo.",
            status_code=429,
            code="auth/too-many-requests",
        )

    _RATE_LIMIT_STORE[key] = now


def verify_firebase_id_token(id_token_str: str) -> Dict[str, Any]:
    if not GOOGLE_AUTH_AVAILABLE:
        raise EmailServiceError(
            "Falta google-auth en el backend para verificar el token.",
            status_code=503,
            code="email_service_not_configured",
        )

    project_id = (settings.firebase_project_id or "handstats-ac5fa").strip()
    try:
        decoded = _google_id_token.verify_firebase_token(
            id_token_str,
            _GoogleAuthRequest(),
            audience=project_id,
        )
        return decoded
    except Exception as exc:
        raise EmailServiceError(
            f"Token de Firebase inválido o caducado: {exc}",
            status_code=401,
            code="invalid_firebase_token",
        )


def _get_identity_toolkit_access_token() -> Tuple[str, str]:
    if not GOOGLE_AUTH_AVAILABLE:
        raise EmailServiceError(
            "Dependencia google-auth no disponible.",
            status_code=503,
            code="email_service_not_configured",
        )

    sa_info = _load_service_account_info()
    if not sa_info:
        raise EmailServiceError(
            "Falta FIREBASE_SERVICE_ACCOUNT_JSON.",
            status_code=503,
            code="email_service_not_configured",
        )

    creds = _google_service_account.Credentials.from_service_account_info(
        sa_info,
        scopes=IDENTITY_TOOLKIT_SCOPES,
    )
    creds.refresh(_GoogleAuthRequest())
    project_id = sa_info.get("project_id") or settings.firebase_project_id or "handstats-ac5fa"
    return creds.token, project_id


def lookup_firebase_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    access_token, project_id = _get_identity_toolkit_access_token()
    url = f"https://identitytoolkit.googleapis.com/v1/projects/{project_id}/accounts:lookup"
    resp = _requests.post(
        url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        json={"email": [email]},
        timeout=10,
    )
    if resp.status_code != 200:
        raise EmailServiceError(
            f"Error consultando usuario en Firebase Identity Toolkit ({resp.status_code}).",
            status_code=502,
            code="firebase_lookup_error",
        )
    users = resp.json().get("users") or []
    return users[0] if users else None


def generate_firebase_action_link(
    *,
    request_type: str,
    email: str,
    continue_url: str,
) -> str:
    access_token, project_id = _get_identity_toolkit_access_token()
    url = f"https://identitytoolkit.googleapis.com/v1/projects/{project_id}/accounts:sendOobCode"
    payload = {
        "requestType": request_type,
        "email": email,
        "continueUrl": continue_url,
        "canHandleCodeInApp": True,
        "returnOobLink": True,
    }
    resp = _requests.post(
        url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=10,
    )

    if resp.status_code != 200:
        detail = ""
        try:
            detail = resp.json().get("error", {}).get("message", "")
        except Exception:
            detail = resp.text

        if "EMAIL_NOT_FOUND" in detail:
            raise EmailServiceError("Cuenta no encontrada.", status_code=404, code="auth/user-not-found")
        if "TOO_MANY_ATTEMPTS" in detail or "RESET_PASSWORD_EXCEED_LIMIT" in detail:
            raise EmailServiceError("Demasiados intentos.", status_code=429, code="auth/too-many-requests")

        raise EmailServiceError(
            f"No se pudo generar el enlace oficial de Firebase ({resp.status_code}): {detail}",
            status_code=502,
            code="firebase_oob_error",
        )

    oob_link = resp.json().get("oobLink")
    if not oob_link:
        raise EmailServiceError(
            "Firebase no devolvió el enlace de acción.",
            status_code=502,
            code="firebase_oob_missing",
        )
    return oob_link


def send_via_resend(
    *,
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str,
    email_type: str,
) -> Dict[str, Any]:
    api_key = (settings.resend_api_key or "").strip()
    if not api_key or _requests is None:
        raise EmailServiceError(
            "Servicio Resend no configurado.",
            status_code=503,
            code="email_service_not_configured",
        )

    payload: Dict[str, Any] = {
        "from": settings.resend_from_email.strip(),
        "to": [to_email],
        "subject": subject,
        "html": html_body,
        "text": text_body,
        "tags": [
            {"name": "app", "value": "handstats-pro"},
            {"name": "category", "value": email_type},
        ],
    }

    if settings.resend_reply_to and settings.resend_reply_to.strip():
        payload["reply_to"] = settings.resend_reply_to.strip()

    resp = _requests.post(
        RESEND_EMAILS_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=12,
    )

    if resp.status_code not in (200, 201):
        detail = ""
        try:
            detail = resp.json().get("message") or resp.text
        except Exception:
            detail = resp.text
        raise EmailServiceError(
            f"Resend rechazó el envío ({resp.status_code}): {detail}",
            status_code=502,
            code="resend_delivery_error",
        )

    return resp.json()

