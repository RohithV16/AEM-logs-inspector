import { useMutation } from '@tanstack/react-query';

export interface AnalysisResult {
  success: boolean;
  error?: string;
}

export interface BatchInput {
  files: string[];
  logTypes: ('error' | 'request' | 'cdn')[];
}

async function analyzeFile(filePath: string): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath }),
  });
  return response.json();
}

export function useAnalysis() {
  return useMutation({
    mutationFn: analyzeFile,
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