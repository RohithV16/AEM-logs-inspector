import type { FilterState } from '../types'

export interface PdfSummary {
  fileName: string
  totalEvents: number
  filters: FilterState
  levelCounts: Record<string, number>
  generatedAt: string
}

export function buildPdfSummary(params: {
  fileName: string
  totalEvents: number
  filters: FilterState
  levelCounts?: Record<string, number>
}): PdfSummary {
  return {
    fileName: params.fileName,
    totalEvents: params.totalEvents,
    filters: params.filters,
    levelCounts: params.levelCounts || {},
    generatedAt: new Date().toISOString(),
  }
}
