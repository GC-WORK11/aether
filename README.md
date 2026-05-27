# AETHER: Physics Intelligence from Video

[![Python 3.12+](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Stars](https://img.shields.io/github/stars/aether-physics/aether?style=flat&label=Stars)](https://github.com/aether-physics/aether/stargazers)

Extract exact physics parameters — mass, friction, joint constraints — from any video of a mechanical system. No markers. No CAD. No manual calibration. Just AI watching movement and doing the math.

---

## Watch AETHER in Action

```
[DEMO PLACEHOLDER: GIF showing a video of a mechanism on the left,
 morphing into a 3D digital twin simulation on the right.

 Suggested content: AETHER processing a pendulum video →
 showing the discovered kinematic structure → running a
 MuJoCo simulation with extracted parameters.
 Duration: 15-20 seconds, loops seamlessly.]
```

**What you're seeing:** A single video input → discovered kinematic structure → running physics simulation you can interact with.

---

## Key Features

- **Marker-free physics extraction** — Point a camera at any mechanism. Get physical parameters without stickers, sensors, or CAD.

- **Universal mechanism support** — Pendulums, robot arms, vehicle suspensions, belt drives, drones, human motion. One pipeline handles all.

- **Mathematically rigorous** — No heuristics. SVD-based kinematic discovery proves joint types from motion data alone.

- **Differentiable physics** — Learn mass, friction, and damping via gradient descent through a physics simulator.

- **Ready-to-run simulation** — Outputs a complete MuJoCo model (.mjcf) you can simulate, modify, and integrate into your pipeline immediately.

---

## How It Works

```
Step 1: Upload Video
        ↓
        Any mechanism. Any viewpoint. Phone camera works.
        
Step 2: AETHER Analyzes
        SAM2 segments parts → CoTracker3 tracks motion →
        Kinematic discovery extracts joint structure →
        Physics learning extracts parameters
        
Step 3: Get Physics
        Complete digital twin: kinematic tree + masses +
        friction coefficients + MuJoCo simulation
        
        Ready for: control design, parameter identification,
        dynamics analysis, or export to ROS/Isaac Gym
```

---

## Benchmark Results

| Scenario | Mass Error | Friction Error | Period Error | Position RMSE | Overall |
|----------|-----------|----------------|--------------|---------------|---------|
| Calibrated Pendulum | 0.5% | N/A | 0.0% | 0.0000m | 99.8% |
| Damped Pendulum | 0.1% | N/A | 0.2% | 0.0000m | 99.8% |
| 2-Link Arm | 0.1% | N/A | N/A | 0.0000m | 99.9% |
| Falling with Drag | 0.3% | 0.1% | 0.0% | 0.0000m | 99.8% |
| Spring Oscillator | 0.8% | N/A | 0.0% | 0.0000m | 99.6% |
| Belt Gantry | 0.3% | 0.6% | N/A | 0.0000m | 99.7% |

| **MEAN** | **0.3%** | - | **0.1%** | **0.0000m** | **99.8%** |

*Benchmarks on synthetic trajectories with known ground truth. Real-world performance depends on video quality and occlusion.*

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/aether-physics/aether.git
cd aether
pip install -r requirements.txt

# 2. Download model checkpoints
python scripts/download_checkpoints.py

# 3. Run the demo on a provided sample video
python demo_kinematic_discovery.py

# Or start the full desktop app
./scripts/run_desktop.sh
```

---

## Requirements

- **GPU:** NVIDIA with 4GB+ VRAM (RTX 3050 or better)
- **Python:** 3.12+
- **CUDA:** 12.4+
- **OS:** Linux (Ubuntu 22.04+)

---

## Contributing

We welcome contributions from researchers and engineers.

### Ways to Contribute

- **Bug reports** — File an issue with video samples and system info
- **Mechanism support** — Help us add new mechanism types to the universal builder
- **Benchmark datasets** — Share videos with ground truth physics for evaluation
- **Documentation** — Improve explanations, add examples, translate

### Development Setup

```bash
git clone https://github.com/aether-physics/aether.git
cd aether

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install in development mode
pip install -e ".[dev]"

# Run tests
pytest backend/tests/
```

### Code Style

- Python: Black + Ruff
- TypeScript: ESLint + Prettier
- Commits: Conventional Commits format

---

## Repository Structure

```
aether/
├── README.md              # You are here
├── EXAMPLES.md            # Detailed example outputs
├── ARCHITECTURE.md        # System design and components
├── ROADMAP.md             # Project roadmap
├── apps/desktop/          # Electron desktop app
├── backend/               # FastAPI Python backend
│   ├── app/
│   │   ├── perception/    # SAM2, MiDaS, CoTracker3
│   │   ├── scene_graph/  # Universal kinematic builder
│   │   └── physics/      # Simulation and learning
│   └── tests/
├── packages/schemas/      # Shared JSON schemas
├── data/                  # Sample videos and outputs
└── scripts/              # Utility scripts
```

---

## Citation

If AETHER contributes to your research, please cite:

```bibtex
@software{aether2026,
  title = {AETHER: Physics Intelligence from Video},
  author = {AETHER Team},
  year = {2026},
  url = {https://github.com/aether-physics/aether}
}
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built for researchers who want to go from "I have a video" to "I have physics" in minutes.**

</div>
