import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Zap, Book, Settings } from 'lucide-react'

interface NavItem {
  path: string
  label: string
  icon: any
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/whatif', label: 'What-If', icon: Zap },
  { path: '/knowledge', label: 'Knowledge', icon: Book },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#050507] flex">
      {/* Sidebar */}
      <nav className="w-64 glass border-r border-white/5 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tight">
            AETHER <span className="text-cyan-500 font-mono text-sm">v0.1.0</span>
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
            Neural Dynamics Studio
          </p>
        </div>

        <div className="flex-1 space-y-2">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="pt-6 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Engine Ready
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
