import { useQuery } from '@tanstack/react-query';
import { useCloudManagerStore, Program, Environment } from './useCloudManager';
import { CommandPreview } from './CommandPreview';

export function CloudManagerPanel() {
  const { selectedProgramId, selectedEnvironmentId, selectProgram, selectEnvironment } = useCloudManagerStore();

  const { data: programs, isLoading: loadingPrograms } = useQuery({
    queryKey: ['cmPrograms'],
    queryFn: () => fetch('/api/cloudmanager/programs').then((r) => r.json()),
  });

  const { data: environments, isLoading: loadingEnvs } = useQuery({
    queryKey: ['cmEnvironments', selectedProgramId],
    queryFn: () => fetch(`/api/cloudmanager/programs/${selectedProgramId}/environments`).then((r) => r.json()),
    enabled: !!selectedProgramId,
  });

  return (
    <div className="cloudmanager-tab-pane active" id="cmTab-download">
      <div className="cloudmanager-cache-status">
        Programs and environments load live from AEM Cloud Manager.
      </div>
      
      <div className="cloudmanager-grid">
        <label className="cloudmanager-field">
          <span>Program</span>
          <select
            className="filter-select"
            value={selectedProgramId || ''}
            onChange={(e) => selectProgram(e.target.value)}
          >
            <option value="">{loadingPrograms ? 'Loading...' : 'Select program'}</option>
            {(programs || []).map((p: Program) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <small className="cloudmanager-hint">Programs load live via Adobe API.</small>
        </label>

        <label className="cloudmanager-field">
          <span>Environment</span>
          <select
            className="filter-select"
            value={selectedEnvironmentId || ''}
            onChange={(e) => selectEnvironment(e.target.value)}
            disabled={!selectedProgramId || loadingEnvs}
          >
            <option value="">{loadingEnvs ? 'Loading environments...' : 'Select environment'}</option>
            {(environments || []).map((e: Environment) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <small className="cloudmanager-hint">
            {selectedProgramId ? 'Select an environment to browse logs.' : 'Choose a program first.'}
          </small>
        </label>
      </div>

      <CommandPreview />
      
      <div className="upload-row cloudmanager-actions-row">
        <button className="upload-btn" disabled={!selectedEnvironmentId}>
          Download Selected Logs
        </button>
        <button className="tail-btn" disabled={!selectedEnvironmentId}>
          Tail Logs
        </button>
      </div>
    </div>
  );
}