import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { BarChart3, Briefcase, Zap, MessageSquare, Home, Sun, Moon, Settings as SettingsIcon, PlayCircle, StopCircle, Sparkles } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import Agents from './pages/Agents'
import Index from './pages/Index'
import Settings from './pages/Settings'
import Applications from './pages/Applications'
import ChefChat from './pages/ChefChat'
import { useJobStore } from './store/useJobStore'
import { JobDetailModal } from './components/JobDetailModal'
import { Toasts } from './components/Toasts'
import { SchedulerBadge } from './components/SchedulerBadge'
import './index.css'

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-white/10 text-white'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {children}
    </Link>
  )
}

function Layout() {
  const { fetchStats, fetchAgents, fetchJobs, runAllAgents, stopAllAgents, loadSettings, agents } = useJobStore()
  const [isLightMode, setIsLightMode] = useState(false)

  useEffect(() => {
    loadSettings()
    fetchStats()
    fetchAgents()
    fetchJobs(1)
    const interval = setInterval(() => {
      fetchStats()
      fetchAgents()
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isLightMode) document.documentElement.classList.add('light-theme')
    else document.documentElement.classList.remove('light-theme')
  }, [isLightMode])

  const anyRunning = agents.some(a => a.status === 'running')

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Premium Background */}
      <div className="bg-mesh">
        <div className="bg-grid"></div>
        <div className="blob-container">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
          <div className="blob blob-4"></div>
        </div>
        <div className="vignette"></div>
        <div className="noise"></div>
      </div>

      {/* Navbar */}
      <nav style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        className="sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #e85d3d, #c94d2f)' }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">JobAgents</span>
            <span className="text-xs px-2 py-0.5 rounded-full text-gray-400"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              KI-AGENTEN
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <NavLink to="/"><Home className="w-4 h-4" /> Hub</NavLink>
            <NavLink to="/workspace"><MessageSquare className="w-4 h-4" /> Workspace</NavLink>
            <NavLink to="/dashboard"><BarChart3 className="w-4 h-4" /> Analysen</NavLink>
            <NavLink to="/jobs"><Briefcase className="w-4 h-4" /> Pipeline</NavLink>
            <NavLink to="/chef"><MessageSquare className="w-4 h-4" /> Chef</NavLink>
            <NavLink to="/bewerbungen"><Sparkles className="w-4 h-4" /> KI-Bewerbung</NavLink>
            <NavLink to="/settings"><SettingsIcon className="w-4 h-4" /> Setup</NavLink>
          </div>

          <div className="flex items-center gap-2">
            {/* Run All / Stop All */}
            <button
              onClick={() => anyRunning ? stopAllAgents() : runAllAgents()}
              className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:-translate-y-0.5"
              style={{
                background: anyRunning
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #e85d3d, #f97316)',
                color: 'white',
                boxShadow: anyRunning
                  ? '0 4px 15px rgba(239,68,68,0.4)'
                  : '0 4px 15px rgba(232,93,61,0.3)',
              }}
            >
              {anyRunning ? (
                <>
                  <div className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin"></div>
                  <StopCircle size={14} /> Alle stoppen
                </>
              ) : (
                <>
                  <PlayCircle size={14} /> Alle starten
                </>
              )}
            </button>

            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10"
              title={isLightMode ? "Dark Mode" : "Light Mode"}
            >
              {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <SchedulerBadge />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/workspace" element={<Agents />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/chef" element={<ChefChat />} />
          <Route path="/bewerbungen" element={<Applications />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      {/* Global UI overlays */}
      <JobDetailModal />
      <Toasts />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}

export default App
