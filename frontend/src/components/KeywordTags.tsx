import React, { useState, KeyboardEvent } from 'react'
import { X, Tag, Plus } from 'lucide-react'

interface Props {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
}

export const KeywordTags: React.FC<Props> = ({
  value, onChange,
  placeholder = 'Tippe ein Keyword + Enter (z.B. Python)',
  maxTags = 15,
}) => {
  const [input, setInput] = useState('')

  const add = (raw: string) => {
    const t = raw.trim()
    if (!t) return
    if (value.length >= maxTags) return
    if (value.some(v => v.toLowerCase() === t.toLowerCase())) return
    onChange([...value, t])
    setInput('')
  }

  const remove = (idx: number) => {
    const next = value.slice()
    next.splice(idx, 1)
    onChange(next)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      // Remove last tag on backspace when input is empty
      remove(value.length - 1)
    }
  }

  // Allow paste of comma-separated lists ("Python, SAP, Cloud")
  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text')
    if (text.includes(',')) {
      e.preventDefault()
      text.split(',').forEach(t => add(t))
    }
  }

  const full = value.length >= maxTags

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 p-2 rounded-xl min-h-[44px] items-center"
        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
        {value.map((tag, i) => (
          <span key={i}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(59,130,246,0.18))',
              color: '#10b981',
              border: '1px solid rgba(16,185,129,0.3)',
            }}>
            <Tag size={10} />
            {tag}
            <button type="button" onClick={() => remove(i)}
              className="ml-0.5 -mr-1 p-0.5 rounded hover:bg-white/10 text-emerald-300/70 hover:text-white transition-colors"
              title="Entfernen">
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => input && add(input)}
          placeholder={value.length === 0 ? placeholder : full ? 'Maximum erreicht' : '+ Keyword'}
          disabled={full}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder-gray-600 px-2 py-1 focus:outline-none disabled:opacity-50"
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Plus size={11} /> Enter, Komma oder Tab zum Hinzufügen
        </span>
        <span className={value.length >= maxTags - 2 ? 'text-amber-400' : ''}>
          {value.length}/{maxTags}
        </span>
      </div>
    </div>
  )
}
