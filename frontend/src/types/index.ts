export interface LogEvent {
  timestamp: string
  level: string
  logger: string
  message: string
  thread?: string
  exception?: string
  method?: string
  status?: string
  responseTime?: number
  pod?: string
  cache?: string
  clientCountry?: string
  pop?: string
  host?: string
  ttfb?: number
}

export interface TimelineBucket {
  ERROR?: number
  WARN?: number
  requests?: number
  errors?: number
  slow?: number
  cacheHits?: number
  total?: number
}

export type TimelineData = Record<string, TimelineBucket>

export interface FilterOptions {
  packages: string[]
  loggers: string[]
  methods: string[]
  statuses: string[]
  pods: string[]
  countries: string[]
  pops: string[]
  hosts: string[]
  caches: string[]
}

export type LogType = 'error' | 'request' | 'cdn'
