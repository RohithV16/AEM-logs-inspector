import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_RECENT_FILES = 10;

export interface AnalysisState {
  currentFilePath: string | null;
  logType: 'error' | 'request' | 'cdn' | null;
  stats: any;
  recentFiles: string[];
  setAnalysis: (filePath: string, logType: any, stats: any) => void;
  addRecentFile: (filePath: string) => void;
  removeRecentFile: (filePath: string) => void;
  clearRecentFiles: () => void;
  clearAnalysis: () => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({
      currentFilePath: null,
      logType: null,
      stats: null,
      recentFiles: [],
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
    }),
    {
      name: 'aem-analysis-storage',
    }
  )
);
