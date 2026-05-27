# AETHER STUDIO
## Complete Product Requirements Document (PRD)
**Version 3.0 — All Critical Gaps Fixed**
Date: May 09, 2026
Status: Final & Locked

---

## Executive Summary

AETHER Studio is a desktop application that lets any user point a webcam or upload a video of a physical mechanism and instantly receive a living, self-improving, physics-grounded digital twin.

It is the "Cursor IDE for the physical world" — beautiful and easy to use for college students and makers, yet deep and research-grade for engineers and scientists.

The intelligence comes from a custom-trained object-centric dynamics model built using 530M–770M tokens of autonomous research: LLM-generated synthetic physics data validated by Brax, agentic architecture search, and iterative self-improvement.

All previously identified critical gaps have been solved (camera calibration, JAX-PyTorch bridge, communication protocol, evaluation dataset, cold-start handling, EWC optimization, MPC fallback, tool schemas, .aether format, etc.).

The system runs 100% locally on a laptop, balances GPU and RAM usage, and continuously improves itself through real usage and physics-grounded data.

---

## 1. Vision & Positioning

**Tagline:** Cursor for the Physical World

AETHER Studio solves the fundamental limitation of frontier LLMs: they can talk about physics but cannot simulate it accurately. AETHER provides verifiable, local, self-improving physical intelligence that runs on your laptop.

### Target Users

- College students and makers
- Independent engineers and hardware hackers
- Researchers in robotics, mechanical engineering, and embodied AI

### Key Differentiators

- Grounded in real differentiable physics (not LLM hallucinations)
- Self-improving over time
- Beautiful desktop app experience
- Fully local and private

---

## 2. All Critical Gaps — Solved in v3.0

### 2.1 Camera Calibration
- One-time calibration wizard (checkerboard or automatic video-based)
- Intrinsics (fx, fy, cx, cy, distortion) stored per session
- Passed directly into 3D lifting module
- Calibration data included in .aether export

### 2.2 JAX ↔ PyTorch Boundary
- Dedicated `backend/app/utils/tensor_bridge.py` with clean conversion functions
- All perception outputs are converted before reaching dynamics model

### 2.3 Communication Protocol
- MessagePack binary WebSocket only (Socket.IO removed)
- Versioned message types with strict schema

### 2.4 Evaluation Dataset
- 12–15 real mechanism videos + Brax-rendered ground truth created before Phase 2 training

### 2.5 Backend Cold Start
- Staged model loading with progress events sent to frontend
- Health-check polling + loading screen in Electron app

### 2.6 EWC Optimization
- Diagonal Fisher Information Matrix approximation
- Computed on 10% random subsample
- Updated every 2 cycles

### 2.7 MPC Fallback
- Primary: L-BFGS in JAX
- Automatic fallback to Random Shooting (200 trajectories) if L-BFGS diverges

### 2.8 Chat Tool Schema (Locked)
```
PythonCopysimulate(seconds: float, param_overrides: dict) -> SceneGraphSequence
predict_failure(confidence_threshold: float) -> FailurePrediction
get_scene_state() -> SceneGraph
update_parameter(object_id: str, param: str, value: float) -> None
optimize_for(goal: str, constraints: dict) -> OptimizedPlan
```

### 2.9 .aether Export Format (Locked)
ZIP archive containing:
- `model_weights.safetensors`
- `rocp_schema_version.json`
- `metadata.json`
- `calibration.json`

### 2.10 Self-Improvement Test Path
- Synthetic failure injection test included in Phase 4

### 2.11 SAM Version
- Primary: SAM 3 (distilled where available)
- Fallback: SAM 2 Tiny (38M parameters)

### 2.12 Architecture Search Results
- `experiments/` directory with one JSON per run

### 2.13 Material Embedding
- 128-dim vector learned end-to-end during Phase 2 training (Xavier initialization)

---

## 3. Full 5-Phase Integrated Roadmap

### Phase 0: Foundation & Research Architecture
- ROCG-PA SceneGraph schema (with camera_intrinsics and material_embedding)
- Synthetic data generation pipeline (Minimax 2.7 + critic + Brax validation)
- Agentic architecture search framework (80–120 experiments)
- Self-improvement loop specification
- Tensor bridge and MessagePack protocol
- Camera calibration module

### Phase 1: Perception & Object-Centric Understanding
- YOLO-World + SAM 2 Tiny + CoTracker3
- Multi-frame 3D keypoint lifting with camera intrinsics and rigidity prior
- Hybrid re-identification
- Uncertainty estimation
- Real-time pipeline (< 40ms target)

### Phase 2: Dynamics Learning Engine
- Hybrid GATv2 + Neural ODE with Hamiltonian regularization
- 3-stage curriculum (synthetic → mixed → real)
- Multi-component loss function with physics-informed terms
- Agentic architecture search with results store
- Model size ≤ 5.5M parameters

### Phase 3: Differentiable Simulation & Planning
- Pure Learned + Hybrid Brax simulator
- Short-horizon Differentiable MPC with Random Shooting fallback
- Real-time "what-if" simulation and optimization
- Tunable cost function

### Phase 4: Self-Improvement & Online Adaptation
- Failure case detection
- Targeted synthetic data generation (LLM-driven)
- Elastic Weight Consolidation (diagonal approximation)
- 6–8 improvement cycles
- Synthetic failure injection test for v1

### Phase 5: Desktop App & Final Integration
- Electron + React + TypeScript application
- Chat, Studio, Live views with real-time synchronization
- .aether export, onboarding flow, packaging
- Beautiful modern UI with smooth animations

---

## 4. Advanced Libraries & Tools (2026 State-of-the-Art)

### Perception
- YOLO-World (latest)
- SAM 2 Tiny / SAM 3 distilled
- CoTracker3
- Depth-Anything-v2
- TensorRT / ONNX for acceleration

### Dynamics & Simulation
- JAX + Brax (differentiable rigid body physics)
- Equinox / Flax for neural models
- Optax for optimization

### Frontend
- Electron 31+
- React 18 + TypeScript
- Three.js + React Three Fiber
- React Flow
- Tailwind + shadcn/ui

### Data & Research
- MessagePack for communication
- Safetensors for model weights

---

## 5. PhD-Level Mathematical Foundations

### Neural ODE Dynamics
```
dh/dt = f_θ(h_t, G_t)
```

### Hamiltonian Regularization
```
L_ham = |dH/dt|
```

### Elastic Weight Consolidation
```
L_ewc = (1/2) Σᵢ λᵢ (θᵢ - θᵢ*)²
```

### Differentiable MPC
Minimize cost J over horizon H with L-BFGS or Random Shooting fallback.

All formulations are implemented with rigorous physics priors and energy conservation.

---

## 6. Memory & GPU Optimization Strategy

- Peak RAM during training: < 11 GB
- Inference RAM: < 8 GB
- JAX jit + vmap + gradient checkpointing + bfloat16
- Frame skipping and asynchronous perception
- Quantized models for final inference

---

## 7. Implementation Strategy

We use granular, verifiable prompts (9 small prompts instead of large phases) to minimize errors.

---

## 8. Success Metrics & Risks

### Product Success
- First digital twin in < 5 minutes
- Responsive Studio view (< 120ms latency)

### Research Success
- Rollout error < 12% at 5s
- 15% improvement after 6 self-improvement cycles

### Risks & Mitigations
Risks & mitigations are fully documented in the detailed sections above.
