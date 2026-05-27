# AETHER Studio — Phase 4: Self-Improvement & Online Adaptation

**Version:** 1.0
**Status:** Final & Locked
**Prerequisites:** Phase 0, Phase 1, Phase 2, and Phase 3 complete

---

## Hybrid Intelligence Note (Locked)

Core physics intelligence (dynamics model, simulation, self-improvement loop) is **100% open-source, local, and built with PhD-level mathematics and engineering theories**.

Reasoning, explanation, tool calling, failure analysis, and targeted data generation use a **pluggable frontier LLM**.

In the final app, users can choose any provider (Anthropic, OpenAI, Grok, Minimax 2.7, etc.) and paste their API key in settings.

> **During development we default to Minimax 2.7 for cost efficiency.**

---

## 1. Phase 4 Objectives (Research Level)

### Primary Goal

Implement a robust, autonomous self-improvement loop that allows the dynamics model to continuously become more accurate from real-world usage while never forgetting previously learned physics.

### Core Scientific Goals

- Automatically detect where the model is weak on real videos
- Generate highly targeted synthetic data to fix those exact weaknesses
- Retrain safely using Elastic Weight Consolidation (EWC)
- Enable both background batch improvement and lightweight online adaptation
- Lay the foundation for future extension to experimental physics, quantum-scale phenomena, and arbitrary internet videos

### Success Criterion

- **After 6–8 improvement cycles:** ≥ 15–20% cumulative reduction in rollout error on real mechanism videos
- **Maintains (or improves)** performance on the original evaluation dataset
- **No catastrophic forgetting** of previously learned physics

---

## 2. Self-Improvement Loop Architecture (Final Design)

### Closed-Loop System

```
┌──────────────────────────────────────────────────────────────┐
│                    SELF-IMPROVEMENT LOOP                     │
│                                                              │
│  1. Deploy Current Model                                      │
│     (Phase 2 + Phase 3 simulator)                            │
│            │                                                  │
│            ▼                                                  │
│  2. Collect Real Usage Data + Rollouts                        │
│     (from Live View or uploaded videos)                       │
│            │                                                  │
│            ▼                                                  │
│  3. Failure Case Detector                                    │
│     (high-error regions + uncertainty spikes)                  │
│            │                                                  │
│            ▼                                                  │
│  4. Frontier LLM generates targeted synthetic scenarios        │
│     (user-chosen API key)                                     │
│            │                                                  │
│            ▼                                                  │
│  5. Brax Physics Validation + Quality Filter                  │
│     (ground-truth verification)                               │
│            │                                                  │
│            ▼                                                  │
│  6. Retrain with Diagonal EWC                                │
│     (10% subsample, every 2 cycles)                          │
│            │                                                  │
│            ▼                                                  │
│  7. Evaluate Improvement on Held-Out Test Set                │
│            │                                                  │
│            ▼                                                  │
│  8. Deploy Updated Model → Repeat (6–8 cycles)               │
└──────────────────────────────────────────────────────────────┘
```

> **This loop runs in the background when the app is idle or overnight.**

---

## 3. Failure Case Detection (PhD-Level)

### Multi-Metric Detector

Failure cases are identified using multiple signals:

| Signal | Detection Method |
|--------|-----------------|
| Rollout error (3s, 5s, 10s) | Compare prediction vs. actual future frames |
| Energy drift | Monitor `|dH/dt|` beyond threshold |
| Contact prediction mismatch | Phase 2 contact head misfires |
| Uncertainty spikes | Phase 1 covariance exceeds threshold |
| User corrections | User overrides simulation in Studio view |

### Failure Report Output

```python
@dataclass
class FailureReport:
    video_segment: str          # Path or segment ID
    timestamp_start: float
    timestamp_end: float
    objects_involved: list[str] # Object IDs
    edges_involved: list[str]   # Edge IDs
    failure_type: str           # e.g., "underestimates_resonance"
    error_magnitude: float      # How wrong the prediction was
    uncertainty_at_failure: float
    description: str            # Natural language summary
```

### Failure Types

| Type | Description |
|------|-------------|
| `underestimates_resonance` | Model misses oscillatory behavior at high frequencies |
| `contact_mismatch` | Contact predicted at wrong time/location |
| `energy_drift` | Long-horizon energy not conserved |
| `occlusion_confusion` | Identity switched after occlusion |
| `material_dependent` | Model fails on unseen material type |
| `speed_dependent` | Model fails outside training velocity range |

---

## 4. Targeted Synthetic Data Generation

### The Most Powerful Part of the Loop

The frontier LLM receives the failure report and generates **highly specific** new scenarios that directly attack the model's exact weaknesses — not random data.

### Process

```
Failure Report
      │
      ▼
Structured LLM Prompt
(few-shot with physics book excerpts + failure context)
      │
      ▼
LLM Output:
{
  "mechanism_type": "high-speed_rotating_arm",
  "initial_conditions": {...},
  "physical_parameters": {...},
  "failure_mode_targeted": "resonance_underestimation"
}
      │
      ▼
Brax Ground-Truth Validation
      │
      ▼
Quality Filter (score > threshold)
      │
      ▼
8,000–15,000 new scenarios per cycle
```

### LLM Prompt Engineering

```python
SYSTEM_PROMPT = """
You are a physics scenario generator for AETHER Studio.
Given a failure report, generate synthetic scenarios that specifically
target the model's weaknesses.

For each scenario include:
- mechanism type and description
- exact physical parameters (mass, friction, spring constants, etc.)
- initial conditions (positions, velocities)
- the specific failure mode this targets

Generate 50 diverse scenarios per failure type.
All scenarios must be physically plausible (validated in Brax).
"""

USER_PROMPT = f"""
Failure Report:
{failure_report.description}

Objects involved: {failure_report.objects_involved}
Failure type: {failure_report.failure_type}
Error magnitude: {failure_report.error_magnitude}

Generate scenarios targeting this exact weakness.
"""
```

### Validation & Quality Filter

| Criterion | Threshold |
|-----------|-----------|
| Brax physics consistency | > 0.95 |
| Diversity from existing data | > 0.7 |
| Targets specific failure | Explicit match |
| Physical plausibility | Energy bounded |

---

## 5. Safe Retraining with Elastic Weight Consolidation (EWC)

### Mathematical Foundation

**Elastic Weight Consolidation loss:**
```
L_ewc = (1/2) Σᵢ λᵢ (θᵢ - θᵢ*)²
```

Where:
- `θᵢ*` = optimal parameter after previous training
- `λᵢ` = Fisher Information diagonal element (importance of parameter `i`)

### Optimized Laptop Configuration

| Parameter | Value |
|-----------|-------|
| Fisher approximation | Diagonal (not full FIM) |
| Subsample size | 10% of previous training data |
| EWC update frequency | Every 2 cycles (not every cycle) |
| Learning rate | 0.3–0.5× initial rate |
| Data mix ratio | 30% old data + 70% new targeted data |

### Why Diagonal EWC?

| Full FIM | Diagonal Approximation |
|----------|----------------------|
| O(N²) memory | O(N) memory |
| 48GB+ RAM needed | < 2GB extra |
| Slow computation | Fast |
| Accuracy: marginal gain | Accuracy: sufficient |

### Training Pipeline

```
1. Compute Fisher diagonal on 10% random subsample
2. Load previous best checkpoint
3. Mix new targeted data (70%) + old data (30%)
4. Add EWC regularization term to loss
5. Fine-tune with lower learning rate
6. Evaluate on held-out test set
7. If improved: save as new best checkpoint
```

---

## 6. Online Adaptation Modes

### Mode A — Batch Improvement (Primary for v1)

| Setting | Value |
|---------|-------|
| When | App idle or overnight |
| Full cycle | Yes (detection → generation → retraining) |
| GPU usage | Full (throttled < 10GB RAM) |
| User impact | None (background) |

### Mode B — Lightweight Online Adaptation (Future)

| Setting | Value |
|---------|-------|
| When | After each user session |
| Scope | Small gradient updates |
| Learning rate | Very low |
| EWC | Strong |
| User toggle | Optional |

> **Mode B is a Phase 5+ extension. Not in v1 scope.**

---

## 7. v1 Test Path (Critical Fix)

### Synthetic Failure Injection Test

Before real-user data is ever used, the full loop must be validated:

```
1. INJECT FAILURE
   Deliberately degrade model on specific scenarios
   e.g., inject noise that causes resonance underestimation

2. RUN FULL LOOP
   failure_detection → LLM_generation → Brax_validation → EWC_retrain

3. VERIFY CORRECTION
   - Did it detect the injected failure?
   - Did it generate targeted scenarios?
   - Did retraining fix the specific weakness?
   - Did it NOT break other capabilities?

4. PASS/FAIL
   Must pass before real-user data is used
   Must pass before Phase 5 final integration
```

### Test Scenarios

| Injected Failure | Expected Detection | Expected Fix |
|------------------|-------------------|--------------|
| Resonance underestimation | High energy drift at high freq | Better high-freq dynamics |
| Contact timing error | Contact F1 drops | Improved contact head |
| Occlusion ID switch | Object ID persistence drops | Better ReID |

---

## 8. Integration with Previous Phases

```
Phase 1 SceneGraph
  (uncertainty + camera intrinsics)
         │
         ▼
Phase 2 Dynamics Model
         │
         ▼
Phase 3 Simulator
  (rollout evaluation for failure detection)
         │
         ▼
Phase 4 Self-Improvement Loop
  (adaptation/ module)
         │
         ▼
Updated Phase 2 Model
  (if improvement verified)
         │
         ▼
Phase 5 Desktop App
  (background service + data collection UI)
```

### Communication

- All phases use **MessagePack binary WebSocket**
- Phase 4 adaptation service runs as background process
- Progress reported to Phase 5 UI via WebSocket

---

## 9. Performance & Laptop Optimization

| Concern | Solution |
|---------|----------|
| LLM API cost | Use Minimax 2.7 (cheapest frontier model) |
| Retraining RAM | < 10 GB (JAX optimizations) |
| GPU balance | Throttled to not interfere with active use |
| Disk space | On-the-fly data generation, no bulk storage |
| Background CPU | Throttled when user is active |
| Overnight mode | Full resources when idle |

---

## 10. Phase 4 Evaluation Metrics

### Primary Metrics

| Metric | Target |
|--------|--------|
| Rollout error reduction per cycle | ≥ 3% per cycle |
| Cumulative improvement (6–8 cycles) | ≥ 15–20% total |
| Forgetting rate on original test set | < 5% |
| Brax validation score for generated data | > 0.95 |
| Failure detection precision | > 80% |

### Long-Term Metric

| Metric | Target |
|--------|--------|
| Consistent improvement trend | 6–8 cycles showing error reduction |
| No regression cycles | Error only goes down |

### Quality Metrics

| Metric | Target |
|--------|--------|
| Targeted scenario diversity | > 0.7 (vs. existing data) |
| Synthetic data physical plausibility | Energy bounded |
| EWC preservation of old tasks | > 95% old-task accuracy retained |

---

## 11. Phase 4 File Structure

```
backend/
├── app/
│   ├── adaptation/
│   │   ├── __init__.py
│   │   ├── self_improvement_loop.py   # Main loop orchestrator
│   │   ├── failure_detector.py        # Multi-metric failure detection
│   │   ├── failure_report.py          # Structured failure output
│   │   ├── scenario_generator.py      # LLM-driven scenario gen
│   │   ├── brax_validator.py           # Brax quality filter
│   │   ├── ewc_optimizer.py          # Diagonal EWC implementation
│   │   ├── checkpoint_manager.py      # Model checkpoint versioning
│   │   ├── cycle_evaluator.py        # Improvement evaluation
│   │   └── injection_test.py          # Synthetic failure test suite
│   ├── simulation/
│   │   └── simulator.py              # (from Phase 3)
│   ├── dynamics/
│   │   └── model.py                  # (from Phase 2)
│   └── communication/
│       └── protocol.py               # MessagePack WebSocket
├── research/
│   └── synthetic/
│       └── gen_pipeline.py           # (from Phase 0)
experiments/                            # Improvement cycle logs
checkpoints/                           # Model checkpoints (old + new)
test_results/
└── synthetic_injection/              # v1 test path results
```

---

## 12. Dependencies (Phase 4 Specific)

```txt
# Core (from Phase 0–3)
jax[cuda12]>=0.4.30
brax>=0.10.0
equinox>=0.11.0
optax>=0.2.0

# Frontend LLM Integration (for Phase 5 trigger)
# LLM API calls handled via user-provided key

# Testing
pytest>=8.0.0
hypothesis>=6.100.0        # Property-based testing
```

---

## 13. Exit Criteria

Before proceeding to Phase 5, the following must be verified:

- [ ] Synthetic failure injection test passes (all 3 scenarios)
- [ ] Failure detector identifies high-error regions correctly
- [ ] LLM generates diverse scenarios targeting specific failures
- [ ] Brax validator filters out physically implausible scenarios
- [ ] Diagonal EWC computed on 10% subsample without OOM
- [ ] Retraining preserves old-task accuracy (> 95%)
- [ ] Cumulative error reduction ≥ 15% after 6 cycles
- [ ] Forgetting rate < 5% on original evaluation set
- [ ] Brax validation score > 0.95 for generated data
- [ ] Background process stays within < 10GB RAM
- [ ] Overnight batch improvement completes successfully
- [ ] All communication uses MessagePack WebSocket
- [ ] Checkpoint manager tracks all model versions
- [ ] Improvement metrics logged per cycle
- [ ] Phase 3 simulator integration verified with updated model
