import { useState, useRef, useEffect, useCallback } from 'react'

interface MultiSelectProps {
  label: string
  options: { name: string; count: number }[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
}

export function MultiSelect({ label, options, selected, onChange, placeholder = 'Select...' }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleOption = useCallback((name: string) => {
    const next = selected.includes(name)
      ? selected.filter(s => s !== name)
      : [...selected, name]
    onChange(next)
  }, [selected, onChange])

  const removeChip = useCallback((name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter(s => s !== name))
  }, [selected, onChange])

  const lookup = new Map(options.map(o => [o.name, o]))

  return (
    <div className="multi-select-wrapper" ref={containerRef}>
      <label className="filter-section-label">{label}</label>
      <button
        type="button"
        className="multi-select-trigger"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="multi-select-chips">
          {selected.length === 0 && (
            <span className="multi-select-placeholder">{placeholder}</span>
          )}
          {selected.slice(0, 3).map(name => (
            <span key={name} className="multi-select-chip">
              {name.length > 28 ? name.slice(0, 26) + '…' : name}
              <span className="multi-select-chip-remove" onClick={e => removeChip(name, e)}>&times;</span>
            </span>
          ))}
          {selected.length > 3 && (
            <span className="multi-select-chip multi-select-chip-more">+{selected.length - 3}</span>
          )}
        </div>
        <span className="multi-select-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="multi-select-dropdown">
          {options.length === 0 && (
            <div className="multi-select-empty">No options</div>
          )}
          {options.map(opt => (
            <label key={opt.name} className={`multi-select-item${selected.includes(opt.name) ? ' checked' : ''}`}>
              <input
                type="checkbox"
                checked={selected.includes(opt.name)}
                onChange={() => toggleOption(opt.name)}
              />
              <span className="multi-select-item-label">{opt.name}</span>
              <span className="multi-select-item-count">{lookup.get(opt.name)?.count ?? opt.count}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
