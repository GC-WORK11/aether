import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import {
  Upload, Box, Zap,
  Trash2, Video, Search,
  Database, Cpu,
  WifiOff
} from 'lucide-react'

export function Home() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { 
    sessions, 
    sessionsLoading, 
    selectSession, 
    deleteSession, 
    uploadVideo,
    uploading,
    uploadProgress,
    backendConnected,
    checkBackend,
    loadSessions
  } = useAppStore()
  
  const [search, setSearch] = useState('')
  const [dragOver, setDragOver] = useState(false)
  
  useEffect(() => {
    checkBackend()
    loadSessions()
  }, [])

  const handleFile = async (file: File) => {
    const sessionId = await uploadVideo(file)
    if (sessionId) {
      selectSession(sessionId)
      navigate('/session')
    }
  }

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      handleFile(file)
    }
  }, [uploadVideo, selectSession, navigate])

  const onZoneClick = () => {
    fileInputRef.current?.click()
  }

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const filteredSessions = sessions.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  if (!backendConnected) {
    return (
      <div className="h-screen bg-[#050507] flex items-center justify-center p-6 text-slate-300">
        <div className="bg-[#0a0a0f] border border-rose-500/20 p-12 max-w-md w-full text-center rounded-[40px] shadow-2xl">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-rose-500/20">
            <WifiOff className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black mb-4 uppercase tracking-widest text-white italic">Neural Core Offline</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">The physical engine is unreachable. Ensure the JAX backend is initialized.</p>
          <div className="bg-black/40 p-4 rounded-2xl border border-white/5 font-mono text-[11px] text-cyan-500 text-left mb-8">
            <span className="text-slate-600">$</span> python3 backend/app/main.py
          </div>
          <button 
            onClick={() => checkBackend()}
            className="w-full py-4 bg-white text-black font-black uppercase text-xs rounded-2xl hover:bg-cyan-400 transition-all shadow-xl"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#050507] text-slate-300 font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col">
      {/* Precision Header */}
      <header className="h-16 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5 px-8 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-4">
           <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Box className="w-5 h-5 text-black" />
           </div>
           <h1 className="text-sm font-black tracking-[0.3em] text-white uppercase italic">AETHER STUDIO</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Core Active</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <button className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Docs</button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Discovered Mechanisms */}
        <div className="w-[360px] border-r border-white/5 bg-[#08080a] flex flex-col shrink-0">
          <div className="p-6 flex-1 flex flex-col min-h-0">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2 px-1">
               <Database className="w-3.5 h-3.5 text-cyan-500" /> Physical Vault
            </h2>
            
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <input 
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black border border-white/5 rounded-2xl text-[11px] text-slate-300 focus:border-cyan-500/50 outline-none transition-all"
              />
            </div>

            <div className="space-y-2 overflow-auto flex-1 pr-2 custom-scrollbar">
              {sessionsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-white/5 rounded-2xl border border-white/5 animate-pulse" />
                  ))}
                </div>
              ) : filteredSessions.length === 0 && search ? (
                <div className="py-16 flex flex-col items-center text-center px-4">
                  <Search className="w-8 h-8 text-slate-700 mb-4" />
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">No Results</p>
                  <p className="text-[10px] text-slate-600">Try a different search term</p>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="py-16 flex flex-col items-center text-center px-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    <Video className="w-7 h-7 text-slate-600" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">No Sessions Yet</p>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Drop a video above to analyze physical dynamics.
                  </p>
                </div>
              ) : (
                filteredSessions.map(session => (
                  <div 
                    key={session.id}
                    onClick={() => { selectSession(session.id); navigate('/session') }}
                    className="group p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-bold text-white group-hover:text-cyan-400 transition-colors truncate">{session.name}</h4>
                        <div className="flex items-center gap-3 mt-1.5 text-[9px] text-slate-500 font-medium uppercase tracking-tighter">
                          <span className="flex items-center gap-1"><Video className="w-2.5 h-2.5" /> {session.frame_count}F</span>
                          <span className="flex items-center gap-1"><Cpu className="w-2.5 h-2.5" /> Backend</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}
                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Center: The Quantum Dropzone */}
        <div className="flex-1 flex items-center justify-center p-20 relative bg-[#050507]">
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={onFileSelect}
            accept="video/*"
            className="hidden"
          />

          <div 
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={onZoneClick}
            className={`w-full max-w-2xl aspect-[16/10] rounded-[60px] border-2 border-dashed transition-all flex flex-col items-center justify-center relative group overflow-hidden cursor-pointer ${
              uploading ? 'border-cyan-500 bg-cyan-500/5' : dragOver ? 'border-white/40 bg-white/5 scale-[1.02]' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.01]'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-8 px-12 text-center relative z-10">
                <div className="relative">
                   <div className="w-24 h-24 rounded-full border-4 border-cyan-500/20" />
                   <div className="absolute inset-0 w-24 h-24 rounded-full border-t-4 border-cyan-500 animate-spin" />
                   <Zap className="absolute inset-0 m-auto w-8 h-8 text-cyan-500 animate-pulse" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-2">Ingesting Reality</h3>
                   <p className="text-xs text-slate-500 font-mono italic">Phase-shift: {uploadProgress}%</p>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-cyan-500 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.5)]" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center relative z-10 p-12">
                 <div className="w-24 h-24 rounded-[40px] bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:shadow-[0_20px_50px_rgba(255,255,255,0.02)] transition-all duration-700">
                    <Upload className="w-10 h-10 text-white opacity-20 group-hover:opacity-100 transition-all duration-500" />
                 </div>
                 <h3 className="text-2xl font-black text-white uppercase tracking-[0.4em] mb-4 italic">Decompile Physics</h3>
                 <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-sm">
                    Drop raw footage to autonomously reconstruct 
                    physical laws and MJX digital twins.
                 </p>
                 
              </div>
            )}
            
            {/* Corner Decorative Elements */}
            <div className="absolute top-10 left-10 w-4 h-4 border-t-2 border-l-2 border-white/5 group-hover:border-white/20 transition-colors" />
            <div className="absolute top-10 right-10 w-4 h-4 border-t-2 border-r-2 border-white/5 group-hover:border-white/20 transition-colors" />
            <div className="absolute bottom-10 left-10 w-4 h-4 border-b-2 border-l-2 border-white/5 group-hover:border-white/20 transition-colors" />
            <div className="absolute bottom-10 right-10 w-4 h-4 border-b-2 border-r-2 border-white/5 group-hover:border-white/20 transition-colors" />
          </div>

        </div>
      </main>
    </div>
  )
}
