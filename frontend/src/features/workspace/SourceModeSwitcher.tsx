import { useWorkspaceStore } from './useWorkspace';

export function SourceModeSwitcher() {
  const { sourceMode, setSourceMode } = useWorkspaceStore();

  return (
    <div className="source-mode-switch" role="tablist" aria-label="Analysis source mode">
      <button
        className={`source-mode-btn ${sourceMode === 'local' ? 'active' : ''}`}
        type="button"
        onClick={() => setSourceMode('local')}
        aria-selected={sourceMode === 'local'}
      >
        Local Path
      </button>
      <button
        className={`source-mode-btn ${sourceMode === 'cloudmanager' ? 'active' : ''}`}
        type="button"
        onClick={() => setSourceMode('cloudmanager')}
        aria-selected={sourceMode === 'cloudmanager'}
      >
        Cloud Manager
      </button>
    </div>
  );
}
