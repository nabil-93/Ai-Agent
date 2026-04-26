import React, { useEffect, useState } from 'react'
import { X, Save, Briefcase, Layers, Key, Tag, Settings as SettingsIcon, RotateCw, Copy } from 'lucide-react'
import { Agent, useJobStore } from '../store/useJobStore'
import { CityAutocomplete } from './CityAutocomplete'
import { KeywordTags } from './KeywordTags'
import { isValidGermanCity } from '../data/germanCities'

interface Props {
  agent: Agent | null
  onClose: () => void
}

const DOMAIN_PRESETS = [
  'IT', 'IT & Software', 'Data & AI', 'Cloud', 'DevOps',
  'SAP', 'Wirtschaftsinformatik', 'Software', 'Consulting',
  'Mobile', 'Verwaltung & IT',
]

export const AgentConfigModal: React.FC<Props> = ({ agent, onClose }) => {
  const { updateAgentConfig, applyConfigToAll, pushToast } = useJobStore()

  const [keywords, setKeywords] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [domain, setDomain] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (agent) {
      setKeywords(agent.keywords ?? [])
      setLocation(agent.location ?? '')
      setDomain(agent.domain ?? '')
      setApiKey(agent.api_key ?? '')
      setCurrentPage(agent.current_page ?? 1)
    }
  }, [agent])

  // Lock body scroll
  useEffect(() => {
    if (!agent) return
    document.body.style.overflow = 'hidden'
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onEsc)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onEsc)
    }
  }, [agent, onClose])

  if (!agent) return null

  const locationValid = !location || isValidGermanCity(location)

  const buildPayload = () => ({
    keywords: keywords.length > 0 ? keywords : null,
    location: location.trim() || null,
    domain: domain.trim() || null,
    api_key: apiKey.trim() || null,
    current_page: currentPage,
  })

  const save = async () => {
    if (!locationValid) {
      pushToast('Standort ungültig — bitte aus der Liste wählen', 'error')
      return
    }
    setSaving(true)
    try {
      await updateAgentConfig(agent.id, buildPayload())
      pushToast(`${agent.name} aktualisiert`, 'success')
      onClose()
    } catch {
      /* toast already shown */
    } finally {
      setSaving(false)
    }
  }

  const applyAll = async () => {
    if (!locationValid) {
      pushToast('Standort ungültig — bitte aus der Liste wählen', 'error')
      return
    }
    if (!confirm('Diese Konfiguration auf ALLE Hunter-Agenten anwenden?')) return
    setSaving(true)
    try {
      await applyConfigToAll(agent.id, buildPayload())
      pushToast('Auf alle Agenten angewendet', 'success')
      onClose()
    } catch {
      /* */
    } finally {
      setSaving(false)
    }
  }

  const resetPage = () => setCurrentPage(1)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl"
        style={{
          background: 'linear-gradient(180deg, #0d1421 0%, #05070a 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header glow */}
        <div className="absolute top-0 left-0 right-0 h-32 opacity-30 pointer-events-none rounded-t-3xl"
          style={{ background: 'radial-gradient(ellipse at top, rgba(16,185,129,0.4), transparent 70%)' }} />

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-5 right-5 z-10 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all border border-white/10">
          <X size={18} />
        </button>

        <div className="relative p-8">
          {/* Title */}
          <div className="flex items-start gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Agent Config</div>
              <h2 className="text-2xl font-bold text-white">{agent.name}</h2>
              <div className="text-xs text-gray-500 mt-0.5">
                Quelle: <span className="text-emerald-400">{agent.source}</span> · Status: {agent.status}
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-400 mt-4 mb-6">
            Stelle hier ein, <strong>was</strong> dieser Agent suchen soll, <strong>wo</strong>, und welche Keywords er nutzt.
            Ohne API-Key nutzt der Agent den kostenlosen Scraping-Pfad.
          </p>

          {/* Keywords */}
          <Section icon={Tag} title="Keywords" hint="Was soll gesucht werden?">
            <KeywordTags value={keywords} onChange={setKeywords} />
          </Section>

          {/* Location */}
          <Section icon={Briefcase} title="Standort" hint="In welcher Stadt soll gesucht werden?">
            <CityAutocomplete value={location} onChange={setLocation} placeholder="z.B. Berlin, München, Remote" />
          </Section>

          {/* Domain */}
          <Section icon={Layers} title="Bereich (Domain)" hint="Optional: spezifischer Fachbereich">
            <input type="text" value={domain} onChange={e => setDomain(e.target.value)}
              list="domain-presets"
              placeholder="IT, Data, SAP, Cloud..."
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50" />
            <datalist id="domain-presets">
              {DOMAIN_PRESETS.map(d => <option key={d} value={d} />)}
            </datalist>
          </Section>

          {/* API key */}
          <Section icon={Key} title="API-Schlüssel" hint="Optional: Falls gesetzt, nutzt der Agent die API-Route statt Scraping">
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder="Leer lassen für Scraping-Modus"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50" />
          </Section>

          {/* Pagination state */}
          <Section icon={RotateCw} title="Aktuelle Seite" hint="Welche Seite soll der nächste Run laden?">
            <div className="flex items-center gap-2">
              <input type="number" min={1} value={currentPage}
                onChange={e => setCurrentPage(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
              <button type="button" onClick={resetPage}
                className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 text-amber-400 hover:text-white hover:bg-amber-500/20 border border-amber-500/30 transition-all">
                <RotateCw size={12} /> Zurücksetzen auf 1
              </button>
            </div>
          </Section>

          {/* Footer actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/5 mt-6">
            <button onClick={save} disabled={saving}
              className="flex-1 px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
              }}>
              <Save size={16} /> {saving ? 'Speichern...' : 'Speichern'}
            </button>
            <button onClick={applyAll} disabled={saving}
              className="px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-purple-400 hover:text-white border border-purple-500/30 hover:bg-purple-500/20 transition-all disabled:opacity-50">
              <Copy size={14} /> Auf alle Hunter anwenden
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const Section: React.FC<{
  icon: React.ElementType
  title: string
  hint?: string
  children: React.ReactNode
}> = ({ icon: Icon, title, hint, children }) => (
  <div className="mb-5">
    <div className="flex items-center gap-2 mb-2">
      <Icon size={14} className="text-emerald-500" />
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">{title}</h3>
    </div>
    {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
    {children}
  </div>
)
