import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAppStore } from '../store/useAppStore'
import { 
  Settings as SettingsIcon, Cpu, HardDrive, Database, Loader2, 
  Brain, ShieldCheck, Key, Globe, Layout, ChevronRight, Save
} from 'lucide-react'

interface SystemStatus {
  status: string
  gpu_available: boolean
  gpu_memory?: number
  stages: Array<{ name: string; model: string; time_estimate: string }>
}

export function Settings() {
  const { 
    aiProvider, aiModel, aiApiKey, aiBaseUrl, setAiSettings,
    backendConnected 
  } = useAppStore()

  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [knowledgeStatus, setKnowledgeStatus] = useState<{chunk_count: number; status: string} | null>(null)
  const [loading, setLoading] = useState(true)

  // Local form state
  const [provider, setProvider] = useState(aiProvider)
  const [model, setModel] = useState(aiModel)
  const [apiKey, setApiKey] = useState(aiApiKey)
  const [baseUrl, setBaseUrl] = useState(aiBaseUrl)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    setLoading(true)
    try {
      const [sys, kb] = await Promise.all([
        api.orchestrate.status(),
        api.knowledge.status()
      ])
      setSystemStatus(sys)
      setKnowledgeStatus(kb)
    } catch (e) {
      console.error('Failed to load status:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    setAiSettings({ provider, model, apiKey, baseUrl })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center gap-3 text-slate-400 mb-2 uppercase tracking-widest text-[10px] font-bold">
            <Layout className="w-3.5 h-3.5" />
            <span>System Configuration</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
            Workstation Settings
          </h1>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar / Navigation */}
          <aside className="col-span-12 lg:col-span-3 space-y-1">
             <button className="w-full flex items-center justify-between px-4 py-2 bg-white border border-slate-200 rounded-lg text-blue-600 font-bold text-xs shadow-sm">
                AI & Reasoning <ChevronRight className="w-4 h-4" />
             </button>
             <button className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-100 rounded-lg text-slate-500 font-medium text-xs transition-colors">
                Physics Engine
             </button>
             <button className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-100 rounded-lg text-slate-500 font-medium text-xs transition-colors">
                Perception Stack
             </button>
             <button className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-100 rounded-lg text-slate-500 font-medium text-xs transition-colors">
                Export / Formats
             </button>
          </aside>

          {/* Main Settings Panel */}
          <div className="col-span-12 lg:col-span-9 space-y-8">
            
            {/* AI Provider Section */}
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
               <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Reasoning Provider</h2>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded border border-slate-200">Cloud-First</span>
               </div>
               
               <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" /> API Provider
                      </label>
                      <select 
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                      >
                        <option value="minimax">MiniMax (Official)</option>
                        <option value="openrouter">OpenRouter (Any Model)</option>
                        <option value="openai">OpenAI (GPT-4o)</option>
                        <option value="gemini">Google Gemini</option>
                        <option value="ollama">Local Ollama</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5" /> Model ID
                      </label>
                      <input 
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g. MiniMax-M2.7-highspeed"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" /> API Credential
                    </label>
                    <div className="relative">
                      <input 
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium italic">Credentials are stored locally and never transmitted except to the provider.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Custom Base URL (Optional)
                    </label>
                    <input 
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button 
                      onClick={handleSave}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg ${
                        saved 
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                        : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700'
                      }`}
                    >
                      {saved ? <ShieldCheck className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      {saved ? 'SETTINGS SECURED' : 'SAVE CONFIGURATION'}
                    </button>
                  </div>
               </div>
            </section>

            {/* System Metrics Section */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-5 h-5 text-emerald-500" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase">JAX Engine</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{systemStatus?.status || 'Active'}</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase">Hamiltonian Online</p>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <HardDrive className="w-5 h-5 text-blue-500" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase">CUDA Stack</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">
                  {systemStatus?.gpu_available ? 'Ready' : 'Fallback'}
                </p>
                <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase">VRAM Managed</p>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-5 h-5 text-purple-500" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Local KB</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">
                  {knowledgeStatus?.chunk_count || 0}
                </p>
                <p className="text-[10px] text-purple-600 font-bold mt-1 uppercase">Physics Chunks</p>
              </div>
            </div>

            {/* Pipeline Performance */}
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
               <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Discovery Pipeline Latency</h2>
               </div>
               <div className="p-6">
                <div className="space-y-3">
                  {systemStatus?.stages?.map((stage, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{stage.name}</span>
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] text-slate-400 font-medium uppercase">{stage.model}</span>
                         <span className="text-blue-600 font-mono text-xs font-bold">{stage.time_estimate}</span>
                      </div>
                    </div>
                  ))}
                </div>
               </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}
