import React, { useEffect } from 'react'
import { useJobStore } from '../store/useJobStore'
import { Briefcase, Zap, TrendingUp, Activity } from 'lucide-react'

const Dashboard: React.FC = () => {
  const { stats, statsLoading, fetchStats } = useJobStore()

  useEffect(() => {
    fetchStats()
  }, [])

  if (statsLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">Dashboard wird geladen...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Jobs Insgesamt',
      value: stats.summary.total_jobs,
      icon: Briefcase,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0))'
    },
    {
      title: 'Heute hinzugefügt',
      value: stats.summary.today_jobs,
      icon: TrendingUp,
      color: '#22c55e',
      gradient: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0))'
    },
    {
      title: 'Diese Woche',
      value: stats.summary.week_jobs,
      icon: Activity,
      color: '#a855f7',
      gradient: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0))'
    },
    {
      title: 'Aktive Agenten',
      value: stats.summary.active_agents,
      icon: Zap,
      color: '#eab308',
      gradient: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0))'
    },
  ]

  return (
    <div>
      {/* Hero */}
      <div className="mb-12">
        <h1 className="text-5xl font-bold text-white mb-2" style={{ lineHeight: 1.1 }}>
          Überblick,
        </h1>
        <h1 className="text-5xl font-bold mb-6" style={{
          lineHeight: 1.1,
          fontStyle: 'italic',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          in Echtzeit.
        </h1>
        <p className="text-gray-400 text-lg max-w-xl">
          Analyse der Leistung deiner Agenten, Verteilung der Angebote nach Quelle und globale Statistiken.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div
              key={idx}
              className="relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-50"
                style={{ background: card.color, transform: 'translate(30%, -30%)' }}></div>
              
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">{card.title}</p>
                  <p className="text-4xl font-bold text-white">{card.value}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: card.gradient, border: `1px solid ${card.color}44` }}>
                  <Icon className="w-6 h-6" style={{ color: card.color }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts / Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* By Status */}
        <div className="rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            Verteilung nach Status
          </h2>
          <div className="space-y-5">
            {Object.entries(stats.by_status).map(([status, count]) => {
              const percent = stats.summary.total_jobs > 0 ? (count / stats.summary.total_jobs) * 100 : 0
              const statusLabels: Record<string, string> = {
                en_cours: 'In Bearbeitung',
                envoye: 'Gesendet',
                entretien: 'Interview',
                refus: 'Abgelehnt'
              }
              return (
                <div key={status}>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-gray-400 capitalize">{statusLabels[status] || status.replace('_', ' ')}</span>
                    <span className="text-white font-semibold">{count}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${percent}%`,
                        background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                        boxShadow: '0 0 10px rgba(59,130,246,0.5)'
                      }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* By Source */}
        <div className="rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            Jobs nach Quelle
          </h2>
          <div className="space-y-5">
            {Object.entries(stats.by_source).map(([source, count]) => {
              const percent = stats.summary.total_jobs > 0 ? (count / stats.summary.total_jobs) * 100 : 0
              return (
                <div key={source}>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-gray-400 capitalize">{source}</span>
                    <span className="text-white font-semibold">{count}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${percent}%`,
                        background: 'linear-gradient(90deg, #a855f7, #c084fc)',
                        boxShadow: '0 0 10px rgba(168,85,247,0.5)'
                      }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top Domains & Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Domains */}
        <div className="rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            Top Bereiche
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.top_domains)
              .sort((a, b) => b[1] - a[1])
              .map(([domain, count], idx) => (
                <div key={domain} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs font-bold w-4">{idx + 1}</span>
                    <span className="text-gray-200 font-medium text-sm">{domain}</span>
                  </div>
                  <span className="text-white bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-xs font-bold">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Top Locations */}
        <div className="rounded-2xl p-6 flex flex-col justify-between"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Top Standorte
            </h2>
            <div className="space-y-3">
              {Object.entries(stats.top_locations)
                .sort((a, b) => b[1] - a[1])
                .map(([location, count], idx) => (
                  <div key={location} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-xs font-bold w-4">{idx + 1}</span>
                      <span className="text-gray-200 font-medium text-sm">{location}</span>
                    </div>
                    <span className="text-white bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-bold">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Average Score */}
          <div className="mt-6 p-5 rounded-xl flex items-center justify-between relative overflow-hidden"
            style={{ border: '1px solid rgba(59,130,246,0.3)' }}>
            <div className="absolute inset-0 opacity-20"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #a855f7)' }}></div>
            <div className="relative z-10">
              <h3 className="text-white font-bold text-sm mb-1">Durchschnittlicher Score</h3>
              <p className="text-gray-400 text-xs">Über alle gefundenen Anzeigen</p>
            </div>
            <div className="relative z-10 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-transparent bg-clip-text"
                style={{ background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text' }}>
                {stats.summary.avg_score.toFixed(1)}
              </span>
              <span className="text-gray-500 text-sm font-bold">/10</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

