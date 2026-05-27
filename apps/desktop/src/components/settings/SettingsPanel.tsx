import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../store/useSettingsStore'
import { BookOpen, Brain, Database, ChevronRight, Loader2, CheckCircle2, AlertCircle, RefreshCw, Zap, Key, Globe, Settings } from 'lucide-react'

/* ─── Provider Card ─────────────────────────────── */
function ProviderCard({ 
  id, 
  label, 
  description, 
  icon: Icon, 
  active, 
  onSelect 
}: {
  id: string
  label: string
  description: string
  icon: React.ElementType
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: '16px',
        background: active ? 'var(--accent-subtle)' : 'var(--surface-2)',
        border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--r-lg)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all var(--t-base)',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: active ? 'var(--accent)' : 'var(--surface-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all var(--t-base)',
        }}>
          <Icon size={17} color={active ? '#fff' : 'var(--text-secondary)'} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text-primary)' }}>
              {label}
            </span>
            {active && <span className="badge badge-accent">Active</span>}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{description}</span>
        </div>
        <ChevronRight size={14} color={active ? 'var(--accent)' : 'var(--text-disabled)'} />
      </div>
    </button>
  )
}

/* ─── API Key Input ─────────────────────────────── */
function ApiKeyInput({ 
  value, 
  onChange,
  onSave,
  testing 
}: { 
  value: string
  onChange: (v: string) => void
  onSave: () => void
  testing: boolean
}) {
  const [showKey, setShowKey] = useState(false)
  
  return (
    <div style={{
      padding: '14px',
      background: 'var(--surface-2)',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Key size={14} color="var(--text-secondary)" />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>API Key</span>
      </div>
      
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Paste your API key here..."
          style={{
            flex: 1,
            padding: '8px 12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            fontSize: 12,
            color: 'var(--text-primary)',
            fontFamily: 'monospace',
          }}
        />
        <button 
          onClick={() => setShowKey(!showKey)}
          className="btn btn-ghost btn-sm"
        >
          {showKey ? 'Hide' : 'Show'}
        </button>
        <button 
          onClick={onSave}
          disabled={testing || !value}
          className="btn btn-primary btn-sm"
        >
          {testing ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
        </button>
      </div>
    </div>
  )
}

/* ─── Model Selector ─────────────────────────────── */
function ModelSelector({ 
  models, 
  value, 
  onChange 
}: { 
  models: string[]
  value: string
  onChange: (v: string) => void
}) {
  if (models.length === 0) {
    return (
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Enter model name..."
        style={{
          width: '100%',
          padding: '8px 12px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-sm)',
          fontSize: 12,
          color: 'var(--text-primary)',
        }}
      />
    )
  }
  
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '8px 12px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)',
        fontSize: 12,
        color: 'var(--text-primary)',
      }}
    >
      {models.map(m => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
  )
}

/* ─── Status Row ─────────────────────────────────── */
function StatusRow({ icon: Icon, label, value, status }: {
  icon: React.ElementType
  label: string
  value: string
  status: 'good' | 'warn' | 'error' | 'neutral'
}) {
  const colors = {
    good: 'var(--success)',
    warn: 'var(--warning)',
    error: 'var(--danger)',
    neutral: 'var(--text-muted)',
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      background: 'var(--surface-2)',
      borderRadius: 'var(--r-md)',
    }}>
      <Icon size={15} color={colors[status]} />
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: colors[status] }}>{value}</span>
    </div>
  )
}

/* ─── Settings Panel ───────────────────────────────── */
export function SettingsPanel({ onClose }: { onClose?: () => void }) {
  const {
    activeLLM, setActiveLLM,
    minimaxModel, setMinimaxModel,
    apiKey, setApiKey,
    provider, setProvider,
    baseUrl, setBaseUrl,
    knowledgeStatus,
    isInitializingKnowledge,
    fetchKnowledgeStatus, initializeKnowledge,
  } = useSettingsStore()

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchKnowledgeStatus()
  }, [])

  const handleInitKnowledge = async () => {
    await initializeKnowledge()
    await fetchKnowledgeStatus()
  }

  const handleSaveApiKey = async () => {
    setSaving(true)
    setTestResult(null)
    try {
      // Save to backend
      await fetch('/api/llm/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          model: minimaxModel,
          api_key: apiKey,
          base_url: baseUrl,
        }),
      })
      setTestResult({ success: true, message: 'Settings saved!' })
    } catch (e) {
      setTestResult({ success: false, message: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/llm/test', { method: 'POST' })
      if (res.ok) {
        setTestResult({ success: true, message: 'Connection successful!' })
      } else {
        const data = await res.json()
        setTestResult({ success: false, message: data.detail || 'Connection failed' })
      }
    } catch (e) {
      setTestResult({ success: false, message: 'Failed to connect' })
    } finally {
      setTesting(false)
    }
  }

  const providers = [
    { id: 'minimax', label: 'MiniMax', description: 'Fast reasoning via MiniMax M2', icon: Zap },
    { id: 'openai', label: 'OpenAI', description: 'GPT-4o, GPT-4o-mini', icon: Brain },
    { id: 'openrouter', label: 'OpenRouter', description: 'Access to 100+ models', icon: Globe },
    { id: 'lmstudio', label: 'LM Studio', description: 'Local models on your GPU', icon: Database },
  ]

  const modelOptions: Record<string, string[]> = {
    minimax: ['MiniMax-Embedding', 'abab6.5s-chat', 'abab5.5-chat'],
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    openrouter: [],  // Dynamic
    lmstudio: [],    // Local
  }

  const chunkCount = knowledgeStatus?.chunk_count ?? 0
  const knowledgeReady = knowledgeStatus?.knowledge_initialized ?? false

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 150ms ease-out',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          maxHeight: '85vh',
          background: 'var(--surface)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleIn 200ms var(--t-spring)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: 2 }}>Settings</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Configure AI reasoning engine</p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <span style={{ fontSize: 18, color: 'var(--text-muted)' }}>×</span>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* ── LLM Provider ─────────────────────── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Settings size={16} color="var(--text-secondary)" />
              <h3>AI Provider</h3>
            </div>

            {/* Provider Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {providers.map(p => (
                <ProviderCard
                  key={p.id}
                  id={p.id}
                  label={p.label}
                  description={p.description}
                  icon={p.icon}
                  active={provider === p.id}
                  onSelect={() => setProvider(p.id)}
                />
              ))}
            </div>

            {/* Model Selector */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                Model
              </label>
              <ModelSelector
                models={modelOptions[provider] || []}
                value={minimaxModel}
                onChange={setMinimaxModel}
              />
            </div>

            {/* API Key */}
            <ApiKeyInput
              value={apiKey}
              onChange={setApiKey}
              onSave={handleSaveApiKey}
              testing={saving}
            />

            {/* Test & Result */}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                onClick={handleTestConnection}
                disabled={testing || !apiKey}
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {testing ? <Loader2 size={13} className="animate-spin" /> : 'Test Connection'}
              </button>
              <button
                onClick={handleSaveApiKey}
                disabled={saving || !apiKey}
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : 'Save'}
              </button>
            </div>

            {/* Test Result */}
            {testResult && (
              <div style={{
                marginTop: 10,
                padding: '10px 14px',
                background: testResult.success ? 'var(--success-bg)' : 'var(--danger-bg)',
                borderRadius: 'var(--r-md)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {testResult.success ? (
                  <CheckCircle2 size={14} color="var(--success)" />
                ) : (
                  <AlertCircle size={14} color="var(--danger)" />
                )}
                <span style={{ fontSize: 12, color: testResult.success ? 'var(--success)' : 'var(--danger)' }}>
                  {testResult.message}
                </span>
              </div>
            )}
          </section>

          {/* ── Knowledge Base ─────────────────── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <BookOpen size={16} color="var(--text-secondary)" />
              <h3>Knowledge Base</h3>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              <StatusRow
                icon={knowledgeReady ? CheckCircle2 : AlertCircle}
                label="Knowledge Base"
                value={knowledgeReady
                  ? `${chunkCount.toLocaleString()} chunks indexed`
                  : knowledgeStatus?.status === 'running' ? 'Initializing...' : 'Not initialized'}
                status={knowledgeReady ? 'good' : knowledgeStatus?.status === 'running' ? 'warn' : 'neutral'}
              />
              <StatusRow
                icon={Database}
                label="Embedding Model"
                value={knowledgeStatus?.embedding_model ?? 'all-MiniLM-L6-v2'}
                status="neutral"
              />
              <StatusRow
                icon={BookOpen}
                label="Sources"
                value={knowledgeReady
                  ? `${knowledgeStatus?.papers_fetched ?? 0} ArXiv papers + physics fundamentals`
                  : 'ArXiv physics/engineering + robotics'}
                status="neutral"
              />
            </div>

            {/* Initialize button */}
            {!knowledgeReady && (
              <button
                onClick={handleInitKnowledge}
                disabled={isInitializingKnowledge}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {isInitializingKnowledge ? (
                  <><Loader2 size={13} className="animate-spin" /> Initializing knowledge base...</>
                ) : (
                  <><Database size={13} /> Initialize Knowledge Base</>
                )}
              </button>
            )}

            {knowledgeReady && (
              <div style={{
                padding: '12px 14px',
                background: 'var(--success-bg)',
                border: '1px solid rgba(22,163,74,0.15)',
                borderRadius: 'var(--r-md)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <CheckCircle2 size={14} color="var(--success)" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>Knowledge ready</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  AETHER knows Newton's laws, belt tension, MPC, SAM 2, vibration theory, and {knowledgeStatus?.papers_fetched ?? 0} ArXiv papers. Ask physics questions in the chat!
                </p>
              </div>
            )}

            {knowledgeStatus?.status === 'running' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Loader2 size={13} className="animate-spin" color="var(--accent)" />
                  <span style={{ fontSize: 12, color: 'var(--accent)' }}>
                    Fetching {knowledgeStatus.papers_fetched} ArXiv papers...
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '60%' }} />
                </div>
              </div>
            )}

            {knowledgeStatus?.error && (
              <div style={{
                padding: '10px 14px',
                background: 'var(--danger-bg)',
                borderRadius: 'var(--r-md)',
              }}>
                <span style={{ fontSize: 12, color: 'var(--danger)' }}>
                  Error: {knowledgeStatus.error}
                </span>
              </div>
            )}
          </section>

          {/* ── About ─────────────────────────── */}
          <section>
            <div style={{
              padding: '12px 14px',
              background: 'var(--surface-2)',
              borderRadius: 'var(--r-md)',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>AETHER Studio</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>v0.1.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Backend</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>FastAPI + PyTorch + MuJoCo</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Perception</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>SAM 2 · CoTracker3 · MiDaS</span>
              </div>
            </div>
          </section>
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
        `}</style>
      </div>
    </div>
  )
}
