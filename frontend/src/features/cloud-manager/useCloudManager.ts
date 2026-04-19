import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Program {
  id: string;
  name: string;
}

interface Environment {
  id: string;
  programId: string;
  name: string;
}

interface LogOption {
  id: string;
  name: string;
}

interface CloudManagerState {
  programs: Program[];
  selectedProgramId: string | null;
  environments: Environment[];
  selectedEnvironmentId: string | null;
  logOptions: LogOption[];
  selectedLogOptions: string[];
  loading: boolean;
  error: string | null;
  setPrograms: (programs: Program[]) => void;
  selectProgram: (id: string) => void;
  setEnvironments: (environments: Environment[]) => void;
  selectEnvironment: (id: string) => void;
  setLogOptions: (logOptions: LogOption[]) => void;
  toggleLogOption: (id: string) => void;
}

export const useCloudManagerStore = create<CloudManagerState>()(
  persist(
    (set, get) => ({
      programs: [],
      selectedProgramId: null,
      environments: [],
      selectedEnvironmentId: null,
      logOptions: [],
      selectedLogOptions: [],
      loading: false,
      error: null,
      setPrograms: (programs) => set({ programs }),
      selectProgram: (id) => set({ selectedProgramId: id, environments: [], selectedEnvironmentId: null, logOptions: [] }),
      setEnvironments: (environments) => set({ environments }),
      selectEnvironment: (id) => set({ selectedEnvironmentId: id, logOptions: [] }),
      setLogOptions: (logOptions) => set({ logOptions }),
      toggleLogOption: (id) => {
        const { selectedLogOptions } = get();
        set({
          selectedLogOptions: selectedLogOptions.includes(id)
            ? selectedLogOptions.filter((x) => x !== id)
            : [...selectedLogOptions, id],
        });
      },
    }),
    { name: 'aem-cloud-manager' }
  )
);

export type { Program, Environment, LogOption };