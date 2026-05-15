import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { FilterPayload } from '../types'

interface LogContextValue {
  filePath: string
  setFilePath: (path: string) => void
  payload: FilterPayload
  setPayload: (p: FilterPayload) => void
  totalEvents: number
  setTotalEvents: (n: number) => void
}

const LogContext = createContext<LogContextValue | null>(null)

export function LogProvider({ children }: { children: ReactNode }) {
  const [filePath, setFilePath] = useState('')
  const [payload, setPayload] = useState<FilterPayload>({ filePath: '', filters: {} })
  const [totalEvents, setTotalEvents] = useState(0)

  const handleSetFilePath = useCallback((path: string) => {
    setFilePath(path)
    setPayload({ filePath: path, filters: {} })
  }, [])

  const handleSetPayload = useCallback((p: FilterPayload) => {
    setPayload(p)
  }, [])

  return (
    <LogContext.Provider
      value={{
        filePath,
        setFilePath: handleSetFilePath,
        payload,
        setPayload: handleSetPayload,
        totalEvents,
        setTotalEvents,
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
