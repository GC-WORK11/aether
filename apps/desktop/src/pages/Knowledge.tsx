import { useState, useEffect, useCallback } from 'react'
import { Book, Search, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import type { KnowledgeChunk } from '../lib/api'

const CODATA_CONSTANTS = [
  { symbol: 'c', name: 'Speed of light', value: '299,792,458', unit: 'm/s' },
  { symbol: 'h', name: 'Planck constant', value: '6.62607015×10⁻³⁴', unit: 'J·s' },
  { symbol: 'e', name: 'Elementary charge', value: '1.602176634×10⁻¹⁹', unit: 'C' },
  { symbol: 'k', name: 'Boltzmann constant', value: '1.380649×10⁻²³', unit: 'J/K' },
  { symbol: 'G', name: 'Gravitational constant', value: '6.67430×10⁻¹¹', unit: 'm³kg⁻¹s⁻²' },
  { symbol: 'g', name: 'Standard gravity', value: '9.80665', unit: 'm/s²' },
]

export function Knowledge() {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<KnowledgeChunk[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chunkCount, setChunkCount] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'search' | 'constants'>('search')

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const s = await api.knowledge.status()
      setChunkCount(s.chunk_count)
    } catch (e) {
      console.error('Failed to load status:', e)
    }
  }

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await api.knowledge.query(searchQuery, 10)
      setResults(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  const loadRandom = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.knowledge.query('physics mechanics dynamics', 10)
      setResults(Array.isArray(data) ? data : [])
    } catch (e) {
      setError('Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#050507] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Book className="w-8 h-8 text-blue-400" />
            Knowledge Base
          </h1>
          <p className="text-slate-400">
            Physics formulas, constants, and world knowledge
            {chunkCount !== null && (
              <span className="ml-2 text-cyan-500">({chunkCount} chunks)</span>
            )}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'search' ? 'bg-cyan-500 text-black' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setActiveTab('constants')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'constants' ? 'bg-cyan-500 text-black' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            Constants
          </button>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Search physics formulas..."
                  className="w-full pl-12 pr-4 py-4 bg-surface border border-white/5 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <button onClick={handleSearch} disabled={loading} className="btn-primary px-6">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
              </button>
              <button onClick={loadRandom} className="btn-secondary px-4">
                Random
              </button>
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                {error}
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">{results.length} results</p>
                {results.map((chunk, i) => (
                  <div key={i} className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2">{chunk.title}</h3>
                    <p className="text-slate-300 mb-3 whitespace-pre-wrap">{chunk.text}</p>
                    <p className="text-xs text-slate-500">Source: {chunk.source}</p>
                  </div>
                ))}
              </div>
            )}

            {results.length === 0 && !loading && (
              <div className="glass-card py-16 text-center text-slate-500">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Search for physics formulas</p>
                <p className="text-sm mt-2">Try: "gear ratio", "pendulum", "spring force"</p>
              </div>
            )}
          </div>
        )}

        {/* Constants Tab */}
        {activeTab === 'constants' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CODATA_CONSTANTS.map(constant => (
              <div key={constant.symbol} className="glass-card p-4">
                <div className="text-2xl font-mono text-cyan-400 mb-1">{constant.symbol}</div>
                <p className="text-lg font-mono text-white mb-1">{constant.value}</p>
                <p className="text-sm text-slate-500 mb-2">{constant.name}</p>
                {constant.unit && (
                  <p className="text-xs text-cyan-600">Unit: {constant.unit}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
