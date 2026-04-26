import React from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useJobStore } from '../store/useJobStore'

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
}

const COLORS = {
  success: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.4)', icon: '#22c55e' },
  error:   { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.4)', icon: '#ef4444' },
  info:    { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.4)', icon: '#3b82f6' },
}

export const Toasts: React.FC = () => {
  const { toasts, removeToast } = useJobStore()

  return (
    <div className="fixed top-20 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => {
        const Icon = ICONS[t.type]
        const c = COLORS[t.type]
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-md min-w-[280px] max-w-md animate-in slide-in-from-right duration-300"
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <Icon size={18} style={{ color: c.icon }} className="flex-shrink-0" />
            <span className="text-sm text-white flex-1 font-medium">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
