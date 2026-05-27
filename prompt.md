# AETHER Starting Prompt

## Role

You are building AETHER Studio: a local-first desktop application that turns short videos of real mechanical systems into a lightweight, inspectable, physics-aware digital twin.

AETHER is not a Blender replacement and not a pure chatbot. It is a practical bridge between video, geometry, physics, and natural-language what-if simulation.

## The Three Core Problems

### 1. 3D Models Are Too Heavy

Do not start by generating perfect editable Blender meshes. That path is too slow, too RAM-heavy, and too fragile.

For v0, split "3D model" into two layers:

- Visual 3D: point cloud, Gaussian splat, or coarse mesh reconstructed from video.
- Physics 3D: simple rigid bodies, joints, keypoints, constraints, masses, friction, springs, dampers.

The visual layer makes the scene look understandable. The physics layer makes it computable.

This means AETHER does not need to recreate every bolt and curve. It needs to know:

- What objects exist.
- Where their keypoints are.
- Which parts move together.
- Which parts touch, rotate, slide, flex, or transmit force.
- Which parameters the user can modify.

### 2. Physics Must Be Honest

Do not let the LLM invent physics results.

The LLM can:

- Explain results.
- Pick tools.
- Translate user questions into simulation requests.
- Suggest likely parameters.
- Generate synthetic scenario descriptions.

The LLM cannot:

- Claim final force, stress, stability, or failure results without a simulator or measured data.
- Pretend uncertain monocular video is exact.
- Hide confidence or assumptions.

Every answer must include a confidence level and the assumptions used.

### 3. Start Small

The first build must support one narrow but impressive vertical:

**A 3D printer belt and gantry mechanism from a short uploaded video.**

Why this first:

- Mostly rigid parts.
- Clear belts, pulleys, rails, and carriage.
- Easy to film.
- Useful to makers and students.
- Physics can start with tension, vibration, friction, damping, and trajectory error.

After that, expand to:

1. Drone arm and payload stability.
2. RC car suspension.
3. Bicycle or mountain bike suspension.
4. Simple linkages and robotic arms.
5. Sports motion analysis.

## v0 Product Goal

Given a 20-60 second video of a 3D printer belt mechanism, AETHER should:

1. Load the video.
2. Extract frames.
3. Estimate camera motion and depth.
4. Segment and track key parts.
5. Build a lightweight scene graph.
6. Show a 3D visual reconstruction.
7. Let the user ask: "What happens if belt tension increases by 25%?"
8. Run a simplified physics simulation.
9. Show before/after charts and a visual overlay.
10. Clearly state assumptions and confidence.

## Core User Story

As a maker or engineering student, I want to upload a video of a mechanical system and ask what-if questions, so I can understand how changing physical parameters affects motion, stability, vibration, and risk without needing a full CAD model.

## MVP Features

### Upload And Inspect

- Upload video.
- Extract keyframes.
- Show timeline.
- Allow user to select region of interest.
- Run visual reconstruction.

### Perception

- Segment major moving objects.
- Track keypoints across frames.
- Estimate rough depth and camera intrinsics.
- Build object-centric scene graph.

### Lightweight 3D

- Display point cloud or Gaussian splat if available.
- Display keypoints, paths, and object nodes.
- Display simple primitive physics bodies over the visual scene.

### Physics Sandbox

- Support rigid bodies, pulleys, belts, springs, damping, friction, and contact approximation.
- Allow manual parameter edits.
- Run short-horizon simulation.
- Display uncertainty when parameters are estimated.

### Chat Interface

- Convert natural language into backend tool calls.
- Explain simulation results.
- Ask for missing information when needed.
- Never fake physical certainty.

## Non-Goals For v0

- Perfect photorealistic mesh export.
- Full Blender-style modeling.
- Arbitrary internet video physics.
- Fluids, cloth, deformation, fracture, quantum physics, or chemical simulation.
- Fully automatic material identification.
- Production-grade self-improvement loop.

## Technical Strategy

Use proven open-source tools first. Build glue, not magic.

The core pipeline:

```text
Video
  -> frame extraction
  -> camera/depth/point reconstruction
  -> segmentation
  -> point/keypoint tracking
  -> scene graph
  -> simplified physics model
  -> simulation
  -> visualization
  -> chat explanation
```

## Key Architectural Rule

Keep visual reconstruction and physics simulation separate.

Visual reconstruction answers:

> "What does the system look like in 3D?"

Physics simulation answers:

> "What simplified physical system best explains the motion?"

The breakthrough is combining both in one interface.

## Backend Tool Contract

Implement these tools first:

```python
load_video(path: str) -> VideoSession
extract_frames(session_id: str, fps: float = 5.0) -> FrameSet
reconstruct_scene(session_id: str) -> ReconstructionResult
segment_objects(session_id: str) -> SegmentationResult
track_keypoints(session_id: str) -> TrackingResult
build_scene_graph(session_id: str) -> SceneGraph
simulate(scene_graph_id: str, seconds: float, param_overrides: dict) -> SimulationResult
answer_question(session_id: str, question: str) -> AssistantAnswer
```

## Expected First Demo

The first demo should show:

- Uploaded 3D printer video.
- Reconstructed sparse 3D scene or splat preview.
- Tracked belt, pulley, carriage, and rail keypoints.
- Scene graph nodes and edges.
- Belt tension slider.
- Simulation chart showing estimated vibration change.
- Chat response explaining the result in simple language.

## Truthfulness Policy

Every physics result must include:

- Inputs used.
- Assumptions.
- Confidence.
- Whether result came from measured video, classical simulator, learned model, or heuristic estimate.

Example:

```text
Increasing belt tension by 25% is estimated to reduce lateral carriage vibration by 10-18%.
Confidence: medium.
Assumptions: belt approximated as linear spring-damper, pulley slip ignored, camera calibration estimated from video.
```

## Build Order

1. Create repo structure.
2. Build video upload and frame extraction.
3. Add visual reconstruction prototype.
4. Add segmentation and tracking prototype.
5. Define scene graph schema.
6. Build simple 3D viewer.
7. Add first physics simulator for belt/gantry.
8. Add chat tool-calling wrapper.
9. Add confidence and assumptions UI.
10. Package as local desktop app.

## Golden Rule

AETHER v0 wins if it makes one real mechanical video understandable, editable, and simulatable.

It loses if it tries to solve all of physics before the first demo.
