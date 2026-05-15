import type { RawEvent } from './domain'

export interface FilterPayload {
  filePath: string
  filters: Record<string, unknown>
}

export interface RawEventsPayload {
  filePath: string
  page: number
  perPage: number
  search?: string
  from?: string
  to?: string
  level?: string
  logger?: string[]
  thread?: string
  pod?: string
  package?: string[]
  exception?: string
  category?: string
  method?: string
  httpStatus?: number
  minResponseTime?: number
  maxResponseTime?: number
  cache?: string
  clientCountry?: string
  pop?: string
  host?: string
  minTtfb?: number
  maxTtfb?: number
  advancedRules?: AdvancedRule[]
}

export interface AdvancedRule {
  field: string
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'gt' | 'gte' | 'lt' | 'lte' | 'in'
  value: string
}

export interface RawEventsResponse {
  success: boolean
  events: RawEvent[]
  total: number
  page: number
  perPage: number
  totalPages: number
  levelCounts?: Record<string, number>
}

export interface FilterResponse {
  success: boolean
  timeline?: { date: string; count: number }[]
  loggers?: { name: string; count: number }[]
  threads?: { name: string; count: number }[]
  packages?: { name: string; count: number }[]
  exceptions?: { name: string; count: number }[]
  hourly?: { hour: number; count: number }[]
  levelCounts?: Record<string, number>
}
