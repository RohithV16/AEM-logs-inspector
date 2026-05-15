export interface RawEvent {
  id: string
  timestamp?: string
  level: string
  message: string
  logger?: string
  threadName?: string
  stackTrace?: string
  exception?: string
  category?: string
  method?: string
  status?: number
  responseTime?: number
  url?: string
  cache?: string
  country?: string
  pop?: string
  host?: string
  ttfb?: number
  ttlb?: number
  pod?: string
  sourceFile?: string
  logType?: 'error' | 'request' | 'cdn'
}

export type LogType = 'error' | 'request' | 'cdn' | 'mixed'

export type Theme = 'system' | 'light' | 'dark'
