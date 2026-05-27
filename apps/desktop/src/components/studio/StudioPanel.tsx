import { useAppStore } from '../../store/useAppStore'
import { Play, Brain, Box, Zap, Video, Image, ArrowRight } from 'lucide-react'

export function StudioPanel() {
  const { 
    currentSession, 
    pipelineRunning, 
    pipelineProgress,
    pipelineResult,
    runPipeline,
    sceneGraph,
    reconstruction,
    error,
    setError,
  } = useAppStore()
  
  if (!currentSession) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No session selected</p>
          <a href="/" className="text-cyan-400 hover:text-cyan-300 mt-2 inline-block">
            Go to Home →
          </a>
        </div>
      </div>
    )
  }
  
  const handleRunPipeline = async () => {
    await runPipeline('Analyze the physics of this mechanism')
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Session Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{currentSession.name}</h2>
          <p className="text-sm text-gray-400">{currentSession.frame_count || 0} frames</p>
        </div>
        <a 
          href="/session"
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
        >
          Open Full View →
        </a>
      </div>
      
      {/* Error */}
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg">
          <p className="text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="mt-2 text-sm text-red-300">
            Dismiss
          </button>
        </div>
      )}
      
      {/* Run Pipeline */}
      <div className="p-6 bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-xl border border-cyan-800/50">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-cyan-600 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">AETHER Complete Analysis</h3>
            <p className="text-sm text-gray-400">SAM2 → Scene Graph → 3D → Simulation → Knowledge</p>
          </div>
        </div>
        
        <button
          onClick={handleRunPipeline}
          disabled={pipelineRunning}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 rounded-lg font-medium transition-colors"
        >
          {pipelineRunning ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              {pipelineProgress || 'Running...'}
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Run Full Analysis
            </>
          )}
        </button>
      </div>
      
      {/* Results */}
      {pipelineResult && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Mechanism */}
          <div className="p-4 bg-purple-900/30 rounded-xl border border-purple-800">
            <p className="text-sm text-gray-400 mb-1">Mechanism</p>
            <p className="text-xl font-bold text-purple-400 capitalize">
              {pipelineResult.answer?.mechanism_type || 'Unknown'}
            </p>
          </div>
          
          {/* Time */}
          <div className="p-4 bg-cyan-900/30 rounded-xl border border-cyan-800">
            <p className="text-sm text-gray-400 mb-1">Total Time</p>
            <p className="text-xl font-bold text-cyan-400">
              {pipelineResult.total_time_seconds?.toFixed(1)}s
            </p>
          </div>
          
          {/* Objects */}
          <div className="p-4 bg-green-900/30 rounded-xl border border-green-800">
            <p className="text-sm text-gray-400 mb-1">Objects</p>
            <p className="text-xl font-bold text-green-400">
              {sceneGraph?.n_objects || 0}
            </p>
          </div>
          
          {/* Depth */}
          <div className="p-4 bg-orange-900/30 rounded-xl border border-orange-800">
            <p className="text-sm text-gray-400 mb-1">3D Objects</p>
            <p className="text-xl font-bold text-orange-400">
              {reconstruction?.n_point_clouds || 0}
            </p>
          </div>
        </div>
      )}
      
      {/* Quick Actions */}
      {pipelineResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Scene Graph */}
          <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <Box className="w-5 h-5 text-green-400" />
              <h4 className="font-medium text-white">Scene Graph</h4>
            </div>
            {sceneGraph ? (
              <div className="space-y-2 text-sm">
                <p className="text-gray-400">Type: <span className="text-white capitalize">{sceneGraph.mechanism_type}</span></p>
                <p className="text-gray-400">Objects: <span className="text-white">{sceneGraph.n_objects}</span></p>
                <p className="text-gray-400">Edges: <span className="text-white">{sceneGraph.n_edges}</span></p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data</p>
            )}
          </div>
          
          {/* 3D */}
          <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <Image className="w-5 h-5 text-orange-400" />
              <h4 className="font-medium text-white">3D Reconstruction</h4>
            </div>
            {reconstruction ? (
              <div className="space-y-2 text-sm">
                <p className="text-gray-400">Objects: <span className="text-white">{reconstruction.n_objects}</span></p>
                <p className="text-gray-400">Point Clouds: <span className="text-white">{reconstruction.n_point_clouds}</span></p>
                <p className="text-gray-400">Time: <span className="text-white">{reconstruction.time_seconds?.toFixed(1)}s</span></p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data</p>
            )}
          </div>
          
          {/* Simulation */}
          <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-purple-400" />
              <h4 className="font-medium text-white">MuJoCo</h4>
            </div>
            <p className="text-sm text-gray-400">Ready to simulate</p>
            <a href="/session" className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 mt-2 text-sm">
              Open Simulator <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
      
      {/* Pipeline Answer */}
      {pipelineResult?.answer && (
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <h4 className="font-medium text-white mb-2">Analysis Answer</h4>
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
            {pipelineResult.answer.text}
          </pre>
        </div>
      )}
    </div>
  )
}
