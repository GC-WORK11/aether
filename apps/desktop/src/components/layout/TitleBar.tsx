import { useState } from 'react'
import { Settings, Wifi, WifiOff, ChevronDown, Plus, Minimize2, Maximize2, X } from 'lucide-react'

interface TitleBarProps {
  backendStatus: 'online' | 'offline' | 'checking'
  sessionId?: string | null
  onNewSession?: () => void
  onSettingsClick?: () => void
}

export function TitleBar({ backendStatus, sessionId, onNewSession, onSettingsClick }: TitleBarProps) {
  const [modelLabel, setModelLabel] = useState('MiniMax 2.7')
  const [modelOpen, setModelOpen] = useState(false)

  const models = [
    { label: 'MiniMax 2.7', sub: 'Fast reasoning · Best for physics' },
    { label: 'MiniMax M2.6', sub: 'Balanced speed & quality' },
    { label: 'Claude 4', sub: 'Highest quality · Slower' },
    { label: 'GPT-4o', sub: 'OpenAI · Fast tool calling' },
  ]

  return (
    <header className="titlebar">
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 4 }}>
        <div style={{
          width: 26, height: 26,
          background: 'linear-gradient(135deg, #4F6AF0 0%, #7B93FF 100%)',
          borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(79,106,240,0.3)',
        }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '-0.5px' }}>Æ</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0D0F14', letterSpacing: '-0.02em', lineHeight: 1.2 }}>AETHER</span>
          <span style={{ fontSize: 9, color: '#929AA8', letterSpacing: '0.04em', lineHeight: 1.2, fontWeight: 500 }}>STUDIO</span>
        </div>
      </div>

      {/* Session pill */}
      {sessionId ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px',
          background: 'rgba(79,106,240,0.08)',
          border: '1px solid rgba(79,106,240,0.15)',
          borderRadius: 20,
          fontSize: 11, fontWeight: 500,
          color: 'var(--accent)',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--success)',
            boxShadow: '0 0 0 2px rgba(22,163,74,0.2)',
          }} />
          Active Session
        </div>
      ) : (
        <button
          onClick={onNewSession}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-2)',
            borderRadius: 20,
            fontSize: 11, fontWeight: 500,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all var(--t-fast)',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--surface-3)'; (e.target as HTMLElement).style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { (e.target as HTMLElement).style.background = 'var(--surface-2)'; (e.target as HTMLElement).style.color = 'var(--text-secondary)' }}
        >
          <Plus size={11} strokeWidth={2.5} />
          New Session
        </button>
      )}

      <div style={{ flex: 1 }} />

      {/* Model selector */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setModelOpen(o => !o)}
          className="btn-icon"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            width: 'auto', height: 28, padding: '0 8px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-2)',
            borderRadius: 8,
            fontSize: 11, fontWeight: 500,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)',
          }} />
          {modelLabel}
          <ChevronDown size={10} strokeWidth={2} />
        </button>

        {modelOpen && (
          <div style={{
            position: 'absolute', top: '100%', right: 0,
            marginTop: 6,
            background: 'var(--surface)',
            border: '1px solid var(--border-2)',
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: 6,
            minWidth: 200,
            zIndex: 999,
            animation: 'scaleIn 150ms var(--t-spring) forwards',
          }}>
            {models.map(m => (
              <button
                key={m.label}
                onClick={() => { setModelLabel(m.label); setModelOpen(false) }}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 2,
                  width: '100%', padding: '8px 10px',
                  background: m.label === modelLabel ? 'var(--accent-subtle)' : 'transparent',
                  border: 'none', borderRadius: 'var(--r-md)',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background var(--t-fast)',
                }}
                onMouseEnter={e => { if (m.label !== modelLabel) (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
                onMouseLeave={e => { if (m.label !== modelLabel) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span style={{ fontSize: 12, fontWeight: 500, color: m.label === modelLabel ? 'var(--accent)' : 'var(--text-primary)' }}>{m.label}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.sub}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {backendStatus === 'online' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--success)',
            }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Connected</span>
          </div>
        ) : backendStatus === 'checking' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--warning)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Connecting…</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <WifiOff size={12} color="var(--danger)" />
            <span style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 500 }}>Offline</span>
          </div>
        )}
      </div>

      {/* Settings */}
      <button className="btn-icon" title="Settings" onClick={onSettingsClick}>
        <Settings size={14} strokeWidth={1.75} />
      </button>

      <style>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(-4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </header>
  )
}
