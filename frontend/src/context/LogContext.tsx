import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from 'react'
import type { FilterPayload, FilterMeta, CrossReferenceMap, RawEvent } from '../types'

interface LogContextValue {
  filePath: string
  setFilePath: (path: string) => void
  payload: FilterPayload
  setPayload: (p: FilterPayload) => void
  totalEvents: number
  setTotalEvents: (n: number) => void
  levelCounts: Record<string, number>
  setLevelCounts: (c: Record<string, number>) => void
  filterMeta: FilterMeta
  setFilterMeta: (m: FilterMeta) => void
  filteredFilterMeta: FilterMeta
  selectedFilters: Record<string, unknown>
  setSelectedFilters: (f: Record<string, unknown>) => void
  clearAllFilters: () => void
  pinnedEvents: RawEvent[]
  addPinnedEvent: (event: RawEvent) => void
  removePinnedEvent: (id: string) => void
}

const LogContext = createContext<LogContextValue | null>(null)

const AUTO_APPLY_DEBOUNCE_MS = 150

const emptyMeta = (): FilterMeta => ({
  packages: [], loggers: [], threads: [], exceptions: [], categories: [],
  packageThreads: {}, packageExceptions: {}, packageLoggers: {},
  loggerThreads: {}, loggerExceptions: {}, loggerPackages: {},
  threadPackages: {}, threadLoggers: {}, threadExceptions: {},
  exceptionPackages: {}, exceptionLoggers: {}, exceptionThreads: {}
})

function getSelectedArray(f: Record<string, unknown>, key: string): string[] {
  const v = f[key]
  if (Array.isArray(v)) return v as string[]
  if (typeof v === 'string' && v) return [v]
  return []
}

function intersectWithCrossRef(
  allOptions: { name: string; count: number }[],
  crossRef: CrossReferenceMap,
  selectedKeys: string[]
): Set<string> {
  if (!selectedKeys.length) return new Set(allOptions.map(o => o.name))
  const valid = new Set<string>()
  for (const sk of selectedKeys) {
    const map = crossRef[sk]
    if (map) Object.keys(map).forEach(k => valid.add(k))
  }
  return valid
}

function computeFilteredFilterMeta(
  filterMeta: FilterMeta,
  selectedFilters: Record<string, unknown>
): FilterMeta {
  const pkgSelected = getSelectedArray(selectedFilters, 'package')
  const loggerSelected = getSelectedArray(selectedFilters, 'logger')
  const threadSelected = getSelectedArray(selectedFilters, 'thread')
  const excSelected = getSelectedArray(selectedFilters, 'exception')

  const noSelections = !pkgSelected.length && !loggerSelected.length && !threadSelected.length && !excSelected.length
  if (noSelections) return filterMeta

  let validPackages = new Set(filterMeta.packages.map(p => p.name))
  let validLoggers = new Set(filterMeta.loggers.map(l => l.name))
  let validThreads = new Set(filterMeta.threads.map(t => t.name))
  let validExceptions = new Set(filterMeta.exceptions.map(e => e.name))

  function intersectSets(a: Set<string>, b: Set<string>): Set<string> {
    if (!a.size) return b
    if (!b.size) return a
    return new Set([...a].filter(x => b.has(x)))
  }

  if (pkgSelected.length) {
    validLoggers = intersectSets(validLoggers, intersectWithCrossRef(filterMeta.loggers, filterMeta.packageLoggers, pkgSelected))
    validThreads = intersectSets(validThreads, intersectWithCrossRef(filterMeta.threads, filterMeta.packageThreads, pkgSelected))
    validExceptions = intersectSets(validExceptions, intersectWithCrossRef(filterMeta.exceptions, filterMeta.packageExceptions, pkgSelected))
  }
  if (loggerSelected.length) {
    validPackages = intersectSets(validPackages, intersectWithCrossRef(filterMeta.packages, filterMeta.loggerPackages, loggerSelected))
    validThreads = intersectSets(validThreads, intersectWithCrossRef(filterMeta.threads, filterMeta.loggerThreads, loggerSelected))
    validExceptions = intersectSets(validExceptions, intersectWithCrossRef(filterMeta.exceptions, filterMeta.loggerExceptions, loggerSelected))
  }
  if (threadSelected.length) {
    validPackages = intersectSets(validPackages, intersectWithCrossRef(filterMeta.packages, filterMeta.threadPackages, threadSelected))
    validLoggers = intersectSets(validLoggers, intersectWithCrossRef(filterMeta.loggers, filterMeta.threadLoggers, threadSelected))
    validExceptions = intersectSets(validExceptions, intersectWithCrossRef(filterMeta.exceptions, filterMeta.threadExceptions, threadSelected))
  }
  if (excSelected.length) {
    validPackages = intersectSets(validPackages, intersectWithCrossRef(filterMeta.packages, filterMeta.exceptionPackages, excSelected))
    validLoggers = intersectSets(validLoggers, intersectWithCrossRef(filterMeta.loggers, filterMeta.exceptionLoggers, excSelected))
    validThreads = intersectSets(validThreads, intersectWithCrossRef(filterMeta.threads, filterMeta.exceptionThreads, excSelected))
  }

  pkgSelected.forEach(p => validPackages.add(p))
  loggerSelected.forEach(l => validLoggers.add(l))
  threadSelected.forEach(t => validThreads.add(t))
  excSelected.forEach(e => validExceptions.add(e))

  return {
    ...filterMeta,
    packages: filterMeta.packages.filter(p => validPackages.has(p.name)),
    loggers: filterMeta.loggers.filter(l => validLoggers.has(l.name)),
    threads: filterMeta.threads.filter(t => validThreads.has(t.name)),
    exceptions: filterMeta.exceptions.filter(e => validExceptions.has(e.name)),
    categories: filterMeta.categories
  }
}

function loadPinnedEvents(): RawEvent[] {
  try {
    const stored = localStorage.getItem('aem_pinnedEvents')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function savePinnedEvents(events: RawEvent[]) {
  localStorage.setItem('aem_pinnedEvents', JSON.stringify(events))
}

export function LogProvider({ children }: { children: ReactNode }) {
  const [filePath, setFilePath] = useState('')
  const [payload, setPayload] = useState<FilterPayload>({ filePath: '', filters: {} })
  const [totalEvents, setTotalEvents] = useState(0)
  const [levelCounts, setLevelCounts] = useState<Record<string, number>>({})
  const [filterMeta, setFilterMeta] = useState<FilterMeta>(emptyMeta())
  const [selectedFilters, setSelectedFilters] = useState<Record<string, unknown>>({})
  const [pinnedEvents, setPinnedEvents] = useState<RawEvent[]>(loadPinnedEvents)
  const autoApplyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addPinnedEvent = useCallback((event: RawEvent) => {
    setPinnedEvents((prev) => {
      if (prev.some((e) => e.id === event.id)) return prev
      const next = [...prev, event]
      savePinnedEvents(next)
      return next
    })
  }, [])

  const removePinnedEvent = useCallback((id: string) => {
    setPinnedEvents((prev) => {
      const next = prev.filter((e) => e.id !== id)
      savePinnedEvents(next)
      return next
    })
  }, [])

  const filteredFilterMeta = useMemo(
    () => computeFilteredFilterMeta(filterMeta, selectedFilters),
    [filterMeta, selectedFilters]
  )

  const handleSetFilePath = useCallback((path: string) => {
    setFilePath(path)
    setPayload({ filePath: path, filters: {} })
    setSelectedFilters({})
  }, [])

  const handleSetPayload = useCallback((p: FilterPayload) => {
    setPayload(p)
  }, [])

  const clearAllFilters = useCallback(() => {
    setSelectedFilters({})
  }, [])

  useEffect(() => {
    if (!filePath) return
    if (autoApplyTimer.current) clearTimeout(autoApplyTimer.current)
    autoApplyTimer.current = setTimeout(() => {
      const filters: Record<string, unknown> = { ...selectedFilters }
      setPayload({ filePath, filters })
    }, AUTO_APPLY_DEBOUNCE_MS)
    return () => {
      if (autoApplyTimer.current) clearTimeout(autoApplyTimer.current)
    }
  }, [filePath, selectedFilters, setPayload])

  return (
    <LogContext.Provider
      value={{
        filePath,
        setFilePath: handleSetFilePath,
        payload,
        setPayload: handleSetPayload,
        totalEvents,
        setTotalEvents,
        levelCounts,
        setLevelCounts,
        filterMeta,
        setFilterMeta,
        filteredFilterMeta,
        selectedFilters,
        setSelectedFilters,
        clearAllFilters,
        pinnedEvents,
        addPinnedEvent,
        removePinnedEvent,
      }}
    >
      {children}
    </LogContext.Provider>
  )
}

export function useLogContext(): LogContextValue {
  const ctx = useContext(LogContext)
  if (!ctx) throw new Error('useLogContext must be used within LogProvider')
  return ctx
}
