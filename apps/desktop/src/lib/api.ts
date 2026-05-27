/** AETHER Studio API Client - Type-safe backend connection */

const BASE = '' // Use Vite proxy (relative URLs)

// ─── Type Definitions ───────────────────────────────────────────────────────

export interface HealthResponse {
  status: string
  gpu_available: boolean
  version: string
}

export interface Session {
  id: string
  name: string
  frame_count?: number
  video_id?: string
  status?: string
  created_at?: string
}

export interface OrchestratorStatus {
  status: string
  gpu_available: boolean
  stages: Array<{ name: string; model: string; time_estimate: string }>
  total_time_estimate: string
}

export interface OrchestratorQuick {
  session_id: string
  mechanism_type: string
  n_objects: number
  simulation: { success: boolean; duration: number; timesteps?: number }
}

export interface SceneGraph {
  mechanism_type: string
  mechanism_name?: string
  n_objects: number
  n_edges: number
  xml?: string
  objects: Array<{
    id: string
    label: string
    physics: Record<string, number>
  }>
}

export interface Reconstruction {
  n_objects: number
  n_point_clouds: number
  depth_stats: { min: number; max: number; mean: number }
  time_seconds?: number
}

export interface SimulationResult {
  success: boolean
  duration?: number
  timesteps?: number
  mechanism_type?: string
  pendulum_period_s?: number
  vibration_amplitude_mm?: number
  confidence?: number
  params_used?: Record<string, number>
  error?: string
}

export interface KnowledgeChunk {
  title: string
  text: string
  source: string
  distance?: number
}

export interface PipelineResult {
  session_id: string
  pipeline: string
  n_frames: number
  stages: Record<string, any>
  total_time_seconds: number
  answer: {
    text: string
    mechanism_type: string
    grounded: boolean
    xml?: string
  }
}

// ─── API Client ─────────────────────────────────────────────────────────────

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`
  try {
    const r = await fetch(url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...opts?.headers },
    })
    if (!r.ok) {
      const err = await r.text().catch(() => 'Unknown error')
      throw new Error(`${r.status} ${path}: ${err}`)
    }
    return r.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Backend not running. Start with: cd backend && python3 -m uvicorn app.main:app')
    }
    throw error
  }
}

// ─── API Methods ────────────────────────────────────────────────────────────

export const api = {
  health: () => req<HealthResponse>('/api/health'),

  orchestrate: {
    status: () => req<OrchestratorStatus>('/api/orchestrate/status'),
    process: (sessionId: string, question: string) =>
      req<PipelineResult>(`/api/orchestrate/process?session_id=${encodeURIComponent(sessionId)}&question=${encodeURIComponent(question)}`),
    quick: (sessionId: string) =>
      req<OrchestratorQuick>(`/api/orchestrate/quick?session_id=${encodeURIComponent(sessionId)}`),
    analyzed: (sessionId: string) =>
      req<{ analyzed_video_exists: boolean; analyzed_video_url: string | null; analyzed_frames_exists: boolean; analyzed_frames_url: string | null; analyzed_frames_count: number }>(`/api/orchestrate/analyzed/${encodeURIComponent(sessionId)}`),
  },

  sessions: {
    list: () => req<Session[]>('/api/sessions'),
    create: (name: string) => req<Session>('/api/sessions', { 
      method: 'POST', 
      body: JSON.stringify({ name }) 
    }),
    get: (id: string) => req<Session>(`/api/sessions/${encodeURIComponent(id)}`),
    delete: (id: string) => req<void>(`/api/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },

  videos: {
    upload: (sessionId: string, file: File, onProgress?: (p: number) => void) => {
      const fd = new FormData()
      fd.append('file', file)
      return new Promise<{ video_id: string }>((res, rej) => {
        const x = new XMLHttpRequest()
        x.upload.onprogress = e => { 
          if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded * 100) / e.total)) 
        }
        x.onload = () => {
          if (x.status >= 200 && x.status < 300) res(JSON.parse(x.responseText))
          else rej(new Error(`Upload failed: ${x.status}`))
        }
        x.onerror = () => rej(new Error('Network error'))
        x.open('POST', `${BASE}/api/videos/upload/${encodeURIComponent(sessionId)}`)
        x.send(fd)
      })
    },
    get: (id: string) => req<any>(`/api/videos/${encodeURIComponent(id)}`),
  },

  frames: {
    list: (sessionId: string) => req<{ frames: any[]; count: number }>(`/api/frames/${encodeURIComponent(sessionId)}`),
    extract: (sessionId: string, fps = 5, maxFrames?: number) =>
      req<any>('/api/frames/extract', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, fps, max_frames: maxFrames }),
      }),
    getFrame: (sessionId: string, frameIndex: number) =>
      `/static/${encodeURIComponent(sessionId)}/frames/frame_${String(frameIndex).padStart(4, '0')}.png`,
  },

  sceneGraph: {
    identify: (sessionId: string) =>
      req<SceneGraph>(`/api/scene-graph/identify?session_id=${encodeURIComponent(sessionId)}`),
    build: (sessionId: string) =>
      req<SceneGraph>(`/api/scene-graph/build?session_id=${encodeURIComponent(sessionId)}`),
  },

  reconstruction: {
    reconstruct: (sessionId: string, frameIndex = 0) =>
      req<Reconstruction>(`/api/reconstruction/reconstruct?session_id=${encodeURIComponent(sessionId)}&frame_index=${frameIndex}`),
    dense: (sessionId: string) =>
      req<Reconstruction>(`/api/reconstruction/reconstruct/dense?session_id=${encodeURIComponent(sessionId)}`),
    exportURDF: (sessionId: string) =>
      req<any>('/api/reconstruction/export/urdf', { 
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId }),
      }),
  },

  simulation: {
    run: (sessionId: string, horizonSeconds = 5, paramOverrides?: Record<string, number>) =>
      req<SimulationResult>('/api/simulation', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          horizon_seconds: horizonSeconds,
          param_overrides: paramOverrides || {},
        }),
      }),
    simulateUniversal: (mechanismType: string, params: Record<string, number>, duration = 5) =>
      req<SimulationResult>('/api/simulation/universal', {
        method: 'POST',
        body: JSON.stringify({
          mechanism_type: mechanismType,
          params,
          horizon_seconds: duration,
        }),
      }),
  },

  knowledge: {
    status: () => req<{ chunk_count: number; status: string }>('/api/knowledge/status'),
    query: (query: string, topK = 5) =>
      req<KnowledgeChunk[]>(`/api/knowledge/query?q=${encodeURIComponent(query)}&top_k=${topK}`),
    categories: () => req<string[]>('/api/knowledge/categories'),
  },

  chat: {
    send: (message: string, sessionId?: string) => {
      let url = `/api/chat?message=${encodeURIComponent(message)}`;
      if (sessionId) url += `&session_id=${encodeURIComponent(sessionId)}`;
      return req<{ response: string; agent?: string; error?: string }>(url, { method: 'POST' });
    },
  },
}
