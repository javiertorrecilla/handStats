from pydantic import BaseModel, Field, BeforeValidator
from typing import List, Optional, Annotated, Any, Dict
from datetime import datetime, timezone
from bson import ObjectId

# Representación de un ObjectId de MongoDB como String válido en Pydantic v2
def check_object_id(v: any) -> str:
    if isinstance(v, ObjectId):
        return str(v)
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid ObjectId")
    return str(v)

PyObjectId = Annotated[str, BeforeValidator(check_object_id)]

# ==========================================
# SUB-MODELOS DE JUGADORES
# ==========================================

class SavedPlayer(BaseModel):
    """Jugador guardado en la biblioteca del usuario."""
    name: str
    number: int
    is_goalkeeper: bool = False

class SavedTeam(BaseModel):
    """Equipo guardado en el perfil del usuario para reutilización."""
    name: str
    logo_url: Optional[str] = None
    players: List[SavedPlayer] = []

class MatchPlayer(BaseModel):
    """Jugador dentro de un partido concreto."""
    name: str
    number: int
    is_goalkeeper: bool = False

# ==========================================
# SUB-MODELOS DE ESTADÍSTICAS DETALLADAS
# ==========================================

class ShotDetail(BaseModel):
    goals: int = 0
    attempts: int = 0

class ZoneStats(BaseModel):
    extremo: ShotDetail = ShotDetail()
    pivote: ShotDetail = ShotDetail()
    exterior: ShotDetail = ShotDetail()
    penetracion: ShotDetail = ShotDetail()
    siete_metros: ShotDetail = ShotDetail()
    primera_oleada: ShotDetail = ShotDetail()
    segunda_oleada: ShotDetail = ShotDetail()

class PositionStats(BaseModel):
    muy_izquierda: ShotDetail = ShotDetail()
    izquierda: ShotDetail = ShotDetail()
    centro: ShotDetail = ShotDetail()
    derecha: ShotDetail = ShotDetail()
    muy_derecha: ShotDetail = ShotDetail()

class PlayerDetailedStats(BaseModel):
    player_id: str
    player_name: str
    player_number: int
    is_goalkeeper: bool = False
    goals: int = 0
    shots: int = 0
    assists: int = 0
    turnovers: int = 0
    steals: int = 0
    blocks: int = 0
    yellow_cards: int = 0
    two_min_suspensions: int = 0
    red_cards: int = 0
    blue_cards: int = 0
    saves: int = 0
    goals_conceded: int = 0
    shots_faced: int = 0
    zones: ZoneStats = ZoneStats()
    positions: PositionStats = PositionStats()

class SituationStats(BaseModel):
    posicional: ShotDetail = ShotDetail()
    primera_oleada: ShotDetail = ShotDetail()
    segunda_oleada: ShotDetail = ShotDetail()
    igualdad: ShotDetail = ShotDetail()
    superioridad: ShotDetail = ShotDetail()
    inferioridad: ShotDetail = ShotDetail()

class DisciplinaryStats(BaseModel):
    yellow_cards: int = 0
    two_minutes: int = 0
    red_cards: int = 0
    blue_cards: int = 0

# ==========================================
# MODELO PARTIDO Y EVENTOS (MATCH & EVENTS)
# ==========================================

class MatchEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(ObjectId()))
    event_type: str  
    player_id: Optional[Any] = None  
    player_number: Optional[Any] = None
    player_name: Optional[str] = None
    team: Optional[str] = None
    is_opponent_action: bool = False
    match_time_seconds: int = 0
    
    possession_number: Optional[int] = 1
    play_phase: Optional[str] = "Posicional"  
    numerical_situation: Optional[str] = "Igualdad"  
    
    shot_type: Optional[str] = None  
    shot_position: Optional[str] = None  
    shot_zone: Optional[str] = None
    is_penetration: Optional[bool] = False
    goal_zone: Optional[str] = None
    result: Optional[str] = None  
    target_zone: Optional[str] = None  
    assist_position: Optional[str] = None  
    
    goalkeeper_id: Optional[Any] = None
    goalkeeper_number: Optional[Any] = None
    goalkeeper_name: Optional[str] = None
    shooter_number: Optional[Any] = None
    shooter_name: Optional[str] = None
    rebound: Optional[str] = None
    turnover_type: Optional[str] = None
    
    sanction_type: Optional[str] = None  
    
    turnover_zone_row: Optional[str] = None  
    turnover_zone_col: Optional[str] = None  
    
    # Coordenadas espaciales (0-100%) para Mapas de Calor
    court_x: Optional[float] = None
    court_y: Optional[float] = None
    goal_x: Optional[float] = None
    goal_y: Optional[float] = None
    court_coord: Optional[Dict[str, Any]] = None
    goal_coord: Optional[Dict[str, Any]] = None
    rebound: Optional[str] = None

    class Config:
        extra = "allow"

class MatchPossession(BaseModel):
    possession_number: int
    team: str  
    start_time: int
    end_time: int
    duration: int
    phase: str
    situation: str
    end_reason: str  

class Match(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str  # firebase_uid del usuario propietario
    home_team: str
    away_team: str
    home_players: List[MatchPlayer] = []
    away_players: List[MatchPlayer] = []
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    goals_home: int = 0
    goals_away: int = 0
    
    events: List[MatchEvent] = []
    possessions: List[MatchPossession] = []

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }

# ==========================================
# MODELO USUARIO (USER)
# ==========================================

class User(BaseModel):

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    firebase_uid: str
    email: str
    name: str
    saved_teams: List[SavedTeam] = []

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }