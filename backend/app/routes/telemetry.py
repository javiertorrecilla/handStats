import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Request, status
from pydantic import BaseModel, Field

from app.database import error_logs_collection

logger = logging.getLogger("handtix.telemetry")

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


class TelemetryErrorReport(BaseModel):
    name: Optional[str] = Field(default="Error", max_length=120)
    message: str = Field(..., min_length=1, max_length=600)
    stack: Optional[str] = Field(default=None, max_length=4000)
    component_stack: Optional[str] = Field(default=None, max_length=2500)
    source: Optional[str] = Field(default="app", max_length=80)
    level: Optional[str] = Field(default="error", max_length=20)
    route: Optional[str] = Field(default="", max_length=300)
    user_id: Optional[str] = Field(default=None, max_length=120)
    user_agent: Optional[str] = Field(default=None, max_length=260)
    release: Optional[str] = Field(default="handtix-frontend", max_length=80)
    timestamp: Optional[str] = Field(default=None, max_length=60)


@router.post("/errors", status_code=status.HTTP_202_ACCEPTED)
async def ingest_client_error(payload: TelemetryErrorReport, request: Request):
    """
    Registra errores de ejecución del frontend en logs estructurados del servidor y MongoDB (`error_logs`).
    """
    doc = {
        "name": (payload.name or "Error")[:120],
        "message": payload.message[:600],
        "stack": payload.stack[:4000] if payload.stack else None,
        "component_stack": payload.component_stack[:2500] if payload.component_stack else None,
        "source": (payload.source or "app")[:80],
        "level": (payload.level or "error")[:20],
        "route": (payload.route or "")[:300],
        "user_id": payload.user_id[:120] if payload.user_id else None,
        "user_agent": payload.user_agent[:260] if payload.user_agent else None,
        "release": (payload.release or "handtix-frontend")[:80],
        "client_timestamp": payload.timestamp,
        "client_ip": request.client.host if request.client else None,
        "received_at": datetime.now(timezone.utc),
    }

    logger.error(
        "Client telemetry [%s/%s] route=%s user=%s: %s",
        doc["level"],
        doc["source"],
        doc["route"],
        doc["user_id"] or "anon",
        doc["message"],
    )

    persisted = False
    try:
        await error_logs_collection.insert_one(doc)
        persisted = True
    except Exception as db_exc:
        logger.warning("No se pudo persistir telemetry error en MongoDB: %s", db_exc)

    return {"status": "recorded", "persisted": persisted}

