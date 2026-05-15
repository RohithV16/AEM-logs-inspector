import { useState } from 'react'
import { useRawEventsQuery } from '../../api/hooks'
import type { RawEvent } from '../../types'

export function EventsList() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [pinned, setPinned] = useState<Set<string>>(new Set())

  const { data, isLoading, error } = useRawEventsQuery({
    filePath: '',
    page,
    perPage,
  })

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const togglePin = (id: string) => {
    setPinned((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyJson = (event: RawEvent) => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2))
  }

  if (isLoading) {
    return (
      <div className="events-list" data-testid="events-list">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="event-skeleton" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="events-list-error" data-testid="events-list">
        <p>Failed to load events. {(error as Error).message}</p>
        <button onClick={() => setPage(1)}>Retry</button>
      </div>
    )
  }

  if (!data || data.events.length === 0) {
    return (
      <div className="events-list-empty" data-testid="events-list">
        <p>No events found. Try adjusting your filters.</p>
      </div>
    )
  }

  const totalPages = data.totalPages || 1

  return (
    <div className="events-list" data-testid="events-list">
      <div className="events-list-header">
        <span>{data.total} events</span>
        <select
          data-testid="per-page"
          value={perPage}
          onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
        >
          {[50, 100, 150, 200].map((n) => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>
      </div>

      <div className="events-rows">
        {data.events.map((event) => (
          <div
            key={event.id}
            className={`event-row ${expanded.has(event.id) ? 'expanded' : ''}`}
          >
            <div className="event-header" onClick={() => toggleExpand(event.id)}>
              <span className={`event-level level-${event.level.toLowerCase()}`}>
                {event.level}
              </span>
              <span className="event-timestamp">{event.timestamp}</span>
              <span className="event-message">{event.message}</span>
              <div className="event-actions">
                <button
                  className="pin-btn"
                  onClick={(e) => { e.stopPropagation(); togglePin(event.id) }}
                >
                  {pinned.has(event.id) ? '\u2605' : '\u2606'}
                </button>
                <button
                  className="copy-btn"
                  onClick={(e) => { e.stopPropagation(); copyJson(event) }}
                >
                  Copy JSON
                </button>
              </div>
            </div>

            {expanded.has(event.id) && (
              <div className="event-detail">
                <div className="detail-tabs">
                  <div className="detail-tab active">Stack Trace</div>
                  <div className="detail-tab">JSON</div>
                </div>
                <pre className="detail-content">
                  {event.stackTrace || 'No stack trace available'}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pagination" data-testid="pagination">
        <button
          data-testid="pagination-prev"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          data-testid="pagination-next"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>
    </div>
  )
}
