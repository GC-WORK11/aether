# AETHER Roadmap

Where AETHER is headed — from first release to full research platform.

---

## Version Timeline

```
2026                    2027
  │                       │
  ├─ v1.0 (current) ──────┤
  ├─ v1.5                 │
  ├─ v2.0                 │
  ├─ v2.5                 │
  └─ Future ──────────────┘

Now:     Core pipeline working, desktop app functional
Soon:    Better UX, more mechanisms, real-time processing
Later:   Multi-body, ROS integration, full digital twin
```

---

## v1.0: Core Pipeline (Current)

**Status:** Functional but limited

### What Works

- Video frame extraction (PyAV, fast seeking)
- SAM2 segmentation (minimal grid, 43x faster)
- MiDaS depth estimation
- CoTracker3 point tracking
- Kinematic discovery (spectral clustering + SVD)
- Scene graph building (9 mechanism types)
- Belt/gantry physics simulation
- MuJoCo model export
- Desktop app (Electron + React)
- REST API for all pipeline stages

### Known Limitations

- Simulation works for belt/gantry only — other mechanism types return correct kinematic structure but generic physics
- Mass estimation has 15-30% error — improving with differentiable physics
- Requires good lighting and clear joint visibility
- Single viewpoint (multi-view planned)

### Example Session Today

```bash
# Upload video
curl -X POST /api/videos/upload/$SID -F "file=@suspension.mp4"

# Get kinematic structure (works great)
curl -X POST /api/scene_graph/$SID/build?mechanism_type=vehicle
# Returns: bodies, joints, axes, confidence scores ✓

# Simulate (limited to belt/gantry physics)
curl -X POST /api/simulate -d '{"scene_graph": ...}'
# Returns: physics for belt, not suspension ⚠️
```

---

## v1.5: Better UX + More Mechanisms

**Target:** Q3 2026

### Goals

1. **Universal physics simulation** — All 9 mechanism types get correct physics, not just belt/gantry
2. **Improved mass estimation** — MJX backprop for 10-15% mass error (from current 15-30%)
3. **Better segmentation** — FastSAM or Q-SAM for 10x faster masking
4. **3D viewer** — Interactive Three.js visualization of the digital twin
5. **Calibration utilities** — Scale reference, known-mass objects for ground truth

### Technical Changes

```
SAM2 (16 pts, 0.15s/frame)
    ↓
FastSAM or Q-SAM (0.02s/frame, same quality)

Belt/gantry simulation
    ↓
Universal physics bridge (all 9 mechanisms)

2D track overlay
    ↓
3D Gaussian splat preview
```

### User Impact

| Before v1.5 | After v1.5 |
|-------------|-------------|
| "My suspension video gets a scene graph but belt simulation" | "My suspension video gets correct suspension physics" |
| "Tracking looks a bit shaky" | "Smooth 3D preview of mechanism" |
| "Mass error is ±30%" | "Mass error is ±15%" |
| "I need to guess scale" | "Use a coin as reference, get exact scale" |

---

## v2.0: Real-Time Video Processing

**Target:** Q4 2026

### Goals

1. **Live webcam processing** — AETHER watches a mechanism in real-time and updates its model
2. **TensorRT full pipeline** — CUDA graphs for complete pipeline < 0.3s/frame
3. **Interactive what-if** — Drag parameters and see physics update instantly
4. **Multi-view fusion** — Combine phone camera from multiple angles

### Technical Architecture

```
Webcam feed (30fps)
      │
      ▼
┌─────────────────────────────────────┐
│      Real-Time AETHER Pipeline      │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │ TensorRT│  │ TensorRT│          │
│  │  SAM2   │  │  MiDaS  │          │
│  │ encoder │  │ depth   │          │
│  └────┬────┘  └────┬────┘          │
│       │            │                │
│       └─────┬──────┘                │
│             ▼                       │
│       ┌───────────┐                 │
│       │ CoTracker3│                 │
│       │  (online) │                 │
│       └─────┬─────┘                 │
│             │                       │
│             ▼                       │
│       ┌───────────┐                 │
│       │Kinematic  │                 │
│       │ Update    │                 │
│       └─────┬─────┘                 │
│             │                       │
│             ▼                       │
│       ┌───────────┐                 │
│       │ Live 3D  │                 │
│       │ Preview  │                 │
│       └───────────┘                 │
└─────────────────────────────────────┘
             │
             ▼
   Interactive digital twin
   (drag, modify, simulate)
```

### Performance Targets

| Metric | v1.0 | v2.0 |
|--------|------|------|
| Frame latency | 0.26s | 0.03s |
| Tracking latency | 0.04s | 0.01s |
| Full pipeline | 1.4s | 0.1s |
| Real-time capable | No | Yes (10+ fps) |
| Interactive update | 2-5s | 0.1s |

### User Experience

```
[Live view shows mechanism]
    │
    │ AETHER detects structure
    ▼
[3D model appears, updates live]
    │
    │ User clicks "lock model"
    ▼
[Interactive controls appear]
    - Mass slider: 0.5x to 2.0x
    - Friction: 0 to 1.0
    - Stiffness: 50 to 200 N/m
    │
    ▼
[Physics updates in real-time]
```

---

## v2.5: Multi-Body Mechanisms

**Target:** Q1 2027

### Goals

1. **Complex assemblies** — Multiple interacting mechanisms (not just single chains)
2. **Contact modeling** — Realistic contact dynamics (gears, cams, clutches)
3. **Closed-loop mechanisms** — Four-bar linkages, gear trains, differential gears
4. **Parameterized families** — Learn mechanism class parameters, not just instance

### New Mechanism Types

```
v2.0: Single-chain mechanisms
  - Pendulum ✓
  - 2-link arm ✓
  - Slider-crank ✓
  - Vehicle suspension ✓

v2.5: Complex assemblies
  - Four-bar linkage (closed loop)
  - Gear pair (contact + constraints)
  - Cam-follower (complex contact)
  - Differential (closed loop + contact)
  - Vehicle drivetrain (multi-body + gears)
```

### Technical Requirements

```python
# Closed-loop detection
class ClosedLoopDetector:
    def find_loops(self, kinematic_tree):
        # Detect cycles in kinematic graph
        # Identify loop closure constraints
        # Add to physics model as equality constraints
        pass

# Contact mechanics
class ContactModel:
    def compute_contact(self, body_a, body_b, penetration):
        # Normal force (spring-damper)
        # Tangential friction force
        # Return contact wrenches for both bodies
        pass
```

### JSON Output Enhancement

```json
{
  "mechanism_type": "four_bar_linkage",
  "n_bodies": 4,
  "n_joints": 4,
  "loops": [
    {
      "type": "closed_kinematic_loop",
      " Bodies": ["link0", "link1", "link2", "link3"],
      "constraint": "loop_closure",
      "equation": "R0 * L0 + R1 * L1 + R2 * L2 + R3 * L3 = 0"
    }
  ],
  "grashof_type": "class_I",
  "is_grashof": true
}
```

---

## Future: Integration with Robotics Ecosystems

**Target:** Q2 2027 and beyond

### ROS/ROS2 Integration

```python
# ros2_aether bridge
class AetherROSBridge:
    """
    AETHER as a ROS2 node for perception.
    Publishes scene graph as ROS messages.
    """
    def __init__(self):
        self.sub_video = ros2.subscribe('/camera/image', Image)
        self.pub_scene_graph = ros2.advertise('/aether/scene_graph', SceneGraph)
        self.pub_joint_states = ros2.advertise('/aether/joint_states', JointState)

    def on_video(self, img):
        sg = self.aether.process(img)
        self.pub_scene_graph.publish(sg.to_ros_msg())

        # Also publish as TF for rviz visualization
        for body in sg.bodies:
            self.pub_tf.publish(body.to_transform())
```

### Isaac Gym Integration

```python
# Export to Isaac Gym format
class IsaacGymExporter:
    def export(self, scene_graph):
        # Convert AETHER scene graph to Isaac Gym USD
        # Includes:
        # - Rigid body hierarchies
        # - Joint definitions
        # - Contact materials
        # - Physics material properties
        pass

# Training integration
class IsaacGymTrainer:
    def train_policy(self, scene_graph, task):
        # Import mechanism to Isaac Gym
        asset = self.exporter.export(scene_graph)

        # Create training task
        task = LiftTask(asset, target_pose)

        # Train RL policy
        policy = ppo.train(task, num_envs=2048)

        return policy
```

### Mujoco XML Extensions

```xml
<!-- AETHER exports standard MuJoCo -->
<mujoco model="vehicle_suspension">
  <worldbody>
    <body name="chassis">
      <freejoint/>
      <geom type="box" size=".125 .06 .04"/>
    </body>
  </worldbody>
</mujoco>

<!-- Future: AETHER-ROS extensions for TF tree -->
<aether extensions="ros">
  <tf_tree>
    <frame name="chassis" parent="world"/>
    <frame name="wheel_fl" parent="chassis"/>
  </tf_tree>
</aether>
```

### Simulation Interchange

```
AETHER
   │
   ├──▶ MuJoCo .mjcf (native)
   ├──▶ ROS/URDF (via aether_ros)
   ├──▶ Isaac Gym USD (via aether_isaac)
   ├──▶ Drake (via aether_drake)
   └──▶ Webots (via aether_webots)
```

---

## How to Get There

### Contributors Welcome

The roadmap above represents our priorities, but contributions drive the timeline.

| Area | Help Wanted | Difficulty |
|------|-------------|------------|
| FastSAM integration | Test and benchmark | Medium |
| Universal physics bridge | Math + physics knowledge | Hard |
| TensorRT optimization | CUDA expertise | Hard |
| 3D viewer | Three.js experience | Medium |
| ROS bridge | ROS2 experience | Medium |
| Documentation | Technical writing | Easy |

### Milestone Markers

Watch for these release signals:

```
v1.5: "Universal physics simulation" — all 9 mechanisms simulated
v2.0: "Real-time" — webcam feed to 3D preview in < 1 second
v2.5: "Multi-body" — closed loops and contacts working
v3.0: "Production" — ROS, Isaac Gym, Drake bridges complete
```

---

## Version History

### v0.9 (Internal Alpha)
- SAM2 + CoTracker3 pipeline working
- Kinematic discovery on synthetic data
- Desktop app prototype

### v1.0 (Current)
- Full pipeline functional
- 9 mechanism types in scene graph
- MuJoCo export
- Desktop app with chat interface

### v1.5 (Planned)
- Universal physics simulation
- 3D viewer
- Better mass estimation

---

## Feedback

What matters most to you? Open an issue or start a discussion:

- **Real-time processing** — We can prioritize TensorRT optimization
- **More mechanism types** — Tell us what you need
- **ROS integration** — Let us know your robotics stack
- **Accuracy improvements** — Share videos where AETHER struggles
