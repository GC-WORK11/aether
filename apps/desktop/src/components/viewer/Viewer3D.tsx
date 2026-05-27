import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Loader2, RotateCw } from 'lucide-react'
import { api } from '../../lib/api'

interface PointCloud {
  id: number
  n_points: number
  center_3d: [number, number, number]
  bbox: [number, number, number, number]
}

interface Reconstruction {
  n_objects: number
  n_point_clouds: number
  depth_stats?: { min: number; max: number; mean: number }
  point_clouds?: PointCloud[]
}

interface Viewer3DProps {
  sessionId?: string
}

export function Viewer3D({ sessionId }: Viewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  
  const [reconstruction, setReconstruction] = useState<Reconstruction | null>(null)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'points' | 'mesh'>('points')

  useEffect(() => {
    if (!containerRef.current) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x050507)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.01,
      100
    )
    camera.position.set(0, 0, 2)
    cameraRef.current = camera

    // Renderer
    let renderer: THREE.WebGLRenderer | null = null
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      containerRef.current.appendChild(renderer.domElement)
      rendererRef.current = renderer
    } catch (e) {
      console.error('WebGL not supported:', e)
      // Fallback: show placeholder
      if (containerRef.current) {
        containerRef.current.innerHTML = '<div style="color:#06b6d4;display:flex;align-items:center;justify-content:center;height:100%;font-family:monospace;font-size:12px;">3D Viewer requires WebGL</div>'
      }
      return
    }

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 0.1
    controls.maxDistance = 10
    controlsRef.current = controls

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    
    const pointLight = new THREE.PointLight(0x06b6d4, 2, 10)
    pointLight.position.set(2, 2, 2)
    scene.add(pointLight)
    
    scene.add(new THREE.DirectionalLight(0xffffff, 0.8))

    // Grid
    const grid = new THREE.GridHelper(10, 40, 0x334155, 0x111827)
    grid.position.y = -0.5
    scene.add(grid)

    // Axes
    scene.add(new THREE.AxesHelper(1))

    // Animate
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)

      // Dispose all geometries and materials in the scene
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry?.dispose()
            if (Array.isArray(object.material)) {
              object.material.forEach((m) => m.dispose())
            } else {
              object.material?.dispose()
            }
          }
        })
        // Clear the scene
        while (sceneRef.current.children.length > 0) {
          sceneRef.current.remove(sceneRef.current.children[0])
        }
      }

      renderer.dispose()
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  const loadReconstruction = useCallback(async () => {
    if (!sessionId) return
    
    setLoading(true)
    try {
      const data = await api.reconstruction.dense(sessionId)
      setReconstruction(data)
    } catch (e) {
      console.error('Failed to load reconstruction:', e)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    loadReconstruction()
  }, [loadReconstruction])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#050507]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Loading 3D...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#050507]">
      {/* Toolbar */}
      <div className="flex items-center gap-4 p-3 border-b border-white/5">
        <button
          onClick={loadReconstruction}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RotateCw className="w-4 h-4" />
          Refresh
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('points')}
            className={`px-3 py-1 rounded text-xs ${viewMode === 'points' ? 'bg-cyan-500 text-black' : 'bg-white/5'}`}
          >
            Points
          </button>
          <button
            onClick={() => setViewMode('mesh')}
            className={`px-3 py-1 rounded text-xs ${viewMode === 'mesh' ? 'bg-cyan-500 text-black' : 'bg-white/5'}`}
          >
            Wireframe
          </button>
        </div>

        {reconstruction && (
          <div className="flex gap-4 text-xs text-slate-500 ml-auto">
            <span>Objects: {reconstruction.n_objects}</span>
            <span>Clouds: {reconstruction.n_point_clouds}</span>
            {reconstruction.depth_stats && (
              <span>Depth: {reconstruction.depth_stats.min.toFixed(0)}-{reconstruction.depth_stats.max.toFixed(0)}</span>
            )}
          </div>
        )}
      </div>

      {/* 3D Viewport */}
      <div ref={containerRef} className="flex-1 relative">
        {!reconstruction && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <p className="text-sm">Load a session to view 3D reconstruction</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
