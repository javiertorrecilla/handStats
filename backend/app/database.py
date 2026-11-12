import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# Conexión a MongoDB con soporte para certificados TLS/SSL en entornos serverless (Vercel) y locales
client = AsyncIOMotorClient(settings.mongo_url, tlsCAFile=certifi.where())
database = client.handstats

# Colecciones
match_collection = database.get_collection("matches")
user_collection = database.get_collection("users")
auth_tokens_collection = database.get_collection("auth_tokens")
error_logs_collection = database.get_collection("error_logs")

