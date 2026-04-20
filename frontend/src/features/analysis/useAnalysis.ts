import { useMutation } from '@tanstack/react-query';
import { useAnalysisStore } from './useAnalysisStore';
import { useFilterStore } from '../filters/useFilters';
import { usePaginationStore } from '../results/usePagination';

export interface AnalysisResult {
  success: boolean;
  error?: string;
  logType?: string;
}

export interface BatchAnalysisResult {
  fileId: string;
  success: boolean;
  logType?: string;
  summary?: Record<string, unknown>;
  results?: Record<string, unknown>;
  timeline?: Record<string, unknown>;
  fileName?: string;
  originalPath?: string;
  error?: string;
}

export interface MergedAnalysisResult {
  success: boolean;
  merged: boolean;
  logTypesPresent: string[];
  combinedSummary: {
    totalErrors: number;
    totalWarnings: number;
    totalRequests: number;
    totalCdnRequests: number;
    totalLines: number;
    uniqueErrors: number;
    uniqueWarnings: number;
  };
  results: Array<{
    level: string;
    message: string;
    count: number;
  }>;
  timeline: Record<string, { ERROR: number; WARN: number; total: number }>;
  entries: Array<Record<string, unknown>>;
  totalEntries: number;
  fileCount: number;
  error?: string;
}

export interface BatchAnalysisResponse {
  success: boolean;
  results: BatchAnalysisResult[];
}

export interface BatchInput {
  files: string[];
  logTypes: ('error' | 'request' | 'cdn')[];
}

async function analyzeFile(filePath: string) {
  const response = await fetch('/api/filter/filter', {
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

async function analyzeBatch(filePaths: string[]) {
  const response = await fetch('/api/filter/analyze-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePaths }),
  });
  const payload = await response.json() as MergedAnalysisResult;

  if (!response.ok) {
    throw new Error(`Batch analysis request failed with status ${response.status}.`);
  }

  if (!payload.success) {
    throw new Error(payload.error || 'Batch analysis failed.');
  }

  return payload;
}

export function useAnalysis() {
  const setAnalysis = useAnalysisStore((s) => s.setAnalysis);
  const addRecentFile = useAnalysisStore((s) => s.addRecentFile);
  const clearFilters = useFilterStore((s) => s.clear);
  const setPage = usePaginationStore((s) => s.setPage);
  
  return useMutation({
    mutationFn: analyzeFile,
    onSuccess: (data, filePath) => {
      if (data.success) {
        setAnalysis(filePath, data.logType, data);
        addRecentFile(filePath);
        clearFilters();
        setPage(1);
      }
    }
  });
}

export function useBatchAnalysis() {
  const setAnalysis = useAnalysisStore((s) => s.setAnalysis);
  const setMergedResults = useAnalysisStore((s) => s.setMergedResults);
  const addRecentFile = useAnalysisStore((s) => s.addRecentFile);
  const clearFilters = useFilterStore((s) => s.clear);
  const setPage = usePaginationStore((s) => s.setPage);
  
  return useMutation({
    mutationFn: analyzeBatch,
    onSuccess: (data) => {
      if (data && data.merged) {
        setMergedResults(data);
        setAnalysis('Multiple Files', 'merged', data);
        addRecentFile('Multiple Files');
        clearFilters();
        setPage(1);
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
