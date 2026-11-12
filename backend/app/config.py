from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    # Conexión principal a MongoDB
    mongo_url: str = Field(default="mongodb://localhost:27017", validation_alias="MONGO_URL")

    # Secreto para firmar tokens de sesión independientes (si no se define, se deriva de MONGO_URL)
    auth_token_secret: Optional[str] = Field(default=None, validation_alias="AUTH_TOKEN_SECRET")

    # Proveedor 1: Resend API (HTTPS)
    resend_api_key: Optional[str] = Field(default=None, validation_alias="RESEND_API_KEY")
    resend_from_email: str = Field(
        default="Handtix Pro <onboarding@resend.dev>",
        validation_alias="RESEND_FROM_EMAIL",
    )
    resend_reply_to: Optional[str] = Field(default=None, validation_alias="RESEND_REPLY_TO")

    # Proveedor 2: SMTP estándar (Gmail App Password, Brevo, Outlook, etc.)
    smtp_host: Optional[str] = Field(default=None, validation_alias="SMTP_HOST")
    smtp_port: int = Field(default=465, validation_alias="SMTP_PORT")
    smtp_user: Optional[str] = Field(default=None, validation_alias="SMTP_USER")
    smtp_password: Optional[str] = Field(default=None, validation_alias="SMTP_PASSWORD")
    smtp_from_email: Optional[str] = Field(default=None, validation_alias="SMTP_FROM_EMAIL")
    smtp_use_tls: bool = Field(default=False, validation_alias="SMTP_USE_TLS")

    # URL pública de la aplicación y orígenes permitidos para enlaces de verificación/recuperación
    app_public_url: str = Field(
        default="https://hand-stats.vercel.app",
        validation_alias="APP_PUBLIC_URL",
    )
    allowed_auth_origins: Optional[str] = Field(
        default=None,
        validation_alias="ALLOWED_AUTH_ORIGINS",
    )

    # Clave web pública opcional solo para migrar contraseñas de cuentas previas en Firebase
    firebase_web_api_key: Optional[str] = Field(default=None, validation_alias="FIREBASE_WEB_API_KEY")

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
