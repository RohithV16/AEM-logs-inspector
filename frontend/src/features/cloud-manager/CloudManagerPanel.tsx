import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCloudManagerStore, Program, Environment, LogOption } from './useCloudManager';
import { CommandPreview } from './CommandPreview';
import { useWorkspaceStore } from '../workspace/useWorkspace';
import { useToast } from '../../shared/components/useToast';
import { useAnalysisStore } from '../analysis/useAnalysisStore';
import { useFilterStore } from '../filters/useFilters';
import { FileSelectorModal } from '../analysis/FileSelectorModal';

interface ProgramsResponse {
  success: boolean;
  programs?: Program[];
  error?: string;
}

interface EnvironmentsResponse {
  success: boolean;
  environments?: Environment[];
  error?: string;
}

interface LogOptionsResponse {
  success: boolean;
  logOptions?: LogOption[];
  error?: string;
}

interface DownloadResponse {
  success: boolean;
  downloadedFilesDetailed?: Array<{
    filePath: string;
    fileName?: string;
    supported?: boolean;
    unsupportedReason?: string;
  }>;
  downloadedFiles?: string[];
  error?: string;
}

async function readJsonOrThrow(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    throw new Error(`${fallbackMessage} (HTTP ${response.status})`);
  }
  return response.json();
}

export function CloudManagerPanel() {
  const {
    selectedProgramId,
    selectedEnvironmentId,
    selectProgram,
    selectEnvironment,
    logOptions,
    selectedLogOptions,
    setLogOptions,
    toggleLogOption
  } = useCloudManagerStore();
  const setActiveTab = useWorkspaceStore((state) => state.setActiveTab);
  const addToast = useToast();
  const [showFileSelector, setShowFileSelector] = useState(false);

  const { data: programs = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ['cmPrograms'],
    queryFn: async () => {
      const response = await fetch('/api/cloudmanager/programs');
      const payload = await readJsonOrThrow(
        response,
        'Unable to load Cloud Manager programs.'
      ) as ProgramsResponse;
      if (!payload.success) {
        throw new Error(payload.error || 'Unable to load Cloud Manager programs.');
      }
      return payload.programs || [];
    }
  });

  const { data: environments = [], isLoading: loadingEnvs } = useQuery({
    queryKey: ['cmEnvironments', selectedProgramId],
    queryFn: async () => {
      const response = await fetch(`/api/cloudmanager/programs/${selectedProgramId}/environments`);
      const payload = await readJsonOrThrow(
        response,
        'Unable to load Cloud Manager environments.'
      ) as EnvironmentsResponse;
      if (!payload.success) {
        throw new Error(payload.error || 'Unable to load Cloud Manager environments.');
      }
      return payload.environments || [];
    },
    enabled: !!selectedProgramId,
  });

  const { isLoading: loadingLogOptions } = useQuery({
    queryKey: ['cmLogOptions', selectedProgramId, selectedEnvironmentId],
    queryFn: async () => {
      const response = await fetch(
        `/api/cloudmanager/environments/${selectedEnvironmentId}/log-options?programId=${selectedProgramId}`
      );
      const payload = await readJsonOrThrow(
        response,
        'Unable to load Cloud Manager log options.'
      ) as LogOptionsResponse;
      if (!payload.success) {
        throw new Error(payload.error || 'Unable to load Cloud Manager log options.');
      }
      const options = payload.logOptions || [];
      setLogOptions(options);
      return options;
    },
    enabled: Boolean(selectedProgramId && selectedEnvironmentId),
  });

  const selectedSelections = useMemo(
    () => logOptions
      .filter((option) => selectedLogOptions.includes(`${option.service}:${option.name}`))
      .map((option) => ({ service: option.service, logName: option.name })),
    [logOptions, selectedLogOptions]
  );

  const canRun = Boolean(selectedProgramId && selectedEnvironmentId && selectedSelections.length > 0);

  async function handleDownload() {
    if (!canRun) return;
    try {
      const response = await fetch('/api/cloudmanager/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: selectedProgramId,
          environmentId: selectedEnvironmentId,
          selections: selectedSelections
        })
      });

      const payload = await readJsonOrThrow(
        response,
        'Cloud Manager download failed.'
      ) as DownloadResponse;
      if (!payload.success) {
        addToast({ type: 'error', message: payload.error || 'Cloud Manager download failed.' });
        return;
      }

      const supportedFiles = (payload.downloadedFilesDetailed || []).filter((file) => file.supported !== false);
      if (supportedFiles.length === 0) {
        addToast({
          type: 'warning',
          message: 'Logs downloaded, but no supported files were found.'
        });
        return;
      }

      setShowFileSelector(true);
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Cloud Manager download failed.'
      });
    }
  }

  async function handleFileSelectionFromDownload(selectedPaths: string[]) {
    if (selectedPaths.length === 0) return;

    try {
      const response = await fetch('/api/filter/analyze-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePaths: selectedPaths })
      });
      const data = await response.json();

      if (data.success && data.results && data.results.length > 0) {
        const firstResult = data.results[0];
        if (firstResult.success) {
          const setAnalysis = useAnalysisStore.getState().setAnalysis;
          const addRecentFile = useAnalysisStore.getState().addRecentFile;
          const clearFilters = useFilterStore.getState().clear;
          
          setAnalysis(firstResult.fileName, firstResult.logType, firstResult);
          addRecentFile(firstResult.originalPath);
          clearFilters();
          setActiveTab('events');
          addToast({ type: 'success', message: 'Logs analyzed successfully.' });
        }
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Analysis failed.'
      });
    }
    
    setShowFileSelector(false);
  }

  function handleTailStart() {
    if (!canRun) return;
    setActiveTab('live-tail');
    addToast({ type: 'info', message: 'Switched to Live Tail. Click Start Tail to begin streaming.' });
  }

  return (
    <div className="cloudmanager-tab-pane active" id="cmTab-download">
      <div className="cloudmanager-cache-status">
        Programs and environments load live from AEM Cloud Manager.
      </div>
      
      <div className="cloudmanager-grid">
        <label className="cloudmanager-field">
          <span>Program</span>
          <select
            aria-label="Program"
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
            aria-label="Environment"
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

      <section className="filter-group">
        <div className="filter-section-header">
          <p className="filter-section-label">Log Options</p>
          <span className="filter-count">{selectedSelections.length} selected</span>
        </div>
        <div className={`cloudmanager-log-list ${!selectedEnvironmentId ? 'disabled' : ''}`}>
          {!selectedEnvironmentId && <span>Select an environment first.</span>}
          {selectedEnvironmentId && loadingLogOptions && <span>Loading log options...</span>}
          {selectedEnvironmentId && !loadingLogOptions && logOptions.length === 0 && (
            <span>No log options were returned for this environment.</span>
          )}
          {logOptions.map((option) => {
            const optionId = `${option.service}:${option.name}`;
            const checked = selectedLogOptions.includes(optionId);
            return (
              <label className="cloudmanager-log-option" key={optionId}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleLogOption(optionId)}
                />
                <div>
                  <strong>{option.service}</strong>
                  <span>{option.name}</span>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      <CommandPreview />
      
      <div className="upload-row cloudmanager-actions-row">
        <button className="upload-btn" disabled={!canRun} onClick={handleDownload}>
          Download Selected Logs
        </button>
        <button className="tail-btn" disabled={!canRun} onClick={handleTailStart}>
          Tail Logs
        </button>
      </div>

      <FileSelectorModal
        isOpen={showFileSelector}
        onClose={() => setShowFileSelector(false)}
        onAnalyze={handleFileSelectionFromDownload}
        title="Select Files to Analyze"
      />
    </div>
  );
}
