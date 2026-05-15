import type { FilterResponse, RawEventsResponse, RawEventsPayload } from '../types'

const BASE = '/api'

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export function postFilter(body: { filePath: string; filters: Record<string, unknown> }) {
  return post<FilterResponse>(`${BASE}/filter`, body)
}

export function postFilterBatch(body: { filePaths: string[]; filters: Record<string, unknown> }) {
  return post<FilterResponse>(`${BASE}/filter/batch`, body)
}

export function postRawEvents(params: RawEventsPayload) {
  return post<RawEventsResponse>(`${BASE}/raw-events`, params)
}

export function postRawEventsBatch(params: RawEventsPayload & { filePaths: string[] }) {
  return post<RawEventsResponse>(`${BASE}/raw-events/batch`, params)
}

async function downloadBlob(url: string, body: unknown, filename: string) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Export failed: ${res.status}`)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  a.click()
  URL.revokeObjectURL(objectUrl)
}

export function postExportCsv(body: { filePath: string; filters: Record<string, unknown> }) {
  return downloadBlob(`${BASE}/export/csv`, body, 'aem-log-errors.csv')
}

export function postExportJson(body: { filePath: string; filters: Record<string, unknown> }) {
  return downloadBlob(`${BASE}/export/json`, body, 'aem-log-errors.json')
}

export function postExportPdf(body: { filePath: string; filters: Record<string, unknown> }) {
  return downloadBlob(`${BASE}/export/pdf`, body, 'aem-log-summary.pdf')
}

export function startAnalysisSSE(
  body: { filePath: string; filters: Record<string, unknown> },
  onEvent: (data: unknown) => void,
): EventSource {
  const params = new URLSearchParams({ filePath: body.filePath, filters: JSON.stringify(body.filters) })
  const es = new EventSource(`${BASE}/analyze/stream?${params}`)
  es.onmessage = (e) => {
    try {
      onEvent(JSON.parse(e.data))
    } catch {
      onEvent(e.data)
    }
  }
  return es
}

export function startTailWebSocket(): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = import.meta.env.VITE_WS_URL || `${protocol}//${window.location.host}`
  return new WebSocket(wsUrl)
}
