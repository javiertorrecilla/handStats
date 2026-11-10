from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    # Forzamos a que lea exactamente "MONGO_URL" desde el .env
    mongo_url: str = Field(default="mongodb://localhost:27017", validation_alias="MONGO_URL")

    # Servicio de correo transaccional (Resend + Firebase Admin Identity Toolkit)
    resend_api_key: Optional[str] = Field(default=None, validation_alias="RESEND_API_KEY")
    resend_from_email: str = Field(
        default="HandStats Pro <onboarding@resend.dev>",
        validation_alias="RESEND_FROM_EMAIL",
    )
    resend_reply_to: Optional[str] = Field(default=None, validation_alias="RESEND_REPLY_TO")

    firebase_project_id: str = Field(default="handstats-ac5fa", validation_alias="FIREBASE_PROJECT_ID")
    firebase_service_account_json: Optional[str] = Field(
        default=None,
        validation_alias="FIREBASE_SERVICE_ACCOUNT_JSON",
    )
    firebase_client_email: Optional[str] = Field(
        default=None,
        validation_alias="FIREBASE_CLIENT_EMAIL",
    )
    firebase_private_key: Optional[str] = Field(
        default=None,
        validation_alias="FIREBASE_PRIVATE_KEY",
    )

    app_public_url: str = Field(
        default="https://hand-stats.vercel.app",
        validation_alias="APP_PUBLIC_URL",
    )
    allowed_auth_origins: Optional[str] = Field(
        default=None,
        validation_alias="ALLOWED_AUTH_ORIGINS",
    )

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
