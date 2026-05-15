import type { AdvancedRule } from './api'

export interface FilterState {
  level?: string
  search?: string
  from?: string
  to?: string
  package?: string[]
  logger?: string[]
  thread?: string
  pod?: string
  exception?: string
  category?: string
  method?: string
  httpStatus?: number
  status?: number
  minResponseTime?: number
  maxResponseTime?: number
  cache?: string
  country?: string
  pop?: string
  host?: string
  minTtfb?: number
  maxTtfb?: number
  advancedRules?: AdvancedRule[]
}

export interface MixedFilters {
  error?: FilterState
  request?: FilterState
  cdn?: FilterState
}

export interface Preset {
  name: string
  filters: FilterState
  mixedFilters?: MixedFilters
}

export type ViewTab = 'events' | 'charts' | 'pinned' | 'tail'

export type SourceMode = 'local' | 'cloudmanager'
