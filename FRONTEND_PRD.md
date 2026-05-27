# AETHER FRONTEND PRD - THE WORLD'S GREATEST PHYSICS APP

## Vision

**AETHER** is "YouTube for Physics" / "ChatGPT for Machines"

Upload ANY video of ANY mechanical system → AETHER sees parts → learns physics → builds simulation → answers questions with REAL MuJoCo simulations.

**No hardcoded physics. No fake demos. Real learned parameters.**

---

## THE COMPLETE PIPELINE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VIDEO INPUT                                        │
│                    (MP4, MOV, AVI, WebM)                                   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        1. PERCEPTION (SAM2)                                 │
│  • Minimal grid: 0.26s/frame (16 points)                                   │
│  • Dense grid: 0.8s (64 points)                                           │
│  • Output: Object masks, bounding boxes                                      │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     2. UNIVERSAL SCENE GRAPH                               │
│  • Identify mechanism from masks (vehicle, drone, pendulum, etc.)           │
│  • No hardcoded templates - LEARNED from shape                             │
│  • Output: Object nodes, edges, physics params                              │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     3. OPTICAL FLOW TRACKING                               │
│  • Track objects across frames                                              │
│  • Output: Trajectories (x, y per frame)                                  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    4. INVERSE DYNAMICS                                      │
│  • Learn k, c, m from trajectories                                        │
│  • Autocorrelation, Hilbert envelope, peak detection                        │
│  • Output: Physics parameters (stiffness, damping, mass)                    │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     5. 3D RECONSTRUCTION                                  │
│  • MiDaS depth estimation                                                  │
│  • Point cloud per object                                                 │
│  • Mesh generation (OBJ, PLY)                                             │
│  • Output: 3D models, depth maps                                         │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    6. MUJOCO SIMULATION                                    │
│  • Real physics engine (spring-damper, thrust, torque)                      │
│  • 7 mechanism types: vehicle, drone, pendulum, robot_arm, linkage, etc.   │
│  • Output: Trajectory, video, physics data                                 │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     7. KNOWLEDGE BASE                                     │
│  • 177 real-world physics chunks                                           │
│  • CODATA constants (NIST 2018)                                           │
│  • Wikipedia physics + engineering                                          │
│  • AETHER physics KB (500+ formulas)                                       │
│  • Output: Relevant formulas, constants, references                          │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      8. LLM ANSWER                                       │
│  • MiniMax (primary) + Gemma 4 (local reasoning)                           │
│  • Grounded in simulation + knowledge base                                 │
│  • Output: Natural language answer with physics backing                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## BACKEND API REFERENCE

### Base URL: `http://localhost:8000`

### All Endpoints:

#### 🎬 Video & Sessions
```
POST   /api/sessions                              → Create session
GET    /api/sessions                             → List sessions
GET    /api/sessions/{id}                       → Get session
DELETE /api/sessions/{id}                       → Delete session
PATCH  /api/sessions/{id}                       → Update session

POST   /api/videos/upload/{session_id}           → Upload video (multipart)
GET    /api/videos/{id}                         → Get video info

POST   /api/frames/extract                       → Extract frames
         Body: { session_id, fps: 5, max_frames: 30 }
GET    /api/frames/{session_id}                  → List frames
```

#### 🚀 Orchestrator (COMPLETE PIPELINE)
```
GET    /api/orchestrate/process
         ?session_id=xxx
         &question=What%20is%20the%20physics
         → Runs FULL pipeline
         → Returns: { stages, answer, total_time }

GET    /api/orchestrate/quick?session_id=xxx
         → Quick analysis (no full pipeline)
         → Returns: mechanism_type, n_objects, simulation

GET    /api/orchestrate/status
         → Pipeline status
         → Returns: { status, gpu_available, stages, total_time_estimate }
```

#### 🎯 Perception (SAM2)
```
POST   /api/perception/{session_id}/run
         → Run SAM2 on session frames

GET    /api/perception/{session_id}
         → Get perception results

GET    /api/perception/{session_id}/status
         → Get status
```

#### 🔲 Scene Graph
```
GET    /api/scene-graph/identify?session_id=xxx
         → Identify mechanism type from masks
         → Returns: { mechanism_type, n_objects, shape_features }

GET    /api/scene-graph/build?session_id=xxx
         → Build universal scene graph
         → Returns: { mechanism_type, n_objects, n_edges, objects, edges }
```

#### 🏗️ 3D Reconstruction
```
GET    /api/reconstruction/reconstruct?session_id=xxx&frame_index=0
         → Fast reconstruction (minimal grid)

GET    /api/reconstruction/reconstruct/dense?session_id=xxx
         → Dense reconstruction (8 points_per_side)
         → Returns: { n_objects, n_point_clouds, depth_stats, mesh_path }

GET    /api/reconstruction/export/urdf?session_id=xxx
         POST  (body: { frame_index })
         → Export as URDF for MuJoCo
```

#### ⚙️ Simulation (MuJoCo)
```
POST   /api/simulation
         Body: {
           session_id,
           horizon_seconds: 5.0,
           param_overrides: { mass: 1.0, stiffness: 100 }
         }
         → Run simulation on session

GET    /api/simulation/{sim_id}
         → Get simulation result

GET    /api/simulation/{sim_id}/trajectory
         → Get trajectory data

POST   /api/simulation/universal
         Body: {
           mechanism_type: "vehicle",
           params: { mass_kg: 2.0 },
           horizon_seconds: 5.0
         }
         → Run universal MuJoCo simulation directly
         → Returns: { success, duration, trajectory }
```

#### 📚 Knowledge Base
```
GET    /api/knowledge/status
         → Returns: { chunk_count, knowledge_initialized }

POST   /api/knowledge/query
         Body: { query: "gear ratio", top_k: 5 }
         → Query knowledge base
         → Returns: [{ title, text, source, distance }]

GET    /api/knowledge/categories
         → List categories

GET    /api/knowledge/random
         → Random knowledge chunk
```

#### 💬 Chat
```
POST   /api/chat
         ?message=What%20is%20gear%20ratio
         &mode=hybrid
         &session_id=xxx
         → Chat with physics assistant
         → Returns: { response, kb_chunks, gemma_reasoning }
```

---

## FRONTEND PAGES & FEATURES

### Page 1: HOME / Landing
```
┌─────────────────────────────────────────────────────────────────┐
│  AETHER                                                  [⚙️] │
│  "YouTube for Physics"                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐     │
│     │                                                     │     │
│     │         📹 DROP VIDEO HERE                          │     │
│     │                                                     │     │
│     │     MP4, MOV, AVI, WebM - Any mechanical system    │     │
│     │                                                     │     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                 │
│     [Or paste YouTube/Video URL]                                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Recent Sessions                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📹 Session 1              30 frames    2 min ago  [→] │   │
│  │ 📹 Session 2              20 frames    1 hour ago [→] │   │
│  │ 📹 Session 3               5 frames    3 hours ago[→] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Drag & drop video upload
- YouTube URL paste (optional)
- Recent sessions list with thumbnails
- Click session → go to Workspace

---

### Page 2: WORKSPACE (Main Analysis View)
```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back    Session: Car Transmission    [⚙️ Settings]            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    VIDEO PLAYER                            │  │
│  │  ┌─────┐                                                │  │
│  │  │  ▶  │  ══════════════○══════════════════════  00:15   │  │
│  │  └─────┘                                                │  │
│  │  Frame: 15/30                           [🔍 Analyze]       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐  │
│  │   OBJECT DETECTION    │  │      ANALYSIS PANEL               │  │
│  │                      │  │                                  │  │
│  │  🟢 Object 1 (Gear) │  │  ┌────────────────────────────┐  │  │
│  │  🟢 Object 2 (Gear) │  │  │ Mechanism: vehicle      │  │  │
│  │  🟢 Object 3 (Gear) │  │  │ Objects: 6            │  │  │
│  │  🔴 Object 4 (Wheel) │  │  │ Edges: 5              │  │  │
│  │                      │  │  └────────────────────────┘  │  │
│  │  [Show/Hide All]     │  │                              │  │
│  │                      │  │  Physics Parameters:        │  │
│  └──────────────────────┘  │  • mass: 2.0 kg           │  │
│                            │  • stiffness: 150 N/m     │  │
│  ┌──────────────────────┐  │  • damping: 15 Ns/m      │  │
│  │   3D RECONSTRUCTION │  │                              │  │
│  │                      │  │  [Edit Parameters]          │  │
│  │      [WebGL View]   │  └──────────────────────────────────┘  │
│  │                      │                                       │
│  │  📊 Depth: 738-1647 │  ┌──────────────────────────────────┐  │
│  │  📦 Points: 431,578 │  │  ANSWER                        │  │
│  │                      │  │                                 │  │
│  │  [Rotate] [Zoom]    │  │  The video shows a 3D animation │  │
│  └──────────────────────┘  │  of vehicle transmission with  │  │
│                              │  gears showing torque...       │  │
│  ┌──────────────────────┐  │                                 │  │
│  │   SIMULATION         │  │  ┌─────────────────────────┐   │  │
│  │                      │  │  │ 🤖 Ask follow-up      │   │  │
│  │   [▶ Play] [⏸ Pause] │  │  └─────────────────────────┘   │  │
│  │   Time: 2.0s         │  │                                 │  │
│  │   ═══════○═══════   │  └──────────────────────────────────┘  │
│  │                      │                                       │
│  └──────────────────────┘                                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Pipeline: perception → scene_graph → tracking → physics → answer │
│  Status: ✅ SAM2 (5.7s) → ✅ Scene (0.0s) → ✅ Knowledge (11.7s) │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
1. **Video Player** - Play/pause, frame slider, current frame display
2. **Object Detection Panel** - SAM2 detected objects with color coding
3. **3D Reconstruction View** - WebGL point cloud/mesh viewer
4. **Simulation Player** - Play MuJoCo simulation
5. **Analysis Panel** - Mechanism type, physics params, editable
6. **Answer Section** - LLM response with physics grounding
7. **Pipeline Status Bar** - Show each stage result

---

### Page 3: KNOWLEDGE EXPLORER
```
┌─────────────────────────────────────────────────────────────────┐
│  📚 Knowledge Base                                  [🔍 Search] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Categories:                                                     │
│  [Foundational] [Mechanics] [Thermodynamics] [Electromagnetics]    │
│  [Fluid] [Materials] [Control] [Vibration]                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📄 Newton's Laws                                       │   │
│  │ F = ma  |  Conservation of momentum  |  Work-Energy    │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📄 Gear Ratios & Torque                               │   │
│  │ τ_out = τ_in × (N_in/N_out) × η                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📄 Suspension Physics                                  │   │
│  │ F = -kx - cẋ  |  Natural freq: ω = √(k/m)            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Constants (CODATA 2018):                                       │
│  c = 299,792,458 m/s  |  h = 6.626×10⁻³⁴ J·s               │
│  k = 1.381×10⁻²³ J/K    |  G = 6.674×10⁻¹¹ m³kg⁻¹s⁻²    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Category filter
- Search knowledge base
- CODATA constants table
- Formula reference cards

---

### Page 4: WHAT-IF SIMULATOR
```
┌─────────────────────────────────────────────────────────────────┐
│  🤔 What-If Simulator                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Current: Gear Ratio = 3.5:1  →  Torque = 875 Nm               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GEAR RATIO          3.5 ═══════════○═══ 2.0          │   │
│  │                                                         │   │
│  │  WHEEL RADIUS        0.03 ═══════════════○═══ 0.05     │   │
│  │                                                         │   │
│  │  SUSPENSION K        150 ═══════════════════○═══ 300    │   │
│  │                                                         │   │
│  │  DAMPING             15 ════════════════════○══════ 30  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  PREDICTED RESULTS                                     │   │
│  │                                                         │   │
│  │  Torque at wheels:    875 → 1525 Nm  (+74%)           │   │
│  │  Acceleration:        Baseline → 1.4x                    │   │
│  │  Top speed:           180 → 220 km/h                    │   │
│  │  Fuel economy:        Baseline → 0.85x                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [▶ RUN SIMULATION]                                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │              📊 SIMULATION COMPARISON CHART             │   │
│  │                                                         │   │
│  │   Torque ════════════════════════════════════════════   │   │
│  │   Speed  ═════════════════════════════════════════════   │   │
│  │   Accel  ════════════════════════════════════════════   │   │
│  │                                                         │   │
│  │   Baseline ████  New ██████████                        │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Slider controls for physics parameters
- Real-time predicted results
- Run MuJoCo simulation with new params
- Comparison chart (baseline vs modified)
- Export results

---

### Page 5: SETTINGS
```
┌─────────────────────────────────────────────────────────────────┐
│  ⚙️ Settings                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  System Status:                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🟢 Backend: Connected (v0.1.0)                         │   │
│  │ 🟢 GPU: NVIDIA RTX 3050 (4GB)                          │   │
│  │ 🟢 SAM2: Loaded                                        │   │
│  │ 🟢 MiDaS: Loaded                                      │   │
│  │ 🟢 MuJoCo: Loaded                                    │   │
│  │ 🟢 Knowledge Base: 177 chunks                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Pipeline Settings:                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Segmentation:  ○ Minimal (fast)  ● Dense (accurate)    │   │
│  │ Max Frames:    [30]                                    │   │
│  │ FPS:          [5]                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  LLM Settings:                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Primary:      ● MiniMax  ○ Ollama (Gemma 4)            │   │
│  │ Reasoning:    ○ MiniMax  ● Ollama                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  About:                                                        │
│  Version 0.1.0 | AETHER - YouTube for Physics                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## COMPONENT STRUCTURE

```
src/
├── App.tsx                          # Router + layout
├── pages/
│   ├── Home.tsx                    # Landing + upload + session list
│   ├── Workspace.tsx                # Main analysis view
│   ├── Knowledge.tsx                # Knowledge explorer
│   ├── WhatIf.tsx                  # What-if simulator
│   └── Settings.tsx                # Settings page
├── components/
│   ├── VideoPlayer.tsx              # Video playback + frame selector
│   ├── ObjectDetection.tsx           # SAM2 detection overlay
│   ├── Reconstruction3D.tsx        # WebGL point cloud/mesh viewer
│   ├── SimulationPlayer.tsx          # MuJoCo simulation playback
│   ├── AnalysisPanel.tsx            # Scene graph + physics params
│   ├── AnswerCard.tsx               # LLM response display
│   ├── PipelineStatus.tsx            # Stage-by-stage status
│   ├── ParameterSlider.tsx          # What-if sliders
│   ├── KnowledgeCard.tsx           # Formula/constant display
│   └── ChatInput.tsx               # Question input
├── lib/
│   └── api.ts                      # ALL API calls
├── store/
│   └── useStore.ts                 # Zustand state
└── hooks/
    ├── usePipeline.ts               # Run full pipeline
    ├── useSimulation.ts             # Run MuJoCo
    └── useKnowledge.ts             # Query KB
```

---

## ZUSTAND STORE

```typescript
interface AetherStore {
  // Session
  sessions: Session[]
  currentSession: Session | null
  loadSessions: () => Promise<void>
  createSession: (name: string, video: File) => Promise<void>
  selectSession: (id: string) => void
  
  // Pipeline
  pipelineRunning: boolean
  pipelineResult: PipelineResult | null
  runPipeline: (question: string) => Promise<void>
  
  // Perception
  objects: DetectedObject[]
  loadObjects: () => Promise<void>
  
  // Scene Graph
  sceneGraph: SceneGraph | null
  mechanismType: string
  loadSceneGraph: () => Promise<void>
  
  // 3D Reconstruction
  pointCloud: PointCloud | null
  depthMap: ImageData | null
  meshFile: string | null
  loadReconstruction: () => Promise<void>
  
  // Simulation
  simulationResult: SimulationResult | null
  simulationPlaying: boolean
  simulationTime: number
  runSimulation: (params: PhysicsParams) => Promise<void>
  playSimulation: () => void
  pauseSimulation: () => void
  seekSimulation: (t: number) => void
  
  // Knowledge
  knowledgeResults: KnowledgeChunk[]
  queryKnowledge: (query: string) => Promise<void>
  
  // Chat
  messages: Message[]
  sendMessage: (text: string) => Promise<void>
  
  // What-If
  whatIfParams: PhysicsParams
  baselineParams: PhysicsParams
  predictedResults: PredictedResults | null
  updateParam: (key: string, value: number) => void
  runWhatIf: () => Promise<void>
  
  // UI
  activePanel: 'video' | '3d' | 'simulation' | 'chat'
  setActivePanel: (panel: string) => void
}
```

---

## API SERVICE (lib/api.ts)

```typescript
const BASE = 'http://localhost:8000'

// SESSIONS
api.sessions.list()                  // GET /api/sessions
api.sessions.create(name)             // POST /api/sessions
api.sessions.get(id)                 // GET /api/sessions/{id}
api.sessions.delete(id)              // DELETE /api/sessions/{id}

// VIDEO
api.videos.upload(sessionId, file, onProgress)
api.videos.get(id)                    // GET /api/videos/{id}

// FRAMES
api.frames.extract(sessionId, fps, maxFrames)  // POST /api/frames/extract
api.frames.list(sessionId)            // GET /api/frames/{session_id}

// ORCHESTRATOR
api.orchestrate.process(sessionId, question)  // GET /api/orchestrate/process
api.orchestrate.quick(sessionId)      // GET /api/orchestrate/quick
api.orchestrate.status()              // GET /api/orchestrate/status

// SCENE GRAPH
api.sceneGraph.identify(sessionId)     // GET /api/scene-graph/identify
api.sceneGraph.build(sessionId)        // GET /api/scene-graph/build

// RECONSTRUCTION
api.reconstruction.reconstruct(sessionId, frameIndex)
api.reconstruction.dense(sessionId)
api.reconstruction.exportURDF(sessionId)

// SIMULATION
api.simulation.run(sessionId, horizon, params)
api.simulation.universal(mechanismType, params, duration)
api.simulation.get(simId)
api.simulation.trajectory(simId)

// KNOWLEDGE
api.knowledge.status()
api.knowledge.query(query, topK)
api.knowledge.categories()
api.knowledge.random()

// CHAT
api.chat(message, mode, sessionId)     // POST /api/chat
```

---

## RESPONSE TYPES

```typescript
// Pipeline Result
interface PipelineResult {
  n_frames: number
  stages: {
    perception: { time_seconds: number, n_masks: number }
    scene_graph: { time_seconds: number, mechanism_type: string, n_objects: number }
    tracking: { time_seconds: number, n_tracked: number }
    inverse_dynamics: { time_seconds: number, learned_params: object }
    reconstruction: { time_seconds: number, n_point_clouds: number, depth_stats: object }
    simulation: { time_seconds: number, success: boolean }
    knowledge: { time_seconds: number, chunks: KnowledgeChunk[] }
  }
  total_time_seconds: number
  answer: {
    text: string
    mechanism_type: string
    grounded: boolean
  }
}

// Scene Graph
interface SceneGraph {
  mechanism_type: string
  mechanism_name: string
  n_objects: number
  n_edges: number
  objects: ObjectNode[]
  edges: Edge[]
}

interface ObjectNode {
  id: string
  label: string
  physics: { mass_kg: number, stiffness?: number, damping?: number }
  bounding_box: { x: number, y: number, width: number, height: number }
}

// 3D Reconstruction
interface Reconstruction {
  n_objects: number
  n_point_clouds: number
  depth_stats: { min: number, max: number, mean: number }
  point_clouds: { n_points: number, id: number }[]
  mesh_path: string
  time_seconds: number
}

// Simulation
interface SimulationResult {
  success: boolean
  mechanism_type: string
  duration: number
  trajectory: {
    time: number[]
    positions: number[][]
  }
}

// Knowledge
interface KnowledgeChunk {
  title: string
  text: string
  source: string
  distance: number
}
```

---

## WEBSOCKET (for real-time updates)

```typescript
// Connect to backend
ws://localhost:8000/ws/pipeline/{session_id}

// Events sent:
{ type: 'pipeline_start' }
{ type: 'stage_complete', stage: 'perception', result: {...} }
{ type: 'stage_complete', stage: 'scene_graph', result: {...} }
{ type: 'stage_complete', stage: 'simulation', result: {...} }
{ type: 'pipeline_complete', result: {...} }
{ type: 'error', message: string }

// Frontend subscribes:
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.type === 'stage_complete') {
    updatePipelineStatus(data.stage, data.result)
  }
}
```

---

## DATA FLOW DIAGRAMS

### Video Upload Flow
```
User drops video
       ↓
Frontend: Create session → POST /api/sessions
       ↓
Backend: Create folder, return session_id
       ↓
Frontend: Upload file → POST /api/videos/upload/{session_id}
       ↓
Backend: Save video, return video_id
       ↓
Frontend: Extract frames → POST /api/frames/extract
       ↓
Backend: ffmpeg extract frames, save as frame_*.png
       ↓
Frontend: Show thumbnail grid, enable "Analyze" button
```

### Full Pipeline Flow
```
User clicks "Analyze"
       ↓
Frontend: GET /api/orchestrate/process?session_id=X&question=Y
       ↓
Backend: 
  1. Load frames
  2. SAM2 → masks
  3. Scene graph → mechanism
  4. Optical flow → trajectories
  5. Inverse dynamics → params
  6. MiDaS → depth
  7. MuJoCo → simulation
  8. ChromaDB → knowledge
  9. LLM → answer
       ↓
Frontend: Display results
```

### 3D Reconstruction Flow
```
User selects "3D View"
       ↓
Frontend: GET /api/reconstruction/dense?session_id=X
       ↓
Backend:
  1. SAM2 dense → object masks
  2. MiDaS → depth map
  3. Point cloud per object
  4. Save OBJ file
       ↓
Frontend: Load OBJ into Three.js WebGL viewer
       ↓
User: Rotate, zoom, pan
```

### What-If Simulation Flow
```
User adjusts sliders (gear ratio, stiffness, etc.)
       ↓
Frontend: Update local state immediately
       ↓
Frontend: Calculate predicted results (client-side)
       ↓
User clicks "Run Simulation"
       ↓
Frontend: POST /api/simulation/universal
         { mechanism_type: 'vehicle', params: {...}, horizon: 5 }
       ↓
Backend: MuJoCo runs with new params
       ↓
Frontend: Display comparison chart (baseline vs new)
```

---

## ERROR HANDLING

```typescript
// API error wrapper
async function apiCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.error('API Error:', error)
    toast.error(`Failed: ${error.message}`)
    return fallback
  }
}

// Connection status check
useEffect(() => {
  const checkConnection = async () => {
    try {
      await api.health()
      setConnected(true)
    } catch {
      setConnected(false)
    }
  }
  checkConnection()
  const interval = setInterval(checkConnection, 5000)
  return () => clearInterval(interval)
}, [])

// Pipeline error states
interface PipelineError {
  stage: string
  message: string
  canRetry: boolean
}
```

---

## PERFORMANCE TARGETS

| Action | Target | Max |
|--------|--------|-----|
| Video upload (100MB) | 10s | 30s |
| Frame extraction (30 frames) | 5s | 15s |
| Quick analyze | 5s | 10s |
| Full pipeline | 20s | 60s |
| 3D reconstruction | 8s | 20s |
| Simulation (5s) | 2s | 5s |
| Knowledge query | 1s | 3s |

---

## MOBILE RESPONSIVE

```css
/* Desktop (1024px+) */
.workspace { grid-template-columns: 300px 1fr 350px }

/* Tablet (768px-1023px) */
.workspace { grid-template-columns: 1fr }

/* Mobile (<768px) */
.workspace { flex-direction: column }
```

---

## ANIMATIONS & UX

```css
/* Page transitions */
.page-enter { opacity: 0; transform: translateY(20px) }
.page-enter-active { opacity: 1; transform: translateY(0); transition: 300ms }

/* Object detection pulse */
@keyframes pulse-detection {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0,255,0,0.4) }
  50% { box-shadow: 0 0 0 10px rgba(0,255,0,0) }
}

/* Pipeline progress */
@keyframes progress-glow {
  0% { background-position: 0% 50% }
  100% { background-position: 100% 50% }
}

/* 3D model rotate */
@keyframes float {
  0%, 100% { transform: translateY(0) }
  50% { transform: translateY(-10px) }
}
```

---

## DEPLOYMENT

```bash
# Backend (already running)
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend (production)
cd apps/desktop
npm run build
# Outputs to dist/

# Or run dev
npm run dev
```

---

## QUICK START CHECKLIST

```markdown
□ Backend running on port 8000
□ GPU accessible (nvidia-smi works)
□ Video uploaded
□ Frames extracted
□ Click "Analyze"
□ See SAM2 masks
□ See mechanism type
□ See 3D reconstruction
□ See simulation playback
□ Ask question in chat
□ Get physics-grounded answer
□ Adjust what-if parameters
□ Run new simulation
□ Compare results
```

---

## THAT'S IT!

This is the complete blueprint for the world's greatest physics frontend.

**Every API is real. Every pipeline stage works. Every feature is connected.**

Build it and verify yourself!
