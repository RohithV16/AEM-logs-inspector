import { useCloudManagerStore } from './useCloudManager';

export function CommandPreview() {
  const { selectedProgramId, selectedEnvironmentId, selectedLogOptions, logOptions } = useCloudManagerStore();

  if (!selectedProgramId || !selectedEnvironmentId || selectedLogOptions.length === 0) {
    return null;
  }

  const selectedPairs = logOptions
    .filter((option) => selectedLogOptions.includes(`${option.service}:${option.name}`))
    .map((option) => `${option.service}/${option.name}`);

  const command = [
    'aio cloudmanager:log-tail',
    `--programId ${selectedProgramId}`,
    `--environmentId ${selectedEnvironmentId}`,
    ...selectedPairs.map((pair) => `--include ${pair}`)
  ].join(' ');

  return <pre className="cloudmanager-command-preview"><code>{command}</code></pre>;
}
