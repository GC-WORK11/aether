# AETHER Studio — Phase 0: Foundation, Research Architecture & All Critical Fixes

**Version:** 1.0
**Status:** Final & Locked
**Prerequisites:** None — this is the starting point

---

> **This is the final locked foundation for the entire project.** Every critical gap has been solved here before any code is written.

---

## 1. Project Vision (Locked)

AETHER Studio is a desktop application that lets a user point a webcam or upload a short video of any rigid or simple articulated mechanism and receive a living, self-improving, physics-grounded digital twin.

It uses PhD-level mathematics and engineering theories (Hamiltonian Neural Networks, Neural ODEs, Differentiable MPC, Elastic Weight Consolidation, object-centric graph dynamics) combined with the latest 2026 open-source libraries, while staying low on RAM and balanced on GPU.

All intelligence is local and self-improving through a 530M–770M token research pipeline.

---

## 2. All Critical Gaps — Explicitly Solved in Phase 0

| Gap | Solution Implemented Here |
|-----|--------------------------|
| Camera Calibration | Full calibration module + intrinsics in ROCG-PA schema |
| JAX ↔ PyTorch Boundary | Dedicated tensor bridge layer |
| Communication Protocol | MessagePack binary WebSocket only |
| Evaluation Dataset | 12–15 real mechanism videos + Brax ground truth plan |
| Backend Cold Start | Staged loading + health-check polling |
| EWC Compute Cost | Diagonal approximation on 10% subsample |
| MPC Instability | L-BFGS + Random Shooting fallback |
| Tool Schema | Exact function signatures defined |
| .aether Format | Full ZIP specification |
| Self-Improvement Test Path | Synthetic failure injection test |
| SAM Version | SAM 2 Tiny as proven fallback |
| Architecture Search Store | `experiments/` directory with JSON logs |
| Material Embedding | Learned end-to-end with Xavier init |

---

## 3. ROCG-PA SceneGraph Schema (Final Locked Version)

```python
class ROCGPA_SceneGraph:
    timestamp: float
    camera_intrinsics: dict  # fx, fy, cx, cy, distortion_coeffs
    objects: list[ObjectNode]
    edges: list[Edge]

class ObjectNode:
    id: str
    keypoints: dict  # "canonical" and "current" (12-16 3D points)
    velocity: dict   # linear + angular
    physics: dict    # mass, friction, restitution, damping
    material_embedding: list[float]  # 128-dim (learned end-to-end)
    latent_state: list[float]        # 128-dim

class Edge:
    source_id: str
    target_id: str
    contact_prob: float
    normal_force: list[float]
    joint_type: str
    joint_axis: list[float]
```

### File Location
`backend/app/schemas/rocp_scenegraph.py`

---

## 4. Camera Calibration Module (Solved)

- **One-time calibration wizard** in the desktop app (checkerboard pattern or automatic from video)
- **Intrinsics stored per session** in `calibration.json`
- **Passed into every 3D lifting call** in Phase 1
- **Included in every .aether export**

### Deliverables

| File | Purpose |
|------|---------|
| `backend/app/perception/calibration.py` | Calibration logic |
| `backend/app/schemas/calibration_schema.py` | Calibration JSON schema |
| `frontend/components/CalibrationWizard.tsx` | UI wizard component |

---

## 5. Tensor Bridge (JAX ↔ PyTorch) (Solved)

`backend/app/utils/tensor_bridge.py` contains:

```python
torch_to_jax(tensor)      # PyTorch → JAX
jax_to_torch(array)       # JAX → PyTorch
numpy_to_jax(array)       # NumPy → JAX
jax_to_numpy(array)       # JAX → NumPy
 Automatic device handling (CPU/GPU)
```

> **All perception outputs go through this bridge before reaching the dynamics model.**

### Deliverable
`backend/app/utils/tensor_bridge.py`

---

## 6. Communication Protocol (Locked)

- **Only MessagePack binary WebSocket**
- **No Socket.IO**
- Versioned message types with strict schema

### Message Types

| Message Type | Description |
|--------------|-------------|
| `SCENE_UPDATE` | Full scene graph state update |
| `PREDICTION_REQUEST` | Request dynamics prediction |
| `SIMULATION_REQUEST` | Request simulation run |
| `PARAMETER_UPDATE` | Update physical parameters |
| `HEALTH_CHECK` | Ping/pong health check |
| `IMPROVEMENT_STATUS` | Self-improvement cycle status |

### Deliverable
`backend/app/communication/protocol.py`

---

## 7. Synthetic Data Generation Pipeline (PhD-Level)

### Generator Stack
- **Primary generator:** Minimax 2.7 (cost-efficient)
- **Critic/validator:** Stronger model (Claude or equivalent)
- **Physics validator:** Brax for physical correctness

### Scenario Categories
- Free rigid bodies
- Contacts
- Joints
- Fatigue
- Failure modes

### Targets
- **90,000–110,000** high-quality scenarios
- Active curriculum controller for later self-improvement cycles
- Every scenario validated in Brax before acceptance

### Deliverables

| File | Purpose |
|------|---------|
| `backend/research/synthetic/gen_pipeline.py` | Main generation pipeline |
| `backend/research/synthetic/brax_validator.py` | Brax validation layer |
| `backend/research/synthetic/curriculum_controller.py` | Curriculum management |

---

## 8. Agentic Architecture Search Framework

- **80–120 automated experiments**
- **Each experiment saved** in `experiments/` as JSON (config + metrics + loss curves)
- **LLM analyzer** reviews results and proposes next variant
- **Search space constrained to:**
  - GATv2 variants
  - Neural ODE variants
  - Hamiltonian strength
  - Contact modeling

### Experiment JSON Schema
```json
{
  "experiment_id": "exp_001",
  "config": {
    "gat_hidden_dim": 128,
    "node_types": ["rigid", "joint"],
    "hamiltonian_strength": 0.5
  },
  "metrics": {
    "rollout_error_5s": 0.08,
    "inference_time_ms": 32
  },
  "loss_curves": {
    "train": [...],
    "val": [...]
  }
}
```

### Deliverables

| File | Purpose |
|------|---------|
| `backend/research/search/search_engine.py` | Experiment runner |
| `backend/research/search/llm_analyzer.py` | LLM result analyzer |
| `experiments/` (dir) | JSON logs per experiment |

---

## 9. Self-Improvement Loop Specification

### Pipeline
1. **Failure detector** identifies high-error regions
2. **LLM generates** targeted synthetic scenarios
3. **Retraining uses** diagonal EWC on 10% subsample (updated every 2 cycles)
4. **Synthetic failure injection test** included for v1 validation

### EWC Details
- Diagonal Fisher Information Matrix approximation
- Computed on 10% random subsample
- Updated every 2 cycles

### Deliverables

| File | Purpose |
|------|---------|
| `backend/research/improvement/failure_detector.py` | High-error region detection |
| `backend/research/improvement/scenario_generator.py` | LLM-driven scenario gen |
| `backend/research/improvement/ewc_optimizer.py` | Diagonal EWC implementation |
| `backend/research/improvement/injection_test.py` | Synthetic failure test |

---

## 10. Memory & GPU Strategy (Low RAM + Balanced GPU)

### Targets
| Mode | Peak RAM |
|------|----------|
| Training | < 11 GB |
| Inference | < 8 GB |

### Techniques
- JAX `jit` + `vmap` + gradient checkpointing + `bfloat16`
- Frame skipping in perception
- Asynchronous perception → dynamics pipeline
- Model quantization path for final inference

---

## 11. Technology Stack (Latest 2026 Open-Source)

### Perception
- YOLO-World (latest)
- SAM 2 Tiny (proven fallback) / SAM 3 distilled
- CoTracker3
- Depth-Anything-v2
- TensorRT / ONNX for acceleration

### Dynamics & Simulation
- JAX + Brax (differentiable physics)
- Equinox / Flax for neural models
- Optax for optimization

### Frontend
- Electron 31+
- React 18 + TypeScript
- Tailwind + shadcn/ui
- Three.js + React Three Fiber
- React Flow

### Data
- MessagePack
- Safetensors

---

## 12. .aether Export Format (Locked)

ZIP archive containing:
- `model_weights.safetensors`
- `rocp_schema_version.json`
- `metadata.json`
- `calibration.json`

---

## 13. Chat Tool Schema (Locked)

```python
PythonCopysimulate(seconds: float, param_overrides: dict) -> SceneGraphSequence
predict_failure(confidence_threshold: float) -> FailurePrediction
get_scene_state() -> SceneGraph
update_parameter(object_id: str, param: str, value: float) -> None
optimize_for(goal: str, constraints: dict) -> OptimizedPlan
```

---

## 14. Phase 0 File Structure

```
backend/
├── app/
│   ├── schemas/
│   │   ├── rocp_scenegraph.py        # ROCG-PA SceneGraph schema
│   │   └── calibration_schema.py     # Calibration JSON schema
│   ├── perception/
│   │   └── calibration.py            # Camera calibration logic
│   ├── communication/
│   │   └── protocol.py               # MessagePack WebSocket protocol
│   └── utils/
│       └── tensor_bridge.py          # JAX ↔ PyTorch bridge
├── research/
│   ├── synthetic/
│   │   ├── gen_pipeline.py           # Main generation pipeline
│   │   ├── brax_validator.py         # Brax validation layer
│   │   └── curriculum_controller.py  # Curriculum management
│   ├── search/
│   │   ├── search_engine.py          # Experiment runner
│   │   └── llm_analyzer.py           # LLM result analyzer
│   └── improvement/
│       ├── failure_detector.py       # High-error region detection
│       ├── scenario_generator.py     # LLM-driven scenario gen
│       ├── ewc_optimizer.py          # Diagonal EWC implementation
│       └── injection_test.py         # Synthetic failure test
experiments/                            # JSON logs per experiment
frontend/
├── components/
│   └── CalibrationWizard.tsx         # UI calibration wizard
```

---

## 15. Dependencies

```txt
# Core ML
jax[cuda12]>=0.4.30
torch>=2.3.0
brax>=0.10.0
equinox>=0.11.0
flax>=0.8.0
optax>=0.2.0

# Perception
yolo-world>=0.1.0
supermind-segment-anything>=2.0.0  # SAM 2 / 3
cotracker3>=1.0.0
depth-anything-v2>=1.0.0

# Data & Serialization
msgpack>=1.0.0
safetensors>=0.4.0

# Frontend
electron>=31.0.0
react>=18.3.0
typescript>=5.4.0
three>=0.163.0
@react-three/fiber>=8.16.0
@xyflow/react>=12.0.0
tailwindcss>=3.4.0
shadcn-ui>=0.10.0

# Communication
websockets>=12.0.0
```

---

## 16. Exit Criteria

Before proceeding to Phase 1, the following must be verified:

- [ ] `ROCGPA_SceneGraph` schema validates correctly
- [ ] Camera calibration wizard runs and produces valid intrinsics
- [ ] `tensor_bridge.py` converts all tensor types without data loss
- [ ] MessagePack WebSocket sends and receives all message types
- [ ] Synthetic pipeline generates and validates 100 scenarios (dry run)
- [ ] Architecture search runs 3 experiments and saves valid JSON
- [ ] Self-improvement loop runs 1 cycle end-to-end
- [ ] All .aether exports are valid ZIP archives
- [ ] Training peak RAM < 11 GB (measured with `nvidia-smi` / `htop`)
- [ ] Inference peak RAM < 8 GB
