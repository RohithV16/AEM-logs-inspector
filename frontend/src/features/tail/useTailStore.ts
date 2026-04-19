import { create } from 'zustand';
import type { TailEntry } from './useTailSocket';

interface TailStore {
  entries: TailEntry[];
  connected: boolean;
  error: string | null;
  autoScroll: boolean;
  setEntries: (entries: TailEntry[]) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setAutoScroll: (autoScroll: boolean) => void;
}

export const useTailStore = create<TailStore>((set) => ({
  entries: [],
  connected: false,
  error: null,
  autoScroll: true,
  setEntries: (entries) => set({ entries }),
  setConnected: (connected) => set({ connected }),
  setError: (error) => set({ error }),
  setAutoScroll: (autoScroll) => set({ autoScroll }),
}));