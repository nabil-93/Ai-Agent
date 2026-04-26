import React, { useEffect, useState } from 'react'
import { useJobStore } from '../store/useJobStore'
import { useNavigate } from 'react-router-dom'
import { Zap, Briefcase, Power, Square, Edit2, Check, X } from 'lucide-react'

const AGENT_CONFIG: Record<string, { avatar: string; role: string; desc: string; color: string }> = {
  linkedin: {
    avatar: '/avatars/ChatGPT Image 24 avr. 2026, 15_49_15.png',
    role: 'LinkedIn Hunter',
    desc: 'Findet LinkedIn-Angebote für IT, Data, SAP in Deutschland.',
    color: '#0077B5',
  },
  xing: {
    avatar: '/avatars/ChatGPT Image 24 avr. 2026, 15_51_06.png',
    role: 'XING Hunter',
    desc: 'Sucht nach Möglichkeiten auf XING — dem deutschen Business-Netzwerk.',
    color: '#026466',
  },
  indeed: {
    avatar: '/avatars/ChatGPT Image 24 avr. 2026, 15_56_49.png',
    role: 'Indeed Hunter',
    desc: 'Durchsucht Indeed.de nach den besten Marktangeboten.',
    color: '#2557A7',
  },
  agentur: {
    avatar: '/avatars/ChatGPT Image 24 avr. 2026, 16_16_11.png',
    role: 'Bundesagentur Hunter',
    desc: 'Nutzt die offizielle API der Bundesagentur für Arbeit.',
    color: '#1a6b3a',
  },
  chef: {
    avatar: '/avatars/ChatGPT Image 24 avr. 2026, 16_17_59.png',
    role: 'Chef-Orchestrator',
    desc: 'Aggregiert, dedupliziert und bewertet alle gefundenen Angebote.',
    color: '#e85d3d',
  },
}

function getAgentConfig(source: string) {
  const key = source?.toLowerCase()
  return AGENT_CONFIG[key] || {
    avatar: '/avatars/ChatGPT Image 24 avr. 2026, 16_17_59.png',
    role: 'KI Agent',
    desc: 'Automatisierter Suchagent.',
    color: '#6366f1',
  }
}

function StatusBadge({ status, enabled }: { status: string; enabled: boolean }) {
  if (!enabled) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 text-gray-500 border border-white/10">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
        Deaktiviert
      </span>
    )
  }
  const map: Record<string, { label: string; color: string; dot: string }> = {
    running: { label: 'Läuft', color: 'rgba(234,179,8,0.15)', dot: '#eab308' },
    active:  { label: 'Bereit', color: 'rgba(34,197,94,0.15)', dot: '#22c55e' },
    idle:    { label: 'Bereit', color: 'rgba(34,197,94,0.15)', dot: '#22c55e' },
    error:   { label: 'Fehler', color: 'rgba(239,68,68,0.15)',  dot: '#ef4444' },
  }
  const s = map[status] || map.active
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ background: s.color, color: s.dot, border: `1px solid ${s.dot}33` }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.dot }}></span>
      {s.label}
    </span>
  )
}

const Index: React.FC = () => {
  const navigate = useNavigate()
  const { agents, agentsLoading, stats, fetchAgents, fetchStats, triggerAgent, toggleAgent, stopAgent, updateAgentTask } = useJobStore()
  const [runningId, setRunningId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTaskValue, setEditTaskValue] = useState<string>('')

  useEffect(() => {
    fetchAgents()
    fetchStats()
    const interval = setInterval(fetchAgents, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleRun = async (id: number) => {
    setRunningId(id)
    try {
      await triggerAgent(id)
    } finally {
      setRunningId(null)
    }
  }

  const handleStop = (id: number) => {
    setRunningId(null)
    stopAgent(id)
  }

  const handleSaveTask = async (id: number) => {
    await updateAgentTask(id, editTaskValue)
    setEditingId(null)
  }

  const chefAgent = agents?.find(a => a.source?.toLowerCase() === 'chef')
  // Hide cv_generator here — it has its own dedicated page (/bewerbungen)
  const regularAgents = agents?.filter(a => {
    const src = a.source?.toLowerCase()
    return src !== 'chef' && src !== 'cv_generator'
  }) || []

  const renderAgentCard = (agent: any, isChef = false) => {
    const cfg = getAgentConfig(agent?.source)
    const isRunning = agent?.status === 'running' || runningId === agent?.id
    const isEnabled = agent?.enabled === 1
    const isEditing = editingId === agent?.id

    return (
      <div key={agent.id}
        onClick={() => !isEditing && navigate(`/workspace?agentId=${agent.id}`)}
        className={`glass-card group relative rounded-3xl p-6 flex flex-col transition-all duration-500 overflow-hidden cursor-pointer hover:ring-2 hover:ring-orange-500/30 hover:scale-[1.02] active:scale-[0.98] ${!isEnabled ? 'border-gray-800' : ''}`}
      >
        {!isEnabled && (
          <div className="absolute inset-0 bg-[#05070a]/90 backdrop-blur-md z-20 flex flex-col items-center justify-center border border-white/5 rounded-3xl transition-all duration-500">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
              <Power className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Agent Aus</h3>
            <p className="text-gray-500 text-xs mb-6 text-center px-6">Der Agent ist offline.</p>
            <button
              onClick={(e) => { e.stopPropagation(); toggleAgent(agent.id, true); }}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold border border-white/10 transition-all flex items-center gap-2 hover:border-green-500/30 hover:text-green-400 group/btn"
            >
              <Power size={16} className="text-gray-400 group-hover/btn:text-green-500 transition-colors" />
              Agent einschalten
            </button>
          </div>
        )}

        <div className="absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"
          style={{ background: cfg.color }}></div>
        
        <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[10px] font-bold text-gray-400 px-2 py-1 rounded-lg bg-white/5 border border-white/10 uppercase tracking-tighter">
          <Briefcase size={10} className="text-gray-500" />
          {agent.jobs_found_total} Jobs
        </div>

        <div className="relative mx-auto mb-6">
          <div className="w-28 h-28 rounded-[2rem] overflow-hidden relative z-10 transition-transform duration-500 group-hover:scale-105"
            style={{ border: `1px solid ${cfg.color}33`, boxShadow: `0 20px 40px ${cfg.color}15` }}>
            <img src={cfg.avatar} alt={agent.name}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
          {isRunning && (
            <div className="absolute inset-[-4px] rounded-[2.2rem] border-2 border-orange-500/50 animate-ping opacity-75"></div>
          )}
        </div>

        <div className="text-center mb-1">
          <div className="flex justify-center mb-4 gap-2">
            <StatusBadge status={agent.status} enabled={isEnabled} />
            <button
              onClick={(e) => { e.stopPropagation(); toggleAgent(agent.id, false); }}
              className="p-1.5 rounded-full border transition-all text-red-500 border-red-500/20 hover:bg-red-500/10"
              title="Agent ausschalten"
            >
              <Power size={12} />
            </button>
          </div>
          <h3 className="text-white font-extrabold text-xl mb-1 tracking-tight">{agent.name}</h3>
          <p className="text-orange-500/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">{cfg.role}</p>
        </div>
        
        <div className="flex-1 relative group/desc mt-2 mb-6">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editTaskValue}
                onChange={(e) => setEditTaskValue(e.target.value)}
                className="w-full bg-[#05070a] text-gray-300 text-xs rounded-xl border border-orange-500/30 p-3 focus:outline-none focus:border-orange-500 resize-none min-h-[80px]"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingId(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400"
                >
                  <X size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleSaveTask(agent.id); }}
                  className="p-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-500 border border-orange-500/30"
                >
                  <Check size={14} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-400 text-xs text-center leading-relaxed px-2 opacity-80 group-hover:opacity-100 transition-opacity">
                {agent.task || cfg.desc}
              </p>
              {!isChef && isEnabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditTaskValue(agent.task || cfg.desc)
                    setEditingId(agent.id)
                  }}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-white/5 opacity-0 group-hover/desc:opacity-100 transition-opacity hover:bg-orange-500/20 hover:text-orange-500"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-white/5">
          {isRunning || agent.status === 'running' ? (
            <div className="w-full py-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-between px-4 transition-all duration-300 relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', color: '#4b5563', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2 text-orange-400">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"></div>
                SCAN LÄUFT...
              </div>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStop(agent.id); }}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/20 flex items-center gap-1.5 z-10"
              >
                <Square size={10} fill="currentColor" />
                <span className="text-[10px] font-bold">STOP</span>
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); handleRun(agent.id); }}
              className="w-full py-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 group/btn relative overflow-hidden"
              style={{ background: `${cfg.color}15`, color: 'white', border: `1px solid ${cfg.color}44` }}
            >
              <div className="absolute inset-0 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" style={{ background: cfg.color }}></div>
              <span className="relative z-10 flex items-center gap-2">
                <Zap size={14} className="group-hover/btn:fill-white" />
                AGENT STARTEN
              </span>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row justify-between gap-8 mb-12">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">{agents?.filter(a => a.enabled).length} aktive Agenten · 24/7</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2" style={{ lineHeight: 1.1 }}>
            Dein KI-Team,
          </h1>
          <h1 className="text-5xl font-bold mb-6" style={{
            lineHeight: 1.1, fontStyle: 'italic',
            background: 'linear-gradient(135deg, #e85d3d, #f97316)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            immer griffbereit.
          </h1>
          <p className="text-gray-400 text-lg max-w-xl">
            Klicke auf einen Agenten, um seine Statistiken zu sehen und ihn zu starten. Jeder Agent sucht 24/7 nach Jobs in Deutschland.
          </p>

          <div className="flex items-center gap-8 mt-8">
            {[
              { val: agents?.filter(a => a.enabled).length, label: 'Aktive Agenten' },
              { val: stats?.summary?.total_jobs || 0, label: 'Gefundene Jobs' },
              { val: stats?.summary?.today_jobs || 0, label: "Heute gefunden" },
            ].map(({ val, label }) => (
              <div key={label}>
                <div className="text-3xl font-bold text-white">{val}</div>
                <div className="text-gray-500 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {chefAgent && (
          <div className="lg:w-80 flex-shrink-0">
            {renderAgentCard(chefAgent, true)}
          </div>
        )}
      </div>

      <div className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
        <div className="w-3 h-px bg-orange-500"></div>
        Suchquellen
      </div>
      
      {agentsLoading && agents?.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-orange-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {regularAgents.map(agent => renderAgentCard(agent))}
        </div>
      )}
    </div>
  )
}

export default Index
