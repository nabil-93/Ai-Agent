import React, { useEffect, useState } from 'react'
import { useJobStore } from '../store/useJobStore'
import { Save, Send, Key, Globe, Shield, MessageSquare } from 'lucide-react'

const Settings: React.FC = () => {
  const { settings, loadSettings, saveSettings, pushToast } = useJobStore()

  const [form, setForm] = useState(settings)

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    setForm(settings)
  }, [settings])

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    saveSettings(form)
    pushToast('Einstellungen gespeichert', 'success')
  }

  const testTelegram = async () => {
    if (!form.telegram_bot_token || !form.telegram_chat_id) {
      pushToast('Bitte Telegram Token und Chat ID eingeben', 'error')
      return
    }
    try {
      const url = `https://api.telegram.org/bot${form.telegram_bot_token}/sendMessage`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: form.telegram_chat_id,
          text: '🤖 *JobAgents Test*\nVerbindung erfolgreich!',
          parse_mode: 'Markdown',
        }),
      })
      if (res.ok) pushToast('Test-Nachricht gesendet ✓', 'success')
      else pushToast('Telegram-Test fehlgeschlagen', 'error')
    } catch {
      pushToast('Verbindungsfehler', 'error')
    }
  }

  const Section: React.FC<{ title: string; icon: React.ElementType; color: string; children: React.ReactNode }> =
    ({ title, icon: Icon, color, children }) => (
      <div className="rounded-2xl p-6 mb-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
            <Icon size={18} style={{ color }} />
          </div>
          <h2 className="text-base font-bold text-white">{title}</h2>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    )

  const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> =
    ({ label, hint, children }) => (
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
        {children}
        {hint && <p className="text-xs text-gray-600 mt-1.5">{hint}</p>}
      </div>
    )

  const inputCls = "w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:bg-orange-500/5 transition-all"

  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-bold text-white mb-2" style={{ lineHeight: 1.1 }}>
          Einstellungen,
        </h1>
        <h1 className="text-5xl font-bold mb-6" style={{
          lineHeight: 1.1, fontStyle: 'italic',
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          dein Setup.
        </h1>
        <p className="text-gray-400 text-lg max-w-xl">
          Konfiguriere Benachrichtigungen, API-Schlüssel und Standardparameter für deine Agenten.
        </p>
      </div>

      <div className="max-w-3xl">
        {/* Telegram */}
        <Section title="Telegram-Benachrichtigungen" icon={MessageSquare} color="#3b82f6">
          <Field label="Bot Token" hint="Erhältlich von @BotFather auf Telegram">
            <input
              type="password"
              placeholder="123456789:AAA-bbb-ccc..."
              value={form.telegram_bot_token || ''}
              onChange={e => handleChange('telegram_bot_token', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Chat ID" hint="Schicke /start an deinen Bot, dann hole sie über @userinfobot">
            <input
              type="text"
              placeholder="123456789"
              value={form.telegram_chat_id || ''}
              onChange={e => handleChange('telegram_chat_id', e.target.value)}
              className={inputCls}
            />
          </Field>
          <button
            onClick={testTelegram}
            className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 text-blue-400 hover:text-white hover:bg-blue-500/20 border border-blue-500/30 transition-all"
          >
            <Send size={14} /> Test-Nachricht senden
          </button>
        </Section>

        {/* API Keys */}
        <Section title="API-Schlüssel" icon={Key} color="#a855f7">
          <Field label="SerpAPI Key" hint="Optional: Für erweiterte Suche">
            <input
              type="password"
              placeholder="abc123..."
              value={form.serpapi_key || ''}
              onChange={e => handleChange('serpapi_key', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="LinkedIn Email" hint="Optional: Nur für authentifizierte Suche">
            <input
              type="email"
              placeholder="dein@email.de"
              value={form.linkedin_email || ''}
              onChange={e => handleChange('linkedin_email', e.target.value)}
              className={inputCls}
            />
          </Field>
        </Section>

        {/* Search Defaults */}
        <Section title="Suchparameter" icon={Globe} color="#10b981">
          <Field label="Standard-Standort" hint="Wird als Default für alle Agenten verwendet">
            <input
              type="text"
              placeholder="Berlin, München..."
              value={form.default_location || ''}
              onChange={e => handleChange('default_location', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Standard-Keywords (kommagetrennt)" hint="z.B. Python, SAP, Data Science">
            <input
              type="text"
              placeholder="Python, SQL, Data Science"
              value={form.default_keywords || ''}
              onChange={e => handleChange('default_keywords', e.target.value)}
              className={inputCls}
            />
          </Field>
        </Section>

        {/* Info */}
        <Section title="Über das System" icon={Shield} color="#f59e0b">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Version</div>
              <div className="text-white font-semibold">1.0.0</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Backend</div>
              <div className="text-emerald-400 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                FastAPI · SQLite
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Frontend</div>
              <div className="text-white font-semibold">React · Vite · Tailwind</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">KI-Modell</div>
              <div className="text-white font-semibold">Multi-Agent</div>
            </div>
          </div>
        </Section>

        {/* Save button */}
        <div className="flex justify-end mt-8">
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 text-white transition-all hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #e85d3d, #f97316)',
              boxShadow: '0 4px 20px rgba(232,93,61,0.4)',
            }}
          >
            <Save size={16} /> Einstellungen speichern
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
