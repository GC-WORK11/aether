# AETHER Studio — Phase 5: Desktop App & Final Integration

**Version:** 1.0
**Status:** Final & Locked
**Prerequisites:** Phase 0, Phase 1, Phase 2, Phase 3, and Phase 4 complete

---

## Hybrid Intelligence Note (Locked)

Core physics intelligence (perception, dynamics, simulation, self-improvement) is **100% open-source, local, and built with PhD-level mathematics and engineering theories**.

Reasoning, tool calling, explanation, failure analysis, and targeted data generation use a **fully pluggable frontier LLM**.

In the final app, users go to **Settings → LLM Provider** and choose any provider (Anthropic, OpenAI, Grok, Minimax 2.7, etc.) and paste their API key. The system uses it only for high-level reasoning while keeping all physics computation **100% local**.

---

## 1. Phase 5 Objectives (Product + Research Level)

### Primary Goal

Deliver a beautiful, professional, responsive desktop application that seamlessly integrates all previous phases into a delightful user experience while hiding the research complexity.

### Core Goals

- Three polished views (Chat, Studio, Live) that feel premium and intuitive
- Real-time synchronization between frontend and backend with < 120ms latency
- Onboarding flow that lets any user create their first digital twin in < 5 minutes
- Full support for pluggable LLM API keys
- Cross-platform packaging and professional distribution
- Graceful handling of backend cold-start and model loading

### Success Criterion

A user installs the app, calibrates the camera once, records a 45-second video of a 3D printer or drone mechanism, and has a fully interactive digital twin with live simulation and self-improvement capabilities.

---

## 2. Desktop App Architecture (Final Locked)

### Technology Stack (2026 State-of-the-Art)

| Layer | Technology |
|-------|-----------|
| Desktop framework | Electron 31+ |
| Frontend framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui + glassmorphism |
| 3D visualization | Three.js + React Three Fiber |
| Graph visualization | React Flow |
| State management | Zustand |
| Communication | MessagePack binary WebSocket (only protocol) |
| Backend | Python FastAPI |
| Physics | All Phases 1–4 (JAX + PyTorch) |

### Layered Architecture

```
┌─────────────────────────────────────────────┐
│          Electron Main Process                │
│  (background service, auto-updater, tray)    │
└──────────────────┬──────────────────────────┘
                   │ IPC + MessagePack WebSocket
                   ▼
┌─────────────────────────────────────────────┐
│            React Renderer (UI)               │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │         Zustand Store                │   │
│  └──────────────┬──────────────────────┘   │
│                 │                            │
│  ┌──────────────┼──────────────────────┐   │
│  │              │   Three Views         │   │
│  │  Chat View   │   Studio View        │   │
│  │              │   Live View           │   │
│  └──────────────┴──────────────────────┘   │
└──────────────────┬──────────────────────────┘
                   │ MessagePack WebSocket
                   ▼
┌─────────────────────────────────────────────┐
│            Python Backend (FastAPI)           │
│                                             │
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐ │
│  │ Phase 1 │ │ Phase 2 │ │ Phase 3+4    │ │
│  │Percept. │ │Dynamics │ │Sim + Adapt  │ │
│  └─────────┘ └─────────┘ └──────────────┘ │
│                                             │
│  JAX + PyTorch + Brax                      │
└─────────────────────────────────────────────┘
```

---

## 3. The Three Views (Detailed Design)

### A. Chat View (Cursor-Style)

| Feature | Description |
|---------|-------------|
| Streaming chat | Real-time token streaming from LLM |
| Natural language input | Type any question about the mechanism |
| Voice input | Whisper (STT) + Piper (TTS) button |
| Visible tool calling | Shows "Running simulation...", "Generating targeted data..." |
| Context awareness | Knows current digital twin, parameters, calibration data |
| LLM usage | Reasoning and explanation only (not physics) |

### B. Studio View ("Neurobiology Lab" for Machines)

| Feature | Description |
|---------|-------------|
| Interactive SceneGraph | React Flow + Three.js 3D overlay |
| Parameter sliders | Mass, friction, tension, speed — instant preview |
| Prediction timeline | Scrubbable 5–15 second horizon with uncertainty bands |
| Heatmaps | Energy, force vectors, failure probability |
| Attention maps | Dynamics model attention visualization |
| Comparison mode | Side-by-side original vs. modified parameters |
| "Optimize for..." button | Triggers Phase 3 MPC planner |

### C. Live View

| Feature | Description |
|---------|-------------|
| Webcam feed | High-quality with real-time physics overlays |
| One-click "Build Digital Twin" | Runs Phase 1 perception + calibration |
| Live indicators | Confidence, uncertainty, object count |
| Recording mode | Capture + auto-analysis pipeline |

---

## 4. Real-Time Synchronization & Cold-Start Handling

### Communication Protocol

- **MessagePack binary WebSocket only** (Socket.IO removed in Phase 0)
- Versioned message types
- Binary serialization for efficiency

### Cold-Start Loading Sequence

```
User launches app
       │
       ▼
Frontend shows loading screen with progress bar
       │
       ▼
Backend stages load (events sent via WebSocket):
  [1/5] Loading perception models...
  [2/5] Loading dynamics model...
  [3/5] Initializing simulator...
  [4/5] Loading self-improvement module...
  [5/5] Ready
       │
       ▼
Frontend receives "ready" event → shows main UI
```

### Reliability

| Feature | Implementation |
|---------|---------------|
| Health-check polling | Backend exposes `/health` endpoint, polled every 5s |
| Auto-reconnection | Exponential backoff on WebSocket disconnect |
| Optimistic UI | Show results immediately, rollback on error |
| Graceful degradation | If LLM unavailable, disable chat but keep physics working |

---

## 5. Settings & Pluggable LLM

### Settings Panel UI

```
Settings
├── LLM Provider
│   ├── OpenAI (GPT-4o, GPT-4o-mini)
│   ├── Anthropic (Claude 4 Sonnet, Claude 3.5)
│   ├── Grok (xAI)
│   ├── MiniMax 2.7
│   ├── Ollama (local)
│   └── Custom (URL + base path)
├── API Configuration
│   ├── API Key: [••••••••••••••••]
│   ├── Temperature: [0.7    ]
│   ├── Max Tokens: [4096    ]
│   └── System Prompt: [Customize...]
├── Self-Improvement
│   ├── [Toggle] Enable background improvement
│   ├── [Toggle] Run overnight only
│   └── Max cycles per week: [8    ]
├── Performance
│   ├── [Toggle] Low Power Mode
│   ├── [Slider] Max GPU memory (%)
│   └── [Toggle] Async perception
└── About
    ├── Version: 1.0.0
    ├── Check for updates
    └── Licenses
```

### API Key Storage

- Stored **locally encrypted** (Electron safeStorage API)
- Never sent to any server except the chosen LLM provider
- One-click disconnect / clear

---

## 6. Performance & Laptop Optimization (Final)

### Targets

| Metric | Target |
|--------|--------|
| Frontend RAM | < 3.5 GB |
| Full app startup | < 60 seconds |
| Interactive round-trip | < 120ms |
| WebSocket latency | < 50ms |

### Optimization Techniques

| Technique | Target |
|-----------|--------|
| Heavy memoization | Prevent unnecessary re-renders |
| Virtualized lists | Handle 1000+ object scenes |
| Debounced WebSocket calls | Prevent flooding during slider drags |
| Background throttling | Self-improvement loop yields to user tasks |
| Optional Low Power Mode | Reduces visualization FPS, limits background work |

---

## 7. Packaging & Distribution

### Build Targets

| Platform | Format | Tool |
|----------|--------|------|
| Windows | `.exe` (NSIS installer) | electron-builder |
| macOS | `.dmg` + `.pkg` | electron-builder |
| Linux | `.AppImage` + `.deb` | electron-builder |

### Auto-Updater

- Uses `electron-updater`
- Checks GitHub Releases for new versions
- User prompt before download
- Background download + install on quit

### Distribution Channels

| Channel | Source |
|---------|--------|
| Stable | GitHub Releases (tagged releases) |
| Beta | GitHub Releases (pre-release) |
| Nightly | (Future) CI-built artifacts |

---

## 8. Onboarding & First-Run Experience

### Onboarding Flow

```
[Screen 1] Welcome
  Logo + 30-second explainer video
  "AETHER Studio creates a digital twin of any physical mechanism"
  [Get Started →]

[Screen 2] Camera Calibration
  One-time wizard (checkerboard or auto)
  "Point your camera at the mechanism you want to study"
  [Calibrate] [Skip for now]

[Screen 3] Try with Sample Video
  Pre-loaded 3D printer mechanism video
  One-click "See it in action"
  [Continue →]

[Screen 4] Guided Tour
  Quick highlight of Chat, Studio, Live views
  [Start Creating →]

[Screen 5] Create Your First Twin
  Open Live View → Record 45 seconds → Done
  [Let's Go →]
```

### Goal

> **User has a working, interactive digital twin within 5 minutes of opening the app.**

---

## 9. Phase 5 Evaluation Metrics

### Product Metrics

| Metric | Target |
|--------|--------|
| Time to first digital twin | < 5 minutes |
| Subjective responsiveness score | > 4.5 / 5 |
| Crash rate | < 0.5% |
| User retention (first week) | > 50% |
| NPS (Net Promoter Score) | > 40 |

### Technical Metrics

| Metric | Target |
|--------|--------|
| WebSocket round-trip latency | < 50ms |
| Frontend RAM (idle) | < 2 GB |
| Frontend RAM (active) | < 3.5 GB |
| Full app startup time | < 60s on mid-range laptop |
| Build size (Windows) | < 300 MB |
| GPU utilization during simulation | < 70% |

---

## 10. Phase 5 File Structure

```
aether-studio/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI entry point
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── ws.py              # WebSocket handler
│   │   │   ├── health.py          # Health-check endpoint
│   │   │   └── upload.py          # Video upload
│   │   ├── perception/            # (from Phase 1)
│   │   ├── dynamics/              # (from Phase 2)
│   │   ├── simulation/            # (from Phase 3)
│   │   ├── adaptation/            # (from Phase 4)
│   │   └── schemas/
│   │       └── rocp_scenegraph.py # (from Phase 0)
│   ├── research/                   # (from Phase 0)
│   ├── experiments/               # (from Phase 2)
│   ├── checkpoints/               # Model checkpoints
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── views/
│   │   │   │   ├── ChatView.tsx
│   │   │   │   ├── StudioView.tsx
│   │   │   │   └── LiveView.tsx
│   │   │   ├── ui/               # shadcn components
│   │   │   ├── studio/
│   │   │   │   ├── ParameterSliders.tsx
│   │   │   │   ├── TimelineScrubber.tsx
│   │   │   │   ├── EnergyHeatmap.tsx
│   │   │   │   ├── ForceVectors.tsx
│   │   │   │   ├── FailureHeatmap.tsx
│   │   │   │   └── SimComparison.tsx
│   │   │   ├── live/
│   │   │   │   ├── WebcamFeed.tsx
│   │   │   │   └── ConfidenceOverlay.tsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   └── ToolCallIndicator.tsx
│   │   │   ├── settings/
│   │   │   │   └── SettingsPanel.tsx
│   │   │   └── onboarding/
│   │   │       └── OnboardingFlow.tsx
│   │   ├── store/
│   │   │   ├── useAppStore.ts    # Zustand store
│   │   │   └── useSessionStore.ts
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useSimulation.ts
│   │   │   └── useLLM.ts
│   │   └── lib/
│   │       ├── websocket.ts      # MessagePack WebSocket client
│   │       └── utils.ts
│   ├── public/
│   │   ├── sample-videos/       # Pre-loaded demo videos
│   │   └── assets/
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── electron/
│   ├── main.ts                  # Electron main process
│   ├── preload.ts               # Preload script (IPC bridge)
│   ├── auto-updater.ts
│   └── tray.ts                  # System tray
├── packaging/
│   ├── electron-builder.yml
│   └── icon.png
├── package.json                  # Monorepo root
└── README.md
```

---

## 11. Dependencies (Phase 5 Specific)

### Frontend

```json
{
  "electron": "^31.0.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "typescript": "^5.4.0",
  "vite": "^6.0.0",
  "@vitejs/plugin-react": "^4.3.0",
  "tailwindcss": "^3.4.0",
  "shadcn-ui": "^0.10.0",
  "three": "^0.163.0",
  "@react-three/fiber": "^8.16.0",
  "@react-three/drei": "^9.105.0",
  "@xyflow/react": "^12.0.0",
  "zustand": "^5.0.0",
  "ws": "^8.17.0",
  "msgpack": "^5.0.0",
  "electron-updater": "^6.2.0",
  "electron-builder": "^24.13.0",
  "lucide-react": "^0.400.0",
  "@whisper/whisper": "^1.0.0",
  "pipi-ts": "^1.0.0"
}
```

### Backend

```txt
# Core (from Phase 0–4)
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
websockets>=12.0.0
msgpack>=1.0.0

# Physics
jax[cuda12]>=0.4.30
torch>=2.3.0
brax>=0.10.0

# Serving
python-multipart>=0.0.9
```

---

## 12. Exit Criteria

Before the v1.0 release, the following must be verified:

### Onboarding
- [ ] First-run onboarding flow completes in < 5 minutes
- [ ] Camera calibration wizard produces valid intrinsics
- [ ] Sample video loads and demonstrates all three views
- [ ] User can create first digital twin from webcam in < 5 minutes

### Three Views
- [ ] Chat View streams tokens in real-time
- [ ] Chat correctly invokes tools (simulation, parameter update)
- [ ] Studio View renders SceneGraph in 3D
- [ ] Parameter sliders produce simulation updates in < 150ms
- [ ] Timeline scrubber shows uncertainty bands correctly
- [ ] "Optimize for..." triggers MPC and shows results
- [ ] Live View shows webcam feed with real-time overlays
- [ ] One-click "Build Digital Twin" completes successfully

### Settings & LLM
- [ ] All LLM providers configurable (OpenAI, Anthropic, Grok, MiniMax, Ollama)
- [ ] API key saved securely (encrypted locally)
- [ ] Temperature and token controls affect LLM output
- [ ] Self-improvement toggle works correctly
- [ ] Low Power Mode reduces resource usage

### Performance
- [ ] App startup < 60 seconds
- [ ] Interactive round-trip < 120ms
- [ ] Frontend RAM < 3.5 GB
- [ ] WebSocket latency < 50ms

### Cold Start & Reliability
- [ ] Backend loads with progress events shown in UI
- [ ] Health-check polling recovers from disconnect
- [ ] Auto-reconnection works after network interruption
- [ ] Graceful error messages for all failure modes

### Packaging
- [ ] Windows `.exe` installer builds successfully
- [ ] macOS `.dmg` builds successfully
- [ ] Linux `.AppImage` builds successfully
- [ ] Auto-updater checks GitHub Releases
- [ ] App runs on clean install without dev tools

### Integration
- [ ] Phase 1 perception flows into Phase 2 dynamics
- [ ] Phase 2 dynamics flows into Phase 3 simulator
- [ ] Phase 4 self-improvement loop runs in background
- [ ] All communication uses MessagePack binary WebSocket
- [ ] `.aether` export works end-to-end
- [ ] LLM tool calling invokes correct backend functions

---

## 13. Release Checklist

```
Pre-Release
├── All Phase 0–4 exit criteria verified
├── Phase 5 exit criteria 100% green
├── Synthetic failure injection test passed (Phase 4)
├── 6–8 self-improvement cycles completed
├── User testing: 10+ beta users, > 4.5/5 responsiveness score
├── Crash rate < 0.5% over 1 week beta
└── Documentation complete (README + in-app guides)

Release Day
├── Tag v1.0.0 on GitHub
├── Create GitHub Release with release notes
├── Upload all platform installers
├── Auto-updater configured for v1.0.0
└── Announce (social, community)

Post-Release
├── Monitor crash reports (Sentry / GitHub)
├── Collect user feedback
├── Track retention metrics (Day 1, Week 1, Month 1)
├── Plan v1.1 improvements
└── Continue self-improvement cycles
```
