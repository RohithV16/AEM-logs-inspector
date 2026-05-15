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

  if (!totalEvents || totalEvents === 0) return null

  const handleExportAll = () => {
    if (!payload) return
    csvMutation.mutate(payload)
    jsonMutation.mutate(payload)
    pdfMutation.mutate(payload)
  }

  return (
    <div className="export-bar" data-testid="export-bar">
      <button data-testid="export-csv" onClick={() => payload && csvMutation.mutate(payload)}>
        Export CSV
      </button>
      <button data-testid="export-json" onClick={() => payload && jsonMutation.mutate(payload)}>
        Export JSON
      </button>
      <button data-testid="export-pdf" onClick={() => payload && pdfMutation.mutate(payload)}>
        Export PDF
      </button>
      <button data-testid="export-all" className="export-all-btn" onClick={handleExportAll}>
        Export All
      </button>
    </div>
  )
}
