import React, { useEffect, useRef, useState } from 'react'
import { MapPin, AlertCircle } from 'lucide-react'
import { suggestCities, isValidGermanCity } from '../data/germanCities'

interface Props {
  value: string
  onChange: (next: string) => void
  placeholder?: string
}

export const CityAutocomplete: React.FC<Props> = ({ value, onChange, placeholder = 'z.B. Berlin' }) => {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSuggestions(suggestCities(value, 8))
    setHighlight(0)
  }, [value])

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  const valid = !value || isValidGermanCity(value)

  const pick = (city: string) => {
    onChange(city)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight(h => Math.min(h + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(suggestions[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: valid ? '#10b981' : '#ef4444' }} />
        <input
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full bg-black/20 border rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-all"
          style={{
            borderColor: valid ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.5)',
          }}
        />
      </div>

      {!valid && (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
          <AlertCircle size={12} />
          <span>Unbekannte Stadt — wähle eine aus der Liste</span>
        </div>
      )}

      {open && suggestions.length > 0 && (
        <div className="absolute z-30 mt-1 left-0 right-0 max-h-56 overflow-y-auto rounded-xl shadow-2xl"
          style={{ background: '#0b0e14', border: '1px solid rgba(255,255,255,0.08)' }}>
          {suggestions.map((city, i) => (
            <button
              key={city}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); pick(city) }}
              onMouseEnter={() => setHighlight(i)}
              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors"
              style={{
                background: i === highlight ? 'rgba(16,185,129,0.12)' : 'transparent',
                color: i === highlight ? '#10b981' : '#d1d5db',
              }}
            >
              <MapPin size={12} className="opacity-50" /> {city}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
