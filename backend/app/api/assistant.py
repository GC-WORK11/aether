"""Chat / Assistant API — ADK Agent primary, Ollama fallback. No hybrid."""
import asyncio
import logging
from fastapi import APIRouter, Query
from app.agents.chat import chat as do_chat
from app.agents.physics_agent import get_adk_api_key

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


@router.post("/chat")
async def chat(
    message: str = Query(..., description="User message"),
    session_id: str | None = Query(None, description="Session for context"),
):
    """Chat — ADK (Gemini) primary, Ollama (Gemma 4) fallback.

    Priority:
    1. ADK agent with Gemini (requires GOOGLE_API_KEY)
    2. Ollama local Gemma 4 (requires: ollama serve)
    """
    try:
        result = await asyncio.wait_for(do_chat(message=message, session_id=session_id), timeout=120.0)
        return result
    except asyncio.TimeoutError:
        return {"error": "timeout", "response": "All agents timed out. Try again."}
    except Exception as e:
        log.error(f"Chat failed: {e}")
        return {"error": str(e), "response": f"Chat error: {e}"}


@router.get("/chat/status")
async def chat_status():
    """Check which chat backends are available."""
    from app.ollama.client import is_ollama_alive, DEFAULT_MODEL as OLLAMA_MODEL
    from app.knowledge.service import get_knowledge_status

    ollama_alive = await is_ollama_alive()
    kb_status = get_knowledge_status()
    google_key = get_adk_api_key()

    return {
        "adk": {"available": google_key is not None, "model": "gemini-2.0-flash"},
        "ollama": {"available": ollama_alive, "model": OLLAMA_MODEL},
        "knowledge_base": {"initialized": kb_status.get("knowledge_initialized", False), "chunks": kb_status.get("chunk_count", 0)},
    }
