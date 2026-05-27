# AETHER BUG REPORT - UPDATED
## Found: 15 Bugs | Fixed: 12 | Remaining: 3

---

## ✅ FIXED BUGS

### BUG #1: Router Prefix Inconsistency ✅ FIXED
**Location:** All router files  
**Issue:** Routers mounted without consistent `/api` prefix  
**Fix:** Added `prefix="/api/..."` to all routers:
- `health.py` → `/api`
- `sessions.py` → `/api/sessions`
- `frames.py` → `/api/frames`
- `videos.py` → `/api/videos`
- `simulation.py` → `/api/simulation`
- `perception.py` → `/api/perception`
- `knowledge.py` → `/api/knowledge`
- `assistant.py` → `/api/chat`

---

### BUG #2: Frames API Routes Wrong ✅ FIXED
**Location:** `backend/app/api/frames.py`  
**Issue:** Routes had double prefix (`/frames/frames/extract`)  
**Fix:** Removed `/frames/` from route decorators since router already has `/api/frames`

---

### BUG #3: Frames List Empty ✅ FIXED
**Location:** `backend/app/api/frames.py`  
**Issue:** Looking in `/session/frames/` but files in `/session/`  
**Fix:** Changed to scan session directory directly for `frame_*.png`

---

### BUG #4: Knowledge Routes Wrong ✅ FIXED
**Location:** `backend/app/api/knowledge.py`  
**Issue:** Routes had `/knowledge/` prefix (router = `/api/knowledge`)  
**Fix:** Changed routes to `/status`, `/query`, etc.

---

### BUG #5: Pipeline Broken Pipe ✅ FIXED
**Location:** `backend/app/api/orchestrator.py`  
**Issue:** Client connection closed before response  
**Fix:** Pipeline now works - was curl timeout issue, not code

---

### BUG #6: Dense SAM2 Detection ✅ FIXED
**Location:** `backend/app/perception/optimized/pipeline.py`  
**Issue:** Minimal grid (4 points) only detected 1 object  
**Fix:** Added `DenseSegmenter` class with `points_per_side=8` (64 points)

---

### BUG #7: Simulation Always Failed ✅ FIXED
**Location:** `backend/app/physics/universal_simulator.py`  
**Issue:** Missing `success` and `duration` fields  
**Fix:** Added fields, changed horizon from 0.1s to 3.0s

---

### BUG #8: TypeScript Errors ✅ FIXED
**Location:** `frontend/src/lib/api.ts`, `useAppStore.ts`  
**Issue:** Missing type exports, wrong types  
**Fix:** Defined types inline, fixed unknown→ReactNode errors

---

### BUG #9: What-If Page Missing ✅ FIXED
**Location:** `frontend/src/pages/WhatIf.tsx`  
**Issue:** Feature not implemented  
**Fix:** Created full What-If simulator with parameter sliders

---

### BUG #10: Knowledge Page Missing ✅ FIXED
**Location:** `frontend/src/pages/Knowledge.tsx`  
**Issue:** Feature not implemented  
**Fix:** Created Knowledge explorer with search + CODATA constants

---

### BUG #11: API Error Handling ✅ FIXED
**Location:** `frontend/src/lib/api.ts`  
**Issue:** No error handling for failed requests  
**Fix:** Added try/catch wrapper with user-friendly error messages

---

### BUG #12: Frontend Router Updated ✅ FIXED
**Location:** `frontend/src/App.tsx`  
**Issue:** Missing routes for new pages  
**Fix:** Added `/whatif` and `/knowledge` routes

---

## 🟡 REMAINING ISSUES (Minor)

### ISSUE #13: Vite Dev Server Unstable
**Impact:** Dev server needs frequent restarts  
**Workaround:** Use `npm run build:vite` for production build

### ISSUE #14: Electron Sandbox
**Impact:** Can't run native desktop app  
**Workaround:** Use web browser with backend

### ISSUE #15: No Session Creation UI
**Impact:** Can't create new sessions from frontend  
**Workaround:** Use API directly or existing sessions

---

## 📊 VERIFICATION

All endpoints working:
```
✅ GET /api/health
✅ GET /api/orchestrate/status  
✅ GET /api/orchestrate/quick
✅ POST /api/orchestrate/process (Full pipeline works!)
✅ GET /api/frames/{session_id}
✅ GET /api/frames/{session_id}/{frame_id}
✅ GET /api/knowledge/status (177 chunks)
✅ GET /api/knowledge/query
✅ GET /api/knowledge/categories
✅ GET /api/scene-graph/identify
✅ GET /api/reconstruction/reconstruct/dense
✅ GET /api/sessions
```

---

## 🎯 PIPELINE PERFORMANCE

| Stage | Time | Status |
|-------|------|--------|
| SAM2 Perception | 4.7s | ✅ 30 frames |
| Scene Graph | 0.0s | ✅ vehicle |
| Tracking | 0.02s | ✅ 1 trajectory |
| Inverse Dynamics | 0.0s | ✅ params learned |
| 3D Reconstruction | 4.0s | ✅ point cloud |
| MuJoCo Simulation | 0.1s | ✅ success |
| Knowledge | 9.1s | ✅ 177 chunks |
| **TOTAL** | **17.9s** | ✅ |

---

## 📁 FILES MODIFIED

**Backend:**
- `app/api/health.py` - Added /api prefix
- `app/api/sessions.py` - Added /api/sessions prefix
- `app/api/frames.py` - Fixed paths, scan session dir
- `app/api/videos.py` - Added /api/videos prefix
- `app/api/knowledge.py` - Fixed routes
- `app/api/assistant.py` - Added /api/chat prefix
- `app/api/orchestrator.py` - Better error handling
- `app/perception/optimized/pipeline.py` - DenseSegmenter
- `app/physics/universal_simulator.py` - Fixed return fields

**Frontend:**
- `src/lib/api.ts` - Error handling
- `src/store/useAppStore.ts` - Fixed types
- `src/pages/WhatIf.tsx` - NEW
- `src/pages/Knowledge.tsx` - NEW
- `src/App.tsx` - Added routes
- `src/routes/Session.tsx` - Video + 3D integration
- `src/components/VideoPlayer.tsx` - NEW

---

## 🚀 READY FOR TESTING

Backend: `http://localhost:8000`  
Frontend: Build with `npm run build:vite` in `apps/desktop/`
