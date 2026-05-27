# AETHER Studio — Phase 3: Differentiable Simulation & Planning

**Version:** 1.0
**Status:** Final & Locked
**Prerequisites:** Phase 0, Phase 1, and Phase 2 complete

---

## Note on Future Vision (Locked & Acknowledged)

You want AETHER Studio to eventually handle the entire state of current physics — classical, experimental, quantum phenomena, random internet videos, and any "what-if" modification question.

The current foundation (ROCG-PA, object-centric dynamics, differentiable simulation) is deliberately built as a **general extensible engine**.

For **v1 we start with rigid + simple articulated mechanisms** because it is the most tractable, verifiable, and useful slice on a laptop with 2026 open-source tools.

The architecture (object-centric graph + Neural ODE + Hamiltonian priors + self-improvement loop) is designed from day one to be extended later to:
- Deformable objects
- Fluids
- Experimental setups
- Quantum-scale modeling

> **We keep moving forward with the phases exactly as specified.**

---

## 1. Phase 3 Objectives (Research Level)

### Primary Goal

Wrap the Phase 2 dynamics model into a fast, fully differentiable simulator that supports real-time "what-if" simulation, parameter modification, and short-horizon planning inside the Studio view.

### Core Goals

- Enable instant interactive simulation when the user changes any physical parameter
- Support both open-loop imagination and optimized planning
- Handle the calibrated ROCG-PA SceneGraph from Phase 1 (with camera intrinsics)
- Keep everything low-RAM and GPU-balanced on a laptop
- Prepare the foundation for future extensions (experimental setups, more general physics)

### Success Criterion

- Users can change parameters in the Studio view and see believable simulation results within **< 150ms**
- Stable long-horizon rollouts up to **15 seconds**

---

## 2. Differentiable Simulation Architecture (Locked)

### Two-Mode Simulator

```
ROCG-PA SceneGraph
       │
       ▼
┌─────────────────────────────────────┐
│         SIMULATOR                    │
│                                      │
│  ┌─────────────────────────────┐    │
│  │  Mode A — Pure Learned      │    │
│  │  (Default for interactivity) │    │
│  │                              │    │
│  │  Phase 2 Neural ODE + GATv2 │    │
│  │  100% JAX, fully diff        │    │
│  │  Best for real-time sliders  │    │
│  └─────────────────────────────┘    │
│                                      │
│  ┌─────────────────────────────┐    │
│  │  Mode B — Hybrid Brax +     │    │
│  │  Learned Dynamics           │    │
│  │  (Higher physical fidelity)  │    │
│  │                              │    │
│  │  Brax rigid body engine +   │    │
│  │  learned forces/impulses    │    │
│  │  Used for: failure prediction │    │
│  │  and optimization           │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
       │
       ▼
Updated SceneGraph + Visual Output
```

### Mode Selection

| Scenario | Mode |
|----------|------|
| Real-time parameter sliders | Mode A (Pure Learned) |
| Interactive "what-if" | Mode A |
| Failure prediction | Mode B (Hybrid) |
| Optimized planning | Mode B (Hybrid) |
| Long horizon stability | Mode B |

> **Both modes respect camera intrinsics and uncertainty from Phase 1.**

---

## 3. Planning System

### Primary Method: Differentiable Model Predictive Control (MPC)

### Configuration

| Parameter | Value |
|-----------|-------|
| Horizon | 8–15 steps (≈ 5–12 seconds) |
| Primary Optimizer | L-BFGS (inside JAX) |
| Fallback | Random Shooting (200 trajectories) if L-BFGS diverges after 10 iterations |

### Planning Modes

| Mode | Description | Example |
|------|-------------|---------|
| **Open-loop simulation** | "What happens if I increase tension by 25%?" | User asks "what if" question |
| **Optimized planning** | "Find the best parameter change to delay failure as long as possible" | User clicks "Optimize for..." |

### L-BFGS + Random Shooting Fallback

```
for iteration = 1 to max_iterations:
    try L-BFGS step
    if diverged OR nan detected:
        switch to Random Shooting (200 trajectories)
        break
```

> **This solves the MPC instability problem identified in Phase 0.**

---

## 4. Cost Function (Tunable & Extensible)

### Multi-Objective Cost

```
J = w_1 · J_target + w_2 · J_smoothness + w_3 · J_energy + w_4 · J_failure_risk + w_5 · J_parameter_change
```

### Cost Components

| Term | Purpose | Default Weight |
|------|---------|----------------|
| `J_target` | Track desired state or trajectory | 1.0 |
| `J_smoothness` | Penalize jerky/non-physical transitions | 0.1 |
| `J_energy` | Penalize excessive energy use | 0.05 |
| `J_failure_risk` | Penalize high-failure-probability states | 0.2 |
| `J_parameter_change` | Penalize large parameter deviations | 0.15 |

### Studio View Controls

All weights (`w_1` through `w_5`) are **user-tunable via sliders** in the Studio view.

### Future Extensibility

```
Future cost terms can be added without changing the core planner:
- J_quantum: quantum-inspired observables
- J_experimental: deviation from reference setup
- J_deformable: soft-body deformation penalties
```

---

## 5. Rollout & Imagination Features (Studio View)

### Real-Time Parameter Controls

| Control | Effect |
|---------|--------|
| Mass slider | Changes object mass, instant rollout preview |
| Friction slider | Adjusts friction coefficients |
| Speed multiplier | Scales all velocities |
| Tension slider | Adjusts spring/rod tension forces |
| External force | Adds/removes directional force vector |

### Timeline & Visualization

| Feature | Description |
|---------|-------------|
| Scrubbable timeline | 5–15 second prediction horizon with draggable playhead |
| Uncertainty bands | Shaded regions showing ±1σ from Phase 1 covariance |
| Side-by-side view | Original video vs. simulated future, synchronized |
| Energy heatmap | Color-coded energy levels across timeline |
| Force vectors | Arrows showing forces at each timestep |
| Failure probability heatmap | Red = high failure risk, green = safe |

### "Optimize for..." Button

- Opens goal specification dialog
- Runs MPC planning (Mode B)
- Returns optimal parameter changes
- Shows projected outcome

---

## 6. Integration with Previous Phases (All Fixes Applied)

```
Phase 1 SceneGraph
  (with camera intrinsics + uncertainty)
         │
         ▼
  tensor_bridge.torch_to_jax()
         │
         ▼
  Phase 2 Dynamics Model
         │
         ▼
  Phase 3 Simulator
  (Mode A or Mode B based on need)
         │
         ▼
  Studio View + MessagePack WebSocket → Frontend
```

### Communication

- All inter-process communication uses **MessagePack binary WebSocket**
- No Socket.IO (removed in Phase 0)
- Versioned message types

### Cold Start Handling

- Staged model loading with progress events to frontend
- Health-check polling during initialization
- Graceful loading screen in Electron app

---

## 7. Performance & Laptop Optimization

### Latency Targets

| Operation | Target |
|-----------|--------|
| Single 10-step rollout | < 40ms |
| Full MPC optimization | < 200ms |
| Parameter change → visual update | < 150ms |

### Optimization Techniques

| Technique | Purpose |
|-----------|---------|
| JAX `jit` | Compile for speed |
| JAX `vmap` | Vectorize over multiple rollouts |
| Gradient checkpointing | Reduce memory during planning |
| `bfloat16` | Half memory, minimal accuracy loss |
| Pre-compiled rollouts | Cache common scenarios |
| Asynchronous planning | MPC runs in background thread |
| Random Shooting fallback | Guarantees < 200ms even if L-BFGS diverges |

---

## 8. Phase 3 Evaluation Metrics

### Technical Metrics

| Metric | Target |
|--------|--------|
| Rollout speed | > 25 steps/second |
| MPC success rate | > 90% (with fallback) |
| Prediction accuracy vs ground truth | < Phase 2 baseline error + 5% |
| Long-horizon stability (15s) | Energy drift < 10% |

### User-Facing Metrics

| Metric | Target |
|--------|--------|
| Perceived responsiveness | < 150ms to visual update |
| Visual realism score | > 4/5 on mechanism videos |
| Slider-to-simulation latency | < 100ms |
| Planning ("Optimize for...") time | < 5 seconds |

---

## 9. Phase 3 File Structure

```
backend/
├── app/
│   ├── simulation/
│   │   ├── __init__.py
│   │   ├── simulator.py              # Two-mode simulator (A + B)
│   │   ├── mode_a_learned.py        # Pure learned rollout
│   │   ├── mode_b_hybrid.py         # Brax + learned hybrid
│   │   ├── rollouts.py              # Rollout engine
│   │   └── cost_function.py         # Multi-objective cost
│   ├── planning/
│   │   ├── __init__.py
│   │   ├── mpc.py                   # MPC controller
│   │   ├── lbfgs_optimizer.py       # L-BFGS implementation
│   │   ├── random_shooting.py       # Fallback planner
│   │   └── planner.py               # Unified planner interface
│   ├── dynamics/
│   │   └── model.py                 # (from Phase 2)
│   └── utils/
│       └── tensor_bridge.py          # JAX ↔ PyTorch bridge
├── research/
│   └── synthetic/
│       └── gen_pipeline.py           # (from Phase 0)
frontend/
├── components/
│   ├── StudioView.tsx               # Main simulation view
│   ├── ParameterSliders.tsx         # Interactive parameter controls
│   ├── TimelineScrubber.tsx         # Scrubbable prediction timeline
│   ├── SimComparison.tsx            # Side-by-side video vs simulation
│   ├── EnergyHeatmap.tsx           # Energy visualization
│   ├── FailureHeatmap.tsx          # Failure probability overlay
│   ├── ForceVectorOverlay.tsx      # Force arrows in 3D view
│   └── OptimizeDialog.tsx          # "Optimize for..." goal spec
```

---

## 10. Dependencies (Phase 3 Specific)

```txt
# Core (from Phase 0 + 2)
jax[cuda12]>=0.4.30
jaxlib>=0.4.30
brax>=0.10.0
equinox>=0.11.0
flax>=0.8.0
optax>=0.2.0

# Planning
scipy>=1.13.0              # L-BFGS interface

# Visualization (frontend)
three>=0.163.0
@react-three/fiber>=8.16.0
@react-three/drei>=9.105.0
```

---

## 11. Exit Criteria

Before proceeding to Phase 4, the following must be verified:

- [ ] Mode A (Pure Learned) produces stable rollouts up to 15 seconds
- [ ] Mode B (Hybrid Brax) produces higher-fidelity contacts
- [ ] L-BFGS optimizer runs successfully on planning tasks
- [ ] Random Shooting fallback triggers correctly when L-BFGS diverges
- [ ] All 5 cost function terms are tunable via Studio sliders
- [ ] Parameter change → visual update latency < 150ms
- [ ] MPC optimization completes in < 5 seconds
- [ ] Side-by-side video vs simulation view works in real-time
- [ ] Uncertainty bands correctly display Phase 1 covariance
- [ ] Failure probability heatmap updates in real-time
- [ ] Energy conservation maintained in long rollouts (< 10% drift)
- [ ] Phase 1 SceneGraph flows correctly through tensor bridge → Phase 2 → Phase 3
- [ ] MessagePack WebSocket communicates all simulator state correctly
- [ ] All earlier critical gaps remain solved
