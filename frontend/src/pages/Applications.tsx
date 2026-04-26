import React, { useEffect, useRef, useState } from 'react'
import { useJobStore } from '../store/useJobStore'
import {
  FileText, Upload, Trash2, Download, Sparkles, CheckCircle2,
  Clock, Loader2, AlertTriangle, FilePlus2, Building2, MapPin,
} from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'In Warteschlange', color: '#9ca3af', bg: 'rgba(156,163,175,0.15)' },
  processing: { label: 'Wird erstellt...',  color: '#eab308', bg: 'rgba(234,179,8,0.15)' },
  completed:  { label: 'Fertig',            color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  error:      { label: 'Fehler',            color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const Applications: React.FC = () => {
  const {
    cv, applications, applicationsLoading, agents,
    fetchCV, uploadCV, deleteCV, fetchApplications,
    deleteApplication, downloadAppFile, fetchAgents,
  } = useJobStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const cvAgent = agents.find(a => a.source === 'cv_generator')

  useEffect(() => {
    fetchCV()
    fetchApplications()
    fetchAgents()
    // Auto-refresh while there are pending/processing applications
    const interval = setInterval(() => {
      const hasActive = useJobStore.getState().applications.some(
        a => a.status === 'pending' || a.status === 'processing'
      )
      if (hasActive) {
        fetchApplications()
        fetchAgents()
      }
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const onPickFile = () => fileInputRef.current?.click()

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadCV(file)
    } catch {
      /* toast already handled */
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const stats = {
    pending: applications.filter(a => a.status === 'pending').length,
    processing: applications.filter(a => a.status === 'processing').length,
    completed: applications.filter(a => a.status === 'completed').length,
    error: applications.filter(a => a.status === 'error').length,
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-white mb-2" style={{ lineHeight: 1.1 }}>
          KI-Bewerbung,
        </h1>
        <h1 className="text-5xl font-bold mb-6" style={{
          lineHeight: 1.1, fontStyle: 'italic',
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          maßgeschneidert.
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl">
          Lade deinen Lebenslauf hoch — der KI-Agent erstellt für jede Stelle einen
          angepassten CV und ein passendes Motivationsschreiben.
        </p>
      </div>

      {/* Agent card */}
      <div className="rounded-2xl p-6 mb-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(236,72,153,0.04))',
          border: '1px solid rgba(168,85,247,0.2)',
        }}>
        <div className="absolute top-0 right-0 w-64 h-64 blur-3xl opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }}></div>

        <div className="relative flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              boxShadow: '0 8px 25px rgba(168,85,247,0.4)',
            }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white">CV & Bewerbung KI</h2>
              {cvAgent && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{
                    background: cvAgent.status === 'running' ? 'rgba(234,179,8,0.2)' : 'rgba(34,197,94,0.15)',
                    color: cvAgent.status === 'running' ? '#eab308' : '#22c55e',
                  }}>
                  {cvAgent.status === 'running' ? '● Läuft' : '● Bereit'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Generiert für jede ausgewählte Stelle einen angepassten Lebenslauf und ein Motivationsschreiben als Word-Dokument (.docx).
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Wartend" value={stats.pending} color="#9ca3af" />
              <Stat label="Erstellung" value={stats.processing} color="#eab308" />
              <Stat label="Fertig" value={stats.completed} color="#22c55e" />
              <Stat label="Fehler" value={stats.error} color="#ef4444" />
            </div>
          </div>
        </div>
      </div>

      {/* CV upload section */}
      <div className="rounded-2xl p-6 mb-6"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-base font-bold text-white mb-1">📄 Master-Lebenslauf</h2>
        <p className="text-sm text-gray-500 mb-5">
          Lade einmalig dein CV hoch. Die KI nutzt es als Vorlage für alle Bewerbungen.
        </p>

        <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc"
          onChange={onFileChange} className="hidden" />

        {cv ? (
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(34,197,94,0.2)' }}>
                <FileText className="w-5 h-5" style={{ color: '#22c55e' }} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{cv.filename}</div>
                <div className="text-xs text-gray-500">
                  {cv.file_type.toUpperCase()} · {formatBytes(cv.file_size)}
                  {cv.has_text ? ' · Text extrahiert ✓' : ' · ⚠ Kein Text gefunden'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onPickFile} disabled={uploading}
                className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 text-blue-400 hover:text-white hover:bg-blue-500/20 border border-blue-500/30 transition-all disabled:opacity-50">
                <Upload size={12} /> Ersetzen
              </button>
              <button onClick={() => deleteCV()}
                className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/30 transition-all">
                <Trash2 size={12} /> Löschen
              </button>
            </div>
          </div>
        ) : (
          <button onClick={onPickFile} disabled={uploading}
            className="w-full p-8 rounded-xl text-center transition-all hover:scale-[1.01] disabled:opacity-50"
            style={{
              background: 'rgba(168,85,247,0.04)',
              border: '2px dashed rgba(168,85,247,0.3)',
            }}>
            <FilePlus2 className="w-10 h-10 mx-auto mb-3" style={{ color: '#a855f7' }} />
            <div className="text-sm font-bold text-white mb-1">
              {uploading ? 'Wird hochgeladen...' : 'CV hochladen'}
            </div>
            <div className="text-xs text-gray-500">PDF, DOCX oder DOC · max. 10MB</div>
          </button>
        )}
      </div>

      {/* Applications list */}
      <div className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-white mb-1">📋 Erstellte Bewerbungen</h2>
            <p className="text-sm text-gray-500">
              Alle generierten Lebensläufe und Motivationsschreiben.
            </p>
          </div>
          <span className="text-xs text-gray-500">{applications.length} {applications.length === 1 ? 'Bewerbung' : 'Bewerbungen'}</span>
        </div>

        {applicationsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl animate-pulse"
                style={{ background: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <Sparkles className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Noch keine Bewerbungen</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Gehe zu <strong className="text-emerald-400">Pipeline</strong>, klicke auf eine Stelle und wähle "KI-Bewerbung erstellen".
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {applications.map(app => {
              const s = STATUS_LABELS[app.status] || STATUS_LABELS.pending
              const StatusIcon = app.status === 'completed' ? CheckCircle2
                : app.status === 'processing' ? Loader2
                : app.status === 'error' ? AlertTriangle : Clock
              return (
                <div key={app.id}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-white/[0.03]"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>

                  <StatusIcon
                    className={`w-5 h-5 flex-shrink-0 ${app.status === 'processing' ? 'animate-spin' : ''}`}
                    style={{ color: s.color }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{app.job_title}</div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1"><Building2 size={11} /> {app.company_name}</span>
                      {app.location && <span className="flex items-center gap-1"><MapPin size={11} /> {app.location}</span>}
                    </div>
                    {app.error_message && (
                      <div className="text-xs text-red-400 mt-1 truncate">{app.error_message}</div>
                    )}
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md whitespace-nowrap"
                    style={{ background: s.bg, color: s.color }}>
                    {s.label}
                  </span>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {app.status === 'completed' && (
                      <>
                        <button onClick={() => downloadAppFile(app.id, 'cv')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 text-blue-400 hover:text-white hover:bg-blue-500/20 border border-blue-500/30 transition-all"
                          title="CV herunterladen">
                          <Download size={11} /> CV
                        </button>
                        <button onClick={() => downloadAppFile(app.id, 'motivation')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 text-purple-400 hover:text-white hover:bg-purple-500/20 border border-purple-500/30 transition-all"
                          title="Motivationsschreiben herunterladen">
                          <Download size={11} /> Motivation
                        </button>
                      </>
                    )}
                    <button onClick={() => deleteApplication(app.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Löschen">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const Stat: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="rounded-xl p-3"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
    <div className="text-2xl font-bold" style={{ color }}>{value}</div>
    <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{label}</div>
  </div>
)

export default Applications
