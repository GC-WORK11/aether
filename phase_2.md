# AETHER Studio — Phase 2: Dynamics Learning Engine

**Version:** 1.0
**Status:** Final & Locked
**Prerequisites:** Phase 0 and Phase 1 complete

---

## Hybrid Intelligence Note (Locked)

Core physics intelligence (dynamics model, simulation, self-improvement) is **100% open-source, local, and trained with PhD-level mathematics and engineering theories**.

Reasoning, tool calling, explanation, and targeted data generation use a **pluggable frontier LLM**.

Users can choose any provider (Anthropic, OpenAI, Grok, Minimax 2.7, etc.) and paste their API key in the app settings.

---

## 1. Phase 2 Objectives (Research Level)

### Primary Goal

Train a stable, generalizable, object-centric dynamics model that takes a calibrated ROCG-PA SceneGraph from Phase 1 and accurately predicts future states of rigid and simple articulated mechanisms.

### Core Scientific Goals

- Learn force propagation, contact dynamics, joint behavior, and material fatigue from data
- Achieve strong sim-to-real transfer
- Maintain long-term stability (energy conservation) in rollouts
- Support differentiable simulation for Phase 3
- Enable the self-improvement loop in Phase 4

### Success Criterion

- **< 12% rollout error at 5-second horizon**
- **< 18% rollout error at 10-second horizon**
- Measured on the evaluation dataset created in Phase 0

---

## 2. Final Dynamics Architecture (Locked)

### Name: Hybrid Object-Centric GATv2 + Neural ODE with Hamiltonian Regularization

### Architecture Components

```
ROCG-PA SceneGraph
       │
       ▼
┌─────────────────────────────────────────┐
│           Graph Encoder (GATv2)          │
│  4 layers, hidden dimension 192         │
│                                         │
│  Nodes = objects                        │
│  (keypoints, velocity, physics attrs,   │
│   material embedding, latent state)      │
│                                         │
│  Edges = learned contact/joint hypotheses│
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│          Dynamics Core (Neural ODE)       │
│  Continuous-time evolution               │
│  Predicts acceleration/forces in        │
│  latent space                           │
│  Strong Hamiltonian regularization       │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│        Contact & Impulse Head            │
│  Separate small MLP                      │
│  Predicts contact probability per edge   │
│  Predicts impulse magnitude + direction  │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│              Decoder                      │
│  Maps updated latent states →            │
│  updated 3D keypoints + velocities       │
└─────────────────────────────────────────┘
       │
       ▼
Updated SceneGraph
```

### Why This Architecture is Best in 2026

- **Combines relational reasoning (GATv2) + continuous dynamics (Neural ODE) + strong physics prior (Hamiltonian)**
- Matches leading research in object-centric physics
- **Stays laptop-feasible: ≤ 5.5M parameters**

### Mathematical Formulation

**Neural ODE Dynamics:**
```
dh/dt = f_θ(h_t, G_t)
```

Where `G_t` is the ROCG-PA SceneGraph at time `t`.

**Hamiltonian Regularization:**
```
L_ham = |dH/dt|
```

Enforces energy conservation over time.

### Model Specs

| Parameter | Value |
|-----------|-------|
| GATv2 layers | 4 |
| Hidden dimension | 192 |
| Contact/Impulse MLP | 2-layer, 64-dim |
| Decoder MLP | 3-layer, 192-dim |
| Total parameters | ≤ 5.5M |
| Latent state dimension | 128 |
| Material embedding dimension | 128 |

---

## 3. Training Curriculum (Synthetic → Real)

### Three-Stage Curriculum

| Stage | Data Type | % of Training | Focus | Epochs |
|-------|-----------|---------------|-------|--------|
| 1 | Pure Synthetic (Brax) | 60% | Core physics + stability | 80 |
| 2 | Mixed (Synthetic + Real) | 30% | Domain adaptation + noise robustness | 40 |
| 3 | Real Video Only | 10% | Final specialization | 20 |

> Synthetic data is generated with the pipeline from Phase 0 and validated in Brax for physical correctness before use.

### Curriculum Controller

The active curriculum controller from Phase 0 manages transitions:
- Automatically advances stages based on validation loss plateau
- Allows manual override via config
- Tracks per-stage metrics for ablation analysis

---

## 4. Loss Function (Multi-Component, Physics-Informed)

### Final Weighted Loss

```
L_total = L_keypoint + 0.35 · L_velocity + 0.18 · L_hamiltonian + 0.12 · L_contact + 0.06 · L_contrastive
```

### Loss Components

| Component | Weight | Description |
|-----------|--------|-------------|
| `L_keypoint` | 1.0 | MSE on 3D keypoint positions, weighted by uncertainty from Phase 1 |
| `L_velocity` | 0.35 | MSE on linear + angular velocities |
| `L_hamiltonian` | 0.18 | Energy conservation: `|dH/dt|` — enforces physics stability |
| `L_contact` | 0.12 | Binary cross-entropy (contact prediction) + impulse magnitude/direction error |
| `L_contrastive` | 0.06 | Contrastive loss to separate different mechanism types |

### Uncertainty Weighting

Phase 1 uncertainty estimates are used to automatically down-weight noisy observations in `L_keypoint`:
```
L_keypoint = Σ (1 / σ_i²) · ||x_pred - x_true||²
```

---

## 5. Agentic Architecture Search (80–120 Experiments)

### Experiment Storage

Each experiment saved in `experiments/` as JSON:
```json
{
  "experiment_id": "exp_042",
  "config": {
    "gat_hidden_dim": 192,
    "gat_num_layers": 4,
    "ode_solver": "rk4",
    "hamiltonian_strength": 0.18,
    "contact建模": "mlp"
  },
  "metrics": {
    "rollout_error_5s": 0.098,
    "rollout_error_10s": 0.152,
    "energy_conservation_error": 0.004,
    "contact_f1": 0.87,
    "inference_time_ms": 31
  },
  "loss_curves": {
    "train": [...],
    "val": [...]
  },
  "timestamp": "ISO-8601"
}
```

### LLM Analyzer

- User-chosen frontier model (Minimax 2.7 during development)
- Reviews all experiment JSONs
- Proposes next config variants
- Constrains search to:
  - GATv2 layer sizes (128, 192, 256)
  - ODE solvers (Euler, RK4, adaptive)
  - Hamiltonian regularization strength (0.1–0.3)
  - Contact modeling options (MLP, physics-based, hybrid)

### Search Target

Run **80–120 automated experiments** before freezing the architecture.

---

## 6. Integration with Phase 1 (Tensor Bridge)

```
Phase 1 Output (ROCG-PA SceneGraph)
       │
       ▼
PyTorch tensors from perception
       │
       ▼
tensor_bridge.torch_to_jax()
       │
       ▼
JAX-based Dynamics Model (Phase 2)
```

- All perception outputs go through `backend/app/utils/tensor_bridge.py`
- Uncertainty from Phase 1 propagates into loss weighting
- Camera intrinsics carried through for reference

---

## 7. Memory & GPU Optimization (Low RAM + Balanced GPU)

### Targets

| Mode | Peak RAM |
|------|----------|
| Training | < 11 GB |
| Inference | < 8 GB |

### Techniques

| Technique | Purpose |
|-----------|---------|
| JAX `jit` | Compile for fast inference |
| JAX `vmap` | Batch over multiple trajectories |
| Gradient checkpointing | Reduce activation memory |
| `bfloat16` everywhere | Half memory, minimal accuracy loss |
| On-the-fly synthetic gen | No full disk storage of datasets |
| Batch size 6–8 (synthetic) | Balanced throughput |
| Batch size 2–4 (real) | Memory-constrained real data |

### Expected Training Time

- **Full run (140 epochs):** 20–28 hours on 4070-class laptop GPU

---

## 8. Phase 2 Evaluation Metrics

### Primary Metrics

| Metric | Target | Horizon |
|--------|--------|---------|
| Rollout MSE | < 12% | 5 seconds |
| Rollout MSE | < 18% | 10 seconds |
| Energy conservation error | < 0.01 | any |
| Contact prediction F1 | > 0.85 | any |
| Sim-to-real gap | < 5% | 5 seconds |

### Qualitative Evaluation

- Visual quality of long rollouts on real mechanisms:
  - 3D printer gantry
  - Drone arm
  - Linkage mechanisms
- Human评估: physics-plausible vs. clearly wrong

### Evaluation Dataset

12–15 real mechanism videos + Brax-rendered ground truth (from Phase 0).

---

## 9. Phase 2 File Structure

```
backend/
├── app/
│   ├── dynamics/
│   │   ├── __init__.py
│   │   ├── gat_encoder.py          # GATv2 graph encoder
│   │   ├── neural_ode.py           # Neural ODE dynamics core
│   │   ├── contact_head.py         # Contact + impulse prediction
│   │   ├── decoder.py              # Latent → keypoints decoder
│   │   └── model.py                # Full model assembly
│   ├── training/
│   │   ├── __init__.py
│   │   ├── curriculum.py          # 3-stage curriculum controller
│   │   ├── loss.py                # Multi-component loss function
│   │   ├── trainer.py             # Main training loop
│   │   └── eval.py                # Evaluation metrics
│   └── utils/
│       └── tensor_bridge.py        # JAX ↔ PyTorch bridge
├── research/
│   ├── synthetic/
│   │   └── gen_pipeline.py         # (from Phase 0)
│   └── search/
│       ├── search_engine.py        # Architecture search runner
│       ├── llm_analyzer.py         # LLM experiment analyzer
│       └── best_config.json        # Output: best found config
experiments/                          # JSON logs (80–120 experiments)
```

---

## 10. Dependencies (Phase 2 Specific)

```txt
# Core ML (from Phase 0)
jax[cuda12]>=0.4.30
torch>=2.3.0
brax>=0.10.0
equinox>=0.11.0
flax>=0.8.0
optax>=0.2.0

# Graph Neural Networks
torch-geometric>=2.6.0
dgl>=2.0.0

# Training Utilities
albumentations>=1.4.0        # Data augmentation
wandb>=0.17.0                 # Experiment tracking (optional)
```

---

## 11. Exit Criteria

Before proceeding to Phase 3, the following must be verified:

- [ ] Dynamics model trains full 140-epoch curriculum without crash
- [ ] Rollout error < 12% at 5s horizon on evaluation dataset
- [ ] Rollout error < 18% at 10s horizon on evaluation dataset
- [ ] Energy conservation error < 0.01 throughout rollout
- [ ] Contact prediction F1 > 0.85
- [ ] Model has ≤ 5.5M parameters
- [ ] Training peak RAM < 11 GB (verified with `nvidia-smi`)
- [ ] Inference peak RAM < 8 GB
- [ ] Architecture search completed ≥ 80 experiments
- [ ] Best config saved as `experiments/best_config.json`
- [ ] Tensor bridge integration verified end-to-end
- [ ] Model exports to `.aether` format correctly
- [ ] Qualitative evaluation passes on 3+ real mechanisms
