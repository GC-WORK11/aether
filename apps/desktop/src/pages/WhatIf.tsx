import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Zap, RotateCw, Play, Loader2, ArrowLeft, Sliders, Activity, Send, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { api } from '../lib/api'
import type { SimulationResult } from '../lib/api'
import { VideoPlayer } from '../components/VideoPlayer'

interface SimData {
  simulation_id: string
  time_array?: number[]
  position_array?: number[][]
  angle_array?: number[]
  joint1_angle_array?: number[]
  joint2_angle_array?: number[]
  end_effector_x?: number[]
  end_effector_y?: number[]
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  simulationUpdated?: boolean
  paramsChanged?: Record<string, number>
}

function SimulationVisualizer({ data, mechanismType }: { data: unknown; mechanismType: string }) {
  const simData = data as SimData
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)

  const isPendulum = mechanismType?.toLowerCase().includes('pendulum') || !!simData.angle_array
  const isRobotArm = mechanismType?.toLowerCase().includes('robot') || !!(simData.joint1_angle_array && simData.joint2_angle_array)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const cx = width / 2
    const cy = height / 2

    cancelAnimationFrame(animFrameRef.current)
    let progress = 0

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 7, 0.3)'
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
      ctx.lineWidth = 1
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, height)
        ctx.stroke()
      }
      for (let i = 0; i < height; i += 40) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(width, i)
        ctx.stroke()
      }

      if (isPendulum && simData.angle_array && simData.time_array) {
        drawPendulumTrace(ctx, cx, cy, width, height, simData, progress)
      } else if (isRobotArm && simData.joint1_angle_array && simData.joint2_angle_array) {
        drawRobotArmAnimation(ctx, cx, cy, simData, progress)
      } else if (simData.position_array) {
        draw3DTrajectory(ctx, cx, cy, width, height, simData, progress)
      } else if (simData.end_effector_x && simData.end_effector_x.length > 0) {
        drawEndEffectorTrajectory(ctx, cx, cy, width, height, simData, progress)
      } else {
        drawDefaultVisualization(ctx, cx, cy, width, height, progress)
      }

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.7)
      grad.addColorStop(0, 'transparent')
      grad.addColorStop(1, 'rgba(5, 5, 7, 0.8)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = 'rgba(6, 182, 212, 0.02)'
      ctx.fillRect(0, 0, width, height)

      progress += 0.002
      if (progress > 1) progress = 0

      animFrameRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [simData, isPendulum, isRobotArm, mechanismType])

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={600}
      className="w-full h-full"
    />
  )
}

function drawPendulumTrace(ctx: CanvasRenderingContext2D, cx: number, cy: number, width: number, height: number, data: SimData, progress: number) {
  const angles = data.angle_array || []
  const times = data.time_array || []
  if (angles.length === 0) return

  const maxAngle = Math.max(...angles.map(Math.abs))
  const scale = Math.min(width, height) * 0.3 / (maxAngle || 1)
  const bobRadius = 20

  const currentAngle = angles[Math.floor(angles.length * 0.95)] || angles[0]
  const bobX = cx + Math.sin(currentAngle) * scale * 3
  const bobY = cy + Math.cos(currentAngle) * scale * 3

  ctx.beginPath()
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)'
  ctx.lineWidth = 1
  for (let i = 0; i < angles.length; i++) {
    const a = angles[i]
    const px = cx + Math.sin(a) * scale * 3
    const py = cy + Math.cos(a) * scale * 3
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#f59e0b'
  ctx.fill()
  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(bobX, bobY)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.lineWidth = 2
  ctx.stroke()

  const bobGrad = ctx.createRadialGradient(bobX, bobY, 0, bobX, bobY, bobRadius * 2)
  bobGrad.addColorStop(0, 'rgba(6, 182, 212, 0.6)')
  bobGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = bobGrad
  ctx.beginPath()
  ctx.arc(bobX, bobY, bobRadius * 2, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2)
  ctx.fillStyle = '#06b6d4'
  ctx.fill()
  ctx.strokeStyle = '#22d3ee'
  ctx.lineWidth = 2
  ctx.stroke()

  const plotY = height - 80
  const plotX = 60
  const plotW = width - 120
  const plotH = 60

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  ctx.strokeRect(plotX, plotY, plotW, plotH)

  ctx.beginPath()
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)'
  ctx.lineWidth = 2
  for (let i = 0; i < angles.length; i++) {
    const px = plotX + (i / (angles.length - 1)) * plotW
    const py = plotY + plotH / 2 - (angles[i] / (maxAngle * 2)) * plotH
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()

  ctx.fillStyle = '#06b6d4'
  ctx.font = '10px monospace'
  ctx.fillText('θ(t) Angle Trace', plotX, plotY - 8)
}

function drawRobotArmAnimation(ctx: CanvasRenderingContext2D, cx: number, cy: number, data: SimData, progress: number) {
  const j1 = data.joint1_angle_array || []
  const j2 = data.joint2_angle_array || []
  if (j1.length === 0 || j2.length === 0) return

  const L1 = 120
  const L2 = 100
  const idx = Math.floor(j1.length * 0.95)
  const a1 = j1[idx]
  const a2 = j2[idx]

  const elbowX = cx + Math.cos(a1) * L1
  const elbowY = cy + Math.sin(a1) * L1
  const endX = elbowX + Math.cos(a1 + a2) * L2
  const endY = elbowY + Math.sin(a1 + a2) * L2

  ctx.beginPath()
  ctx.arc(cx, cy, 12, 0, Math.PI * 2)
  ctx.fillStyle = '#f59e0b'
  ctx.fill()
  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 2
  ctx.stroke()

  const g1 = ctx.createLinearGradient(cx, cy, elbowX, elbowY)
  g1.addColorStop(0, 'rgba(6, 182, 212, 0.3)')
  g1.addColorStop(1, 'rgba(6, 182, 212, 0.1)')
  ctx.strokeStyle = g1
  ctx.lineWidth = 16
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(elbowX, elbowY)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(elbowX, elbowY)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(elbowX, elbowY, 8, 0, Math.PI * 2)
  ctx.fillStyle = '#06b6d4'
  ctx.fill()

  const g2 = ctx.createLinearGradient(elbowX, elbowY, endX, endY)
  g2.addColorStop(0, 'rgba(245, 158, 11, 0.3)')
  g2.addColorStop(1, 'rgba(245, 158, 11, 0.1)')
  ctx.strokeStyle = g2
  ctx.lineWidth = 14
  ctx.beginPath()
  ctx.moveTo(elbowX, elbowY)
  ctx.lineTo(endX, endY)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(elbowX, elbowY)
  ctx.lineTo(endX, endY)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(endX, endY, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#f59e0b'
  ctx.fill()

  const eg = ctx.createRadialGradient(endX, endY, 0, endX, endY, 20)
  eg.addColorStop(0, 'rgba(34, 211, 238, 0.5)')
  eg.addColorStop(1, 'transparent')
  ctx.fillStyle = eg
  ctx.beginPath()
  ctx.arc(endX, endY, 20, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(endX, endY, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#22d3ee'
  ctx.fill()

  ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 0; i < j1.length; i++) {
    const e1 = j1[i]
    const e2 = j2[i]
    const ex = cx + Math.cos(e1) * L1 + Math.cos(e1 + e2) * L2
    const ey = cy + Math.sin(e1) * L1 + Math.sin(e1 + e2) * L2
    if (i === 0) ctx.moveTo(ex, ey)
    else ctx.lineTo(ex, ey)
  }
  ctx.stroke()

  ctx.fillStyle = '#f59e0b'
  ctx.font = '9px monospace'
  ctx.fillText('Joint 1', cx + 15, cy - 15)
  ctx.fillText('Joint 2', elbowX + 15, elbowY - 10)
  ctx.fillText('End Effector', endX + 10, endY)
}

function draw3DTrajectory(ctx: CanvasRenderingContext2D, cx: number, cy: number, width: number, height: number, data: SimData, progress: number) {
  const pos = data.position_array || []
  if (pos.length === 0) return

  const xs = pos.map(p => p[1] || p[0])
  const ys = pos.map(p => p[2] || 0)
  const zs = pos.map(p => p[3] || 0)

  const maxX = Math.max(...xs.map(Math.abs), 1)
  const maxY = Math.max(...ys.map(Math.abs), 1)
  const maxZ = Math.max(...zs.map(Math.abs), 1)

  const scaleX = (width * 0.35) / maxX
  const scaleY = (height * 0.35) / maxY
  const scaleZ = (width * 0.15) / maxZ

  const project = (x: number, y: number, z: number) => ({
    px: cx + (x - z) * scaleX,
    py: cy + (y + (x + z) * 0.3) * scaleY - z * scaleZ * 0.5
  })

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.lineWidth = 1
  const ground = 0
  for (let i = -3; i <= 3; i++) {
    const p1 = project(i, ground, -3)
    const p2 = project(i, ground, 3)
    ctx.beginPath()
    ctx.moveTo(p1.px, p1.py)
    ctx.lineTo(p2.px, p2.py)
    ctx.stroke()
    const p3 = project(-3, ground, i)
    const p4 = project(3, ground, i)
    ctx.beginPath()
    ctx.moveTo(p3.px, p3.py)
    ctx.lineTo(p4.px, p4.py)
    ctx.stroke()
  }

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (let i = 1; i < pos.length; i++) {
    const alpha = i / pos.length
    const p = pos[i]
    const pp = pos[i - 1]
    const pt = project(p[1] || p[0], p[2] || 0, p[3] || 0)
    const ppt = project(pp[1] || pp[0], pp[2] || 0, pp[3] || 0)

    const grad = ctx.createLinearGradient(ppt.px, ppt.py, pt.px, pt.py)
    grad.addColorStop(0, `rgba(6, 182, 212, ${alpha * 0.3})`)
    grad.addColorStop(1, `rgba(6, 182, 212, ${alpha * 0.8})`)

    ctx.beginPath()
    ctx.moveTo(ppt.px, ppt.py)
    ctx.lineTo(pt.px, pt.py)
    ctx.strokeStyle = grad
    ctx.lineWidth = 1 + alpha * 2
    ctx.stroke()
  }

  const start = project(xs[0], ys[0], zs[0])
  ctx.beginPath()
  ctx.arc(start.px, start.py, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#f59e0b'
  ctx.fill()

  const end = project(xs[xs.length - 1], ys[ys.length - 1], zs[zs.length - 1])
  const endGlow = ctx.createRadialGradient(end.px, end.py, 0, end.px, end.py, 20)
  endGlow.addColorStop(0, 'rgba(34, 211, 238, 0.6)')
  endGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = endGlow
  ctx.beginPath()
  ctx.arc(end.px, end.py, 20, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(end.px, end.py, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#22d3ee'
  ctx.fill()

  ctx.font = '9px monospace'
  ctx.fillStyle = '#f59e0b'
  ctx.fillText('X', cx + 150, cy + 20)
  ctx.fillStyle = '#06b6d4'
  ctx.fillText('Y', cx, cy - 140)
  ctx.fillStyle = '#94a3b8'
  ctx.fillText('Z', cx - 150, cy + 20)
}

function drawEndEffectorTrajectory(ctx: CanvasRenderingContext2D, cx: number, cy: number, width: number, height: number, data: SimData, progress: number) {
  const ex = data.end_effector_x || []
  const ey = data.end_effector_y || []
  if (ex.length === 0) return

  const maxX = Math.max(...ex.map(Math.abs), 1)
  const maxY = Math.max(...ey.map(Math.abs), 1)
  const scale = Math.min(width, height) * 0.35 / Math.max(maxX, maxY, 1)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.lineWidth = 1
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath()
    ctx.moveTo(cx + i * 60, cy - 200)
    ctx.lineTo(cx + i * 60, cy + 200)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx - 300, cy + i * 60)
    ctx.lineTo(cx + 300, cy + i * 60)
    ctx.stroke()
  }

  ctx.beginPath()
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)'
  ctx.lineWidth = 8
  for (let i = 0; i < ex.length; i++) {
    const px = cx + ex[i] * scale
    const py = cy - ey[i] * scale
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()

  for (let i = 0; i < ex.length; i += Math.max(1, Math.floor(ex.length / 50))) {
    const px = cx + ex[i] * scale
    const py = cy - ey[i] * scale
    ctx.beginPath()
    ctx.arc(px, py, 2, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(6, 182, 212, ${0.3 + (i / ex.length) * 0.7})`
    ctx.fill()
  }

  ctx.beginPath()
  ctx.arc(cx + ex[0] * scale, cy - ey[0] * scale, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#f59e0b'
  ctx.fill()

  const endGlow = ctx.createRadialGradient(cx + ex[ex.length - 1] * scale, cy - ey[ex.length - 1] * scale, 0, cx + ex[ex.length - 1] * scale, cy - ey[ex.length - 1] * scale, 15)
  endGlow.addColorStop(0, 'rgba(34, 211, 238, 0.6)')
  endGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = endGlow
  ctx.beginPath()
  ctx.arc(cx + ex[ex.length - 1] * scale, cy - ey[ex.length - 1] * scale, 15, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx + ex[ex.length - 1] * scale, cy - ey[ex.length - 1] * scale, 4, 0, Math.PI * 2)
  ctx.fillStyle = '#22d3ee'
  ctx.fill()
}

function drawDefaultVisualization(ctx: CanvasRenderingContext2D, cx: number, cy: number, width: number, height: number, progress: number) {
  const t = Date.now() / 1000
  for (let i = 0; i < 3; i++) {
    const r = 60 + i * 40 + Math.sin(t * 2 + i) * 10
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(6, 182, 212, ${0.2 - i * 0.05})`
    ctx.lineWidth = 2
    ctx.stroke()
  }

  const pulse = (Math.sin(t * 3) + 1) / 2
  const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30)
  centerGrad.addColorStop(0, `rgba(245, 158, 11, ${0.3 + pulse * 0.3})`)
  centerGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = centerGrad
  ctx.beginPath()
  ctx.arc(cx, cy, 30, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx, cy, 8, 0, Math.PI * 2)
  ctx.fillStyle = '#f59e0b'
  ctx.fill()
}

// Parse "what if" questions to extract parameter modifications
function parseWhatIfQuestion(question: string, availableParams: string[]): Record<string, number> | null {
  const changes: Record<string, number> = {}
  const q = question.toLowerCase()

  // Pattern: "2x", "twice", "double", "2 times"
  const doubleMatch = q.match(/(\w+)\s+(?:2x|twice|double|2\s*times)/i) ||
                     q.match(/(?:2x|twice|double|2\s*times)\s+(\w+)/i)
  if (doubleMatch) {
    const param = doubleMatch[1] || doubleMatch[2]
    const matched = availableParams.find(p => p.toLowerCase().includes(param))
    if (matched) {
      changes[matched] = 2.0
      return changes
    }
  }

  // Pattern: "half", "0.5x", "reduce by half"
  const halfMatch = q.match(/(\w+)\s+(?:half|0\.5x)/i) ||
                    q.match(/(?:half|0\.5x)\s+(\w+)/i) ||
                    q.match(/(?:reduce|decrease).*?half/i)
  if (halfMatch) {
    const param = halfMatch[1] || availableParams[0]
    const matched = availableParams.find(p => p.toLowerCase().includes(param))
    if (matched) {
      changes[matched] = 0.5
      return changes
    }
  }

  // Pattern: "3x", "triple", "3 times"
  const tripleMatch = q.match(/(?:3x|triple|3\s*times)\s+(\w+)/i) ||
                      q.match(/(\w+)\s+(?:3x|triple|3\s*times)/i)
  if (tripleMatch) {
    const param = tripleMatch[1] || tripleMatch[2]
    const matched = availableParams.find(p => p.toLowerCase().includes(param))
    if (matched) {
      changes[matched] = 3.0
      return changes
    }
  }

  // Pattern: specific number like "mass = 2.5" or "mass 2.5" or "set mass to 2.5"
  const setMatch = q.match(/(?:set\s+)?(\w+)\s*(?:to|=)\s*([\d.]+)/i)
  if (setMatch) {
    const param = setMatch[1]
    const value = parseFloat(setMatch[2])
    const matched = availableParams.find(p => p.toLowerCase().includes(param))
    if (matched && !isNaN(value)) {
      changes[matched] = value
      return changes
    }
  }

  // Pattern: "increase/decrease X by Y%"
  const percentMatch = q.match(/(increase|decrease|reduce|boost)\s+(\w+)\s+by\s+(\d+)%/i)
  if (percentMatch) {
    const action = percentMatch[1].toLowerCase()
    const param = percentMatch[2]
    const percent = parseInt(percentMatch[3]) / 100
    const matched = availableParams.find(p => p.toLowerCase().includes(param))
    if (matched) {
      changes[matched] = action.includes('decrease') || action.includes('reduce') ? 1 - percent : 1 + percent
      return changes
    }
  }

  return null
}

export function WhatIf() {
  const navigate = useNavigate()
  const {
    currentSession,
    pipelineResult,
    simulation,
    runSimulation,
    simulationLoading,
    error,
    clearError
  } = useAppStore()

  const discoveredParams = useMemo(() => {
    if (!pipelineResult?.stages?.jax_physics?.learned_params) return null
    return Object.values(pipelineResult.stages.jax_physics.learned_params)[0]
  }, [pipelineResult])

  const [params, setParams] = useState<Record<string, number>>({})
  const [horizon, setHorizon] = useState(5)

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, number> | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (discoveredParams) {
      const initial: Record<string, number> = {}
      Object.entries(discoveredParams).forEach(([key, val]) => {
        if (typeof val === 'number') initial[key] = val
      })
      setParams(initial)
    }
  }, [discoveredParams])

  const handleParamChange = (name: string, value: number) => {
    setParams(prev => ({ ...prev, [name]: value }))
    setPendingChanges(null)
  }

  const handleReset = () => {
    if (discoveredParams) {
      const initial: Record<string, number> = {}
      Object.entries(discoveredParams).forEach(([key, val]) => {
        if (typeof val === 'number') initial[key] = val
      })
      setParams(initial)
      setPendingChanges(null)
    }
  }

  const handleRun = async () => {
    if (!currentSession || !pipelineResult) return
    const paramsToUse = pendingChanges
      ? Object.fromEntries(Object.entries(pendingChanges).map(([k, v]) => [k, params[k] * v]))
      : params
    await runSimulation(pipelineResult.answer.mechanism_type, paramsToUse, horizon)
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: chatInput.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setChatInput('')
    setChatLoading(true)
    setPendingChanges(null)

    try {
      // Get AI response
      const response = await api.chat.send(chatInput, {
        provider: 'minimax',
        model: 'MiniMax-M2.7-highspeed',
        sessionId: currentSession?.id
      })

      // Parse question for parameter changes
      const paramKeys = Object.keys(params)
      const changes = parseWhatIfQuestion(chatInput, paramKeys)

      let assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
      }

      if (changes && Object.keys(changes).length > 0) {
        setPendingChanges(changes)
        const changeDesc = Object.entries(changes)
          .map(([k, v]) => `${k} × ${v}`)
          .join(', ')
        assistantMessage.paramsChanged = changes
        assistantMessage.content += `\n\n*Adjusting ${changeDesc} — click Run to simulate.*`
      }

      setMessages(prev => [...prev, assistantMessage])

      // Auto-run simulation if parameter changes detected
      if (changes && Object.keys(changes).length > 0) {
        setTimeout(() => {
          const paramsToUse = Object.fromEntries(
            Object.entries(changes).map(([k, v]) => [k, params[k] * v])
          )
          runSimulation(pipelineResult!.answer.mechanism_type, paramsToUse, horizon)
        }, 500)
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Failed to get response. Please try again.'
      }])
    } finally {
      setChatLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setPendingChanges(null)
  }

  if (!currentSession || !pipelineResult) {
    return (
      <div className="h-screen bg-[#050507] flex items-center justify-center p-6 text-slate-300">
        <div className="max-w-md text-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-8">
              <Activity className="w-12 h-12 text-cyan-500" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Zap className="w-3 h-3 text-amber-400" />
            </div>
          </div>
          <h2 className="text-xl font-black mb-3 uppercase tracking-[0.2em] text-white italic">What-If Lab</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            {!currentSession
              ? "Select a session from the home screen to explore physical parameters."
              : "Run the Physical Compiler on your video first to discover mechanism parameters, then return here to simulate counterfactuals."}
          </p>
          <button
            onClick={() => navigate('/session')}
            className="px-8 py-4 bg-white text-black font-black uppercase text-xs rounded-2xl hover:bg-cyan-400 transition-all shadow-xl flex items-center gap-2 mx-auto hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Studio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#050507] text-slate-300 font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="h-16 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5 px-8 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/session')}
            className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-3">
             <h1 className="text-xs font-black tracking-[0.2em] text-white uppercase italic">WHAT-IF LAB</h1>
             <span className="text-[9px] font-bold text-yellow-500/80 uppercase tracking-widest px-2 py-0.5 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                Simulation Mode
              </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <span className="text-[10px] font-mono text-slate-500 uppercase">Target: {pipelineResult.answer.mechanism_type}</span>
           <button onClick={handleReset} className="p-2 hover:bg-white/5 rounded-lg text-slate-500"><RotateCw className="w-4 h-4" /></button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Chat */}
        <div className="w-[360px] border-r border-white/5 bg-[#08080a] flex flex-col shrink-0">
          {/* Chat header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500" />
              <span className="text-[11px] font-black uppercase tracking-wider text-white">Chat</span>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-40 text-center px-4">
                <Sliders className="w-8 h-8 mb-3 text-slate-600" />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Ask questions about the physics, e.g. "What if the mass was 2x heavier?" or "How would it behave with half the gravity?"
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-cyan-500 text-black font-medium'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="p-4 border-t border-white/5">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about the physics..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[12px] text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                disabled={chatLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="p-3 bg-cyan-500 text-black rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Center Panel: VideoPlayer */}
        <div className="flex-1 bg-[#0a0a0f] flex flex-col shrink-0">
          {currentSession?.id ? (
            <VideoPlayer
              sessionId={currentSession.id}
              frameCount={currentSession.frame_count || 30}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-40">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-4">
                <Play className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-600">Load a session to view video</p>
            </div>
          )}
        </div>

        {/* Right Panel: Parameters + Visualization */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Parameters */}
          <div className="w-full p-6 border-b border-white/5 bg-[#08080a]/50 overflow-auto" style={{ maxHeight: '320px' }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                 <Sliders className="w-3.5 h-3.5 text-cyan-500" /> Parameters
              </h2>
              {pendingChanges && (
                <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                  Pending changes from chat
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              {Object.entries(params).map(([name, value]) => {
                const multiplier = pendingChanges?.[name]
                const displayValue = multiplier ? (value * multiplier).toFixed(4) : value.toFixed(4)
                const hasPending = !!multiplier

                return (
                  <div key={name} className="flex-1 min-w-[180px] bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-white uppercase tracking-wider">{name.replace(/_/g, ' ')}</span>
                      <span className={`text-xs font-mono font-bold ${hasPending ? 'text-amber-400' : 'text-cyan-400'}`}>
                        {displayValue}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={value * 0.1}
                      max={value * 5.0}
                      step={value * 0.01}
                      value={value}
                      onChange={e => handleParamChange(name, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />

                    {hasPending && (
                      <div className="mt-1 flex justify-between text-[8px]">
                        <span className="text-slate-500">Baseline: {value.toFixed(2)}</span>
                        <span className="text-amber-400">× {multiplier}</span>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Time Control */}
              <div className="flex-1 min-w-[180px] bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Horizon</span>
                  <span className="text-xs font-mono text-white font-bold">{horizon}s</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={horizon}
                  onChange={e => setHorizon(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>

            <button
              onClick={handleRun}
              disabled={simulationLoading}
              className="mt-4 w-full py-3 bg-cyan-500 text-black font-black uppercase text-[11px] tracking-[0.2em] rounded-xl hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {simulationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              {simulationLoading ? 'Running Simulation...' : 'Run Simulation'}
            </button>
          </div>

          {/* Visualization */}
          <div className="flex-1 p-6 overflow-auto bg-[#050507]">
            {simulationLoading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20" />
                  <div className="absolute inset-0 w-16 h-16 rounded-full border-t-4 border-cyan-500 animate-spin" />
                </div>
                <p className="text-sm font-black text-white uppercase tracking-[0.2em] mb-1">Simulating</p>
                <p className="text-[10px] text-slate-500 font-mono">Computing physics response</p>
              </div>
            ) : simulation ? (
              <div className="h-full flex flex-col">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Duration</p>
                    <p className="text-lg font-mono font-black text-white">{(simulation.duration || 0).toFixed(2)}s</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Confidence</p>
                    <p className="text-lg font-mono font-black text-emerald-400">{((simulation.confidence || 0.99) * 100).toFixed(0)}%</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Timesteps</p>
                    <p className="text-lg font-mono font-black text-white">{simulation.timesteps || '—'}</p>
                  </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 bg-[#0a0a0f] rounded-2xl border border-white/10 overflow-hidden relative">
                  <SimulationVisualizer data={simulation as unknown as SimData} mechanismType={pipelineResult.answer.mechanism_type} />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <div className="px-2 py-1 bg-black/80 rounded border border-white/10 text-[8px] font-mono text-cyan-400">SIMULATION</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-4">
                   <Play className="w-10 h-10" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.3em]">Ready</p>
                <p className="text-[10px] text-slate-600 mt-1">Run a simulation to see results</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}