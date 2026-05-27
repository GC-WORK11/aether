import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface KnowledgeStatus {
  status: 'idle' | 'running' | 'complete' | 'error'
  papers_fetched: number
  chunks_added: number
  chunk_count: number
  embedding_model: string
  knowledge_initialized: boolean
  error: string | null
}

export interface SettingsState {
  // LLM providers
  provider: string
  apiKey: string
  baseUrl: string
  minimaxModel: string
  activeLLM: 'minimax' | 'openai' | 'openrouter' | 'lmstudio'

  // Knowledge base
  knowledgeStatus: KnowledgeStatus | null
  isInitializingKnowledge: boolean

  // Actions
  setProvider: (p: string) => void
  setApiKey: (k: string) => void
  setBaseUrl: (u: string) => void
  setMinimaxModel: (m: string) => void
  setActiveLLM: (llm: 'minimax' | 'openai' | 'openrouter' | 'lmstudio') => void
  setKnowledgeStatus: (status: KnowledgeStatus | null) => void
  setIsInitializingKnowledge: (v: boolean) => void
  fetchKnowledgeStatus: () => Promise<void>
  initializeKnowledge: () => Promise<void>
}

const API = () => (window as any).electronAPI?.backendUrl?.() ?? 'http://localhost:8000'

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      provider: 'minimax',
      apiKey: '',
      baseUrl: 'https://api.minimax.chat/v1',
      minimaxModel: 'abab6.5s-chat',
      activeLLM: 'minimax',
      knowledgeStatus: null,
      isInitializingKnowledge: false,

      setProvider: (provider) => {
        // Auto-set base URL based on provider
        const baseUrls: Record<string, string> = {
          minimax: 'https://api.minimax.chat/v1',
          openai: 'https://api.openai.com/v1',
          openrouter: 'https://openrouter.ai/api/v1',
          lmstudio: 'http://localhost:1234/v1',
        }
        set({ 
          provider, 
          baseUrl: baseUrls[provider] || baseUrls.minimax,
          activeLLM: provider as any
        })
      },
      setApiKey: (apiKey) => set({ apiKey }),
      setBaseUrl: (baseUrl) => set({ baseUrl }),
      setMinimaxModel: (minimaxModel) => set({ minimaxModel }),
      setActiveLLM: (llm) => set({ activeLLM: llm, provider: llm }),
      setKnowledgeStatus: (status) => set({ knowledgeStatus: status }),
      setIsInitializingKnowledge: (v) => set({ isInitializingKnowledge: v }),

      fetchKnowledgeStatus: async () => {
        try {
          const res = await fetch(`${API()}/api/knowledge/status`)
          if (res.ok) {
            const data = await res.json()
            set({ knowledgeStatus: data })
          }
        } catch { /* offline */ }
      },

      initializeKnowledge: async () => {
        set({ isInitializingKnowledge: true })
        try {
          const res = await fetch(`${API()}/api/knowledge/initialize`, { method: 'POST' })
          if (res.ok) {
            // Poll for completion
            for (let i = 0; i < 60; i++) {
              await new Promise(r => setTimeout(r, 5000))
              await get().fetchKnowledgeStatus()
              const s = get().knowledgeStatus
              if (s?.status === 'complete' || s?.status === 'error') break
            }
          }
        } finally {
          set({ isInitializingKnowledge: false })
        }
      },
    }),
    {
      name: 'aether-settings',
      partialize: (state) => ({
        provider: state.provider,
        apiKey: state.apiKey,
        baseUrl: state.baseUrl,
        minimaxModel: state.minimaxModel,
        activeLLM: state.activeLLM,
      }),
    }
  )
)
