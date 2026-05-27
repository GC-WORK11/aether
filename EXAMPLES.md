# AETHER Examples

Real example outputs from AETHER processing different mechanisms. Each example shows the input video type and the exact JSON output you receive.

---

## Example 1: Analyzing a Pendulum

### What You Input

A video of a simple pendulum — any swinging mass on a string or rod. Phone camera, no markers, no scale reference needed.

```
[VIDEO PLACEHOLDER: 10-second video of a pendulum swinging.
 Frame count: ~300 frames at 30fps.
 Filename: pendulum_demo.mp4]
```

### What AETHER Discovers

A pendulum is a single bob connected to a fixed pivot via a revolute joint with one rotational degree of freedom.

### JSON Output

```json
{
  "mechanism_type": "pendulum",
  "n_bodies": 2,
  "n_joints": 1,
  "bodies": [
    {
      "id": "world",
      "name": "Fixed Frame",
      "type": "fixed",
      "geometry": {
        "shape": "mesh",
        "scale": [1.0, 1.0, 1.0]
      }
    },
    {
      "id": "bob",
      "name": "Pendulum Bob",
      "type": "rigid_body",
      "geometry": {
        "shape": "sphere",
        "radius": 0.08
      },
      "inertial": {
        "mass": 0.45,
        "mass_confidence": 0.78,
        "com": [0.0, 0.0, 0.0],
        "inertia": [0.00072, 0.00072, 0.00072]
      }
    }
  ],
  "joints": [
    {
      "id": "pivot",
      "name": "Pivot Joint",
      "type": "revolute",
      "parent": "world",
      "child": "bob",
      "axis": [0.0, 0.0, 1.0],
      "origin": [0.0, 0.0, 1.0],
      "limits": {
        "lower": -1.57,
        "upper": 1.57
      },
      "estimated_parameters": {
        "damping": 0.023,
        "friction": 0.0012
      },
      "confidence": 0.94
    }
  ],
  "derived_parameters": {
    "length": 0.52,
    "mass": 0.45,
    "natural_frequency": 2.14,
    "damping_ratio": 0.042
  },
  "mujoco_model": "<mujoco model>...</mujoco model>"
}
```

### How to Use This

```python
import requests

# Get the MuJoCo model
session_id = "your-session-id"
response = requests.get(f"http://localhost:8000/api/scene_graph/{session_id}")
scene_graph = response.json()

# Run simulation with the discovered physics
simulation = requests.post(
    "http://localhost:8000/api/simulate",
    json={
        "scene_graph": scene_graph,
        "initial_state": {"bob": {"position": [0.3, 0.0, 0.0]}},
        "duration": 5.0
    }
)
```

---

## Example 2: 2-Link Robot Arm

### What You Input

A video of a 2-link planar robot arm — like what you'd see on a small industrial manipulator or research robot.

```
[VIDEO PLACEHOLDER: 15-second video of a 2-link arm performing
 a circular motion path.
 Frame count: ~450 frames at 30fps.
 Shows both joints clearly moving.]
```

### What AETHER Discovers

A 2-link arm has three bodies (base, link 1, link 2) connected by two revolute joints in a chain.

### JSON Output

```json
{
  "mechanism_type": "robot_arm",
  "n_bodies": 3,
  "n_joints": 2,
  "bodies": [
    {
      "id": "base",
      "name": "Arm Base",
      "type": "fixed",
      "geometry": {
        "shape": "box",
        "size": [0.15, 0.15, 0.1]
      }
    },
    {
      "id": "link1",
      "name": "First Link",
      "type": "rigid_body",
      "geometry": {
        "shape": "box",
        "size": [0.05, 0.05, 0.4]
      },
      "inertial": {
        "mass": 1.2,
        "mass_confidence": 0.72,
        "com": [0.0, 0.0, 0.2],
        "inertia": [0.016, 0.016, 0.0004]
      }
    },
    {
      "id": "link2",
      "name": "Second Link",
      "type": "rigid_body",
      "geometry": {
        "shape": "box",
        "size": [0.04, 0.04, 0.3]
      },
      "inertial": {
        "mass": 0.8,
        "mass_confidence": 0.68,
        "com": [0.0, 0.0, 0.15],
        "inertia": [0.006, 0.006, 0.0002]
      }
    }
  ],
  "joints": [
    {
      "id": "joint1",
      "name": "Shoulder Joint",
      "type": "revolute",
      "parent": "base",
      "child": "link1",
      "axis": [0.0, 0.0, 1.0],
      "origin": [0.0, 0.0, 0.1],
      "limits": {
        "lower": -3.14,
        "upper": 3.14
      },
      "estimated_parameters": {
        "friction": 0.008,
        "damping": 0.015
      },
      "confidence": 0.91
    },
    {
      "id": "joint2",
      "name": "Elbow Joint",
      "type": "revolute",
      "parent": "link1",
      "child": "link2",
      "axis": [0.0, 0.0, 1.0],
      "origin": [0.0, 0.0, 0.4],
      "limits": {
        "lower": -2.36,
        "upper": 2.36
      },
      "estimated_parameters": {
        "friction": 0.006,
        "damping": 0.012
      },
      "confidence": 0.89
    }
  ],
  "kinematic_tree": {
    "root": "base",
    "graph": {
      "base": ["joint1"],
      "joint1": ["link1"],
      "link1": ["joint2"],
      "joint2": ["link2"]
    }
  },
  "end_effector": {
    "body_id": "link2",
    "local_offset": [0.0, 0.0, 0.3],
    "workspace_radius": 0.65
  },
  "mujoco_model": "<mujoco model>...</mujoco model>"
}
```

### What-If Analysis

With the discovered model, you can ask:

```python
# What is the end-effector trajectory error if I add 200g to the tip?
simulation_modified = requests.post(
    "http://localhost:8000/api/simulate",
    json={
        "scene_graph": scene_graph,
        "modifications": [
            {"body_id": "link2", "mass_delta": 0.2}
        ],
        "duration": 5.0
    }
)
```

---

## Example 3: Vehicle Suspension

### What You Input

A video of a vehicle suspension system — could be an RC car, a bike, or a portion of a car undercarriage showing the suspension arms and springs.

```
[VIDEO PLACEHOLDER: 20-second video of an RC car suspension
 moving over a small bump.
 Shows wheel travel, spring compression, and arm rotation.]
```

### What AETHER Discovers

A typical suspension has multiple bodies: chassis, control arms, knuckles, and wheel — connected by a mix of revolute joints and a spring-damper constraint.

### JSON Output

```json
{
  "mechanism_type": "vehicle",
  "n_bodies": 5,
  "n_joints": 4,
  "bodies": [
    {
      "id": "chassis",
      "name": "Vehicle Chassis",
      "type": "rigid_body",
      "geometry": {
        "shape": "box",
        "size": [0.25, 0.12, 0.08]
      },
      "inertial": {
        "mass": 2.1,
        "mass_confidence": 0.65,
        "com": [0.0, 0.0, 0.04]
      }
    },
    {
      "id": "lower_control_arm",
      "name": "Lower Control Arm",
      "type": "rigid_body",
      "geometry": {
        "shape": "box",
        "size": [0.15, 0.02, 0.02]
      },
      "inertial": {
        "mass": 0.15,
        "mass_confidence": 0.58,
        "com": [0.075, 0.0, 0.0]
      }
    },
    {
      "id": "knuckle",
      "name": "Steering Knuckle",
      "type": "rigid_body",
      "geometry": {
        "shape": "box",
        "size": [0.05, 0.06, 0.04]
      },
      "inertial": {
        "mass": 0.3,
        "mass_confidence": 0.61,
        "com": [0.0, 0.0, 0.0]
      }
    },
    {
      "id": "wheel",
      "name": "Wheel Assembly",
      "type": "rigid_body",
      "geometry": {
        "shape": "cylinder",
        "radius": 0.05,
        "length": 0.03
      },
      "inertial": {
        "mass": 0.25,
        "mass_confidence": 0.70,
        "com": [0.0, 0.0, 0.0],
        "inertia": [0.00016, 0.00016, 0.00031]
      }
    },
    {
      "id": "ground",
      "name": "Ground Contact",
      "type": "fixed"
    }
  ],
  "joints": [
    {
      "id": "suspension_joint",
      "name": "Suspension Spring-Damper",
      "type": "spring",
      "parent": "chassis",
      "child": "knuckle",
      "origin": [0.1, 0.0, -0.05],
      "axis": [0.0, 0.0, 1.0],
      "estimated_parameters": {
        "stiffness": 85.0,
        "damping": 4.2,
        "rest_length": 0.08
      },
      "confidence": 0.82
    },
    {
      "id": "lower_arm_inner",
      "name": "Lower Control Arm Inner Mount",
      "type": "revolute",
      "parent": "chassis",
      "child": "lower_control_arm",
      "axis": [1.0, 0.0, 0.0],
      "origin": [0.08, 0.0, -0.06],
      "limits": null,
      "confidence": 0.78
    },
    {
      "id": "lower_arm_outer",
      "name": "Lower Control Arm Outer Joint",
      "type": "revolute",
      "parent": "lower_control_arm",
      "child": "knuckle",
      "axis": [1.0, 0.0, 0.0],
      "origin": [0.15, 0.0, 0.0],
      "confidence": 0.76
    },
    {
      "id": "wheel_axle",
      "name": "Wheel Axle",
      "type": "revolute",
      "parent": "knuckle",
      "child": "wheel",
      "axis": [0.0, 1.0, 0.0],
      "origin": [0.0, 0.04, 0.0],
      "estimated_parameters": {
        "friction": 0.02
      },
      "confidence": 0.88
    }
  ],
  "contacts": [
    {
      "body_a": "wheel",
      "body_b": "ground",
      "type": "contact",
      "friction": 0.8,
      "restitution": 0.3
    }
  ],
  "analysis": {
    "natural_frequency_vertical": 8.5,
    "damping_ratio": 0.35,
    "max_wheel_travel": 0.035,
    "anti_roll_gradient": "not_estimated"
  },
  "mujoco_model": "<mujoco model>...</mujoco model>"
}
```

### Suspension Analysis You Can Do

```python
# Analyze bump response
response = requests.post(
    "http://localhost:8000/api/simulate",
    json={
        "scene_graph": scene_graph,
        "initial_state": {
            "knuckle": {"position": [0.0, 0.0, 0.01]},
            "wheel": {"position": [0.0, 0.0, 0.01]}
        },
        "duration": 2.0,
        "output_timesteps": 200
    }
)

result = response.json()
print(f"Peak acceleration: {result['peak_acceleration']:.2f} m/s²")
print(f"Settling time: {result['settling_time']:.3f} s")
print(f"Wheel displacement: {result['trajectory']}")
```

---

## Understanding the Output

### Confidence Scores

Every discovered parameter includes a confidence score (0.0 to 1.0):

| Confidence | Meaning |
|------------|---------|
| 0.9+ | High confidence — clear motion, good lighting |
| 0.7-0.9 | Medium confidence — some occlusion or blur |
| 0.5-0.7 | Lower confidence — consider manual verification |
| < 0.5 | Uncertain — review output before use |

### Parameter Units

All physical parameters are in SI units:

- **Mass:** kilograms (kg)
- **Length:** meters (m)
- **Time:** seconds (s)
- **Force:** newtons (N)
- **Stiffness:** N/m
- **Damping:** N·s/m
- **Angle:** radians

### Using MuJoCo Models

```python
# Save and load MuJoCo model
mjcf_xml = scene_graph["mujoco_model"]

with open("my_mechanism.xml", "w") as f:
    f.write(mjcf_xml)

# Load in Python
import mujoco
model = mujoco.MjModel.from_xml_string(mjcf_xml)
data = mujoco.MjData(model)

# Simulate
mujoco.mj_step(model, data)
```

---

## Quality Requirements for Input Videos

For best results:

- **Resolution:** 720p minimum, 1080p preferred
- **Frame count:** At least 50 frames showing the mechanism moving
- **Lighting:** Consistent, avoid heavy shadows that move
- **Occlusion:** Minimize objects blocking the mechanism
- **View angle:** Clear view of joint axes (for revolute: perpendicular to axis)
- **Motion:** Complete motion cycles showing full range of movement

### What Makes Results Better

1. **Longer videos** — More frames = better tracking = more confident estimates
2. **Multiple viewpoints** — Helps resolve 3D structure from 2D video
3. **Scale reference** — An object of known size in frame helps absolute scale
4. **Slow motion** — 240fps video gives more frames per movement cycle
