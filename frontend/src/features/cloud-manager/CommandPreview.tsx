import React from 'react';
import { useCloudManagerStore } from './useCloudManager';

export function CommandPreview() {
  const { selectedProgramId, selectedEnvironmentId, selectedLogOptions } = useCloudManagerStore();

  if (!selectedProgramId || !selectedEnvironmentId || selectedLogOptions.length === 0) {
    return null;
  }

  const command = [
    'aio cloudmanager:log-tail',
    `--programId ${selectedProgramId}`,
    `--environmentId ${selectedEnvironmentId}`,
    selectedLogOptions.map((o) => `--includes ${o}`).join(' '),
  ].join(' ');

  return <pre className="command-preview">{command}</pre>;
}