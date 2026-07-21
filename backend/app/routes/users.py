from fastapi import APIRouter, HTTPException
from bson import ObjectId

from app.database import user_collection
from app.models import User, SavedTeam

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# ==========================================================
# CREAR USUARIO
# ==========================================================

@router.post("/")
async def create_user(user: User):

    exists = await user_collection.find_one(
        {"firebase_uid": user.firebase_uid}
    )

    if exists:
        raise HTTPException(
            status_code=409,
            detail="El usuario ya existe."
        )

    data = user.model_dump(
        by_alias=True,
        exclude_none=True
    )

    result = await user_collection.insert_one(data)

    created = await user_collection.find_one(
        {"_id": result.inserted_id}
    )

    created["_id"] = str(created["_id"])

    return created

# ==========================================================
# OBTENER USUARIO POR FIREBASE UID
# ==========================================================

@router.get("/firebase/{uid}")
async def get_user(uid: str):

    user = await user_collection.find_one(
        {"firebase_uid": uid}
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    user["_id"] = str(user["_id"])

    return user

# ==========================================================
# OBTENER EQUIPOS GUARDADOS
# ==========================================================

@router.get("/{user_id}/saved-teams")
async def get_saved_teams(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="ID de usuario inválido")

    user = await user_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return user.get("saved_teams", [])

# ==========================================================
# GUARDAR EQUIPO NUEVO
# ==========================================================

@router.post("/{user_id}/saved-teams")
async def save_team(user_id: str, team: SavedTeam):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="ID de usuario inválido")

    user = await user_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Comprobar si ya existe un equipo con ese nombre
    existing_teams = user.get("saved_teams", [])
    for t in existing_teams:
        if t.get("name", "").lower() == team.name.lower():
            # Actualizar jugadores del equipo existente
            await user_collection.update_one(
                {
                    "_id": ObjectId(user_id),
                    "saved_teams.name": t["name"]
                },
                {
                    "$set": {
                        "saved_teams.$.players": [p.model_dump() for p in team.players]
                    }
                }
            )
            updated = await user_collection.find_one({"_id": ObjectId(user_id)})
            return updated.get("saved_teams", [])

    # Si no existe, añadir nuevo
    await user_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"saved_teams": team.model_dump()}}
    )

    updated = await user_collection.find_one({"_id": ObjectId(user_id)})
    return updated.get("saved_teams", [])

# ==========================================================
# ACTUALIZAR EQUIPO GUARDADO
# ==========================================================

@router.put("/{user_id}/saved-teams/{team_name}")
async def update_saved_team(user_id: str, team_name: str, team: SavedTeam):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="ID de usuario inválido")

    user = await user_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Si se cambia el nombre del equipo, comprobar si el nuevo nombre ya existe (y no es el mismo)
    if team.name.lower() != team_name.lower():
        for t in user.get("saved_teams", []):
            if t.get("name", "").lower() == team.name.lower():
                raise HTTPException(status_code=400, detail="Ya existe un equipo con ese nombre")

    saved_teams = user.get("saved_teams", [])
    updated = False
    for i, t in enumerate(saved_teams):
        if t.get("name", "").lower() == team_name.lower():
            saved_teams[i] = team.model_dump()
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")

    await user_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"saved_teams": saved_teams}}
    )

    return saved_teams

# ==========================================================

# ELIMINAR EQUIPO GUARDADO
# ==========================================================

@router.delete("/{user_id}/saved-teams/{team_name}")
async def delete_saved_team(user_id: str, team_name: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="ID de usuario inválido")

    user = await user_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    firebase_uid = user.get("firebase_uid")

    import re
    from app.database import match_collection

    escaped_name = re.escape(team_name)

    # 1. Eliminar el equipo de la lista saved_teams (insensible a mayúsculas/minúsculas)
    result = await user_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"saved_teams": {"name": {"$regex": f"^{escaped_name}$", "$options": "i"}}}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")

    # 2. Eliminar en cascada todos los partidos de este equipo para este usuario
    delete_result = await match_collection.delete_many({
        "user_id": firebase_uid,
        "$or": [
            {"home_team": {"$regex": f"^{escaped_name}$", "$options": "i"}},
            {"away_team": {"$regex": f"^{escaped_name}$", "$options": "i"}}
        ]
    })

    return {
        "status": "Equipo eliminado correctamente",
        "deleted_matches_count": delete_result.deleted_count
    }
