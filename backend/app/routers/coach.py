from fastapi import APIRouter, HTTPException
from langchain_anthropic import ChatAnthropic
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from app.models.schemas import ChatRequest, ChatResponse
from app.tools.supabase_tools import (
    get_recent_sessions, get_athlete_profile,
    get_training_stats, get_wellness_data,
)
from app.config import settings

router = APIRouter(prefix="/coach", tags=["Coach IA"])

SYSTEM_PROMPT = """Eres CoachSkate, un entrenador experto en patinaje de velocidad, ciclismo y preparación física.

Tu rol:
- Analizar los datos de entrenamiento del atleta con precisión deportiva
- Dar recomendaciones específicas y personalizadas basadas en sus datos reales
- Explicar conceptos de patinaje de velocidad (velocistas vs fondistas, pista 200m/400m, ruta abierta)
- Identificar patrones de fatiga, sobreentrenamiento o falta de recuperación
- Sugerir ajustes de carga, tipo de sesión y distribución semanal
- Motivar al atleta con base en sus logros

Siempre usa las herramientas disponibles para consultar datos reales antes de responder.
Responde siempre en español. Sé conciso, técnico y motivador.
"""

tools = [get_recent_sessions, get_athlete_profile, get_training_stats, get_wellness_data]

def build_agent():
    llm = ChatAnthropic(
        model="claude-sonnet-4-6",
        api_key=settings.anthropic_api_key,
        max_tokens=1024,
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])
    agent = create_tool_calling_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=False, max_iterations=4)

@router.post("/chat", response_model=ChatResponse, summary="Chat con Coach IA")
async def chat(req: ChatRequest):
    """
    Envía un mensaje al agente Coach IA.
    El agente consulta los datos de entrenamiento del atleta en Supabase
    y genera recomendaciones personalizadas usando Claude como LLM.
    """
    try:
        executor = build_agent()
        history = []
        for m in req.history[-6:]:  # últimos 6 mensajes para contexto
            if m.role == "user":
                history.append(HumanMessage(content=m.content))
            else:
                history.append(AIMessage(content=m.content))

        result = await executor.ainvoke({
            "input": f"[user_id={req.user_id}] {req.message}",
            "chat_history": history,
        })
        return ChatResponse(reply=result["output"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/weekly-report/{user_id}", summary="Reporte semanal automático")
async def weekly_report(user_id: str):
    """
    Genera un reporte semanal de entrenamiento con insights y recomendaciones
    para la semana siguiente.
    """
    try:
        executor = build_agent()
        result = await executor.ainvoke({
            "input": (
                f"[user_id={user_id}] Genera un reporte semanal completo. "
                "Incluye: resumen de sesiones de los últimos 7 días, análisis de carga, "
                "estado de bienestar, logros destacados y 3 recomendaciones concretas para la próxima semana."
            ),
            "chat_history": [],
        })
        return {"report": result["output"], "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
