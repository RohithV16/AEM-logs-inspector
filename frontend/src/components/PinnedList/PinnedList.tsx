import { useMemo } from 'react'
import type { RawEvent } from '../../types'

interface PinnedListProps {
  events?: RawEvent[]
  onRemove?: (id: string) => void
}

export function PinnedList({ events = [], onRemove }: PinnedListProps) {
  const pinned = useMemo(() => {
    const stored = localStorage.getItem('aem_pinnedEvents')
    if (!stored) return events
    try {
      const parsed = JSON.parse(stored) as RawEvent[]
      return parsed.length > 0 ? parsed : events
    } catch {
      return events
    }
  }, [events])

  if (pinned.length === 0) {
    return (
      <div className="pinned-section" data-testid="pinned-section">
        <p>No pinned events. Pin events from the Events view.</p>
      </div>
    )
  }

  return (
    <div className="pinned-section" data-testid="pinned-section">
      <h3>Pinned Events ({pinned.length})</h3>
      {pinned.map((event) => (
        <div key={event.id} className="pinned-card">
          <span className={`event-level level-${event.level.toLowerCase()}`}>
            {event.level}
          </span>
          <span className="event-timestamp">{event.timestamp}</span>
          <span className="event-message">{event.message}</span>
          <button onClick={() => onRemove?.(event.id)}>Remove</button>
        </div>
      ))}
    </div>
  )
}
