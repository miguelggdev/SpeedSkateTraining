from langchain.tools import tool
from app.database import get_supabase
from datetime import datetime, timedelta

@tool
def get_recent_sessions(user_id: str, days: int = 30) -> str:
    """Obtiene las sesiones de entrenamiento recientes del atleta.
    Retorna resumen de sesiones con deporte, duración, distancia y tipo de entrenamiento."""
    db = get_supabase()
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()
    res = db.table("training_sessions") \
        .select("sport_type,training_type,athlete_category,started_at,duration_minutes,distance_km,calories,speed_avg,lap_count,track_type,rpe") \
        .eq("user_id", user_id) \
        .gte("started_at", since) \
        .order("started_at", desc=True) \
        .limit(20) \
        .execute()
    sessions = res.data or []
    if not sessions:
        return f"No hay sesiones en los últimos {days} días."
    lines = []
    for s in sessions:
        date = s["started_at"][:10]
        sport = s.get("sport_type","?")
        ttype = s.get("training_type") or ""
        dur = s.get("duration_minutes")
        dist = s.get("distance_km")
        cal = s.get("calories")
        rpe = s.get("rpe")
        parts = [f"{date} | {sport}"]
        if ttype: parts.append(ttype)
        if dur: parts.append(f"{dur}min")
        if dist: parts.append(f"{dist}km")
        if cal: parts.append(f"{cal}kcal")
        if rpe: parts.append(f"RPE:{rpe}")
        lines.append(" | ".join(parts))
    return "\n".join(lines)

@tool
def get_athlete_profile(user_id: str) -> str:
    """Obtiene el perfil del atleta: categoría, frecuencia cardíaca máxima, peso, etc."""
    db = get_supabase()
    res = db.table("profiles").select("*").eq("id", user_id).single().execute()
    p = res.data
    if not p:
        return "Perfil no encontrado."
    parts = []
    if p.get("full_name"): parts.append(f"Atleta: {p['full_name']}")
    if p.get("category"): parts.append(f"Categoría: {p['category']}")
    if p.get("weight_kg"): parts.append(f"Peso: {p['weight_kg']}kg")
    if p.get("hr_max"): parts.append(f"FC máx: {p['hr_max']}bpm")
    if p.get("years_practice"): parts.append(f"Años práctica: {p['years_practice']}")
    if p.get("skate_club"): parts.append(f"Club: {p['skate_club']}")
    return " | ".join(parts) if parts else "Perfil sin completar."

@tool
def get_training_stats(user_id: str) -> str:
    """Calcula estadísticas agregadas de entrenamiento: totales por deporte, promedios, tendencias."""
    db = get_supabase()
    res = db.table("training_sessions") \
        .select("sport_type,training_type,duration_minutes,distance_km,calories,speed_avg") \
        .eq("user_id", user_id) \
        .execute()
    sessions = res.data or []
    if not sessions:
        return "Sin datos de entrenamiento aún."
    by_sport: dict[str, dict] = {}
    for s in sessions:
        sp = s.get("sport_type", "unknown")
        if sp not in by_sport:
            by_sport[sp] = {"count": 0, "km": 0.0, "min": 0, "cal": 0}
        by_sport[sp]["count"] += 1
        by_sport[sp]["km"] += s.get("distance_km") or 0
        by_sport[sp]["min"] += s.get("duration_minutes") or 0
        by_sport[sp]["cal"] += s.get("calories") or 0
    lines = [f"Total sesiones: {len(sessions)}"]
    for sp, d in by_sport.items():
        lines.append(f"{sp}: {d['count']} sesiones | {round(d['km'],1)}km | {d['min']}min | {d['cal']}kcal")
    return "\n".join(lines)

@tool
def get_wellness_data(user_id: str, days: int = 14) -> str:
    """Obtiene datos de bienestar recientes: sueño, fatiga, humor, energía."""
    db = get_supabase()
    since = (datetime.utcnow() - timedelta(days=days)).date().isoformat()
    res = db.table("daily_wellness") \
        .select("date,sleep_hours,sleep_quality,soreness,mood,energy,hydration") \
        .eq("user_id", user_id) \
        .gte("date", since) \
        .order("date", desc=True) \
        .execute()
    rows = res.data or []
    if not rows:
        return "Sin datos de bienestar registrados."
    lines = []
    for r in rows:
        parts = [r["date"]]
        if r.get("sleep_hours"): parts.append(f"sueño:{r['sleep_hours']}h")
        if r.get("energy"): parts.append(f"energía:{r['energy']}/5")
        if r.get("soreness"): parts.append(f"fatiga:{r['soreness']}/5")
        if r.get("mood"): parts.append(f"humor:{r['mood']}")
        lines.append(" | ".join(parts))
    return "\n".join(lines)
