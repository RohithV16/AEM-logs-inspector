import { useMutation } from '@tanstack/react-query';
import { useAnalysisStore } from './useAnalysisStore';

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
  return response.json();
}

export function useAnalysis() {
  const setAnalysis = useAnalysisStore((s) => s.setAnalysis);
  
  return useMutation({
    mutationFn: analyzeFile,
    onSuccess: (data, filePath) => {
      if (data.success) {
        setAnalysis(filePath, data.logType, data);
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