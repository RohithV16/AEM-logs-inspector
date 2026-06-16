import { useLogContext } from '../../context/LogContext'

export function PinnedList() {
  const { pinnedEvents, removePinnedEvent } = useLogContext()

  if (pinnedEvents.length === 0) {
    return (
      <div className="pinned-events-list" data-testid="pinned-section">
        <p>No pinned events. Pin events from the Events view.</p>
      </div>
    )
  }

  return (
    <div className="pinned-events-list" data-testid="pinned-section">
      <h3>Pinned Events ({pinnedEvents.length})</h3>
      {pinnedEvents.map((event) => (
        <div key={event.id} className="pinned-event-card">
          <span className={`level-badge ${event.level}`}>
            {event.level}
          </span>
          <span className="pinned-event-meta">{event.timestamp}</span>
          <span className="pinned-event-message">{event.message}</span>
          <button onClick={() => removePinnedEvent(event.id)}>Remove</button>
        </div>
      ))}
    </div>
  )
}