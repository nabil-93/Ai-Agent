import React, { useEffect, useState } from 'react'
import { Zap, Pause, Play, RefreshCw, Clock } from 'lucide-react'
import { useJobStore } from '../store/useJobStore'

function formatCountdown(target: Date | null): string {
  if (!target) return '—'
  const ms = target.getTime() - Date.now()
  if (ms <= 0) return 'jetzt'
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  if (min === 0) return `in ${sec}s`
  if (min < 60) return `in ${min}m ${sec.toString().padStart(2, '0')}s`
  const hr = Math.floor(min / 60)
  const m = min % 60
  return `in ${hr}h ${m}m`
}

export const SchedulerBadge: React.FC = () => {
  const { scheduler, fetchScheduler, triggerScheduler, pauseScheduler, resumeScheduler } = useJobStore()
  const [open, setOpen] = useState(false)
  const [tick, setTick] = useState(0)  // local tick to refresh countdown

  useEffect(() => {
    fetchScheduler()
    const poll = setInterval(fetchScheduler, 15000)   // refresh status every 15s
    const countdownTick = setInterval(() => setTick(t => t + 1), 1000)
    return () => { clearInterval(poll); clearInterval(countdownTick) }
  }, [])

  // Close popover on outside click
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-scheduler-badge]')) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [open])

  const status = scheduler
  const running = !!status?.running
  const enabled = !!status?.enabled
  const isWorking = !!status?.currently_running
  const nextRun = status?.next_run_at ? new Date(status.next_run_at) : null

  // Color/label based on state
  let dotColor = '#6b7280', label = 'Aus', statusLabel = 'Auto-Pilot inaktiv'
  if (isWorking)      { dotColor = '#f97316'; label = 'läuft jetzt'; statusLabel = 'Suche läuft...' }
  else if (running && enabled) { dotColor = '#22c55e'; label = formatCountdown(nextRun); statusLabel = 'Auto-Pilot aktiv' }
  else if (running && !enabled){ dotColor = '#eab308'; label = 'pausiert';  statusLabel = 'Auto-Pilot pausiert' }

  // Force re-render every second via tick (so countdown updates)
  void tick

  return (
    <div data-scheduler-badge className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-all"
        title={statusLabel}
      >
        <span className={`w-2 h-2 rounded-full ${isWorking ? 'animate-pulse' : ''}`}
          style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}88` }} />
        <span className="text-gray-300 text-xs font-bold uppercase tracking-wider hidden sm:inline">
          Auto-Pilot
        </span>
        <span className="text-xs font-semibold" style={{ color: dotColor }}>{label}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-2xl z-50 p-4"
          style={{
            background: 'linear-gradient(180deg, #0d1421 0%, #05070a 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-emerald-500" />
            <h3 className="text-sm font-bold text-white">Auto-Pilot</h3>
            <span className="ml-auto text-[10px] font-bold uppercase tracking-widest"
              style={{ color: dotColor }}>● {statusLabel}</span>
          </div>

          <div className="space-y-2 text-xs mb-4">
            <Row label="Intervall"   value={status ? `alle ${status.interval_minutes} min` : '—'} />
            <Row label="Nächster Lauf" value={formatCountdown(nextRun)} />
            <Row label="Läufe gesamt"  value={status?.run_count ?? 0} />
            <Row label="Übersprungen"  value={status?.skipped_count ?? 0} />
            {status?.last_result && (
              <Row label="Letztes Ergebnis"
                value={`${status.last_result.status === 'success' ? '✓' : '✗'} ${status.last_result.total_stored ?? 0} Jobs`}
                color={status.last_result.status === 'success' ? '#22c55e' : '#ef4444'} />
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerScheduler()}
              disabled={isWorking}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 text-emerald-400 hover:text-white hover:bg-emerald-500/20 border border-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={11} className={isWorking ? 'animate-spin' : ''} />
              {isWorking ? 'Läuft...' : 'Jetzt starten'}
            </button>
            {enabled ? (
              <button onClick={() => pauseScheduler()}
                className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 text-amber-400 hover:text-white hover:bg-amber-500/20 border border-amber-500/30 transition-all"
                title="Pausieren">
                <Pause size={11} />
              </button>
            ) : (
              <button onClick={() => resumeScheduler()}
                className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 text-blue-400 hover:text-white hover:bg-blue-500/20 border border-blue-500/30 transition-all"
                title="Fortsetzen">
                <Play size={11} />
              </button>
            )}
          </div>

          <p className="text-[10px] text-gray-600 mt-3 flex items-center gap-1">
            <Clock size={10} /> Der Auto-Pilot startet alle Hunter automatisch.
          </p>
        </div>
      )}
    </div>
  )
}

const Row: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color }) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-500">{label}</span>
    <span className="font-semibold" style={{ color: color || '#d1d5db' }}>{value}</span>
  </div>
)
