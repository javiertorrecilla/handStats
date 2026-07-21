from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# Conexión a MongoDB
client = AsyncIOMotorClient(settings.mongo_url)
database = client.handstats

# Colecciones
match_collection = database.get_collection("matches")
user_collection = database.get_collection("users")
