from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # Forzamos a que lea exactamente "MONGO_URL" desde el .env
    mongo_url: str = Field(default="mongodb://localhost:27017", validation_alias="MONGO_URL")

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()