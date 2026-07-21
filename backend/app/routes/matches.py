from fastapi import APIRouter, HTTPException, status
from app.models import Match, MatchEvent, MatchPossession, MatchPlayer
from app.database import match_collection
from bson import ObjectId
from typing import List

router = APIRouter(prefix="/matches", tags=["Matches"])

# ==========================================================
# CREAR PARTIDO
# ==========================================================

@router.post("/", response_description="Crear un nuevo partido", status_code=status.HTTP_201_CREATED)
async def create_match(match: Match):
    match_dict = match.model_dump(by_alias=True, exclude_none=True)
    if "_id" in match_dict and match_dict["_id"] is None:
        del match_dict["_id"]
        
    new_match = await match_collection.insert_one(match_dict)
    created_match = await match_collection.find_one({"_id": new_match.inserted_id})
    created_match["_id"] = str(created_match["_id"])
    return created_match

# ==========================================================
# OBTENER PARTIDO POR ID
# ==========================================================

@router.get("/{match_id}", response_description="Obtener detalles de un partido")
async def get_match(match_id: str):
    if not ObjectId.is_valid(match_id):
        raise HTTPException(status_code=400, detail="ID de partido inválido")
    match = await match_collection.find_one({"_id": ObjectId(match_id)})
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    match["_id"] = str(match["_id"])
    return match

# ==========================================================
# LISTAR PARTIDOS DE UN USUARIO
# ==========================================================

@router.get("/user/{user_id}", response_description="Listar partidos de un usuario")
async def list_matches_by_user(user_id: str):
    matches = await match_collection.find({"user_id": user_id}).sort("date", -1).to_list(100)
    for match in matches:
        match["_id"] = str(match["_id"])
    return matches

# ==========================================================
# ACTUALIZAR JUGADORES DE UN PARTIDO
# ==========================================================

@router.put("/{match_id}/players", response_description="Actualizar jugadores del partido")
async def update_match_players(
    match_id: str,
    home_players: List[MatchPlayer] = [],
    away_players: List[MatchPlayer] = [],
):
    if not ObjectId.is_valid(match_id):
        raise HTTPException(status_code=400, detail="ID de partido inválido")

    update = {}
    if home_players:
        update["home_players"] = [p.model_dump() for p in home_players]
    if away_players:
        update["away_players"] = [p.model_dump() for p in away_players]

    if not update:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")

    result = await match_collection.update_one(
        {"_id": ObjectId(match_id)},
        {"$set": update}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Partido no encontrado")

    updated = await match_collection.find_one({"_id": ObjectId(match_id)})
    updated["_id"] = str(updated["_id"])
    return updated

# ==========================================================
# ELIMINAR PARTIDO
# ==========================================================

@router.delete("/{match_id}", response_description="Eliminar un partido")
async def delete_match(match_id: str):
    if not ObjectId.is_valid(match_id):
        raise HTTPException(status_code=400, detail="ID de partido inválido")
    delete_result = await match_collection.delete_one({"_id": ObjectId(match_id)})
    if delete_result.deleted_count == 1:
        return {"status": "Partido eliminado con éxito"}
    raise HTTPException(status_code=404, detail="Partido no encontrado")

# ==========================================================
# REGISTRAR EVENTO EN VIVO
# ==========================================================

@router.post("/{match_id}/events", response_description="Registrar un evento en vivo")
async def add_match_event(match_id: str, event: MatchEvent):
    if not ObjectId.is_valid(match_id):
        raise HTTPException(status_code=400, detail="ID de partido inválido")

    match = await match_collection.find_one({"_id": ObjectId(match_id)})
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")

    event_dict = event.model_dump(exclude_none=True)

    # Actualizar marcador si es gol
    match_update = {"$push": {"events": event_dict}}
    if event.event_type == "shot" and event.result == "Gol":
        if event.is_opponent_action:
            match_update["$inc"] = {"goals_away": 1}
        else:
            match_update["$inc"] = {"goals_home": 1}

    await match_collection.update_one({"_id": ObjectId(match_id)}, match_update)

    return {"status": "Evento registrado con éxito"}

# ==========================================================
# REGISTRAR POSESIÓN
# ==========================================================

@router.post("/{match_id}/possessions", response_description="Cerrar y registrar una posesión completa")
async def add_match_possession(match_id: str, possession: MatchPossession):
    if not ObjectId.is_valid(match_id):
        raise HTTPException(status_code=400, detail="ID de partido inválido")
        
    await match_collection.update_one(
        {"_id": ObjectId(match_id)},
        {"$push": {"possessions": possession.model_dump()}}
    )
    return {"status": "Posesión registrada con éxito"}

# ==========================================================
# DESHACER ÚLTIMA ACCIÓN / EVENTO
# ==========================================================

@router.post("/{match_id}/undo", response_description="Deshacer el último evento registrado")
async def undo_last_event(match_id: str):
    if not ObjectId.is_valid(match_id):
        raise HTTPException(status_code=400, detail="ID de partido inválido")

    match = await match_collection.find_one({"_id": ObjectId(match_id)})
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")

    events = match.get("events", [])
    if not events:
        raise HTTPException(status_code=400, detail="No hay eventos para deshacer en este partido")

    # 1. Obtener el último evento
    last_event = events[-1]

    match_update = {}
    
    # 2. Deshacer el gol en el marcador si aplica
    if last_event.get("event_type") == "shot" and last_event.get("result") == "Gol":
        if last_event.get("is_opponent_action"):
            match_update["$inc"] = {"goals_away": -1}
        else:
            match_update["$inc"] = {"goals_home": -1}

    # 3. Eliminar el último evento de la lista de eventos
    match_update["$pop"] = {"events": 1}

    # 4. Comprobar si también se debe eliminar la última posesión
    possessions = match.get("possessions", [])
    if possessions:
        last_possession = possessions[-1]
        if last_possession.get("possession_number") == last_event.get("possession_number"):
            match_update["$pop"]["possessions"] = 1

    # 5. Ejecutar la actualización en MongoDB
    await match_collection.update_one({"_id": ObjectId(match_id)}, match_update)

    # 6. Obtener y devolver el partido actualizado
    updated_match = await match_collection.find_one({"_id": ObjectId(match_id)})
    updated_match["_id"] = str(updated_match["_id"])
    return updated_match