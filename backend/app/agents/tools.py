"""AETHER Agent Tools - ADK-compatible tools for physics reasoning."""
import logging
from typing import Any
from google.adk.tools import FunctionTool
from app.physics.universal_simulator import UniversalPhysicsSimulator

log = logging.getLogger(__name__)


def run_physics_simulation(
    mechanism_type: str,
    horizon_seconds: float = 5.0,
    mass_kg: float | None = None,
    friction: float | None = None,
    gravity: float | None = None,
) -> dict:
    """
    Run a physics simulation for a mechanism type.

    Args:
        mechanism_type: Type of mechanism (pendulum, robot_arm, vehicle, drone, etc.)
        horizon_seconds: How long to simulate (default 5 seconds)
        mass_kg: Override mass parameter if known
        friction: Override friction parameter if known
        gravity: Override gravity if known (default 9.81 m/s²)

    Returns:
        Simulation results with trajectory, duration, success status
    """
    try:
        params = {}
        if mass_kg is not None:
            params["mass"] = mass_kg
        if friction is not None:
            params["friction"] = friction
        if gravity is not None:
            params["gravity"] = gravity

        simulator = UniversalPhysicsSimulator()
        result = simulator.simulate(
            mechanism_type=mechanism_type,
            horizon_seconds=horizon_seconds,
            param_overrides=params,
        )
        return {
            "success": result.get("success", True),
            "mechanism_type": mechanism_type,
            "duration_seconds": result.get("duration", horizon_seconds),
            "timesteps": result.get("timesteps", 0),
            "end_effector_x": result.get("end_effector_x", [])[-20:],
            "end_effector_y": result.get("end_effector_y", [])[-20:],
            "params_used": params,
            "raw_result": result,
        }
    except Exception as e:
        log.error(f"Simulation failed: {e}")
        return {"success": False, "error": str(e)}


def analyze_session(
    session_id: str,
    analysis_type: str = "summary",
) -> dict:
    """
    Get analysis data for a session.

    Args:
        session_id: The session ID to analyze
        analysis_type: Type of analysis - "summary", "masks", "parameters", "trajectories"

    Returns:
        Session analysis data
    """
    try:
        from app.core.config import DATA_DIR
        import json

        session_dir = DATA_DIR / "sessions" / session_id
        if not session_dir.exists():
            return {"success": False, "error": "Session not found"}

        result = {"session_id": session_id}

        # Get frame count
        frames_dir = session_dir / "frames"
        if frames_dir.exists():
            frames = sorted(frames_dir.glob("frame_*.png"))
            result["frame_count"] = len(frames)
            result["video_duration_estimate"] = len(frames) / 30  # assuming 30fps

        # Check for analyzed data
        analyzed_dir = session_dir / "analyzed_frames"
        if analyzed_dir.exists():
            analyzed_frames = sorted(analyzed_dir.glob("frame_*.png"))
            result["analyzed_frame_count"] = len(analyzed_frames)

        # Check for scene graph
        sg_dir = session_dir / "scene_graph"
        if sg_dir.exists():
            sg_files = list(sg_dir.glob("*.json"))
            if sg_files:
                with open(sg_files[0]) as f:
                    result["scene_graph"] = json.load(f)

        return result
    except Exception as e:
        log.error(f"Analysis failed: {e}")
        return {"success": False, "error": str(e)}


def get_learned_parameters(session_id: str) -> dict:
    """
    Get learned physics parameters from the pipeline for a session.

    Args:
        session_id: The session ID

    Returns:
        Learned physical parameters (mass, friction, stiffness, etc.)
    """
    try:
        from app.core.config import DATA_DIR
        import json

        # Try to find pipeline results
        session_dir = DATA_DIR / "sessions" / session_id

        # Look for any JSON files with parameter data
        for json_file in session_dir.rglob("*.json"):
            try:
                with open(json_file) as f:
                    data = json.load(f)
                    # Check if this looks like pipeline output
                    if isinstance(data, dict):
                        if "learned_params" in data or "jax_physics" in data.get("stages", {}):
                            return data
            except:
                continue

        return {
            "success": False,
            "error": "No pipeline results found for this session. Run Quick Analysis first.",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_all_tools() -> list[FunctionTool]:
    """Get all AETHER agent tools as ADK FunctionTools."""
    return [
        FunctionTool(run_physics_simulation),
        FunctionTool(analyze_session),
        FunctionTool(get_learned_parameters),
    ]
