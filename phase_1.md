# AETHER Studio — Phase 1: Perception & Object-Centric Scene Understanding

**Version:** 1.0
**Status:** Final & Locked
**Prerequisites:** Phase 0 complete

---

## Hybrid Intelligence Note (Locked)

The core physics intelligence (dynamics model, simulation, self-improvement) is **100% open-source, local, and trained on PhD-level physics**.

The reasoning, planning, explanation, tool calling, and targeted data generation layers use a **pluggable frontier LLM**.

In the final app, users can choose any provider (Anthropic, OpenAI, Grok, Minimax 2.7, etc.) and paste their API key.

> **During development we default to Minimax 2.7 for cost efficiency.**

---

## 1. Phase 1 Objectives (Research Level)

### Primary Goal

Build a real-time, uncertainty-aware, camera-calibrated perception pipeline that converts raw video/webcam input into a clean, consistent ROCG-PA SceneGraph ready for the dynamics model (Phase 2).

### Secondary Goals

- Accurate 3D keypoint estimation from monocular video using explicit camera intrinsics
- Persistent object identities under occlusion and fast motion
- Well-calibrated uncertainty for every output
- End-to-end latency < 40ms on laptop GPU
- Modular design so perception can be upgraded independently

### Success Criterion

The pipeline must produce SceneGraphs that enable the Phase 2 dynamics model to achieve **< 15% rollout error at 5-second horizon** on real mechanism videos.

---

## 2. Perception Pipeline Architecture (Final Locked Design)

```
Raw Video / Webcam
    │
    ▼
1. Camera Calibration Check (intrinsics loaded or prompted)
    │
    ▼
2. Frame Preprocessing + Temporal Buffering
    │
    ▼
3. Detection + Instance Segmentation (YOLO-World + SAM)
    │
    ▼
4. 2D Keypoint & Feature Extraction (CoTracker3)
    │
    ▼
5. Multi-Frame 3D Keypoint Lifting (with camera intrinsics + rigidity prior)
    │
    ▼
6. Hybrid Re-identification & Tracking
    │
    ▼
7. Uncertainty Estimation & Filtering
    │
    ▼
8. Tensor Bridge (PyTorch → JAX)
    │
    ▼
9. ROCG-PA SceneGraph Construction
    │
    ▼
→ Phase 2 Dynamics Model
```

---

## 3. Library Selection (Latest 2026 Open-Source)

| Component | Chosen Library | Reason |
|-----------|---------------|--------|
| Detection | YOLO-World (latest) | Best open-vocabulary + speed |
| Segmentation | SAM 2 Tiny (primary) / SAM 3 distilled | Proven fast & reliable on laptop |
| Tracking & 2D Keypoints | CoTracker3 | State-of-the-art temporal coherence |
| Depth Estimation | Depth-Anything-v2 | Strong monocular depth |
| 3D Lifting | Multi-frame bundle adjustment + learned rigidity prior | Most accurate for rigid mechanisms |
| Re-identification | Hybrid (appearance ViT + geometric + motion) | Robust under occlusion |

---

## 4. Camera Calibration (Critical Fix Implemented)

**Module:** `backend/app/perception/calibration.py`

- One-time calibration wizard in the desktop app (checkerboard pattern recommended)
- Automatic fallback using structure-from-motion on video if checkerboard not available
- Intrinsics stored in `session_calibration.json`
- Passed into every 3D lifting call
- Included in every .aether export file

> **This completely solves the scale ambiguity problem in monocular 3D lifting.**

### Calibration Intrinsics Schema
```python
{
    "fx": float,   # focal length x (pixels)
    "fy": float,   # focal length y (pixels)
    "cx": float,   # principal point x
    "cy": float,   # principal point y
    "distortion_coeffs": [k1, k2, p1, p2, k3],  # radial + tangential
    "resolution": [width, height],
    "calibration_date": "ISO timestamp"
}
```

---

## 5. 3D Keypoint Lifting (PhD-Level)

### Method

1. **2D keypoints** from CoTracker3 + SAM masks
2. **Initialize** with Depth-Anything-v2 + camera intrinsics
3. **Bundle adjustment** — short-horizon (5–8 frames) with rigidity constraint
4. **Refine** with a small learned motion prior (Neural ODE trained on synthetic rigid-body data)
5. **Output:** 3D keypoints + full covariance uncertainty matrix

### Mathematical Foundation

Bundle adjustment minimizes reprojection error + rigidity term:

```
min  Σ || π(K, [R|t], X_i) - x_2d ||²  +  λ · rigidity_loss
```

Where:
- `π` = perspective projection with camera intrinsics `K`
- `[R|t]` = camera rotation and translation
- `X_i` = 3D keypoint
- `x_2d` = observed 2D keypoint

---

## 6. Tensor Bridge (Critical Fix Implemented)

**Module:** `backend/app/utils/tensor_bridge.py`

Contains explicit conversion functions:

```python
torch_to_jax(tensor)   # PyTorch → JAX
jax_to_torch(array)     # JAX → PyTorch
 Automatic device handling (CPU/GPU)
```

> **All perception outputs pass through this bridge before reaching the JAX-based dynamics model.** This eliminates any tensor-type errors.

---

## 7. Re-identification & Temporal Consistency

### Hybrid ReID

| Embedding | Source | Purpose |
|-----------|--------|---------|
| Appearance | Light ViT on SAM crop | Visual similarity |
| Geometric | 3D keypoint configuration | Shape matching |
| Motion | Kalman-filtered velocity | Movement pattern |

### Persistent Memory
Last **30 seconds** of object states for long-occlusion recovery.

### Occlusion Handling
- Maintain object hypotheses during full occlusion
- Merge on re-appearance using appearance + geometry + motion score
- Confidence decay for objects not seen for > 2 seconds

---

## 8. Uncertainty Estimation

Every output includes:

| Uncertainty Source | Representation |
|--------------------|----------------|
| Keypoint position | 3×3 covariance matrix per keypoint |
| Object ID confidence | Scalar [0, 1] per object |
| Segmentation quality | Scalar [0, 1] per mask |

> **These uncertainties are propagated through the tensor bridge into the dynamics model (Phase 2)** so noisy observations are automatically down-weighted.

---

## 9. Real-Time Optimization Strategy

### Latency Budget (< 40ms total)

| Stage | Time Budget |
|-------|------------|
| Detection + Segmentation | 12–15ms |
| Tracking + Keypoints | 7–9ms |
| 3D Lifting | 5–7ms |
| Graph Construction | 2–3ms |

### Optimization Techniques

- **Frame skipping** — perception at 15–20 FPS
- **Asynchronous processing** — perception runs in parallel with dynamics
- **Model quantization / TensorRT** — where possible
- **Early exit** — for high-uncertainty objects

---

## 10. Integration with Later Phases

| Integration Point | How |
|-------------------|-----|
| Phase 1 → Phase 2 | SceneGraph → Tensor Bridge → JAX dynamics model |
| Camera intrinsics | Carried forward into all .aether exports |
| Phase 3 (Simulator) | SceneGraph ready for real-time use |
| Phase 5 (UI) | Studio view renders live SceneGraph |

---

## 11. Phase 1 Evaluation Metrics

| Metric | Target |
|--------|--------|
| Average end-to-end latency | < 40ms on laptop GPU |
| Object ID persistence | > 92% on 60-second videos with occlusion |
| 3D keypoint error | < 8mm on calibrated test set |
| SceneGraph generation success | 6+ different real mechanisms |
| Phase 2 readiness | < 15% rollout error at 5s horizon |

---

## 12. Phase 1 File Structure

```
backend/
├── app/
│   ├── perception/
│   │   ├── __init__.py
│   │   ├── calibration.py           # Camera calibration module
│   │   ├── detection.py             # YOLO-World + SAM pipeline
│   │   ├── tracking.py             # CoTracker3 + ReID
│   │   ├── lifting_3d.py           # Multi-frame 3D lifting
│   │   ├── uncertainty.py          # Covariance estimation
│   │   └── scene_graph_builder.py  # ROCG-PA SceneGraph construction
│   ├── schemas/
│   │   └── rocp_scenegraph.py     # (from Phase 0)
│   └── utils/
│       └── tensor_bridge.py        # JAX ↔ PyTorch bridge
frontend/
├── components/
│   ├── CalibrationWizard.tsx       # (from Phase 0)
│   ├── VideoInput.tsx              # Webcam / upload component
│   └── SceneGraphVisualizer.tsx    # Live SceneGraph debug view
```

---

## 13. Dependencies (Phase 1 Specific)

```txt
# Perception
yolo-world>=0.1.0
supermind-segment-anything>=2.0.0  # SAM 2 / 3
cotracker3>=1.0.0
depth-anything-v2>=1.0.0
opencv-python>=4.10.0
scipy>=1.13.0                   # For bundle adjustment

# Torch
torch>=2.3.0
torchvision>=0.18.0

# Core (from Phase 0)
jax[cuda12]>=0.4.30
```

---

## 14. Exit Criteria

Before proceeding to Phase 2, the following must be verified:

- [ ] Camera calibration wizard produces valid intrinsics
- [ ] YOLO-World detects objects in real mechanism video
- [ ] SAM produces clean segmentation masks
- [ ] CoTracker3 tracks keypoints across 30+ frames
- [ ] 3D lifting produces keypoints with < 8mm error on calibrated set
- [ ] Object IDs persist through 2-second occlusions
- [ ] Uncertainty matrices are non-trivial (not identity)
- [ ] End-to-end latency < 40ms on laptop GPU
- [ ] SceneGraph is valid ROCG-PA format
- [ ] Tensor bridge converts without data loss or device errors
