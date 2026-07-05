from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import get_supabase

router = APIRouter(prefix="/gfit", tags=["Google Fit"])

class GFitSyncPayload(BaseModel):
    user_id: str
    session_id: str
    avg_hr: Optional[int] = None
    max_hr: Optional[int] = None
    calories: Optional[int] = None
    steps: Optional[int] = None
    active_minutes: Optional[int] = None

@router.post("/sync", summary="Sincronizar datos de Google Fit a una sesión")
async def sync_gfit(body: GFitSyncPayload):
    """
    Recibe datos sincronizados desde Google Fit (frecuencia cardíaca, calorías, pasos)
    y los actualiza en la sesión de entrenamiento correspondiente.
    El frontend obtiene los datos via Google Fit REST API con OAuth2 y los envía aquí.
    """
    db = get_supabase()
    update = {}
    if body.avg_hr is not None: update["avg_hr"] = body.avg_hr
    if body.max_hr is not None: update["max_hr"] = body.max_hr
    if body.calories is not None: update["calories"] = body.calories
    if not update:
        return {"message": "Nada que actualizar"}
    res = db.table("training_sessions") \
        .update(update) \
        .eq("id", body.session_id) \
        .eq("user_id", body.user_id) \
        .execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    # Mark profile as connected
    db.table("profiles").update({"gfit_connected": True}).eq("id", body.user_id).execute()
    return {"synced": True, "session_id": body.session_id, "fields": list(update.keys())}

@router.get("/status/{user_id}", summary="Estado de conexión Google Fit")
async def gfit_status(user_id: str):
    """Verifica si el atleta tiene Google Fit conectado y cuántas sesiones tienen datos de HR."""
    db = get_supabase()
    profile = db.table("profiles").select("gfit_connected").eq("id", user_id).single().execute()
    connected = profile.data.get("gfit_connected", False) if profile.data else False
    hr_count = db.table("training_sessions") \
        .select("id", count="exact") \
        .eq("user_id", user_id) \
        .not_.is_("avg_hr", "null") \
        .execute()
    return {
        "connected": connected,
        "sessions_with_hr": hr_count.count or 0,
    }
