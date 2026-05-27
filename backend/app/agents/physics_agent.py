"""AETHER Physics Agent - Google ADK agent for physics reasoning."""
import os
import logging
from google.adk import Agent
from google.adk.models import Gemini
from app.agents.tools import get_all_tools

log = logging.getLogger(__name__)

# Build instruction with system context
INSTRUCTION = """You are AETHER's Physics Reasoning Agent.

You help users understand the physics of mechanisms by:
1. Analyzing what objects move in a video and how they interact
2. Running simulations to predict behavior under different conditions
3. Answering "what if" questions about changing parameters

CONTEXT:
- AETHER analyzes video of mechanisms (pendulums, robot arms, vehicles, drones, etc.)
- SAM2 segmentation identifies objects in each frame
- CoTracker3 tracks point trajectories over time
- Pipeline extracts physical parameters (mass, friction, stiffness, damping)
- MJX/MuJoCo simulates the physics

When a user asks about a mechanism:
1. Identify what they're asking about (pendulum? robot arm? vehicle?)
2. If they ask "what if" about parameters, use run_physics_simulation
3. If they want to know what was found, use analyze_session or get_learned_parameters
4. Explain results in clear, physical terms

Be concise but thorough. Use numbers when available. If data isn't available, say so.
"""


def get_adk_api_key() -> str | None:
    """Get Google ADK API key from environment."""
    return os.environ.get("GOOGLE_API_KEY") or os.environ.get("GOOGLE_ADK_KEY")


def create_physics_agent() -> Agent:
    """Create the AETHER physics reasoning agent."""
    api_key = get_adk_api_key()

    if not api_key:
        log.warning("No Google API key found - ADK agent will use fallback")
        return None

    tools = get_all_tools()

    agent = Agent(
        model=Gemini(model="gemini-2.0-flash", api_key=api_key),
        name="aether_physics_agent",
        description="Physics reasoning agent for AETHER - analyzes mechanisms and runs simulations",
        instruction=INSTRUCTION,
        tools=tools,
    )

    log.info("AETHER Physics Agent created with Google ADK")
    return agent


# Singleton instance
_physics_agent = None


def get_physics_agent() -> Agent | None:
    """Get or create the physics agent singleton."""
    global _physics_agent
    if _physics_agent is None:
        _physics_agent = create_physics_agent()
    return _physics_agent
