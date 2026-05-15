import type { SourceMode } from '../../types'

interface SourcePanelProps {
  mode: SourceMode
  onModeChange: (m: SourceMode) => void
}

export function SourcePanel({ mode, onModeChange }: SourcePanelProps) {
  return (
    <div className="source-panel">
      <div className="source-mode-toggle">
        <button
          data-testid="source-mode-local"
          className={`source-mode-btn ${mode === 'local' ? 'active' : ''}`}
          onClick={() => onModeChange('local')}
        >
          Local
        </button>
        <button
          data-testid="source-mode-cloud"
          className={`source-mode-btn ${mode === 'cloudmanager' ? 'active' : ''}`}
          onClick={() => onModeChange('cloudmanager')}
        >
          Cloud Manager
        </button>
      </div>
    </div>
  )
}
