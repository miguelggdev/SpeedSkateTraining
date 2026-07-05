from fastapi import APIRouter, HTTPException, Query
from app.database import get_supabase
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/sessions", tags=["Sesiones"])

class SessionCreate(BaseModel):
    user_id: str
    sport_type: str
    training_type: Optional[str] = None
    athlete_category: Optional[str] = None
    started_at: str
    ended_at: Optional[str] = None
    duration_minutes: Optional[int] = None
    distance_km: Optional[float] = None
    calories: Optional[int] = None
    avg_hr: Optional[int] = None
    max_hr: Optional[int] = None
    speed_avg: Optional[float] = None
    speed_max: Optional[float] = None
    lap_count: Optional[int] = None
    track_type: Optional[str] = None
    rpe: Optional[int] = None
    comments: Optional[str] = None

@router.get("/{user_id}", summary="Listar sesiones de un atleta")
async def list_sessions(
    user_id: str,
    sport: Optional[str] = Query(None, description="Filtrar por deporte: skating|cycling|gym"),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
):
    """Retorna el historial de sesiones de entrenamiento de un atleta con soporte de paginación y filtros."""
    db = get_supabase()
    q = db.table("training_sessions") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("started_at", desc=True) \
        .limit(limit) \
        .offset(offset)
    if sport:
        q = q.eq("sport_type", sport)
    res = q.execute()
    return {"sessions": res.data, "count": len(res.data)}

@router.post("/", summary="Crear sesión de entrenamiento", status_code=201)
async def create_session(body: SessionCreate):
    """Crea una nueva sesión de entrenamiento. Usada por integraciones externas (NFC, apps móviles)."""
    db = get_supabase()
    res = db.table("training_sessions").insert(body.model_dump(exclude_none=True)).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="No se pudo crear la sesión")
    return res.data[0]

@router.get("/{user_id}/stats", summary="Estadísticas agregadas del atleta")
async def athlete_stats(user_id: str):
    """Retorna KPIs agregados: sesiones totales, km acumulados, calorías, tiempo activo."""
    db = get_supabase()
    res = db.table("training_sessions") \
        .select("sport_type,duration_minutes,distance_km,calories") \
        .eq("user_id", user_id) \
        .execute()
    sessions = res.data or []
    by_sport: dict[str, dict] = {}
    total_km = 0.0
    total_min = 0
    total_cal = 0
    for s in sessions:
        sp = s["sport_type"]
        by_sport.setdefault(sp, {"sessions": 0, "km": 0.0, "minutes": 0})
        by_sport[sp]["sessions"] += 1
        by_sport[sp]["km"] += s.get("distance_km") or 0
        by_sport[sp]["minutes"] += s.get("duration_minutes") or 0
        total_km += s.get("distance_km") or 0
        total_min += s.get("duration_minutes") or 0
        total_cal += s.get("calories") or 0
    return {
        "total_sessions": len(sessions),
        "total_km": round(total_km, 2),
        "total_minutes": total_min,
        "total_calories": total_cal,
        "by_sport": by_sport,
    }
