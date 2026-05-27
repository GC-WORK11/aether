# AETHER Tech Stack

This stack is chosen for a practical, local-first AETHER v0 that can run on a strong laptop without requiring Blender-level editing or cloud-only reconstruction.

## Stack Principle

AETHER should not try to make perfect editable 3D meshes first.

Use:

- Gaussian splats, point clouds, and coarse meshes for visual 3D.
- Scene graphs, keypoints, primitives, joints, and constraints for physics.
- Classical simulation first, learned dynamics later.
- LLMs only for reasoning, explanation, and tool orchestration.

## Recommended v0 Stack

### Desktop App

| Need | Choice | Why |
|---|---|---|
| Desktop shell | Electron + Vite | Fast to build, good native packaging, strong ecosystem |
| UI | React + TypeScript | Mature, reliable, easy component model |
| Styling | Tailwind CSS + shadcn/ui | Fast polished interface |
| State | Zustand | Simple global state without Redux overhead |
| 3D viewer | Three.js + React Three Fiber | Best web-native 3D path |
| Graph viewer | React Flow / `@xyflow/react` | Good scene graph UI |
| Charts | Apache ECharts or Recharts | Simulation charts and timelines |
| Icons | lucide-react | Clean tool icons |

### Backend

| Need | Choice | Why |
|---|---|---|
| API server | FastAPI | Fast Python API, WebSocket support, typed schemas |
| Async tasks | asyncio + background workers first | Keep v0 simple |
| Serialization | MessagePack | Compact binary messages |
| Validation | Pydantic v2 | Strong Python data contracts |
| Video decode | PyAV first, OpenCV fallback | Better control over video frames |
| Storage | Local filesystem + SQLite | Simple, inspectable, private |
| Tests | pytest | Standard Python testing |

## 3D Reconstruction Stack

### Default v0 Path

| Layer | Tool | Role |
|---|---|---|
| Fast geometry foundation | VGGT | Estimate cameras, depth, point maps, and 3D point tracks from images/video |
| Fallback SfM | COLMAP / GLOMAP | Robust classical camera reconstruction |
| Monocular depth | Depth Anything V2 / Video Depth Anything | Depth maps when full reconstruction is not available |
| Gaussian splat rendering | gsplat / nerfstudio | Visual 3D reconstruction and rendering |
| Web display | Three.js point clouds / splat viewer | Lightweight in-app visualization |

### Why This Solves The 3D Problem

Blender-style mesh editing is heavy because it asks for perfect geometry, topology, materials, and editing tools.

AETHER v0 only needs enough 3D to understand and simulate. So the pipeline should produce:

- Camera estimates.
- Sparse or dense point cloud.
- Optional Gaussian splat.
- Keypoint tracks.
- Object masks.
- Coarse primitive bodies for physics.

That is much more realistic on a laptop.

### Later 3D Upgrades

| Future Need | Candidate |
|---|---|
| Better dynamic scene reconstruction | dynamic Gaussian splatting research pipelines |
| Mesh cleanup | Open3D + Trimesh |
| CAD-like export | glTF / GLB, USD later |
| Low-memory inference | ONNX Runtime / TensorRT / quantized VGGT variants |

## Perception Stack

| Need | Choice | Why |
|---|---|---|
| Object/video segmentation | SAM 2 | Strong open video segmentation baseline |
| Promptable detection | YOLO-World | Open-vocabulary detection for parts |
| Point tracking | CoTracker3 | Strong long-range video point tracking, including occlusion handling |
| Depth | Depth Anything V2 / Video Depth Anything | Strong monocular depth baseline |
| Geometry utilities | OpenCV, Open3D, Trimesh | Calibration, point clouds, mesh tools |
| Numeric processing | NumPy, SciPy | Core math and optimization |

## Physics Stack

### v0 Physics

Start with a custom simplified physics module for the first target: 3D printer belt and gantry.

Use:

- NumPy / SciPy for equations and optimization.
- MuJoCo for rigid bodies, joints, actuators, contact, and system identification.
- NVIDIA Warp for GPU-accelerated differentiable kernels when needed.

### Recommended Engines

| Engine | Use In AETHER | Why |
|---|---|---|
| MuJoCo | Primary rigid-body simulation baseline | Fast, accurate, open source, excellent for robotics/mechanisms/contact |
| NVIDIA Warp | Differentiable GPU kernels and custom physics | Python-native, GPU-accelerated, integrates with ML workflows |
| Newton Physics | Future robotics/contact-rich backend | Open-source GPU physics built on Warp and OpenUSD |
| Brax | Learned dynamics research / JAX training | Differentiable, accelerator-friendly, useful for generated training data |
| Project Chrono | Future vehicle/suspension/off-road mechanics | Strong multiphysics and vehicle dynamics |
| Taichi | Future custom differentiable simulation experiments | Good for high-performance physical simulation kernels |

### Physics Honesty Rule

Classify every simulation result as one of:

- Measured from video.
- Classical simulator output.
- Learned model output.
- Heuristic estimate.
- LLM explanation only.

Never mix these without labeling them.

## AI / LLM Stack

| Need | Choice | Why |
|---|---|---|
| Tool calling | OpenAI-compatible provider adapter | Can support OpenAI, Anthropic-compatible wrappers, Ollama, local providers |
| Local option | Ollama / llama.cpp server | Privacy and offline use |
| Prompt management | Plain markdown prompts first | Easy to inspect and iterate |
| Structured outputs | Pydantic models / JSON schema | Prevent vague tool calls |

The LLM should not compute physics. It should call tools that compute physics.

## Learned Dynamics Stack

Do not build this first. Add it after the classical v0 demo works.

| Need | Choice |
|---|---|
| Tensor training | PyTorch first |
| JAX research path | JAX + Equinox + Optax |
| Graph neural networks | PyTorch Geometric |
| Neural ODEs | torchdiffeq or Diffrax |
| Model export | safetensors + ONNX where possible |
| Experiment tracking | local JSON logs first, W&B optional |

## File Formats

| Artifact | Format |
|---|---|
| Session metadata | JSON |
| Scene graph | JSON / MessagePack |
| Point cloud | PLY |
| Gaussian splat | PLY / SPZ if supported |
| Coarse mesh | GLB |
| Simulation result | JSON / MessagePack |
| Export bundle | `.aether` ZIP |

## Minimum Hardware Target

### Development Machine

- 16 GB RAM minimum.
- 24-32 GB RAM preferred.
- NVIDIA GPU with 8 GB VRAM preferred.
- CPU fallback for basic video, UI, and simple physics.

### v0 Low-RAM Strategy

- Process video in sampled keyframes, not every frame.
- Keep one active session in memory.
- Cache model outputs to disk.
- Load heavy models lazily.
- Use small model variants first.
- Allow "fast preview" mode before high-quality reconstruction.

## First Demo Stack

Use this exact starting stack:

```text
Frontend:
  Electron
  React
  TypeScript
  Vite
  Tailwind CSS
  shadcn/ui
  Three.js
  React Three Fiber
  Zustand

Backend:
  Python
  FastAPI
  Pydantic
  MessagePack
  PyAV
  OpenCV
  NumPy
  SciPy
  Open3D
  Trimesh

Perception:
  SAM 2
  CoTracker3
  Depth Anything V2
  VGGT

Reconstruction:
  VGGT first
  COLMAP/GLOMAP fallback
  gsplat or nerfstudio later

Physics:
  Custom belt/gantry simulator first
  MuJoCo second
  Warp/Newton later

Assistant:
  OpenAI-compatible tool-calling adapter
  Ollama/local fallback later
```

## Source Notes

- Meta's VGGT project describes a feed-forward model that infers camera parameters, depth maps, point maps, and 3D point tracks from one or more views.
- Meta's SAM 2 is designed for promptable object segmentation in images and videos with streaming-style interaction.
- Depth Anything V2 is a strong open monocular depth model, with Video Depth Anything available for long-video consistency.
- MuJoCo is a free and open-source advanced physics simulator for robotics, biomechanics, graphics, animation, optimization, and contact-rich systems.
- NVIDIA Warp is a Python framework for GPU-accelerated differentiable simulation and ML-integrated computational physics.
- Newton Physics is an open-source GPU physics engine built on Warp and OpenUSD, developed by NVIDIA, Google DeepMind, and Disney Research under the Linux Foundation.
- Project Chrono is a BSD-licensed open-source multiphysics engine with strong vehicle, multibody, contact, and flexible-body support.

## Final Recommendation

Build the first AETHER around this claim:

> Upload a short 3D printer mechanism video. AETHER reconstructs a lightweight 3D view, tracks the moving parts, builds a scene graph, and answers one physical what-if question with a transparent simulation.

That is the first real mountain. Climb that before chasing all of physics.
