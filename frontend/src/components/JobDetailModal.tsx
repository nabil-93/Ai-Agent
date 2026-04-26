import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ExternalLink, Download, Mail, Phone, MapPin, Briefcase, Building2, Euro, Tag, Star, Sparkles } from 'lucide-react'
import { useJobStore } from '../store/useJobStore'
import client from '../api/client'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

const STATUS_OPTIONS = [
  { value: 'en_cours', label: 'In Bearbeitung', color: '#3b82f6' },
  { value: 'envoye',   label: 'Beworben',       color: '#8b5cf6' },
  { value: 'entretien', label: 'Interview',      color: '#f59e0b' },
  { value: 'refus',    label: 'Abgelehnt',      color: '#ef4444' },
]

const SOURCE_COLORS: Record<string, string> = {
  linkedin: '#0077B5',
  xing: '#026466',
  indeed: '#2557A7',
  agentur: '#1a6b3a',
}

export const JobDetailModal: React.FC = () => {
  const { selectedJob, selectJob, updateJob, generateApplication, cv, fetchCV } = useJobStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (selectedJob) fetchCV()
  }, [selectedJob])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedJob) {
      document.body.style.overflow = 'hidden'
      const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && selectJob(null)
      window.addEventListener('keydown', onEsc)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', onEsc)
      }
    }
  }, [selectedJob])

  if (!selectedJob) return null

  const job = selectedJob
  const sourceColor = SOURCE_COLORS[job.source?.toLowerCase()] || '#6366f1'

  const downloadPDF = async () => {
    try {
      const res = await client.get(`/jobs/${job.id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `job_${job.id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF download failed', err)
    }
  }

  const companyName = job.company?.name || 'Unknown Company'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={() => selectJob(null)}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl"
        style={{
          background: 'linear-gradient(180deg, #0d1421 0%, #05070a 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: `0 25px 80px rgba(0,0,0,0.6), 0 0 1px ${sourceColor}33`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Glow header */}
        <div className="absolute top-0 left-0 right-0 h-40 opacity-30 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top, ${sourceColor}55 0%, transparent 70%)` }}
        ></div>

        {/* Close */}
        <button
          onClick={() => selectJob(null)}
          className="absolute top-5 right-5 z-10 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all border border-white/10"
        >
          <X size={18} />
        </button>

        <div className="relative p-8">
          {/* Source badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full"
              style={{ background: `${sourceColor}22`, color: sourceColor, border: `1px solid ${sourceColor}55` }}>
              {job.source}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: de })}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{job.title}</h2>

          {/* Company / location */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6 text-sm">
            <div className="flex items-center gap-1.5 text-gray-300">
              <Building2 size={14} className="text-gray-500" /> {companyName}
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <MapPin size={14} className="text-gray-500" /> {job.location}
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <Briefcase size={14} className="text-gray-500" /> {job.job_type}
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <Tag size={14} className="text-gray-500" /> {job.domain}
            </div>
          </div>

          {/* Score + Salary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div className="rounded-2xl p-5 flex items-center justify-between"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Relevanz Score</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-transparent bg-clip-text"
                    style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316)', WebkitBackgroundClip: 'text' }}>
                    {job.score.toFixed(1)}
                  </span>
                  <span className="text-gray-500 text-sm font-bold">/10</span>
                </div>
              </div>
              <Star className="w-10 h-10" style={{ color: '#fbbf24', fill: '#fbbf24', opacity: 0.3 }} />
            </div>

            {(job.salary_min || job.salary_max) && (
              <div className="rounded-2xl p-5 flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Gehalt</div>
                  <div className="text-xl font-bold text-white">
                    {job.salary_min?.toLocaleString('de-DE')} - {job.salary_max?.toLocaleString('de-DE')}
                    <span className="text-gray-500 text-sm ml-1">{job.salary_currency || 'EUR'}</span>
                  </div>
                </div>
                <Euro className="w-10 h-10 text-emerald-500/30" />
              </div>
            )}
          </div>

          {/* Description */}
          {job.description && (
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Beschreibung</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{job.description}</p>
            </div>
          )}

          {/* Contact */}
          {(job.email || job.phone) && (
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Kontakt</h3>
              <div className="flex flex-wrap gap-3">
                {job.email && (
                  <a href={`mailto:${job.email}`}
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <Mail size={14} /> {job.email}
                  </a>
                )}
                {job.phone && (
                  <a href={`tel:${job.phone}`}
                    className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <Phone size={14} /> {job.phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Status Pipeline */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Status</h3>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(opt => {
                const active = opt.value === job.status
                return (
                  <button
                    key={opt.value}
                    onClick={() => updateJob(job.id, opt.value)}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: active ? `${opt.color}33` : 'rgba(255,255,255,0.03)',
                      color: active ? opt.color : '#9ca3af',
                      border: `1px solid ${active ? opt.color + '66' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Generate KI Bewerbung — primary CTA */}
          <div className="mb-4">
            <button
              onClick={async () => {
                if (!cv) {
                  selectJob(null)
                  navigate('/bewerbungen')
                  return
                }
                await generateApplication(job.id)
                selectJob(null)
                navigate('/bewerbungen')
              }}
              className="w-full px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                boxShadow: '0 4px 20px rgba(168,85,247,0.4)',
              }}
            >
              <Sparkles size={16} />
              {cv ? 'KI-Bewerbung erstellen (CV + Motivationsschreiben)' : 'CV hochladen, dann Bewerbung erstellen'}
            </button>
            {!cv && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Du brauchst erst einen Master-CV im KI-Bewerbung Bereich
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/5">
            <a
              href={job.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white transition-all hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, ${sourceColor}, ${sourceColor}cc)`,
                boxShadow: `0 4px 20px ${sourceColor}44`,
              }}
            >
              <ExternalLink size={16} /> Bei {job.source} ansehen
            </a>
            <button
              onClick={downloadPDF}
              className="px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-gray-300 hover:text-white border border-white/10 hover:bg-white/5 transition-all"
            >
              <Download size={16} /> PDF Export
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
