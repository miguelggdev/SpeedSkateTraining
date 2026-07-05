from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    user_id: str
    message: str
    history: list[ChatMessage] = []

class ChatResponse(BaseModel):
    reply: str
    sources: list[str] = []

class SessionSummary(BaseModel):
    total_sessions: int
    total_km: float
    total_minutes: int
    avg_speed: Optional[float]
    by_sport: dict[str, int]
    by_training_type: dict[str, int]

class WeeklyReport(BaseModel):
    user_id: str
    week_start: str
    sessions: int
    km: float
    minutes: int
    insights: str
    recommendations: list[str]
