import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import smtplib
import ssl
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, List, Optional, Tuple
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request as UrlRequest, urlopen

import certifi

from app.config import settings

RESEND_EMAILS_URL = "https://api.resend.com/emails"
VERCEL_PREVIEW_HOST_RE = re.compile(r"^(hand-stats|handtix)(-[a-z0-9-]+)?\.vercel\.app$")

PBKDF2_ITERATIONS = 310_000
SESSION_TOKEN_TTL_SECONDS = 7 * 24 * 3600  # 7 días

# Rate-limit ligero en memoria por (tipo_accion, email)
_RATE_LIMIT_STORE: Dict[Tuple[str, str], float] = {}
_MAX_RATE_LIMIT_ENTRIES = 2000


class EmailServiceError(Exception):
    """Error controlado del servicio independiente de autenticación y correo."""

    def __init__(self, message: str, status_code: int = 500, code: str = "email_service_error"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


# ==========================================================
# SEGURIDAD: HASH DE CONTRASEÑAS Y TOKENS CRIPTOGRÁFICOS
# ==========================================================

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    salt_b64 = base64.urlsafe_b64encode(salt).decode("ascii")
    dk_b64 = base64.urlsafe_b64encode(dk).decode("ascii")
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt_b64}${dk_b64}"


def verify_password(password: str, stored_hash: Optional[str]) -> bool:
    if not stored_hash or not password:
        return False
    try:
        scheme, iter_str, salt_b64, dk_b64 = stored_hash.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False
        iterations = int(iter_str)
        salt = base64.urlsafe_b64decode(salt_b64.encode("ascii"))
        expected_dk = base64.urlsafe_b64decode(dk_b64.encode("ascii"))
        computed_dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(computed_dk, expected_dk)
    except Exception:
        return False


def _get_signing_secret() -> bytes:
    configured = (settings.auth_token_secret or "").strip()
    if configured:
        return hashlib.sha256(configured.encode("utf-8")).digest()
    seed = f"handstats-pro-session:{settings.mongo_url}"
    return hashlib.sha256(seed.encode("utf-8")).digest()


def create_session_token(
    *,
    user_id: str,
    uid: str,
    email: str,
    ttl_seconds: int = SESSION_TOKEN_TTL_SECONDS,
) -> str:
    now = int(time.time())
    payload = {
        "sub": user_id,
        "uid": uid,
        "email": email,
        "iat": now,
        "exp": now + ttl_seconds,
    }
    raw_json = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(raw_json).decode("ascii").rstrip("=")
    sig = hmac.new(_get_signing_secret(), payload_b64.encode("ascii"), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode("ascii").rstrip("=")
    return f"hs_sess.{payload_b64}.{sig_b64}"


def verify_session_token(token: str) -> Dict[str, Any]:
    if not token or not isinstance(token, str):
        raise EmailServiceError("Token de sesión ausente.", status_code=401, code="invalid_session_token")

    parts = token.strip().split(".")
    if len(parts) != 3 or parts[0] != "hs_sess":
        raise EmailServiceError("Formato de token de sesión inválido.", status_code=401, code="invalid_session_token")

    _, payload_b64, sig_b64 = parts
    expected_sig = hmac.new(_get_signing_secret(), payload_b64.encode("ascii"), hashlib.sha256).digest()
    expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode("ascii").rstrip("=")

    if not hmac.compare_digest(sig_b64, expected_sig_b64):
        raise EmailServiceError("Firma de sesión inválida.", status_code=401, code="invalid_session_token")

    padding = "=" * (-len(payload_b64) % 4)
    try:
        payload = json.loads(base64.urlsafe_b64decode(payload_b64 + padding).decode("utf-8"))
    except Exception as exc:
        raise EmailServiceError(f"Payload de sesión corrupto: {exc}", status_code=401, code="invalid_session_token")

    if int(payload.get("exp", 0)) < int(time.time()):
        raise EmailServiceError("La sesión ha caducado.", status_code=401, code="session_expired")

    return payload


def generate_action_token_pair() -> Tuple[str, str]:
    """Devuelve (raw_token_para_email, sha256_hex_para_mongodb)."""
    raw_token = secrets.token_urlsafe(32)
    return raw_token, hash_action_token(raw_token)


def hash_action_token(raw_token: str) -> str:
    return hashlib.sha256((raw_token or "").strip().encode("utf-8")).hexdigest()


# ==========================================================
# VALIDACIÓN DE ORIGEN Y RATE LIMIT
# ==========================================================

def sanitize_auth_origin(origin: Optional[str]) -> str:
    """
    Valida que el origen solicitado pertenezca a Handtix Pro o entorno local,
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
        "https://handtix.vercel.app",
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


def build_app_action_url(*, app_origin: str, mode: str, token: str, lang: str = "es") -> str:
    from urllib.parse import urlencode

    params = urlencode({"mode": mode, "token": token, "lang": lang})
    return f"{app_origin.rstrip('/')}/auth/action?{params}"


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


# ==========================================================
# ENVÍO DE CORREOS INDEPENDIENTE (RESEND O SMTP / GMAIL)
# ==========================================================

def get_email_service_status() -> Dict[str, Any]:
    has_resend = bool((settings.resend_api_key or "").strip())
    has_smtp = bool((settings.smtp_user or "").strip() and (settings.smtp_password or "").strip())

    provider: Optional[str] = None
    if has_resend:
        provider = "resend"
    elif has_smtp:
        provider = "smtp"

    missing: List[str] = []
    if provider is None:
        missing.append("RESEND_API_KEY o SMTP_USER + SMTP_PASSWORD")

    return {
        "configured": provider is not None,
        "provider": provider,
        "missing": missing,
    }


def _send_via_resend(
    *,
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str,
    email_type: str,
) -> Dict[str, Any]:
    api_key = (settings.resend_api_key or "").strip()
    payload: Dict[str, Any] = {
        "from": settings.resend_from_email.strip(),
        "to": [to_email],
        "subject": subject,
        "html": html_body,
        "text": text_body,
        "tags": [
            {"name": "app", "value": "handtix-pro"},
            {"name": "category", "value": email_type},
        ],
    }
    if settings.resend_reply_to and settings.resend_reply_to.strip():
        payload["reply_to"] = settings.resend_reply_to.strip()

    req = UrlRequest(
        RESEND_EMAILS_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Handtix-Pro/2.0",
        },
        method="POST",
    )
    ssl_ctx = ssl.create_default_context(cafile=certifi.where())

    try:
        with urlopen(req, timeout=12, context=ssl_ctx) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw) if raw else {}
            return {"provider": "resend", "message_id": data.get("id")}
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        raise EmailServiceError(
            f"Resend rechazó el envío ({exc.code}): {body}",
            status_code=502,
            code="resend_delivery_error",
        )
    except URLError as exc:
        raise EmailServiceError(
            f"No se pudo conectar con Resend: {exc.reason}",
            status_code=502,
            code="resend_network_error",
        )


def _send_via_smtp(
    *,
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str,
) -> Dict[str, Any]:
    smtp_user = (settings.smtp_user or "").strip()
    smtp_password = (settings.smtp_password or "").strip()
    smtp_host = (settings.smtp_host or "smtp.gmail.com").strip()
    smtp_port = int(settings.smtp_port or 465)
    from_header = (settings.smtp_from_email or f"Handtix Pro <{smtp_user}>").strip()

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_header
    msg["To"] = to_email
    if settings.resend_reply_to and settings.resend_reply_to.strip():
        msg["Reply-To"] = settings.resend_reply_to.strip()

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    ssl_ctx = ssl.create_default_context(cafile=certifi.where())

    try:
        if settings.smtp_use_tls or smtp_port == 587:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                server.ehlo()
                server.starttls(context=ssl_ctx)
                server.ehlo()
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, [to_email], msg.as_string())
        else:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15, context=ssl_ctx) as server:
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, [to_email], msg.as_string())

        return {"provider": "smtp", "message_id": f"smtp:{smtp_host}"}
    except smtplib.SMTPAuthenticationError as exc:
        raise EmailServiceError(
            f"Credenciales SMTP inválidas ({exc.smtp_code}). Verifica SMTP_USER y SMTP_PASSWORD (App Password).",
            status_code=502,
            code="smtp_auth_error",
        )
    except Exception as exc:
        raise EmailServiceError(
            f"Error enviando correo vía SMTP: {exc}",
            status_code=502,
            code="smtp_delivery_error",
        )


def send_transactional_email(
    *,
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str,
    email_type: str,
) -> Dict[str, Any]:
    """
    Envía el correo personalizado por Resend o SMTP (Gmail/Brevo/etc.).
    Nunca delega al servicio genérico de Firebase.
    """
    status = get_email_service_status()
    if not status["configured"]:
        raise EmailServiceError(
            "El servicio de correo aún no tiene credenciales configuradas en backend/.env o Vercel (RESEND_API_KEY o SMTP_USER + SMTP_PASSWORD).",
            status_code=503,
            code="email_service_not_configured",
        )

    if status["provider"] == "resend":
        return _send_via_resend(
            to_email=to_email,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            email_type=email_type,
        )

    return _send_via_smtp(
        to_email=to_email,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
    )
