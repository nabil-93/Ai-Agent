import React, { useEffect, useState } from 'react'
import { useJobStore, Agent } from '../store/useJobStore'
import { useSearchParams } from 'react-router-dom'
import { Zap, Briefcase, Power, Square, Send, Sparkles, MessageSquare, BarChart2, Activity, Target, ExternalLink, Settings as SettingsIcon, MapPin, Tag } from 'lucide-react'
import { AgentConfigModal } from '../components/AgentConfigModal'

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

const Agents: React.FC = () => {
  const [searchParams] = useSearchParams()
  const agentIdFromUrl = searchParams.get('agentId')
  
  const { agents: allAgents, agentsLoading, fetchAgents, triggerAgent, toggleAgent, stopAgent, updateAgentTask, jobs, fetchJobs } = useJobStore()
  // Hide cv_generator from this workspace — it has its own dedicated page (/bewerbungen)
  const agents = allAgents.filter(a => a.source?.toLowerCase() !== 'cv_generator')
  const [runningId, setRunningId] = useState<number | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(
    agentIdFromUrl ? parseInt(agentIdFromUrl) : null
  )
  const [chatInput, setChatInput] = useState('')
  const [activeTab, setActiveTab] = useState<'workspace' | 'analytics' | 'jobs'>('workspace')
  const [configAgent, setConfigAgent] = useState<Agent | null>(null)

  useEffect(() => {
    fetchAgents()
    fetchJobs() // Fetch jobs for the jobs tab
    const interval = setInterval(fetchAgents, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (agents?.length > 0 && !selectedAgentId) {
      // Select Chef by default if exists, else first agent
      const chef = agents.find(a => a.source?.toLowerCase() === 'chef')
      setSelectedAgentId(chef ? chef.id : agents[0].id)
    }
  }, [agents, selectedAgentId])

  // Update selectedAgentId if URL param changes
  useEffect(() => {
    if (agentIdFromUrl) {
      const id = parseInt(agentIdFromUrl)
      if (id !== selectedAgentId) {
        setSelectedAgentId(id)
      }
    }
  }, [agentIdFromUrl])

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

  const handleSendChat = async () => {
    if (!chatInput.trim() || !selectedAgentId) return
    await updateAgentTask(selectedAgentId, chatInput)
    setChatInput('')
  }

  if (agentsLoading && agents?.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-orange-500 border-t-transparent"></div>
      </div>
    )
  }

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0]
  if (!selectedAgent) return null

  const cfg = getAgentConfig(selectedAgent?.source)
  const isRunning = selectedAgent?.status === 'running' || runningId === selectedAgent?.id
  const isEnabled = selectedAgent?.enabled === 1

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Top Navigation Bar for Agents */}
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-6 text-sm font-medium border-b border-white/10 pb-2">
          <button onClick={() => setActiveTab('workspace')} className={`pb-2 px-2 flex items-center gap-2 transition-colors ${activeTab === 'workspace' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-300'}`}>
            <MessageSquare size={16} /> Workspace
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`pb-2 px-2 flex items-center gap-2 transition-colors ${activeTab === 'analytics' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-300'}`}>
            <BarChart2 size={16} /> Analysen
          </button>
          <button onClick={() => setActiveTab('jobs')} className={`pb-2 px-2 flex items-center gap-2 transition-colors ${activeTab === 'jobs' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-300'}`}>
            <Briefcase size={16} /> Gefundene Jobs <span className="ml-1 bg-white/10 px-1.5 py-0.5 rounded-md text-xs">{selectedAgent.jobs_found_total}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
          {agents.map(a => {
            const aCfg = getAgentConfig(a.source)
            const isSelected = selectedAgentId === a.id
            return (
              <button
                key={a.id}
                onClick={() => setSelectedAgentId(a.id)}
                className={`relative group w-10 h-10 rounded-xl overflow-hidden transition-all duration-300 ${isSelected ? 'ring-2 ring-orange-500 scale-110 z-10' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                title={a.name}
              >
                <img src={aCfg.avatar} alt={a.name} className="w-full h-full object-cover" />
                <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full border border-[#05070a] ${a.status === 'running' ? 'bg-orange-500 animate-pulse' : a.enabled ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Left Panel: Selected Agent Card */}
        <div className="w-[340px] flex-shrink-0 flex flex-col">
          <div className={`glass-card relative rounded-3xl p-6 flex flex-col flex-1 transition-all duration-500 overflow-hidden ${!isEnabled ? 'border-gray-800' : ''}`}>
            
            {/* Disabled Overlay */}
            {!isEnabled && (
              <div className="absolute inset-0 bg-[#05070a]/90 backdrop-blur-md z-20 flex flex-col items-center justify-center border border-white/5 rounded-3xl transition-all duration-500">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                  <Power className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Agent Aus</h3>
                <p className="text-gray-500 text-xs mb-6 text-center px-6">Dieses Teammitglied macht gerade eine Pause.</p>
                <button
                  onClick={() => toggleAgent(selectedAgent.id, true)}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold border border-white/10 transition-all flex items-center gap-2 hover:border-green-500/30 hover:text-green-400 group/btn"
                >
                  <Power size={16} className="text-gray-400 group-hover/btn:text-green-500 transition-colors" />
                  {selectedAgent.name} reaktivieren
                </button>
              </div>
            )}

            <div className="absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-20" style={{ background: cfg.color }}></div>
            
            <div className="relative mx-auto mb-6 mt-4">
              <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl" style={{ border: `1px solid ${cfg.color}33` }}>
                <img src={cfg.avatar} alt={selectedAgent.name} className="w-full h-full object-cover" />
              </div>
              {isRunning && <div className="absolute inset-[-4px] rounded-[2.7rem] border-2 border-orange-500/50 animate-ping opacity-75"></div>}
            </div>

            <div className="text-center mb-8">
              <div className="flex justify-center mb-4 gap-2">
                <StatusBadge status={selectedAgent.status} enabled={isEnabled} />
                <button
                  onClick={() => toggleAgent(selectedAgent.id, false)}
                  className="p-1.5 rounded-full border transition-all text-red-500 border-red-500/20 hover:bg-red-500/10"
                  title="Agent ausschalten"
                >
                  <Power size={12} />
                </button>
              </div>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{cfg.role}</p>
              <h3 className="text-white font-black text-3xl tracking-tight">{selectedAgent.name}</h3>
            </div>

            {/* Agent Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-center">
                <div className="text-gray-400 text-xs mb-1 uppercase font-bold tracking-wider">Jobs gefunden</div>
                <div className="text-2xl font-bold text-white">{selectedAgent.jobs_found_total}</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-center">
                <div className="text-gray-400 text-xs mb-1 uppercase font-bold tracking-wider">Aktuelle Seite</div>
                <div className="text-2xl font-bold text-emerald-400">{selectedAgent.current_page ?? 1}</div>
              </div>
            </div>

            {/* Live config snapshot + Edit */}
            <div className="rounded-2xl p-4 mb-4 flex-1"
              style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Aktuelle Konfiguration</div>
                <button onClick={(e) => { e.stopPropagation(); setConfigAgent(selectedAgent) }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 text-emerald-400 hover:text-white hover:bg-emerald-500/20 border border-emerald-500/30 transition-all">
                  <SettingsIcon size={11} /> Bearbeiten
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin size={12} className="text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-500">Standort: </span>
                    <span className="text-white font-semibold">
                      {selectedAgent.location || <em className="text-gray-600">nicht gesetzt (Default: Berlin)</em>}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Tag size={12} className="text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-500">Keywords: </span>
                    {selectedAgent.keywords && selectedAgent.keywords.length > 0 ? (
                      <span className="inline-flex flex-wrap gap-1">
                        {selectedAgent.keywords.slice(0, 5).map(k => (
                          <span key={k} className="text-emerald-400 font-semibold">{k}</span>
                        )).reduce((acc: any, el, i, arr) => i < arr.length - 1 ? [...acc, el, <span key={'s'+i} className="text-gray-600">·</span>] : [...acc, el], [])}
                        {selectedAgent.keywords.length > 5 && (
                          <span className="text-gray-500">+{selectedAgent.keywords.length - 5}</span>
                        )}
                      </span>
                    ) : (
                      <em className="text-gray-600">keine (Default: Python, IT, Data, ...)</em>
                    )}
                  </div>
                </div>

                {selectedAgent.api_key && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-purple-400 font-semibold">API-Modus aktiv</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action */}
            <div className="mt-auto pt-4 border-t border-white/5">
              {isRunning ? (
                <div className="w-full py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between px-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2 text-orange-400">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"></div>
                    SUCHE LÄUFT...
                  </div>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStop(selectedAgent.id); }} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/20 flex items-center gap-1.5">
                    <Square size={10} fill="currentColor" /> STOP
                  </button>
                </div>
              ) : (
                <button onClick={() => handleRun(selectedAgent.id)} className="w-full py-4 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 group/btn relative overflow-hidden" style={{ background: `${cfg.color}15`, color: 'white', border: `1px solid ${cfg.color}44` }}>
                  <div className="absolute inset-0 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" style={{ background: cfg.color }}></div>
                  <span className="relative z-10 flex items-center gap-2">
                    <Zap size={16} className="group-hover/btn:fill-white" />
                    {selectedAgent.name.toUpperCase()} STARTEN
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Chat / Workspace Interface */}
        <div className="flex-1 flex flex-col glass-card rounded-3xl border border-white/5 overflow-hidden relative">
          
          {/* Workspace Header */}
          <div className="h-14 border-b border-white/5 flex items-center px-6 gap-3 bg-white/[0.01]">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-orange-500 animate-pulse' : isEnabled ? 'bg-green-500' : 'bg-gray-600'}`}></div>
            <span className="text-gray-300 font-medium">Gespräch mit {selectedAgent.name}</span>
            <div className="ml-auto text-xs text-gray-500 flex items-center gap-2">
              <Briefcase size={12} /> {cfg.role}
            </div>
          </div>

          {/* Conditional Content based on activeTab */}
          {activeTab === 'workspace' && (
            <>
              {/* Workspace Content */}
              <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#05070a]/50 pointer-events-none"></div>
                
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-2xl" style={{ background: `linear-gradient(135deg, ${cfg.color}, #05070a)` }}>
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-3xl font-serif text-white mb-4 text-center max-w-lg" style={{ lineHeight: 1.2 }}>
                  Wie kann ich dir bei deiner Jobsuche helfen?
                </h2>
                
                <p className="text-gray-400 text-center max-w-md mb-10 text-sm leading-relaxed">
                  Mein aktuelles Ziel ist: <strong className="text-gray-200">"{selectedAgent.task || cfg.desc}"</strong>.
                  Du kannst mich bitten, die Strategie zu ändern oder nach anderen Stellen zu suchen.
                </p>

                <div className="flex flex-col gap-3 w-full max-w-xl z-10">
                  <button onClick={() => setChatInput("Suche nur nach Werkstudenten-Jobs in Data Science")} className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-sm text-gray-300 text-left flex items-center justify-between group">
                    Suche nur nach Werkstudenten-Jobs in Data Science
                    <Send size={14} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                  </button>
                  <button onClick={() => setChatInput("Finde Vollzeit-Jobs mit SAP in München")} className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-sm text-gray-300 text-left flex items-center justify-between group">
                    Finde Vollzeit-Jobs mit SAP in München
                    <Send size={14} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                  </button>
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-6 bg-[#05070a]/80 backdrop-blur-xl border-t border-white/5">
                <div className="max-w-3xl mx-auto relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 to-[#6366f1]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative flex items-center bg-[#0a0d14] border border-white/10 rounded-2xl overflow-hidden p-1 shadow-2xl focus-within:border-orange-500/50 transition-colors">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                      placeholder={`Bitte ${selectedAgent.name}, die Suche anzupassen... (Enter zum Bestätigen)`}
                      className="flex-1 bg-transparent text-sm text-white px-4 py-3 focus:outline-none placeholder-gray-600"
                      disabled={!isEnabled}
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={!chatInput.trim() || !isEnabled}
                      className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-800 disabled:text-gray-500 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Send size={14} /> Senden
                    </button>
                  </div>
                </div>
                <p className="text-center text-[10px] text-gray-600 mt-4 font-medium uppercase tracking-widest">
                  Der Agent wird seinen Parameter 'Aufgabe' mit deinen Anweisungen aktualisieren.
                </p>
              </div>
            </>
          )}

          {activeTab === 'analytics' && (
            <div className="flex-1 overflow-y-auto p-8 relative">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-10" style={{ background: cfg.color }}></div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Activity className="text-orange-500" />
                Performance Analyse: {selectedAgent.name}
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                  <p className="text-gray-400 text-sm mb-2">Erfolgsquote</p>
                  <div className="text-4xl font-black text-white mb-4">98.2%</div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div className="h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: '98.2%' }}></div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                  <p className="text-gray-400 text-sm mb-2">Gesamte Jobs Gefunden</p>
                  <div className="text-4xl font-black text-white mb-4">{selectedAgent.jobs_found_total}</div>
                  <div className="flex items-center gap-2 text-sm text-orange-400">
                    <Target size={16} /> Überdurchschnittlich
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4">Aktivitätsverlauf (Letzte 7 Tage)</h3>
                <div className="flex items-end gap-2 h-40">
                  {[45, 60, 30, 80, 50, 90, 75].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col justify-end group">
                      <div 
                        className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-100 opacity-60" 
                        style={{ height: `${val}%`, background: `linear-gradient(to top, ${cfg.color}33, ${cfg.color})` }}
                      ></div>
                      <div className="text-center text-gray-500 text-xs mt-2 font-medium">Tag {idx+1}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-white mb-6">Gefundene Stellen von {selectedAgent.name}</h2>
              <div className="space-y-3">
                {jobs?.filter(j => selectedAgent.source.toLowerCase() === 'chef' || j.source.toLowerCase() === selectedAgent.source.toLowerCase()).length > 0 ? (
                  jobs.filter(j => selectedAgent.source.toLowerCase() === 'chef' || j.source.toLowerCase() === selectedAgent.source.toLowerCase()).map(job => (
                    <div key={job.id} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-white font-bold text-sm mb-1">{job.title}</h4>
                        <p className="text-gray-400 text-xs">{job.company_id || 'Unternehmen'} • {job.location}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${job.status === 'en_cours' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-gray-400'}`}>
                          {job.status === 'en_cours' ? 'In Bearbeitung' : job.status}
                        </span>
                        <a href={job.link} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors">
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                    <p className="text-gray-500 text-sm">Noch keine Jobs von diesem Agenten gefunden.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Per-agent configuration modal */}
      <AgentConfigModal agent={configAgent} onClose={() => setConfigAgent(null)} />
    </div>
  )
}

export default Agents
