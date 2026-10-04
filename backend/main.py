from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from app.routes import matches, users, pdf_routes

app = FastAPI(
    title="HandStats API",
    description="Backend analítico de balonmano — Analizador de partidos",
    version="2.0.0"
)

# ==========================================================
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# RUTAS
# ==========================================================

# Rutas estándar en la raíz (para entorno local)
app.include_router(matches.router)
app.include_router(users.router)
app.include_router(pdf_routes.router)

# Rutas bajo el prefijo /api (para llamadas directas y Vercel Serverless)
api_router = APIRouter(prefix="/api")
api_router.include_router(matches.router)
api_router.include_router(users.router)
api_router.include_router(pdf_routes.router)
app.include_router(api_router)

# ==========================================================
# ROOT / HEALTH CHECKS
# ==========================================================

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Bienvenido a la API de HandStats v2. Analizador de partidos listo."
    }

@app.get("/api", tags=["Root"])
async def api_root():
    return {
        "message": "Bienvenido a la API de HandStats v2 (Vercel Serverless). Analizador de partidos listo."
    }