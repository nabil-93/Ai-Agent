import React, { useEffect, useRef, useState } from 'react'
import { Send, Sparkles, User, Bot, Tag, MapPin, Briefcase, RefreshCw } from 'lucide-react'
import { useJobStore } from '../store/useJobStore'
import client from '../api/client'

interface ChatMsg {
  id: number
  role: 'user' | 'chef'
  text: string
  parsed?: any
  appliedTo?: number[]
  ts: number
}

let msgCounter = 0

const ChefChat: React.FC = () => {
  const { sendChefCommand, agents, fetchAgents, runAllAgents } = useJobStore()
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [examples, setExamples] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Initial greeting + load examples
  useEffect(() => {
    fetchAgents()
    setMessages([{
      id: ++msgCounter, role: 'chef', ts: Date.now(),
      text: 'Hi! Ich bin der Chef-Agent. 🧑‍🍳\n\nSag mir was du suchst und ich konfiguriere alle Hunter-Agenten in einem Schritt.\n\nProbiere z.B. *"Suche Werkstudent Power BI in Berlin"* oder klicke einen Vorschlag unten.',
    }])
    client.get('/chef/examples').then(r => setExamples(r.data.examples || [])).catch(() => {})
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    const t = text.trim()
    if (!t || sending) return
    setMessages(prev => [...prev, { id: ++msgCounter, role: 'user', text: t, ts: Date.now() }])
    setInput('')
    setSending(true)
    try {
      const reply = await sendChefCommand(t)
      if (reply) {
        setMessages(prev => [...prev, {
          id: ++msgCounter, role: 'chef', text: reply.reply,
          parsed: reply.parsed, appliedTo: reply.applied_to, ts: Date.now(),
        }])
      } else {
        setMessages(prev => [...prev, {
          id: ++msgCounter, role: 'chef',
          text: 'Tut mir leid, ich konnte das nicht verarbeiten. Probier eine andere Formulierung.',
          ts: Date.now(),
        }])
      }
    } finally {
      setSending(false)
    }
  }

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  // Show snapshot of one hunter to confirm config persisted
  const sampleHunter = agents.find(a => ['linkedin', 'xing', 'indeed', 'agentur'].includes(a.source?.toLowerCase()))

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-white mb-2" style={{ lineHeight: 1.1 }}>
          Sprich mit dem
        </h1>
        <h1 className="text-5xl font-bold mb-6" style={{
          lineHeight: 1.1, fontStyle: 'italic',
          background: 'linear-gradient(135deg, #e85d3d, #f97316)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Chef.
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl">
          Steuere alle Hunter-Agenten mit natürlicher Sprache. Eine Nachricht, alle Agenten neu konfiguriert.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat panel */}
        <div className="lg:col-span-2 rounded-3xl flex flex-col"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
            border: '1px solid rgba(255,255,255,0.06)',
            minHeight: '600px',
            maxHeight: 'calc(100vh - 280px)',
          }}>
          {/* chat header */}
          <div className="flex items-center gap-3 p-5 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #e85d3d, #f97316)' }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">Chef-Agent</div>
              <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Bereit
              </div>
            </div>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map(m => (
              <Message key={m.id} msg={m} />
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Bot size={14} />
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span>Chef denkt nach...</span>
              </div>
            )}
          </div>

          {/* examples row (only before first user message) */}
          {messages.filter(m => m.role === 'user').length === 0 && examples.length > 0 && (
            <div className="px-5 pb-3">
              <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-2">Vorschläge:</div>
              <div className="flex flex-wrap gap-1.5">
                {examples.map(e => (
                  <button key={e} onClick={() => send(e)}
                    className="px-3 py-1.5 rounded-full text-xs text-gray-300 hover:text-white border border-white/10 hover:bg-white/5 transition-all">
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* input */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder='z.B. "Suche Werkstudent Power BI in Berlin"'
                rows={1}
                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 resize-none"
                style={{ minHeight: '46px', maxHeight: '140px' }}
              />
              <button onClick={() => send(input)} disabled={!input.trim() || sending}
                className="px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 text-white transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{
                  background: 'linear-gradient(135deg, #e85d3d, #f97316)',
                  boxShadow: '0 4px 15px rgba(232,93,61,0.3)',
                }}>
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right side: live agent config preview */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4">
              Aktuelle Hunter-Konfiguration
            </h3>
            {sampleHunter ? (
              <div className="space-y-3 text-sm">
                <ConfigRow icon={MapPin} label="Standort"
                  value={sampleHunter.location || <em className="text-gray-600">Default: Berlin</em>} />
                <ConfigRow icon={Tag} label="Keywords"
                  value={sampleHunter.keywords?.length
                    ? sampleHunter.keywords.slice(0, 5).join(', ') + (sampleHunter.keywords.length > 5 ? `, +${sampleHunter.keywords.length - 5}` : '')
                    : <em className="text-gray-600">Defaults</em>} />
                <ConfigRow icon={Briefcase} label="Bereich"
                  value={sampleHunter.domain || <em className="text-gray-600">—</em>} />
                <ConfigRow icon={RefreshCw} label="Aktuelle Seite"
                  value={`Seite ${sampleHunter.current_page ?? 1}`} />
              </div>
            ) : (
              <p className="text-xs text-gray-500">Lade Agenten...</p>
            )}
            <div className="text-[10px] text-gray-600 mt-4 pt-3 border-t border-white/5">
              Diese Konfiguration gilt für alle {agents.filter(a => !['chef', 'cv_generator'].includes(a.source?.toLowerCase())).length} Hunter-Agenten.
            </div>
          </div>

          <button onClick={() => runAllAgents()}
            className="w-full px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white transition-all hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
            }}>
            <Sparkles size={14} /> Jetzt mit neuer Config suchen
          </button>
        </div>
      </div>
    </div>
  )
}

const Message: React.FC<{ msg: ChatMsg }> = ({ msg }) => {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: isUser
            ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
            : 'linear-gradient(135deg, #e85d3d, #f97316)',
        }}>
        {isUser ? <User size={14} className="text-white" /> : <Sparkles size={14} className="text-white" />}
      </div>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
        style={{
          background: isUser ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isUser ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
        }}>
        <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed"
          dangerouslySetInnerHTML={{ __html: simpleMarkdown(msg.text) }} />

        {msg.parsed && (msg.parsed.keywords?.length || msg.parsed.location || msg.parsed.job_type) && (
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-1.5">
            {msg.parsed.location && (
              <Pill icon={MapPin} text={msg.parsed.location} color="#3b82f6" />
            )}
            {msg.parsed.job_type && (
              <Pill icon={Briefcase} text={msg.parsed.job_type} color="#a855f7" />
            )}
            {msg.parsed.keywords?.map((k: string) => (
              <Pill key={k} icon={Tag} text={k} color="#10b981" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const ConfigRow: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode }> =
  ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-2">
      <Icon size={12} className="text-gray-500 mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
        <div className="text-white font-semibold truncate">{value}</div>
      </div>
    </div>
  )

const Pill: React.FC<{ icon: React.ElementType; text: string; color: string }> =
  ({ icon: Icon, text, color }) => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
      style={{ background: `${color}22`, color }}>
      <Icon size={9} />{text}
    </span>
  )

// Tiny markdown helper for **bold** and *italic*
function simpleMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+?)\*/g, '<em class="text-orange-300">$1</em>')
    .replace(/\n/g, '<br/>')
}

export default ChefChat
