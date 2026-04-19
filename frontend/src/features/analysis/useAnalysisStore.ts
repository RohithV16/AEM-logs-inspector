import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AnalysisState {
  currentFilePath: string | null;
  logType: 'error' | 'request' | 'cdn' | null;
  stats: any;
  setAnalysis: (filePath: string, logType: any, stats: any) => void;
  clearAnalysis: () => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({
      currentFilePath: null,
      logType: null,
      stats: null,
      setAnalysis: (currentFilePath, logType, stats) => set({ currentFilePath, logType, stats }),
      clearAnalysis: () => set({ currentFilePath: null, logType: null, stats: null }),
    }),
    {
      name: 'aem-analysis-storage',
    }
  )
);
