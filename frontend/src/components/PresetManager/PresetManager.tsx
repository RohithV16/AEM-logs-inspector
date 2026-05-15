import { useState } from 'react'
import type { FilterState, Preset } from '../../types'

interface PresetManagerProps {
  currentFilters: FilterState
  onLoadPreset: (filters: FilterState) => void
}

export function PresetManager({ currentFilters, onLoadPreset }: PresetManagerProps) {
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const stored = localStorage.getItem('filterPresets')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [showSave, setShowSave] = useState(false)
  const [presetName, setPresetName] = useState('')

  const savePreset = () => {
    if (!presetName.trim()) return
    const newPreset: Preset = { name: presetName.trim(), filters: { ...currentFilters } }
    const updated = [...presets, newPreset]
    setPresets(updated)
    localStorage.setItem('filterPresets', JSON.stringify(updated))
    setPresetName('')
    setShowSave(false)
  }

  const loadPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value
    if (!name) return
    const preset = presets.find((p) => p.name === name)
    if (preset) {
      onLoadPreset(preset.filters)
    }
  }

  return (
    <div className="preset-manager" data-testid="preset-select">
      <select onChange={loadPreset} defaultValue="">
        <option value="" disabled>Load preset...</option>
        {presets.map((p) => (
          <option key={p.name} value={p.name}>{p.name}</option>
        ))}
      </select>
      <button data-testid="save-preset" onClick={() => setShowSave((p) => !p)}>
        Save Preset
      </button>

      {showSave && (
        <div className="save-preset-form">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name"
            onKeyDown={(e) => { if (e.key === 'Enter') savePreset() }}
          />
          <button onClick={savePreset}>Save</button>
        </div>
      )}
    </div>
  )
}
