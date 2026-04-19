import { create } from 'zustand';

export interface FilterState {
  dateRange: { start: string; end: string };
  logType: 'error' | 'request' | 'cdn' | 'all';
  packages: string[];
  loggers: string[];
  threads: string[];
  exceptions: string[];
  setDateRange: (range: { start: string; end: string }) => void;
  setLogType: (type: 'error' | 'request' | 'cdn' | 'all') => void;
  addPackage: (pkg: string) => void;
  removePackage: (pkg: string) => void;
  addLogger: (logger: string) => void;
  removeLogger: (logger: string) => void;
  addThread: (thread: string) => void;
  removeThread: (thread: string) => void;
  addException: (exc: string) => void;
  removeException: (exc: string) => void;
  clear: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  dateRange: { start: '', end: '' },
  logType: 'error',
  packages: [],
  loggers: [],
  threads: [],
  exceptions: [],
  setDateRange: (range) => set({ dateRange: range }),
  setLogType: (type) => set({ logType: type }),
  addPackage: (pkg) => set((s) => ({ packages: [...s.packages, pkg] })),
  removePackage: (pkg) => set((s) => ({ packages: s.packages.filter((p) => p !== pkg) })),
  addLogger: (logger) => set((s) => ({ loggers: [...s.loggers, logger] })),
  removeLogger: (logger) => set((s) => ({ loggers: s.loggers.filter((l) => l !== logger) })),
  addThread: (thread) => set((s) => ({ threads: [...s.threads, thread] })),
  removeThread: (thread) => set((s) => ({ threads: s.threads.filter((t) => t !== thread) })),
  addException: (exc) => set((s) => ({ exceptions: [...s.exceptions, exc] })),
  removeException: (exc) => set((s) => ({ exceptions: s.exceptions.filter((e) => e !== exc) })),
  clear: () => set({ packages: [], loggers: [], threads: [], exceptions: [] }),
}));