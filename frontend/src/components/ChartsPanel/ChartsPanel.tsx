import { useFilterQuery } from '../../api/hooks'
import { useLogContext } from '../../context/LogContext'

export function ChartsPanel() {
  const { filePath } = useLogContext()
  const { data, isLoading, error } = useFilterQuery({ filePath, filters: {} }, !!filePath)

  if (isLoading) {
    return (
      <div className="charts-panel" data-testid="charts-panel">
        <div className="chart-skeleton" />
        <div className="chart-skeleton" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="charts-panel" data-testid="charts-panel">
        <p className="chart-error">Failed to load chart data. {(error as Error).message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="charts-panel" data-testid="charts-panel">
        <p>No chart data available for the current filters.</p>
      </div>
    )
  }

  return (
    <div className="charts-panel" data-testid="charts-panel">
      <div className="chart-container" data-testid="chart-timeline">
        <h3>Timeline</h3>
        {data.timeline && data.timeline.length > 0 ? (
          <div className="timeline-chart-placeholder">
            {data.timeline.map((t) => (
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
        {data.loggers && data.loggers.length > 0 ? (
          <ul className="logger-list">
            {data.loggers.map((l) => (
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
