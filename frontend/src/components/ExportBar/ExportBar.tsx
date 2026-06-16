import { useState } from 'react'
import { useExportCsv, useExportJson, useExportPdf } from '../../api/hooks'
import type { FilterPayload } from '../../types'

interface ExportBarProps {
  payload?: FilterPayload
  totalEvents?: number
}

export function ExportBar({ payload, totalEvents }: ExportBarProps) {
  const csvMutation = useExportCsv()
  const jsonMutation = useExportJson()
  const pdfMutation = useExportPdf()
  const [exporting, setExporting] = useState<string | null>(null)

  if (!totalEvents || totalEvents === 0) return null

  const runSequential = async () => {
    if (!payload) return
    setExporting('csv')
    try { await csvMutation.mutateAsync(payload) } catch { /* ignore */ }
    setExporting('json')
    try { await jsonMutation.mutateAsync(payload) } catch { /* ignore */ }
    setExporting('pdf')
    try { await pdfMutation.mutateAsync(payload) } catch { /* ignore */ }
    setExporting(null)
  }

  const isLoading = (type: string) => exporting === type || exporting === 'all'
  const isAnyLoading = exporting !== null

  return (
    <div className="export-row" data-testid="export-bar">
      <button
        data-testid="export-csv"
        className="export-btn"
        disabled={isAnyLoading}
        onClick={() => { if (payload) { setExporting('csv'); csvMutation.mutate(payload, { onSettled: () => setExporting(null) }) } }}
      >
        {isLoading('csv') ? 'Exporting...' : 'Export CSV'}
      </button>
      <button
        data-testid="export-json"
        className="export-btn"
        disabled={isAnyLoading}
        onClick={() => { if (payload) { setExporting('json'); jsonMutation.mutate(payload, { onSettled: () => setExporting(null) }) } }}
      >
        {isLoading('json') ? 'Exporting...' : 'Export JSON'}
      </button>
      <button
        data-testid="export-pdf"
        className="export-btn"
        disabled={isAnyLoading}
        onClick={() => { if (payload) { setExporting('pdf'); pdfMutation.mutate(payload, { onSettled: () => setExporting(null) }) } }}
      >
        {isLoading('pdf') ? 'Exporting...' : 'Export PDF'}
      </button>
      <button
        data-testid="export-all"
        className="export-btn"
        disabled={isAnyLoading}
        onClick={runSequential}
      >
        {exporting === 'csv' ? 'Exporting CSV...' :
         exporting === 'json' ? 'Exporting JSON...' :
         exporting === 'pdf' ? 'Exporting PDF...' :
         'Export All'}
      </button>
    </div>
  )
}