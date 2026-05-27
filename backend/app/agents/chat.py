"""ADK Agent + Ollama fallback - no hybrid/minimax."""
import asyncio
import logging
from typing import Optional
from google.adk.runners import Runner
from google.genai import types
from app.agents.physics_agent import get_physics_agent, get_adk_api_key
from app.ollama.client import generate, is_ollama_alive

log = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are AETHER's Physics Reasoning Agent.

You help users understand the physics of mechanisms by:
1. Analyzing what objects move in a video and how they interact
2. Running simulations to predict behavior under different conditions
3. Answering "what if" questions about changing parameters

CONTEXT:
- AETHER analyzes video of mechanisms (pendulums, robot arms, vehicles, drones)
- SAM2 segmentation identifies objects in each frame
- CoTracker3 tracks point trajectories over time
- Pipeline extracts physical parameters (mass, friction, stiffness, damping)
- MJX/MuJoCo simulates the physics

Be concise but thorough. Use numbers when available."""


async def adk_chat(message: str, session_id: Optional[str] = None, user_id: str = "aether_user") -> dict:
    """Chat using the AETHER ADK physics agent (Gemini)."""
    agent = get_physics_agent()

    if agent is None:
        return {"error": "no_adk", "response": "ADK agent not available - set GOOGLE_API_KEY"}

    try:
        app_name = "aether_physics"
        session_key = f"{user_id}_{session_id}" if session_id else user_id

        runner = Runner(agent=agent, app_name=app_name, user_id=user_id)

        content = types.Content(role="user", parts=[types.Part(text=message)])
        response_text = ""

        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_key,
            new_message=content,
        ):
            if hasattr(event, 'text') and event.text:
                response_text += event.text

        if not response_text:
            response_text = "Agent completed but returned no response."

        return {"response": response_text, "agent": "adk", "model": "gemini-2.0-flash"}

    except Exception as e:
        log.error(f"ADK chat failed: {e}")
        return {"error": str(e), "agent": "adk"}


async def ollama_chat(message: str) -> dict:
    """Chat using local Ollama Gemma 4."""
    try:
        ollama_alive = await is_ollama_alive()
        if not ollama_alive:
            return {"error": "ollama_not_running", "response": "Ollama not running. Start with: ollama serve"}

        response = await generate(
            prompt=message,
            model="gemma4:e4b",
            system=SYSTEM_PROMPT,
            temperature=0.7,
            max_tokens=2048,
        )

        return {"response": response, "agent": "ollama", "model": "gemma4:e4b"}

    except Exception as e:
        log.error(f"Ollama chat failed: {e}")
        return {"error": str(e), "agent": "ollama"}


async def chat(message: str, session_id: Optional[str] = None) -> dict:
    """
    Chat - ADK primary, Ollama fallback.

    1. Try ADK agent (Gemini)
    2. If no GOOGLE_API_KEY or error, try Ollama (local Gemma 4)
    3. If Ollama also fails, return error
    """
    # Try ADK first
    if get_adk_api_key():
        try:
            result = await asyncio.wait_for(adk_chat(message, session_id), timeout=60.0)
            if "error" not in result:
                return result
            if result.get("error") != "no_adk":
                # Actual ADK error, try Ollama
                log.warning(f"ADK error: {result.get('error')}, trying Ollama")
        except asyncio.TimeoutError:
            log.warning("ADK timed out, trying Ollama")
        except Exception as e:
            log.warning(f"ADK exception: {e}, trying Ollama")
    else:
        log.info("No GOOGLE_API_KEY, using Ollama fallback")

    # Ollama fallback
    try:
        result = await asyncio.wait_for(ollama_chat(message), timeout=120.0)
        return result
    except asyncio.TimeoutError:
        return {"error": "timeout", "response": "Ollama timed out. Try again."}
    except Exception as e:
        return {"error": str(e), "response": f"All agents failed: {e}"}
