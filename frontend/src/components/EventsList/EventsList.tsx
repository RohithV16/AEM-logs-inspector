import { useState, useEffect } from 'react'
import { useRawEventsQuery } from '../../api/hooks'
import { useLogContext } from '../../context/LogContext'
import type { RawEvent } from '../../types'

export function EventsList() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const { filePath, setTotalEvents, setLevelCounts, payload, pinnedEvents, addPinnedEvent, removePinnedEvent } = useLogContext()
  const pinned = new Set(pinnedEvents.map((e) => e.id))

  const { data, isLoading, error } = useRawEventsQuery({
    filePath,
    page,
    perPage,
    ...payload.filters,
  })

  useEffect(() => {
    if (data) {
      if (data.total !== undefined) {
        setTotalEvents(data.total)
      }
      if (data.levelCounts) {
        setLevelCounts(data.levelCounts)
      }
    }
  }, [data, setTotalEvents, setLevelCounts])

  const [activeTab, setActiveTab] = useState<Record<string, 'stack' | 'json'>>({})

  useEffect(() => {
    setExpanded(new Set())
    setActiveTab({})
  }, [filePath])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const togglePin = (event: RawEvent) => {
    if (pinned.has(event.id)) {
      removePinnedEvent(event.id)
    } else {
      addPinnedEvent(event)
    }
  }

  const copyJson = (event: RawEvent) => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2))
  }

  if (isLoading) {
    return (
      <div className="raw-events-section" data-testid="events-list">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="event-skeleton" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-message" data-testid="events-list">
        <p>Failed to load events. {(error as Error).message}</p>
        <button onClick={() => setPage(1)}>Retry</button>
      </div>
    )
  }

  if (!data || !Array.isArray(data.events) || data.events.length === 0) {
    return (
      <div className="empty-state" data-testid="events-list">
        <p>No events found. Try adjusting your filters.</p>
      </div>
    )
  }

  const totalPages = Math.max(1, data.totalPages || 1)

  return (
    <div className="raw-events-section" data-testid="events-list">
      <div className="pagination-header">
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
            className={`raw-event ${expanded.has(event.id) ? 'expanded' : ''}`}
          >
            <div className="raw-event-header" onClick={() => toggleExpand(event.id)}>
              <span className={`level-badge ${(event.level || 'INFO').toUpperCase()}`}>
                {event.level || '-'}
              </span>
              <span className="event-time">{event.timestamp || ''}</span>
              <span className="event-message">{event.message || event.url || ''}</span>
              <div className="event-actions">
                <button
                  className="raw-event-pin"
                  onClick={(e) => { e.stopPropagation(); togglePin(event) }}
                >
                  {pinned.has(event.id) ? '\u2605' : '\u2606'}
                </button>
                <button
                  className="copy-stack-btn"
                  onClick={(e) => { e.stopPropagation(); copyJson(event) }}
                >
                  Copy JSON
                </button>
              </div>
            </div>

            {expanded.has(event.id) && (
              <div className="event-details">
                <div className="event-details-tabs">
                  <div
                    className={'detail-tab' + (activeTab[event.id] === 'json' ? '' : ' active')}
                    onClick={(e) => { e.stopPropagation(); setActiveTab((prev) => ({ ...prev, [event.id]: 'stack' })) }}
                  >
                    Stack Trace
                  </div>
                  <div
                    className={'detail-tab' + (activeTab[event.id] === 'json' ? ' active' : '')}
                    onClick={(e) => { e.stopPropagation(); setActiveTab((prev) => ({ ...prev, [event.id]: 'json' })) }}
                  >
                    JSON
                  </div>
                </div>
                <pre className="detail-content">
                  {activeTab[event.id] === 'json'
                    ? JSON.stringify(event, null, 2)
                    : (event.stackTrace || 'No stack trace available')
                  }
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
