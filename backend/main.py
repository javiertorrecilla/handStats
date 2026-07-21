from fastapi import FastAPI
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

app.include_router(matches.router)
app.include_router(users.router)
app.include_router(pdf_routes.router)

# ==========================================================
# ROOT
# ==========================================================

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Bienvenido a la API de HandStats v2. Analizador de partidos listo."
    }