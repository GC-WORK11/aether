# AETHER Directory Plan

This directory plan is for the first real implementation of AETHER Studio. It is intentionally narrower than the full PRD so the project can start without drowning in research complexity.

## Root Layout

```text
aether/
├── README.md
├── prompt.md
├── directory.md
├── techstack.md
├── aether_main.prd.md
├── phase_0.md
├── phase_1.md
├── phase_2.md
├── phase_3.md
├── phase_4.md
├── phase_5.md
├── apps/
│   └── desktop/
├── backend/
│   ├── app/
│   ├── services/
│   ├── workers/
│   ├── tests/
│   └── pyproject.toml
├── packages/
│   ├── schemas/
│   └── shared/
├── models/
│   ├── checkpoints/
│   └── configs/
├── data/
│   ├── samples/
│   ├── sessions/
│   ├── reconstructions/
│   └── exports/
├── experiments/
│   ├── reconstruction/
│   ├── physics/
│   └── evaluation/
├── scripts/
│   ├── setup_dev.sh
│   ├── run_backend.sh
│   ├── run_desktop.sh
│   └── download_models.py
└── docs/
    ├── architecture.md
    ├── scene_graph.md
    ├── physics_truthfulness.md
    └── demo_plan.md
```

## Backend Layout

```text
backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── health.py
│   │   ├── sessions.py
│   │   ├── videos.py
│   │   ├── reconstruction.py
│   │   ├── simulation.py
│   │   └── ws.py
│   ├── core/
│   │   ├── config.py
│   │   ├── logging.py
│   │   ├── paths.py
│   │   └── errors.py
│   ├── video/
│   │   ├── loader.py
│   │   ├── frames.py
│   │   ├── metadata.py
│   │   └── roi.py
│   ├── perception/
│   │   ├── segmentation.py
│   │   ├── tracking.py
│   │   ├── depth.py
│   │   ├── camera.py
│   │   ├── keypoints.py
│   │   └── uncertainty.py
│   ├── reconstruction/
│   │   ├── vggt_runner.py
│   │   ├── colmap_runner.py
│   │   ├── gaussian_splat.py
│   │   ├── pointcloud.py
│   │   └── mesh_export.py
│   ├── scene_graph/
│   │   ├── schema.py
│   │   ├── builder.py
│   │   ├── constraints.py
│   │   ├── parameters.py
│   │   └── validators.py
│   ├── physics/
│   │   ├── belt_gantry.py
│   │   ├── rigid_body.py
│   │   ├── mujoco_adapter.py
│   │   ├── warp_adapter.py
│   │   ├── newton_adapter.py
│   │   ├── simulator.py
│   │   └── confidence.py
│   ├── assistant/
│   │   ├── tools.py
│   │   ├── prompts.py
│   │   ├── router.py
│   │   ├── providers.py
│   │   └── truthfulness.py
│   ├── protocol/
│   │   ├── messages.py
│   │   ├── msgpack_codec.py
│   │   └── websocket_manager.py
│   └── export/
│       ├── aether_bundle.py
│       └── report.py
├── services/
│   ├── reconstruction_service.py
│   ├── perception_service.py
│   ├── scene_graph_service.py
│   ├── simulation_service.py
│   └── assistant_service.py
├── workers/
│   ├── frame_worker.py
│   ├── reconstruction_worker.py
│   └── simulation_worker.py
└── tests/
    ├── test_video_frames.py
    ├── test_scene_graph_schema.py
    ├── test_belt_gantry_sim.py
    └── test_truthfulness.py
```

## Desktop App Layout

```text
apps/desktop/
├── package.json
├── vite.config.ts
├── electron/
│   ├── main.ts
│   ├── preload.ts
│   └── backend-process.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── routes/
    │   ├── Home.tsx
    │   ├── Session.tsx
    │   └── Settings.tsx
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── Topbar.tsx
    │   ├── upload/
    │   │   ├── VideoDropzone.tsx
    │   │   └── FrameStrip.tsx
    │   ├── live/
    │   │   ├── VideoPreview.tsx
    │   │   ├── TrackingOverlay.tsx
    │   │   └── ConfidencePanel.tsx
    │   ├── studio/
    │   │   ├── StudioView.tsx
    │   │   ├── Scene3D.tsx
    │   │   ├── SceneGraphPanel.tsx
    │   │   ├── ParameterPanel.tsx
    │   │   ├── Timeline.tsx
    │   │   ├── SimulationCharts.tsx
    │   │   └── AssumptionsPanel.tsx
    │   ├── chat/
    │   │   ├── ChatPanel.tsx
    │   │   ├── MessageList.tsx
    │   │   ├── ToolCallCard.tsx
    │   │   └── ChatInput.tsx
    │   └── ui/
    ├── lib/
    │   ├── api.ts
    │   ├── websocket.ts
    │   ├── msgpack.ts
    │   └── format.ts
    ├── store/
    │   ├── sessionStore.ts
    │   ├── simulationStore.ts
    │   └── settingsStore.ts
    └── styles/
        └── globals.css
```

## Shared Schemas

```text
packages/schemas/
├── scene_graph.schema.json
├── simulation_result.schema.json
├── reconstruction_result.schema.json
├── session.schema.json
└── aether_bundle.schema.json
```

These schemas should be the contract between frontend and backend.

## Data Layout

```text
data/
├── samples/
│   └── printer_belt_demo/
│       ├── input.mp4
│       ├── notes.md
│       └── ground_truth.json
├── sessions/
│   └── {session_id}/
│       ├── input.mp4
│       ├── frames/
│       ├── metadata.json
│       ├── camera.json
│       ├── segmentation.json
│       ├── tracks.json
│       ├── scene_graph.json
│       ├── simulation_runs/
│       └── report.md
├── reconstructions/
│   └── {session_id}/
│       ├── pointcloud.ply
│       ├── splat.ply
│       ├── coarse_mesh.glb
│       └── preview.mp4
└── exports/
    └── {session_id}.aether
```

## Experiments Layout

```text
experiments/
├── reconstruction/
│   ├── vggt_baseline.md
│   ├── colmap_baseline.md
│   └── gaussian_splat_baseline.md
├── physics/
│   ├── belt_gantry_model.md
│   ├── mujoco_baseline.md
│   └── warp_baseline.md
└── evaluation/
    ├── metrics.md
    ├── latency.md
    └── accuracy.md
```

## Implementation Milestones

### Milestone 1: Local App Skeleton

- Electron + React shell.
- FastAPI backend starts from desktop app.
- Health check works.
- Upload video works.

### Milestone 2: Video To Frames

- Extract frames with PyAV or OpenCV.
- Show frame strip in UI.
- Save session folder.

### Milestone 3: Visual 3D Prototype

- Run VGGT or COLMAP on extracted frames.
- Save point cloud.
- Render point cloud in Three.js.

### Milestone 4: Perception Prototype

- Segment objects with SAM 2.
- Track keypoints with CoTracker.
- Save tracks and confidence.

### Milestone 5: Scene Graph

- Convert perception outputs into object nodes and edges.
- Let user inspect graph in UI.
- Add validation tests.

### Milestone 6: First Physics Model

- Implement belt/gantry simplified simulator.
- Parameters: belt tension, damping, pulley friction, carriage mass.
- Output: vibration estimate, trajectory error, energy estimate.

### Milestone 7: Chat Tool Calls

- Natural language question calls simulation tool.
- Assistant response includes assumptions and confidence.

### Milestone 8: First Demo

- One 3D printer belt video.
- One working what-if question.
- One visual reconstruction.
- One before/after simulation chart.

## What Not To Build First

- General self-improvement training loop.
- Full GATv2 + Neural ODE dynamics model.
- Arbitrary physics support.
- Perfect mesh editing.
- Multi-provider LLM settings.
- Full cross-platform packaging.

Those come after the first real demo.
