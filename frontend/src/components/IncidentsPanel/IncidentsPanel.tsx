import { useState } from 'react'

interface Incident {
  id: string
  severity: 'ERROR' | 'WARN'
  timeRange: string
  sources: string[]
  eventCount: number
}

export function IncidentsPanel() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [incidents] = useState<Incident[]>(() => {
    try {
      const stored = localStorage.getItem('aem_incidents')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  if (incidents.length === 0) return null

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="incidents">
      <button
        className="incidents-toggle"
        data-testid="incident-badge"
        onClick={() => setOpen((p) => !p)}
      >
        Incidents ({incidents.length})
      </button>

      {open && (
        <div className="incidents-panel" data-testid="incident-panel">
          {incidents.map((inc) => (
            <div key={inc.id} className="incident-row">
              <div className="incident-header" onClick={() => toggleExpand(inc.id)}>
                <span className={`severity-pill severity-${inc.severity.toLowerCase()}`}>
                  {inc.severity}
                </span>
                <span className="incident-time">{inc.timeRange}</span>
                <span className="incident-count">{inc.eventCount} events</span>
              </div>
              {expanded.has(inc.id) && (
                <div className="incident-detail">
                  {inc.sources.map((src) => (
                    <div key={src} className="incident-source">{src}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
