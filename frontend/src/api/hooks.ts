import { useQuery, useMutation } from '@tanstack/react-query'
import { postFilter, postRawEvents, postExportCsv, postExportJson, postExportPdf } from './index'
import type { FilterPayload, RawEventsPayload } from '../types'

export function useFilterQuery(payload: FilterPayload, enabled = true) {
  return useQuery({
    queryKey: ['filter', payload],
    queryFn: () => postFilter(payload),
    enabled,
    staleTime: 10_000,
  })
}

export function useRawEventsQuery(params: RawEventsPayload) {
  return useQuery({
    queryKey: ['raw-events', params],
    queryFn: () => postRawEvents(params),
    enabled: !!params.filePath,
    staleTime: 5_000,
  })
}

export function useExportCsv() {
  return useMutation({
    mutationFn: (body: FilterPayload) => postExportCsv(body),
  })
}

export function useExportJson() {
  return useMutation({
    mutationFn: (body: FilterPayload) => postExportJson(body),
  })
}

export function useExportPdf() {
  return useMutation({
    mutationFn: (body: FilterPayload) => postExportPdf(body),
  })
}
