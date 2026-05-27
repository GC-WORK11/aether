import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward, Loader2, Eye, Film } from 'lucide-react'
import { api } from '../lib/api'

interface VideoPlayerProps {
  sessionId: string
  frameCount?: number
  onFrameSelect?: (frameIndex: number) => void
}

export function VideoPlayer({ sessionId, frameCount = 30, onFrameSelect }: VideoPlayerProps) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [frames, setFrames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoPlaying, setAutoPlaying] = useState(false)
  const [showAnalyzed, setShowAnalyzed] = useState(false)
  const [totalFrames, setTotalFrames] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const loadFrames = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let useAnalyzed = false
      let frameCountToUse = frameCount

      try {
        const analyzedStatus = await api.orchestrate.analyzed(sessionId)
        if (analyzedStatus.analyzed_frames_exists && analyzedStatus.analyzed_frames_count > 0) {
          useAnalyzed = true
          frameCountToUse = analyzedStatus.analyzed_frames_count
        }
      } catch (e) {
        console.warn('Could not check analyzed status:', e)
      }

      setShowAnalyzed(useAnalyzed)
      setTotalFrames(frameCountToUse)

      const frameUrls: string[] = []
      for (let i = 0; i < frameCountToUse; i++) {
        // Try 5-digit padding first (new), fall back to 4-digit (old sessions)
        const padded5 = String(i).padStart(5, '0')
        const padded4 = String(i).padStart(4, '0')
        if (useAnalyzed) {
          frameUrls.push(`/static/${encodeURIComponent(sessionId)}/analyzed_frames/frame_${padded5}.png`)
        } else {
          frameUrls.push(`/static/${encodeURIComponent(sessionId)}/frames/frame_${padded5}.png`)
        }
      }
      setFrames(frameUrls)
    } catch (e) {
      setError('Failed to load frames')
    } finally {
      setLoading(false)
    }
  }, [sessionId, frameCount])

  useEffect(() => {
    if (sessionId) {
      loadFrames()
    }
  }, [sessionId, loadFrames])

  // Auto-play
  useEffect(() => {
    if (autoPlaying && frames.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % frames.length)
      }, 200)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoPlaying, frames.length])

  const handlePlayPause = useCallback(() => {
    setAutoPlaying(!autoPlaying)
    setIsPlaying(!isPlaying)
  }, [autoPlaying, isPlaying])

  const handlePrev = useCallback(() => {
    setCurrentFrame(prev => Math.max(0, prev - 1))
  }, [])

  const handleNext = useCallback(() => {
    setCurrentFrame(prev => Math.min(frames.length - 1, prev + 1))
  }, [frames.length])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentFrame(Number(e.target.value))
  }, [])

  const handleFrameClick = useCallback((index: number) => {
    setCurrentFrame(index)
    onFrameSelect?.(index)
  }, [onFrameSelect])

  if (loading) {
    return (
      <div className="glass-card p-8 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  if (error || frames.length === 0) {
    return (
      <div className="glass-card p-8 text-center h-64 flex items-center justify-center">
        <p className="text-slate-400">{error || 'No frames available'}</p>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Video Area */}
      <div className="relative aspect-video bg-black flex items-center justify-center">
        <img
          src={frames[currentFrame]}
          alt={`Frame ${currentFrame}`}
          className="max-w-full max-h-full object-contain"
        />

        {/* Frame Counter */}
        <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded-lg text-white text-sm font-mono">
          {currentFrame + 1} / {frames.length}
        </div>

        {/* Mode Badge */}
        <div className="absolute top-4 left-4 bg-cyan-500/80 px-2 py-1 rounded text-black text-xs font-bold flex items-center gap-1">
          {showAnalyzed ? (
            <>
              <Eye className="w-3 h-3" /> SAM2 Analysis
            </>
          ) : (
            <>
              <Film className="w-3 h-3" /> Raw Video
            </>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={currentFrame}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500 mb-3"
          />

          <div className="flex items-center justify-center gap-4">
            <button onClick={handlePrev} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <SkipBack className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={handlePlayPause}
              className="p-3 bg-cyan-500 hover:bg-cyan-400 rounded-full transition-colors"
            >
              {autoPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white" />
              )}
            </button>

            <button onClick={handleNext} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <SkipForward className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="p-4 border-t border-white/5">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {frames.map((frame, index) => (
            <button
              key={index}
              onClick={() => handleFrameClick(index)}
              className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-colors ${
                index === currentFrame
                  ? 'border-cyan-500'
                  : 'border-transparent hover:border-gray-600'
              }`}
            >
              <img src={frame} alt={`${index}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
