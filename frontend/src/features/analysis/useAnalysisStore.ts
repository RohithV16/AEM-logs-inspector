import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_RECENT_FILES = 10;

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
}

export interface AnalysisState {
  currentFilePath: string | null;
  logType: 'error' | 'request' | 'cdn' | 'merged' | null;
  stats: any;
  recentFiles: string[];
  batchResults: BatchAnalysisResult[];
  activeBatchIndex: number;
  mergedResults: MergedAnalysisResult | null;
  setAnalysis: (filePath: string, logType: any, stats: any) => void;
  addRecentFile: (filePath: string) => void;
  removeRecentFile: (filePath: string) => void;
  clearRecentFiles: () => void;
  clearAnalysis: () => void;
  setBatchResults: (results: BatchAnalysisResult[]) => void;
  setActiveBatchIndex: (index: number) => void;
  clearBatchResults: () => void;
  setMergedResults: (results: MergedAnalysisResult) => void;
  clearMergedResults: () => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({
      currentFilePath: null,
      logType: null,
      stats: null,
      recentFiles: [],
      batchResults: [],
      activeBatchIndex: 0,
      mergedResults: null,
      setAnalysis: (currentFilePath, logType, stats) => set({ currentFilePath, logType, stats }),
      addRecentFile: (filePath) => set((state) => {
        const filtered = state.recentFiles.filter((p) => p !== filePath);
        const updated = [filePath, ...filtered].slice(0, MAX_RECENT_FILES);
        return { recentFiles: updated };
      }),
      removeRecentFile: (filePath) => set((state) => ({
        recentFiles: state.recentFiles.filter((p) => p !== filePath)
      })),
      clearRecentFiles: () => set({ recentFiles: [] }),
      clearAnalysis: () => set({ currentFilePath: null, logType: null, stats: null }),
      setBatchResults: (results) => set({ batchResults: results }),
      setActiveBatchIndex: (index) => set({ activeBatchIndex: index }),
      clearBatchResults: () => set({ batchResults: [], activeBatchIndex: 0 }),
      setMergedResults: (results) => set({ mergedResults: results }),
      clearMergedResults: () => set({ mergedResults: null }),
    }),
    {
      name: 'aem-analysis-storage',
    }
  )
);
