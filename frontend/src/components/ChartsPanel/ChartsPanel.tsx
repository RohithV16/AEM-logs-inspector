import { useMemo } from 'react'
import { useFilterQuery } from '../../api/hooks'
import { useLogContext } from '../../context/LogContext'

function toArray(obj: Record<string, number> | undefined | { name: string; count: number }[]): { name: string; count: number }[] {
  if (!obj) return []
  if (Array.isArray(obj)) return obj
  return Object.entries(obj).map(([name, count]) => ({ name, count }))
}

interface TimelineEntry { date: string; count: number }

function timelineToArray(timeline: unknown): TimelineEntry[] {
  if (!timeline) return []
  if (Array.isArray(timeline)) return timeline as TimelineEntry[]
  if (typeof timeline === 'object') {
    return Object.entries(timeline).map(([date, val]) => ({
      date,
      count: typeof val === 'number' ? val : (val as Record<string, number>)?.total ?? 0,
    }))
  }
  return []
}

export function ChartsPanel() {
  const { filePath } = useLogContext()
  const { data, isLoading, error } = useFilterQuery({ filePath, filters: {} }, !!filePath)

  const timeline = useMemo(() => timelineToArray(data?.timeline), [data?.timeline])
  const loggers = useMemo(() => toArray(data?.loggers), [data?.loggers])

  if (isLoading) {
    return (
      <div className="charts-section" data-testid="charts-panel">
        <div className="chart-skeleton" />
        <div className="chart-skeleton" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="charts-section" data-testid="charts-panel">
        <p className="chart-error">Failed to load chart data. {(error as Error).message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="charts-section" data-testid="charts-panel">
        <p>No chart data available for the current filters.</p>
      </div>
    )
  }

  return (
    <div className="charts-section" data-testid="charts-panel">
      <div className="chart-container" data-testid="chart-timeline">
        <h3>Timeline</h3>
        {timeline.length > 0 ? (
          <div className="timeline-chart-placeholder">
            {timeline.map((t) => (
              <div key={t.date} className="timeline-bar" style={{ height: `${Math.min(100, t.count)}px` }}>
                <span className="timeline-label">{t.date}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="chart-empty">Timeline data unavailable</p>
        )}
      </div>

      <div className="chart-container" data-testid="chart-loggers">
        <h3>Loggers</h3>
        {loggers.length > 0 ? (
          <ul className="logger-list">
            {loggers.map((l) => (
              <li key={l.name}>{l.name}: {l.count}</li>
            ))}
          </ul>
        ) : (
          <p className="chart-empty">No logger data</p>
        )}
      </div>
    </div>
  )
}
