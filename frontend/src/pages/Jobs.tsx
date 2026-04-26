import React, { useEffect, useState } from 'react'
import { useJobStore } from '../store/useJobStore'
import { Filter, Search, ChevronLeft, ChevronRight, Sparkles, Star, MapPin, Building2, X } from 'lucide-react'

const SOURCE_COLORS: Record<string, string> = {
  linkedin: '#0077B5',
  xing:     '#026466',
  indeed:   '#2557A7',
  agentur:  '#1a6b3a',
}

const STATUS_COLORS: Record<string, string> = {
  en_cours:  '#3b82f6',
  envoye:    '#8b5cf6',
  entretien: '#f59e0b',
  refus:     '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  en_cours:  'In Bearbeitung',
  envoye:    'Beworben',
  entretien: 'Interview',
  refus:     'Abgelehnt',
}

const Jobs: React.FC = () => {
  const { jobs, totalJobs, currentPage, pageSize, loading, filters, setFilters, fetchJobs, selectJob, runAllAgents } = useJobStore()
  const [filterUI, setFilterUI] = useState({
    city: '', job_type: '', domain: '', status: '', source: '',
  })

  const totalPages = Math.max(1, Math.ceil(totalJobs / pageSize))

  useEffect(() => { fetchJobs(1) }, [filters])

  const apply = () => {
    const f: any = { days: 30 }
    Object.entries(filterUI).forEach(([k, v]) => { if (v) f[k] = v })
    setFilters(f)
  }

  const clear = () => {
    setFilterUI({ city: '', job_type: '', domain: '', status: '', source: '' })
    setFilters({ days: 30 })
  }

  const hasFilters = Object.values(filterUI).some(v => v)

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-white mb-2" style={{ lineHeight: 1.1 }}>
          Job-Pipeline,
        </h1>
        <h1 className="text-5xl font-bold mb-6" style={{
          lineHeight: 1.1, fontStyle: 'italic',
          background: 'linear-gradient(135deg, #10b981, #3b82f6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          zentralisiert.
        </h1>
        <p className="text-gray-400 text-lg max-w-xl">
          {totalJobs} {totalJobs === 1 ? 'Angebot' : 'Angebote'} in deiner Pipeline. Klicke auf eine Karte für Details.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-5 mb-6"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <Filter size={14} className="text-emerald-500" /> Filter
          </h2>
          {hasFilters && (
            <button onClick={clear} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
              <X size={12} /> Zurücksetzen
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
            <input
              type="text"
              placeholder="Stadt"
              value={filterUI.city}
              onChange={e => setFilterUI(p => ({ ...p, city: e.target.value }))}
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          <select value={filterUI.job_type}
            onChange={e => setFilterUI(p => ({ ...p, job_type: e.target.value }))}
            className="bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50">
            <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Alle Typen</option>
            <option value="werkstudent" style={{ background: '#1a1a1a', color: '#fff' }}>Werkstudent</option>
            <option value="praktikum" style={{ background: '#1a1a1a', color: '#fff' }}>Praktikum</option>
            <option value="vollzeit" style={{ background: '#1a1a1a', color: '#fff' }}>Vollzeit</option>
          </select>

          <input type="text" placeholder="Bereich"
            value={filterUI.domain}
            onChange={e => setFilterUI(p => ({ ...p, domain: e.target.value }))}
            className="bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50" />

          <select value={filterUI.status}
            onChange={e => setFilterUI(p => ({ ...p, status: e.target.value }))}
            className="bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50">
            <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k} style={{ background: '#1a1a1a', color: '#fff' }}>{v}</option>
            ))}
          </select>

          <select value={filterUI.source}
            onChange={e => setFilterUI(p => ({ ...p, source: e.target.value }))}
            className="bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50">
            <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Quelle</option>
            <option value="linkedin" style={{ background: '#1a1a1a', color: '#fff' }}>LinkedIn</option>
            <option value="xing" style={{ background: '#1a1a1a', color: '#fff' }}>XING</option>
            <option value="indeed" style={{ background: '#1a1a1a', color: '#fff' }}>Indeed</option>
            <option value="agentur" style={{ background: '#1a1a1a', color: '#fff' }}>Bundesagentur</option>
          </select>
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={apply}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
            Anwenden
          </button>
        </div>
      </div>

      {/* Jobs */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-6 animate-pulse"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="h-5 bg-white/5 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-white/5 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-white/5 rounded w-full mb-2"></div>
              <div className="h-3 bg-white/5 rounded w-4/5"></div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Pipeline ist leer</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Starte deine Agenten, um automatisch Jobs zu finden!
          </p>
          <button onClick={() => runAllAgents()}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #e85d3d, #f97316)' }}>
            Alle Agenten starten →
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
            {jobs.map(job => {
              const sourceCol = SOURCE_COLORS[job.source?.toLowerCase()] || '#6366f1'
              const statusCol = STATUS_COLORS[job.status] || '#6b7280'
              return (
                <div
                  key={job.id}
                  onClick={() => selectJob(job)}
                  className="group cursor-pointer relative rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${sourceCol}66` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)' }}
                >
                  {/* glow */}
                  <div className="absolute top-0 right-0 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-30 transition-opacity"
                    style={{ background: sourceCol }}></div>

                  <div className="relative">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                        style={{ background: `${sourceCol}22`, color: sourceCol }}>
                        {job.source}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star size={12} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                        <span className="text-xs font-bold text-yellow-400">{job.score.toFixed(1)}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-orange-400 transition-colors line-clamp-1">
                      {job.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1"><Building2 size={11} /> {job.company?.name || '—'}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>
                    </div>

                    {job.description && (
                      <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-4">{job.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-gray-400">
                          {job.job_type}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                          style={{ background: `${statusCol}22`, color: statusCol }}>
                          {STATUS_LABELS[job.status] || job.status}
                        </span>
                      </div>
                      {(job.salary_min || job.salary_max) && (
                        <span className="text-xs font-semibold text-emerald-400">
                          {job.salary_min?.toLocaleString('de-DE')}€+
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 py-4">
              <button onClick={() => fetchJobs(currentPage - 1)} disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft size={18} />
              </button>
              <div className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white">
                {currentPage} / {totalPages}
              </div>
              <button onClick={() => fetchJobs(currentPage + 1)} disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Jobs
