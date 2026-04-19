import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCloudManagerStore, Program, Environment } from './useCloudManager';
import { CommandPreview } from './CommandPreview';

export function CloudManagerPanel() {
  const { selectedProgramId, selectedEnvironmentId, selectProgram, selectEnvironment } = useCloudManagerStore();

  const { data: programs } = useQuery({
    queryKey: ['cmPrograms'],
    queryFn: () => fetch('/api/cloudmanager/programs').then((r) => r.json()),
  });

  const { data: environments } = useQuery({
    queryKey: ['cmEnvironments', selectedProgramId],
    queryFn: () => fetch(`/api/cloudmanager/programs/${selectedProgramId}/environments`).then((r) => r.json()),
    enabled: !!selectedProgramId,
  });

  return (
    <div className="cloud-manager-panel">
      <label htmlFor="program-select">Program</label>
      <select
        id="program-select"
        value={selectedProgramId || ''}
        onChange={(e) => selectProgram(e.target.value)}
        name="program"
      >
        <option value="">Select Program</option>
        {(programs || []).map((p: Program) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <label htmlFor="environment-select">Environment</label>
      <select
        id="environment-select"
        value={selectedEnvironmentId || ''}
        onChange={(e) => selectEnvironment(e.target.value)}
        name="environment"
        disabled={!selectedProgramId}
      >
        <option value="">Select Environment</option>
        {(environments || []).map((e: Environment) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>

      <CommandPreview />
    </div>
  );
}