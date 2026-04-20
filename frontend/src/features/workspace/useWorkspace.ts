import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SourceMode = 'local' | 'cloudmanager';
export type DashboardTab = 'events' | 'charts' | 'pinned' | 'live-tail';

interface WorkspaceState {
  sourceMode: SourceMode;
  activeTab: DashboardTab;
  setSourceMode: (mode: SourceMode) => void;
  setActiveTab: (tab: DashboardTab) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      sourceMode: 'local',
      activeTab: 'events',
      setSourceMode: (sourceMode) => set({ sourceMode }),
      setActiveTab: (activeTab) => set({ activeTab }),
    }),
    {
      name: 'aem-workspace-storage',
    }
  )
);
