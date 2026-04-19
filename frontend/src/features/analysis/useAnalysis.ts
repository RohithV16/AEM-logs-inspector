import { useMutation } from '@tanstack/react-query';
import { useAnalysisStore } from './useAnalysisStore';
import { useFilterStore } from '../filters/useFilters';

export interface AnalysisResult {
  success: boolean;
  error?: string;
  logType?: string;
}

export interface BatchInput {
  files: string[];
  logTypes: ('error' | 'request' | 'cdn')[];
}

async function analyzeFile(filePath: string) {
  const response = await fetch('/api/filter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath, filters: {} }),
  });
  const payload = await response.json() as AnalysisResult & Record<string, unknown>;

  if (!response.ok) {
    throw new Error(`Analysis request failed with status ${response.status}.`);
  }

  if (!payload.success) {
    throw new Error(payload.error || 'Analysis failed.');
  }

  return payload;
}

export function useAnalysis() {
  const setAnalysis = useAnalysisStore((s) => s.setAnalysis);
  const addRecentFile = useAnalysisStore((s) => s.addRecentFile);
  const clearFilters = useFilterStore((s) => s.clear);
  
  return useMutation({
    mutationFn: analyzeFile,
    onSuccess: (data, filePath) => {
      if (data.success) {
        setAnalysis(filePath, data.logType, data);
        addRecentFile(filePath);
        clearFilters();
      }
    }
  });
}

export function parseBatchInput(input: string): BatchInput {
  const lines = input.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  const files = lines.map(normalizePath);
  const logTypes = files.map(detectLogType);
  return { files, logTypes };
}

function normalizePath(path: string): string {
  return path.replace(/^["']|["']$/g, '').replace(/\\/g, '/');
}

function detectLogType(path: string): 'error' | 'request' | 'cdn' {
  const lower = path.toLowerCase();
  if (/\.(error|err)$/.test(lower)) return 'error';
  if (/\.(access|request)$/.test(lower)) return 'request';
  if (/\.cdn$/.test(lower)) return 'cdn';
  return 'error';
}
