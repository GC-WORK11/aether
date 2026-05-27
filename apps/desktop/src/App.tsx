import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import { AppShell } from './components/layout/AppShell'
import { Home } from './routes/Home'
import { Session } from './routes/Session'
import { Settings } from './routes/Settings'
import { WhatIf } from './pages/WhatIf'
import { Knowledge } from './pages/Knowledge'
import { LivePanel } from './components/live/LivePanel'

function AppContent() {
  const { activeTab, loadSessions } = useAppStore()
  
  useEffect(() => {
    loadSessions()
  }, [])
  
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/session" element={<Session />} />
        <Route path="/whatif" element={<WhatIf />} />
        <Route path="/knowledge" element={<Knowledge />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default function App() {
  return <AppContent />
}
