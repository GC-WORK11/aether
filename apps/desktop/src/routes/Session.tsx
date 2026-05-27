import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import {
  ArrowLeft, AlertCircle,
  Settings as SettingsIcon,
  Video, Terminal, Maximize2, Loader2, Brain
} from 'lucide-react'
import { VideoPlayer } from '../components/VideoPlayer'
import { api } from '../lib/api'

export function Session() {
  const navigate = useNavigate()
  const {
    currentSession,
    reconstruction,
    loadReconstruction,
    error,
    clearError,
    reconstructionLoading,
    backendConnected,
    checkBackend
  } = useAppStore()

  const [quickAnalysis, setQuickAnalysis] = useState<{
    mechanism_type: string
    n_objects: number
    simulation: { success: boolean; duration: number }
  } | null>(null)
  const [quickAnalysisLoading, setQuickAnalysisLoading] = useState(false)
  const [quickAnalysisError, setQuickAnalysisError] = useState<string | null>(null)

  useEffect(() => {
    checkBackend()
    if (!currentSession) {
      navigate('/')
    } else {
      loadReconstruction()
    }
  }, [currentSession, navigate, loadReconstruction, checkBackend])

  const runQuickAnalysis = async () => {
    if (!currentSession) return
    setQuickAnalysisLoading(true)
    setQuickAnalysisError(null)
    try {
      // Run full pipeline to generate analyzed video + analysis
      const result = await api.orchestrate.process(currentSession.id, "What is the physics of this mechanism?")
      setQuickAnalysis({
        mechanism_type: result.answer.mechanism_type,
        n_objects: result.stages?.perception?.n_masks || 0,
        simulation: { success: true, duration: result.total_time_seconds },
      })
    } catch (e) {
      setQuickAnalysisError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setQuickAnalysisLoading(false)
    }
  }

  if (!currentSession) return null

  return (
    <div className="h-screen bg-[#050507] text-slate-300 font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col">
      {/* Precision Header */}
      <header className="h-14 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5 px-6 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-3">
             <h1 className="text-xs font-black tracking-[0.2em] text-white uppercase italic">AETHER STUDIO</h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-slate-500 text-[10px] font-mono">
            <span className="flex items-center gap-1.5"><Video className="w-3 h-3" /> {currentSession.frame_count || 0}F</span>
            <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded border border-white/5">
              <div className={`w-1.5 h-1.5 rounded-full ${backendConnected ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
              <span className="uppercase text-[9px] font-bold">Backend {backendConnected ? 'Connected' : 'Offline'}</span>
            </div>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-lg text-slate-500">
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Studio Workbench */}
      <main className="flex-1 flex overflow-hidden">

        {/* Left Sidebar */}
        <div className="w-[420px] border-r border-white/5 flex flex-col shrink-0 bg-[#08080a]">
          {/* Perception View */}
          <div className="p-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-500" /> Video Feed
              </h3>
            </div>

            <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-video relative group">
              <VideoPlayer sessionId={currentSession.id} frameCount={currentSession.frame_count || 30} />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white/70 hover:text-white">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Session Info */}
            <div className="mt-6 flex-1">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                Session Info
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Session ID</p>
                  <p className="text-xs font-mono text-slate-300 truncate">{currentSession.id}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Frame Count</p>
                  <p className="text-xs font-mono text-slate-300">{currentSession.frame_count || 0} frames</p>
                </div>
                {quickAnalysis && (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Mechanism Type</p>
                    <p className="text-xs font-mono text-cyan-400">{quickAnalysis.mechanism_type}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-2 mb-1">Objects Detected</p>
                    <p className="text-xs font-mono text-slate-300">{quickAnalysis.n_objects}</p>
                  </div>
                )}
                {quickAnalysisError && (
                  <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
                    <p className="text-[9px] font-bold text-rose-400 uppercase mb-1">Analysis Error</p>
                    <p className="text-xs font-mono text-rose-300">{quickAnalysisError}</p>
                  </div>
                )}
              </div>

              {/* Quick Analysis Button */}
              <button
                onClick={runQuickAnalysis}
                disabled={quickAnalysisLoading}
                className="mt-4 w-full p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 rounded-xl border border-cyan-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {quickAnalysisLoading ? (
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4 text-cyan-400" />
                )}
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                  {quickAnalysis ? 'Re-run Quick Analysis' : 'Quick Analysis'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col bg-[#050507] relative">

          <div className="flex-1 relative">
             {reconstructionLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#050507]/80 backdrop-blur-sm z-30">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20" />
                    <div className="absolute inset-0 w-16 h-16 rounded-full border-t-2 border-cyan-500 animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-white uppercase tracking-[0.3em] mb-1">Loading Reconstruction</p>
                    <p className="text-[10px] text-slate-500 font-mono italic">Fetching point cloud data...</p>
                  </div>
                </div>
              </div>
            )}

            <div className="w-full h-full flex items-center justify-center">
              {reconstruction?.n_point_clouds && reconstruction.n_point_clouds > 0 ? (
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-400 mb-2">Point Cloud Available</p>
                  <p className="text-xs text-slate-600">{reconstruction.n_point_clouds} frames reconstructed</p>
                </div>
              ) : (
                <div className="text-center opacity-50">
                  <p className="text-sm font-bold text-slate-500 mb-2">No Reconstruction Data</p>
                  <p className="text-xs text-slate-600">Upload a video to see analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Global Error Toast */}
      {error && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="bg-[#1a0a0f] border border-rose-500/20 shadow-[0_20px_50px_rgba(244,63,94,0.15)] backdrop-blur-2xl rounded-2xl p-5 flex items-center gap-5 pr-8">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/30">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest">Error</p>
              <p className="text-[11px] text-rose-300 font-medium mt-0.5">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-6 p-2 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 rotate-90" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

