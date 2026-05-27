import { api } from '../lib/api'
import { create } from 'zustand'
import type { 
  Session, 
  PipelineResult, 
  SceneGraph, 
  Reconstruction, 
  SimulationResult,
  KnowledgeChunk 
} from '../lib/api'

interface AppState {
  // UI State
  activeTab: 'studio' | 'live' | 'chat' | 'settings'
  setActiveTab: (tab: 'studio' | 'live' | 'chat' | 'settings') => void
  
  // Sessions
  sessions: Session[]
  currentSession: Session | null
  sessionsLoading: boolean
  loadSessions: () => Promise<void>
  createSession: (name?: string) => Promise<Session | null>
  selectSession: (id: string) => void
  deleteSession: (id: string) => Promise<void>
  
  // Pipeline State
  pipelineRunning: boolean
  pipelineProgress: string
  pipelineResult: PipelineResult | null
  runPipeline: (question: string) => Promise<void>
  
  // Scene Graph
  sceneGraph: SceneGraph | null
  loadSceneGraph: () => Promise<void>
  
  // Reconstruction
  reconstruction: Reconstruction | null
  reconstructionLoading: boolean
  loadReconstruction: () => Promise<void>
  
  // Simulation
  simulation: SimulationResult | null
  simulationLoading: boolean
  runSimulation: (mechanismType: string, params: Record<string, number>, duration: number) => Promise<void>
  
  // Knowledge
  knowledgeChunks: KnowledgeChunk[]
  knowledgeLoading: boolean
  queryKnowledge: (text: string) => Promise<void>
  
  // Chat
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  chatInput: string
  setChatInput: (text: string) => void
  sendMessage: () => Promise<void>
  
  // AI Settings
  aiProvider: string
  aiModel: string
  aiApiKey: string
  aiBaseUrl: string
  setAiSettings: (settings: { provider?: string; model?: string; apiKey?: string; baseUrl?: string }) => void
  
  // Video Upload
  uploadProgress: number
  uploading: boolean
  uploadVideo: (file: File) => Promise<string | null>
  
  // Connection
  backendConnected: boolean
  checkBackend: () => Promise<void>
  
  // Error
  error: string | null
  setError: (error: string | null) => void
  clearError: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // UI State
  activeTab: 'studio',
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  // Sessions
  sessions: [],
  currentSession: null,
  sessionsLoading: false,
  
  loadSessions: async () => {
    set({ sessionsLoading: true })
    try {
      const sessions = await api.sessions.list()
      set({ sessions, sessionsLoading: false })
    } catch (e) {
      set({ error: 'Failed to load sessions', sessionsLoading: false })
    }
  },
  
  createSession: async (name?: string) => {
    try {
      const session = await api.sessions.create(name || `Session ${Date.now()}`)
      await get().loadSessions()
      return session
    } catch (e) {
      set({ error: 'Failed to create session' })
      return null
    }
  },
  
  selectSession: (id: string) => {
    const { sessions } = get()
    const session = sessions.find(s => s.id === id) || null
    set({ currentSession: session, sceneGraph: null, reconstruction: null, simulation: null })
  },
  
  deleteSession: async (id: string) => {
    try {
      await api.sessions.delete(id)
      await get().loadSessions()
    } catch (e) {
      set({ error: 'Failed to delete session' })
    }
  },
  
  // Pipeline
  pipelineRunning: false,
  pipelineProgress: '',
  pipelineResult: null,
  
  runPipeline: async (question: string) => {
    const { currentSession } = get()
    if (!currentSession) {
      set({ error: 'No session selected' })
      return
    }
    
    set({ pipelineRunning: true, pipelineProgress: 'Starting...', error: null })
    
    try {
      const result = await api.orchestrate.process(currentSession.id, question)
      set({ pipelineResult: result, pipelineRunning: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Pipeline failed', pipelineRunning: false })
    }
  },
  
  // Scene Graph
  sceneGraph: null,
  
  loadSceneGraph: async () => {
    const { currentSession } = get()
    if (!currentSession) return
    
    try {
      const sg = await api.sceneGraph.build(currentSession.id)
      set({ sceneGraph: sg })
    } catch (e) {
      console.error('Failed to load scene graph:', e)
    }
  },
  
  // Reconstruction
  reconstruction: null,
  reconstructionLoading: false,
  
  loadReconstruction: async () => {
    const { currentSession } = get()
    if (!currentSession) return

    set({ reconstructionLoading: true })
    try {
      const recon = await api.reconstruction.dense(currentSession.id)
      set({ reconstruction: recon, reconstructionLoading: false })
    } catch (e) {
      console.error('API /api/reconstruction/reconstruct/dense failed:', e)
      set({ reconstructionLoading: false, error: e instanceof Error ? e.message : 'Failed to load reconstruction' })
    }
  },
  
  // Simulation
  simulation: null,
  simulationLoading: false,
  
  runSimulation: async (mechanismType: string, params: Record<string, number>, duration: number) => {
    set({ simulationLoading: true, error: null })
    try {
      // Prioritize the universal simulation endpoint which supports MJX/HNN
      const sim = await api.simulation.simulateUniversal(mechanismType, params, duration)
      set({ simulation: sim, simulationLoading: false })
    } catch (e) {
      console.error('API /api/simulation/universal failed:', e)
      set({ simulationLoading: false, error: e instanceof Error ? e.message : 'Simulation failed: Neural engine busy or invalid params.' })
    }
  },
  
  // Knowledge
  knowledgeChunks: [],
  knowledgeLoading: false,
  
  queryKnowledge: async (text: string) => {
    set({ knowledgeLoading: true })
    try {
      const chunks = await api.knowledge.query(text, 5)
      set({ knowledgeChunks: chunks, knowledgeLoading: false })
    } catch (e) {
      set({ knowledgeLoading: false })
    }
  },
  
  // Chat
  messages: [],
  chatInput: '',
  setChatInput: (text) => set({ chatInput: text }),
  
  sendMessage: async () => {
    const { chatInput, messages, currentSession, aiProvider, aiModel, aiApiKey, aiBaseUrl } = get()
    if (!chatInput.trim()) return
    
    const userMsg = { role: 'user' as const, content: chatInput }
    set({ messages: [...messages, userMsg], chatInput: '' })
    
    try {
      const response = await api.chat.send(chatInput, {
        provider: aiProvider,
        model: aiModel,
        api_key: aiApiKey,
        base_url: aiBaseUrl,
        sessionId: currentSession?.id
      })
      set({ messages: [...get().messages, { role: 'assistant' as const, content: response.response }] })
    } catch (e) {
      set({ 
        messages: [...get().messages, { role: 'assistant' as const, content: 'Error: Failed to get response' }] 
      })
    }
  },

  // AI Settings
  aiProvider: localStorage.getItem('aether_ai_provider') || 'minimax',
  aiModel: localStorage.getItem('aether_ai_model') || 'MiniMax-M2.7-highspeed',
  aiApiKey: localStorage.getItem('aether_ai_api_key') || '',
  aiBaseUrl: localStorage.getItem('aether_ai_base_url') || '',
  
  setAiSettings: (settings) => {
    if (settings.provider) {
      set({ aiProvider: settings.provider })
      localStorage.setItem('aether_ai_provider', settings.provider)
    }
    if (settings.model) {
      set({ aiModel: settings.model })
      localStorage.setItem('aether_ai_model', settings.model)
    }
    if (settings.apiKey !== undefined) {
      set({ aiApiKey: settings.apiKey })
      localStorage.setItem('aether_ai_api_key', settings.apiKey)
    }
    if (settings.baseUrl !== undefined) {
      set({ aiBaseUrl: settings.baseUrl })
      localStorage.setItem('aether_ai_base_url', settings.baseUrl)
    }
  },
  
  // Upload
  uploadProgress: 0,
  uploading: false,
  
  uploadVideo: async (file: File) => {
    set({ uploading: true, uploadProgress: 0, error: null })
    
    try {
      // Create session
      const session = await api.sessions.create(file.name.replace(/\.[^.]+$/, ''))
      
      // Upload video
      await api.videos.upload(session.id, file, (p) => set({ uploadProgress: p }))
      
      // Extract frames
      await api.frames.extract(session.id, 5, 30)
      
      // Reload sessions
      await get().loadSessions()
      set({ uploading: false, uploadProgress: 100 })
      
      return session.id
    } catch (e) {
      set({ uploading: false, error: e instanceof Error ? e.message : 'Upload failed' })
      return null
    }
  },
  
  // Connection
  backendConnected: false,
  
  checkBackend: async () => {
    try {
      await api.health()
      set({ backendConnected: true })
    } catch {
      set({ backendConnected: false })
    }
  },
  
  // Error
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))
