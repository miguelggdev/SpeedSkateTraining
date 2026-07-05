from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import coach, sessions, gfit

app = FastAPI(
    title="SpeedSkateTraining API",
    description="""
## API para la plataforma de entrenamiento de patinaje de velocidad

Endpoints disponibles:
- **Sesiones**: CRUD de sesiones de entrenamiento con filtros y estadísticas
- **Coach IA**: Agente LangChain con Claude que analiza datos reales y da recomendaciones
- **Google Fit**: Sincronización de datos de frecuencia cardíaca y calorías

### Autenticación
Por ahora los endpoints usan `user_id` directamente. En producción se valida el JWT de Supabase.

### Stack
- FastAPI + Uvicorn
- LangChain + Claude (Anthropic)
- Supabase (PostgreSQL + Auth)
    """,
    version="1.0.0",
    contact={"name": "SpeedSkateTraining", "url": "https://skate.arkanatech.tech"},
    license_info={"name": "MIT"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router, prefix="/api/v1")
app.include_router(coach.router,    prefix="/api/v1")
app.include_router(gfit.router,     prefix="/api/v1")

@app.get("/", tags=["Health"], summary="Health check")
async def root():
    return {"status": "ok", "api": "SpeedSkateTraining", "version": "1.0.0", "docs": "/docs"}

@app.get("/health", tags=["Health"], summary="Estado del servidor")
async def health():
    return {"status": "healthy"}
