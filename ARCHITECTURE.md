# AETHER Architecture

AETHER transforms raw video into physics models through a pipeline of specialized components. This document explains how each piece works and how data flows through the system.

---

## High-Level System Diagram

```
                          ┌─────────────────────────────────────────────────────┐
                          │                      VIDEO INPUT                    │
                          │         (mp4, mov, avi — any format PyAV supports)  │
                          └─────────────────────────┬───────────────────────────┘
                                                    │
                                                    ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 1: FRAME EXTRACTION                             │
│                                                                                │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────┐   │
│   │   PyAV Loader   │────▶│  Keyframe Sel.  │────▶│   Frame Cache       │   │
│   │  (fast seeking) │     │  (uniform every  │     │   (PNG files)      │   │
│   │   ~0.3s/frame   │     │   Nth frame)     │     │                     │   │
│   └─────────────────┘     └─────────────────┘     └─────────────────────┘   │
│           │                                               │                   │
│           │              Performance:                    │                   │
│           │              20 frames in ~6s                ▼                   │
└───────────┼──────────────────────────────────────┬───────────────────────────┘
            │                                       │
            ▼                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 2: PERCEPTION (AETHER Neural Core)                    │
│                                                                                │
│   ┌─────────────────────────────────┐    ┌─────────────────────────────────┐   │
│   │      SAM2 Segmentation          │    │         MiDaS Depth            │   │
│   │  ┌───────────────────────────┐  │    │  ┌───────────────────────────┐│   │
│   │  │  Minimal grid points: 16  │  │    │  │  Metric depth estimation  ││   │
│   │  │  (was 256, 43x faster!)   │  │    │  │  from single image        ││   │
│   │  │  ~0.15s per frame         │  │    │  │  ~0.07s per frame         ││   │
│   │  └───────────────────────────┘  │    │  └───────────────────────────┘│   │
│   └─────────────────────────────────┘    └─────────────────────────────────┘   │
│                    │                                        │                   │
│                    │  Masks + Depth                         │                   │
│                    └────────────┬───────────────────────────┘                   │
│                                   ▼                                             │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                        CoTracker3 Tracking                             │  │
│   │  ┌───────────────────────────────────────────────────────────────────┐  │  │
│   │  │  Conservative optimization for point tracking                    │  │  │
│   │  │  Tracks points across frames with sub-pixel accuracy             │  │  │
│   │  │  ~0.04s per frame                                                │  │  │
│   │  └───────────────────────────────────────────────────────────────────┘  │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                   │                                             │
│                                   │  Output:                                   │
│                                   │  - 3D point trajectories                   │
│                                   │  - Segmentation masks per frame           │
│                                   │  - Depth maps                              │
│                                   ▼                                             │
└───────────────────────────────────┼─────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 3: KINEMATIC DISCOVERY                               │
│                                                                                │
│   ┌─────────────────────────────────┐    ┌─────────────────────────────────┐   │
│   │   Rigid Body Clustering         │    │     SE(3) Transformation        │   │
│   │  ┌───────────────────────────┐  │    │  ┌───────────────────────────┐  │   │
│   │  │  Spectral clustering on   │  │    │  │  For each body pair:     │  │   │
│   │  │  motion coherence          │  │    │  │  R, t = argmin ||PX-Q||  │  │   │
│   │  │  (which points move        │  │    │  │  via SVD on cross-cov    │  │   │
│   │  │   together)                │  │    │  └───────────────────────────┘  │   │
│   │  └───────────────────────────┘  │    └─────────────────────────────────┘   │
│   └─────────────────────────────────┘                  │                       │
│                            │                           │                        │
│                            │  Bodies + Transforms      ▼                        │
│                            └──────────┬────────────────────────────────────────┐ │
│                                       │                                         │
│   ┌─────────────────────────────────┐ ▼                                         │
│   │       Joint Classification      │    ┌─────────────────────────────────┐  │
│   │  ┌───────────────────────────┐  │    │        Kinematic Tree           │  │
│   │  │  DOF Analysis via SVD:   │  │───▶│  ┌───────────────────────────┐  │  │
│   │  │                           │  │    │  │  Root → Joint → Body →   │  │  │
│   │  │  Revolute: 1 rot DOF     │  │    │  │  Joint → Body → ...      │  │  │
│   │  │  Prismatic: 1 trans DOF │  │    │  └───────────────────────────┘  │  │
│   │  │  Cylindrical: 2 DOF      │  │    └─────────────────────────────────┘  │
│   │  │  Spherical: 3 rot DOF    │  │                                           │
│   │  └───────────────────────────┘  │    Output:                             │
│   └─────────────────────────────────┘    - Hierarchical body structure         │
│                                            - Joint types and axes               │
│                                            - Transformation matrices             │
└────────────────────────────────────────────┼────────────────────────────────────┘
                                             │
                                             ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 4: PHYSICS LEARNING                                  │
│                                                                                │
│   ┌─────────────────────────────────┐    ┌─────────────────────────────────┐   │
│   │   Mass & Parameter Estimation   │    │       Trajectory Optimization    │   │
│   │  ┌───────────────────────────┐  │    │  ┌───────────────────────────┐  │   │
│   │  │  Differentiable simulation │  │    │  │  Minimize:               │  │   │
│   │  │  via MuJoCo/MJX            │  │    │  │  ||q_sim(t) - q_obs(t)||² │  │   │
│   │  │                            │  │    │  │                           │  │   │
│   │  │  Backprop through physics │  │    │  │  w.r.t. mass, friction,   │  │   │
│   │  │  to learn parameters       │  │    │  │  damping, stiffness       │  │   │
│   │  └───────────────────────────┘  │    │  └───────────────────────────┘  │   │
│   └─────────────────────────────────┘    └─────────────────────────────────┘   │
│                    │                                                         │
│                    │  Physics-validated parameters                            │
│                    ▼                                                         │
└────────────────────┼─────────────────────────────────────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 5: DIGITAL TWIN OUTPUT                                │
│                                                                                │
│   ┌─────────────────────┐    ┌─────────────────────┐    ┌───────────────────┐ │
│   │   MuJoCo MJCF XML   │    │   Scene Graph JSON  │    │  Simulation API   │ │
│   │                     │    │                     │    │                   │ │
│   │  Complete physics   │    │  Bodies, joints,   │    │  Run what-if      │ │
│   │  model ready to     │    │  parameters with   │    │  scenarios        │ │
│   │  simulate          │    │  confidence scores │    │  via REST API     │ │
│   └─────────────────────┘    └─────────────────────┘    └───────────────────┘ │
│                                                                                │
│   Export targets:                                                              │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│   │ MuJoCo   │  │  ROS/    │  │  Isaac   │  │  Custom  │                    │
│   │ .mjcf    │  │  URDF    │  │  Gym     │  │  Format  │                    │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Descriptions

### Frame Extraction

**Technology:** PyAV (FFmpeg bindings)

PyAV provides fast seeking in video files by leveraging FFmpeg's seeking capabilities. Instead of decoding every frame, we seek directly to keyframe positions.

```
Performance: 20 frames in ~6 seconds
Previous: Minutes (decoded every frame)
Speedup: 43x
```

### SAM2 Segmentation

**Technology:** Segment Anything Model 2 (SAM2)

SAM2 segments objects in each frame without requiring prior knowledge of what objects look like. We use a minimal grid of 16 points (instead of the default 256) to find high-quality masks quickly.

```python
# Minimal grid approach: 4x4 = 16 points
sam2.predictor.set_image(frame)
masks, scores, _ = sam2.predictor.point_prompt(
    point_coords=grid_points,
    point_labels=[1] * len(grid_points)
)
```

```
Performance: 0.15s per frame (16 points)
Previous: 6.6s per frame (256 points)
Speedup: 43x
```

### MiDaS Depth Estimation

**Technology:** MiDaS (Depth Anything v2)

Estimates metric depth from a single 2D image. This allows lifting 2D tracked points into 3D space.

```
Performance: 0.07s per frame
VRAM: ~0.6GB peak
Output: Depth map per frame in meters
```

### CoTracker3 Tracking

**Technology:** CoTracker3 (Conservative Optimization Tracker)

Tracks specific points across video frames with sub-pixel accuracy. Uses conservative optimization to avoid drift.

```
Performance: 0.04s per frame (5 frames = 0.2s total)
Output: 3D trajectories for tracked points
Accuracy: Sub-pixel (< 0.1 pixels typical)
```

### Kinematic Discovery

**Technology:** Custom algorithms based on SVD and spectral clustering

This is the mathematical core of AETHER — discovering which rigid bodies exist and how they're connected.

#### Step 1: Rigid Body Clustering

Points that move together (same displacement pattern) belong to the same rigid body.

```python
# Build affinity matrix based on motion similarity
affinity[i, j] = correlation(displacement_i, displacement_j)

# Spectral clustering finds groups
labels = spectral_clustering(affinity, n_clusters=estimated_bodies)
```

#### Step 2: SE(3) Transformation Estimation

For each pair of bodies, compute the rigid transformation (rotation + translation) that maps one to the other.

```python
# Cross-covariance matrix
H = P_ref.T @ P_curr

# SVD gives optimal rotation
U, S, Vt = np.linalg.svd(H)
R = Vt.T @ U  # Rotation matrix

# Translation from centroid difference
t = centroid_curr - R @ centroid_ref
```

#### Step 3: Joint Classification

Analyze the degrees of freedom in the relative motion to determine joint type.

| Observed Motion | Inferred Joint |
|-----------------|----------------|
| Circular trajectory, no translation | Revolute (hinge) |
| Linear trajectory, no rotation | Prismatic (slider) |
| Circular + linear | Cylindrical |
| Spherical trajectory | Spherical |
| No relative motion | Fixed |

```python
# Analyze via SVD on relative velocities
delta_v = v_child - R @ v_parent  # Remove parent's motion
U, S, Vt = np.linalg.svd(delta_v)

# Singular values reveal DOF:
# 1 small, 2 large → 1 rotational DOF → revolute
# 1 large, 2 small → 1 translational DOF → prismatic
# All non-zero → mixed → cylindrical
```

### Physics Learning

**Technology:** MuJoCo MJX (DeepMind's JAX-based differentiable MuJoCo)

Once the kinematic structure is known, we learn the physical parameters (mass, friction, damping, stiffness) by optimizing to match observed trajectories.

```python
def physics_loss(params, observations):
    # Simulate with candidate parameters
    qpos_sim = mjx_simulate(model, params, n_steps=len(observations))
    
    # Compare simulated vs observed trajectories
    return jnp.mean((qpos_sim - observations) ** 2)

# Gradient descent through physics!
grads = jax.grad(physics_loss)(params)
params = params - learning_rate * grads
```

This is differentiable physics — we're not guessing mass from geometry, we're learning mass from motion.

---

## Data Flow: Frame by Frame

### Input: Video Frames

```
Frame 0          Frame 1          Frame 2          Frame 3
   │                │                │                │
   ▼                ▼                ▼                ▼
┌──────┐         ┌──────┐         ┌──────┐         ┌──────┐
│ SAM2 │         │ SAM2 │         │ SAM2 │         │ SAM2 │
│ Mask │         │ Mask │         │ Mask │         │ Mask │
└──┬───┘         └──┬───┘         └──┬───┘         └──┬───┘
   │                │                │                │
   ▼                ▼                ▼                ▼
┌──────┐         ┌──────┐         ┌──────┐         ┌──────┐
│MiDaS │         │MiDaS │         │MiDaS │         │MiDaS │
│Depth │         │Depth │         │Depth │         │Depth │
└──┬───┘         └──┬───┘         └──┬───┘         └──┬───┘
   │                │                │                │
   └────────────────┼────────────────┼────────────────┘
                    ▼
             ┌─────────────┐
             │  CoTracker3 │
             │  3D Points  │
             └──────┬──────┘
                    │
                    ▼
             ┌─────────────┐
             │ Kinematic   │
             │ Discovery   │
             └──────┬──────┘
                    │
                    ▼
             ┌─────────────┐
             │   Scene     │
             │   Graph     │
             └──────┬──────┘
                    │
                    ▼
             ┌─────────────┐
             │  Physics    │
             │  Learning   │
             └──────┬──────┘
                    │
                    ▼
             ┌─────────────┐
             │  Digital    │
             │  Twin       │
             └─────────────┘
```

### Output: Digital Twin

```
Scene Graph JSON          MuJoCo Model (.mjcf)
┌────────────────┐       ┌────────────────────────┐
│ Bodies: 3      │       │ <mujoco model>         │
│ Joints: 2      │       │   <worldbody>          │
│ Type: robot_arm│       │     <body name="L1">   │
│ Confidence: 92%│       │       <joint type=...> │
└────────────────┘       │     </body>            │
                        │   </worldbody>         │
                        │ </mujoco model>        │
                        └────────────────────────┘
```

---

## Performance Profile

### Timing Breakdown (RTX 3050 4GB, 5 frames)

| Stage | Time | VRAM |
|-------|------|------|
| SAM2 segmentation | 0.77s | 2.5GB |
| MiDaS depth | 0.35s | 0.6GB |
| CoTracker3 tracking | 0.19s | 0.6GB |
| Kinematic discovery | 0.10s | 0.2GB |
| Physics learning | 0.50s | 1.0GB |
| **Total** | **1.91s** | **2.9GB peak** |

### Memory Management

Models are loaded sequentially and cleared after use to stay within 4GB VRAM:

```
Frame N starts
  ├─ Load SAM2 (2.5GB) → segment → unload
  ├─ Load MiDaS (0.6GB) → depth → unload
  ├─ Load CoTracker3 (0.6GB) → track → unload
  └─ CPU processing for kinematics + physics
Frame N complete, VRAM cleared
```

---

## File Structure

```
aether/
├── backend/app/
│   ├── main.py                    # FastAPI application entry
│   ├── api/
│   │   ├── videos.py              # /api/videos/* endpoints
│   │   ├── frames.py              # /api/frames/* endpoints
│   │   ├── perception.py          # /api/perception/* (SAM2, MiDaS, CoTracker3)
│   │   ├── scene_graph.py         # /api/scene_graph/* (kinematic builder)
│   │   ├── simulation.py          # /api/simulate/* (physics simulation)
│   │   └── chat.py               # /api/chat/* (assistant)
│   │
│   ├── video/
│   │   ├── loader.py              # PyAV video loading
│   │   └── frames.py             # Frame extraction and caching
│   │
│   ├── perception/
│   │   ├── sam2/
│   │   │   ├── predictor.py       # SAM2 wrapper
│   │   │   └── onnx_encoder.py   # ONNX Runtime encoder
│   │   ├── depth/
│   │   │   └── midas.py          # MiDaS depth estimation
│   │   └── tracking/
│   │       └── cotracker.py       # CoTracker3 wrapper
│   │
│   ├── scene_graph/
│   │   ├── schema.py             # ObjectNode, Edge, Joint schemas
│   │   ├── builder.py            # Universal mechanism builder
│   │   ├── kinematic_discovery.py # SVD + spectral clustering
│   │   └── mjcf_converter.py     # Kinematic tree → MuJoCo XML
│   │
│   └── physics/
│       ├── mujoco_adapter.py     # MuJoCo simulation wrapper
│       ├── learnable_params.py   # Differentiable parameter learning
│       └── trajectory_optimizer.py # L-BFGS-B trajectory fitting
│
├── apps/desktop/                  # Electron desktop app
├── packages/schemas/             # Shared JSON schemas
├── data/
│   ├── samples/                  # Example videos
│   └── sessions/                 # User session data
└── scripts/
    └── download_checkpoints.py  # Model download utility
```

---

## API Integration Points

```
Desktop App (Electron)
        │
        │ WebSocket (MessagePack) + HTTP/JSON
        ▼
FastAPI Backend
   │
   ├── /api/sessions      → Session management
   ├── /api/videos        → Video upload + storage
   ├── /api/frames        → Frame extraction
   ├── /api/perception    → AETHER Neural Core (SAM2 + MiDaS + CoTracker3)
   ├── /api/scene_graph   → Kinematic discovery + scene graph building
   ├── /api/simulation    → Physics simulation (MuJoCo)
   ├── /api/chat          → Assistant with physics knowledge
   └── /api/knowledge     → ChromaDB knowledge base
```

---

## Extension Points

### Adding New Mechanism Types

To add support for a new mechanism type:

1. **Define the template** in `scene_graph/builder.py`:
```python
MECHANISM_TEMPLATES = {
    "new_mechanism": MechanismTemplate(
        objects=["body1", "body2", "joint1"],
        constraints=[...],
        default_params={...}
    )
}
```

2. **Add validation** in `scene_graph/validators.py`

3. **Add export format** if needed in `export/`

### Swapping Perception Models

SAM2, MiDaS, and CoTracker3 can be replaced with newer models:

```python
# In perception/pipeline.py
class AetherNeuralCore:
    def __init__(self):
        self.segmenter = SAM2Predictor()  # or FastSAM, HQ-SAM, etc.
        self.depth_estimator = MiDaS()     # or Marigold, etc.
        self.tracker = CoTracker3()        # or TapNet, etc.
```

### Custom Physics Engines

The physics layer is abstracted — swap MuJoCo for your engine:

```python
# In physics/simulator.py
class PhysicsSimulator:
    def simulate(self, model, params, n_steps):
        # Currently: MuJoCo
        # Could be: MJX, Warp, PhysX, Isaac, etc.
        return mujoco_simulate(model, params, n_steps)
```
