# AETHER — Usage Guide

AETHER extracts physics parameters from video of mechanical systems. Point a camera at a mechanism, get mass, friction, joint constraints, and a working MuJoCo simulation. No markers, no CAD, no manual calibration.

---

## Quick Start

```bash
# Backend (port 8000)
cd /path/to/aether/backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend (port 5173)
cd /path/to/aether/apps/frontend
bun run dev
```

Open `http://localhost:5173` in your browser.

### Requirements

- Python 3.12+
- NVIDIA GPU with 4GB+ VRAM (for GPU acceleration)
- CUDA 12.4+ (for GPU acceleration)
- Ollama running locally for local chat (optional)

---

## Workflow

The typical AETHER pipeline:

### 1. Create a Session

```bash
curl -X POST "http://localhost:8000/api/sessions?name=my_mechanism"
```

Returns a `session_id` (8-character string). Use this to upload your video.

### 2. Upload Video

```bash
curl -X POST "http://localhost:8000/api/videos/upload/YOUR_SESSION_ID" \
  -F "file=@/path/to/video.mp4"
```

Supported formats: mp4, mov, avi, mkv. Larger videos work but take longer to process.

### 3. Extract Frames

```bash
curl -X POST "http://localhost:8000/api/frames/extract" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "YOUR_SESSION_ID", "fps": 5, "max_frames": 500}'
```

Reduces video to images for processing. Lower `fps` for shorter videos, higher for more detail.

### 4. Run Analysis

**Quick analysis** (first frame only, ~5 seconds):

```bash
curl "http://localhost:8000/api/orchestrate/quick?session_id=YOUR_SESSION_ID"
```

Returns mechanism type (pendulum, vehicle, robot_arm, etc.), object count, and a basic simulation.

**Full pipeline** (all frames, may take minutes):

```bash
curl "http://localhost:8000/api/orchestrate/process?session_id=YOUR_SESSION_ID"
```

Runs complete pipeline: SAM2 segmentation, CoTracker3 tracking, kinematic discovery, physics extraction. Can timeout on long videos.

### 5. Check Analyzed Output

```bash
curl "http://localhost:8000/api/orchestrate/analyzed/YOUR_SESSION_ID"
```

Returns paths to analyzed video and frame overlays if they were generated.

### 6. Simulate

```bash
curl -X POST "http://localhost:8000/api/simulation" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "YOUR_SESSION_ID", "mechanism_type": "pendulum", "horizon_seconds": 5.0}'
```

Runs physics simulation. Works with or without a session.

For direct mechanism simulation without video:

```bash
curl -X POST "http://localhost:8000/api/simulation/universal" \
  -H "Content-Type: application/json" \
  -d '{"mechanism_type": "pendulum", "params": {"rod_length": 0.5, "bob_mass": 1.0}, "horizon_seconds": 5.0}'
```

### 7. Chat

Ask questions about the mechanism:

```bash
curl -X POST "http://localhost:8000/api/chat?message=What%20type%20of%20mechanism%20is%20this&session_id=YOUR_SESSION_ID"
```

Uses Google ADK (Gemini) if `GOOGLE_API_KEY` is set, otherwise falls back to local Ollama (Gemma 4). Timeouts after 120 seconds on Ollama.

---

## API Reference

### Orchestration

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/orchestrate/quick` | Fast mechanism ID from first frame |
| GET | `/api/orchestrate/process` | Full pipeline: segmentation, tracking, simulation |
| GET | `/api/orchestrate/status` | GPU availability and model readiness |
| GET | `/api/orchestrate/analyzed/{id}` | Check if analyzed output exists |

### Sessions

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sessions` | Create new session |
| GET | `/api/sessions` | List all sessions |
| GET | `/api/sessions/{id}` | Get session details |
| DELETE | `/api/sessions/{id}` | Delete session and files |
| PATCH | `/api/sessions/{id}` | Update session fields |

### Videos

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/videos/upload/{session_id}` | Upload video to session |
| GET | `/api/videos/videos/{video_id}` | Get video metadata |

### Frames

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/frames/extract` | Extract frames from session video |
| GET | `/api/frames/{session_id}` | List extracted frames |
| GET | `/api/frames/{session_id}/{frame_id}` | Get specific frame |

### Simulation

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/simulation` | Simulate session mechanism |
| POST | `/api/simulation/universal` | Simulate mechanism type directly |
| GET | `/api/simulation/mechanism_types` | List supported mechanism types |
| GET | `/api/simulation/{id}` | Get simulation result |

Supported mechanism types: `vehicle`, `drone`, `robot_arm`, `pendulum`, `linkage`, `belt_gantry`, `rigid_body`

### Reconstruction

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reconstruction/reconstruct` | 3D reconstruction from frame |
| GET | `/api/reconstruction/reconstruct/dense` | Dense reconstruction with point clouds |
| POST | `/api/reconstruction/from_frames` | Multi-frame reconstruction |
| POST | `/api/reconstruction/export/urdf` | Export as URDF robot description |

### Chat

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | Chat with physics agent |
| GET | `/api/chat/status` | Check which backends are available |

---

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Enable Google ADK agent (Gemini)..chat works without it via Ollama fallback |
| `OLLAMA_HOST` | Ollama server URL (default: `http://localhost:11434`) |
| `CUDA_VISIBLE_DEVICES` | Set empty string to force CPU-only mode |

### Agent Backends

1. **Google ADK** — used when `GOOGLE_API_KEY` is set. Faster, more reliable.
2. **Ollama** — local fallback. Requires `ollama serve` running. Uses Gemma 4 by default.
3. **Error state** — if neither is configured and Ollama is not running.

```bash
# Enable cloud agent
export GOOGLE_API_KEY=your-key-here

# Force CPU mode (avoids CUDA OOM on small GPUs)
export CUDA_VISIBLE_DEVICES=

# Use different Ollama host
export OLLAMA_HOST=http://192.168.1.100:11434
```

---

## Output Structure

```
data/sessions/{session_id}/
├── frames/
│   ├── frame_00000.png
│   ├── frame_00001.png
│   └── ...
├── analyzed_frames/          (if generated)
│   ├── frame_00000.png
│   └── ...
├── analyzed.mp4              (if generated)
└── video.mp4                (uploaded video)
```

Static files are served at `/static/{session_id}/...`

---

## Troubleshooting

### CUDA Out of Memory

```
torch.cuda.OutOfMemoryError
```

The GPU ran out of memory during processing. Fixes:

```bash
# Force CPU-only mode
export CUDA_VISIBLE_DEVICES=

# Restart backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Alternatively, reduce video length or frame count before processing.

### No Frames Found (404 after upload)

1. Verify session exists: `curl http://localhost:8000/api/sessions/{session_id}`
2. Check video uploaded correctly: `ls data/sessions/{session_id}/`
3. Try re-uploading the video

### Chat Times Out

- ADK timeout: 60 seconds
- Ollama timeout: 120 seconds

Ollama is significantly slower. For better reliability, set `GOOGLE_API_KEY`. If using Ollama:

```bash
# Verify Ollama is running
curl http://localhost:11434/api/tags
```

Keep messages short and specific. Avoid asking for long explanations.

### Full Pipeline Times Out

The `/api/orchestrate/process` endpoint processes all frames and can take 10+ minutes on long videos. If it times out:

1. Use `/api/orchestrate/quick` instead for faster results
2. Extract fewer frames: set `max_frames` lower when calling `/api/frames/extract`
3. Use a shorter video segment

### Analyzed Video Not Generated

The analyzed video generation (`analyzed.mp4`) is inconsistent, especially on large videos. This is known. Frame overlays may still be generated even if video generation fails. Check:

```bash
curl "http://localhost:8000/api/orchestrate/analyzed/YOUR_SESSION_ID"
```

### Ollama Not Responding

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve

# Pull the default model if needed
ollama pull gemma4
```

---

## What Actually Works

| Feature | Status | Notes |
|---------|--------|-------|
| Video upload | Works | mp4, mov, avi, mkv supported |
| Frame extraction | Works | Reliable, controllable via fps/max_frames |
| Quick analysis | Works | Fast (~5s), returns mechanism type and basic simulation |
| Full pipeline | Works | Slower, may timeout on long videos |
| 3D reconstruction | Works | Returns point clouds and meshes |
| URDF export | Works | Basic URDF from bounding boxes |
| Simulation | Works | All mechanism types simulate |
| Chat (ADK) | Works | Requires GOOGLE_API_KEY |
| Chat (Ollama) | Works | Slower, local |
| Analyzed video | Inconsistent | Often fails on large videos |
| Parameter learning | Experimental | Accuracy varies significantly |

---

## Session Examples

```bash
# Create session
curl -X POST "http://localhost:8000/api/sessions?name=pendulum_test"

# Upload video
curl -X POST "http://localhost:8000/api/videos/upload/abc12345" \
  -F "file=@./pendulum.mp4"

# Extract 10 frames per second, max 200
curl -X POST "http://localhost:8000/api/frames/extract" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "abc12345", "fps": 10, "max_frames": 200}'

# Quick analysis
curl "http://localhost:8000/api/orchestrate/quick?session_id=abc12345"

# Full analysis
curl "http://localhost:8000/api/orchestrate/process?session_id=abc12345"

# Simulate as pendulum
curl -X POST "http://localhost:8000/api/simulation" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "abc12345", "mechanism_type": "pendulum", "horizon_seconds": 5.0}'

# Simulate pendulum directly (no session needed)
curl -X POST "http://localhost:8000/api/simulation/universal" \
  -H "Content-Type: application/json" \
  -d '{"mechanism_type": "pendulum", "params": {"rod_length": 0.5}, "horizon_seconds": 5.0}'

# 3D reconstruct
curl "http://localhost:8000/api/reconstruction/reconstruct/dense?session_id=abc12345"

# Chat about the mechanism
curl -X POST "http://localhost:8000/api/chat?message=what%20type%20of%20mechanism%20is%20this&session_id=abc12345"
```

---

## Data Directory

By default, AETHER stores all session data in:

```
/path/to/aether/data/sessions/
```

Configure via `DATA_DIR` environment variable if you need a different location.
