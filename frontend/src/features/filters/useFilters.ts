import { create } from 'zustand';

export interface FilterState {
  dateRange: { start: string; end: string };
  logType: 'error' | 'request' | 'cdn' | 'all';
  packages: string[];
  loggers: string[];
  threads: string[];
  exceptions: string[];
  methods: string[];
  statuses: string[];
  pods: string[];
  cacheStatuses: string[];
  countries: string[];
  pops: string[];
  hosts: string[];
  urls: string[];
  category: string;
  advancedRules: { field: string; op: string; value: string }[];
  
  availablePackages: string[];
  availableLoggers: string[];
  availableThreads: string[];
  availableExceptions: string[];
  availableMethods: string[];
  availableStatuses: string[];
  availablePods: string[];
  availableCacheStatuses: string[];
  availableCountries: string[];
  availablePops: string[];
  availableHosts: string[];
  availableUrls: string[];
  
  setDateRange: (range: { start: string; end: string }) => void;
  setLogType: (type: 'error' | 'request' | 'cdn' | 'all') => void;
  setCategory: (cat: string) => void;
  setAvailableTokens: (tokens: { 
    packages?: string[]; loggers?: string[]; threads?: string[]; exceptions?: string[];
    methods?: string[]; statuses?: string[]; pods?: string[];
    cacheStatuses?: string[]; countries?: string[]; pops?: string[]; hosts?: string[];
    urls?: string[];
  }) => void;
  
  addPackage: (pkg: string) => void;
  removePackage: (pkg: string) => void;
  addLogger: (logger: string) => void;
  removeLogger: (logger: string) => void;
  addThread: (thread: string) => void;
  removeThread: (thread: string) => void;
  addException: (exc: string) => void;
  removeException: (exc: string) => void;
  addMethod: (method: string) => void;
  removeMethod: (method: string) => void;
  addStatus: (status: string) => void;
  removeStatus: (status: string) => void;
  addPod: (pod: string) => void;
  removePod: (pod: string) => void;
  addCacheStatus: (cache: string) => void;
  removeCacheStatus: (cache: string) => void;
  addCountry: (country: string) => void;
  removeCountry: (country: string) => void;
  addPop: (pop: string) => void;
  removePop: (pop: string) => void;
  addHost: (host: string) => void;
  removeHost: (host: string) => void;
  
  addAdvancedRule: (rule: { field: string; op: string; value: string }) => void;
  removeAdvancedRule: (index: number) => void;
  clear: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  dateRange: { start: '', end: '' },
  logType: 'error',
  packages: [],
  loggers: [],
  threads: [],
  exceptions: [],
  methods: [],
  statuses: [],
  pods: [],
  cacheStatuses: [],
  countries: [],
  pops: [],
  hosts: [],
  urls: [],
  category: '',
  advancedRules: [],
  availablePackages: [],
  availableLoggers: [],
  availableThreads: [],
  availableExceptions: [],
  availableMethods: [],
  availableStatuses: [],
  availablePods: [],
  availableCacheStatuses: [],
  availableCountries: [],
  availablePops: [],
  availableHosts: [],
  availableUrls: [],

  setDateRange: (range) => set({ dateRange: range }),
  setLogType: (type) => set({ logType: type }),
  setCategory: (category) => set({ category }),
  setAvailableTokens: (tokens) => set((s) => ({
    availablePackages: tokens.packages ?? s.availablePackages,
    availableLoggers: tokens.loggers ?? s.availableLoggers,
    availableThreads: tokens.threads ?? s.availableThreads,
    availableExceptions: tokens.exceptions ?? s.availableExceptions,
    availableMethods: tokens.methods ?? s.availableMethods,
    availableStatuses: tokens.statuses ?? s.availableStatuses,
    availablePods: tokens.pods ?? s.availablePods,
    availableCacheStatuses: tokens.cacheStatuses ?? s.availableCacheStatuses,
    availableCountries: tokens.countries ?? s.availableCountries,
    availablePops: tokens.pops ?? s.availablePops,
    availableHosts: tokens.hosts ?? s.availableHosts,
    availableUrls: tokens.urls ?? s.availableUrls,
  })),
  addPackage: (pkg) => set((s) => ({ packages: [...new Set([...s.packages, pkg])] })),
  removePackage: (pkg) => set((s) => ({ packages: s.packages.filter((p) => p !== pkg) })),
  addLogger: (logger) => set((s) => ({ loggers: [...new Set([...s.loggers, logger])] })),
  removeLogger: (logger) => set((s) => ({ loggers: s.loggers.filter((l) => l !== logger) })),
  addThread: (thread) => set((s) => ({ threads: [...new Set([...s.threads, thread])] })),
  removeThread: (thread) => set((s) => ({ threads: s.threads.filter((t) => t !== thread) })),
  addException: (exc) => set((s) => ({ exceptions: [...new Set([...s.exceptions, exc])] })),
  removeException: (exc) => set((s) => ({ exceptions: s.exceptions.filter((e) => e !== exc) })),
  
  addMethod: (method) => set((s) => ({ methods: [...new Set([...s.methods, method])] })),
  removeMethod: (method) => set((s) => ({ methods: s.methods.filter((m) => m !== method) })),
  addStatus: (status) => set((s) => ({ statuses: [...new Set([...s.statuses, status])] })),
  removeStatus: (status) => set((s) => ({ statuses: s.statuses.filter((st) => st !== status) })),
  addPod: (pod) => set((s) => ({ pods: [...new Set([...s.pods, pod])] })),
  removePod: (pod) => set((s) => ({ pods: s.pods.filter((p) => p !== pod) })),
  
  addCacheStatus: (cache) => set((s) => ({ cacheStatuses: [...new Set([...s.cacheStatuses, cache])] })),
  removeCacheStatus: (cache) => set((s) => ({ cacheStatuses: s.cacheStatuses.filter((c) => c !== cache) })),
  addCountry: (country) => set((s) => ({ countries: [...new Set([...s.countries, country])] })),
  removeCountry: (country) => set((s) => ({ countries: s.countries.filter((c) => c !== country) })),
  addPop: (pop) => set((s) => ({ pops: [...new Set([...s.pops, pop])] })),
  removePop: (pop) => set((s) => ({ pops: s.pops.filter((p) => p !== pop) })),
  addHost: (host) => set((s) => ({ hosts: [...new Set([...s.hosts, host])] })),
  removeHost: (host) => set((s) => ({ hosts: s.hosts.filter((h) => h !== host) })),
  addUrl: (url: string) => set((s) => ({ urls: [...new Set([...s.urls, url])] })),
  removeUrl: (url: string) => set((s) => ({ urls: s.urls.filter((u) => u !== url) })),

  addAdvancedRule: (rule) => set((s) => ({ advancedRules: [...s.advancedRules, rule] })),
  removeAdvancedRule: (index) => set((s) => ({ advancedRules: s.advancedRules.filter((_, i) => i !== index) })),
  clear: () => set({ 
    packages: [], 
    loggers: [], 
    threads: [], 
    exceptions: [], 
    methods: [],
    statuses: [],
    pods: [],
    cacheStatuses: [],
    countries: [],
    pops: [],
    hosts: [],
    urls: [],
    category: '', 
    dateRange: { start: '', end: '' },
    advancedRules: []
  }),
}));