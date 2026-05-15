import { LevelChips } from './LevelChips'
import { useLogContext } from '../../context/LogContext'

export function FilterSidebar() {
  const { levelCounts, filterMeta } = useLogContext()

  return (
    <div className="filter-sidebar" data-testid="filter-sidebar">
      <LevelChips levelCounts={levelCounts} />
      <div className="filter-group">
        <label>Package</label>
        <select multiple data-testid="package-select" className="filter-select">
          {filterMeta.packages.length === 0 && <option value="">Select packages...</option>}
          {filterMeta.packages.map((p) => (
            <option key={p.name} value={p.name}>{p.name} ({p.count})</option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label>Logger</label>
        <select multiple data-testid="logger-select" className="filter-select">
          {filterMeta.loggers.length === 0 && <option value="">Select loggers...</option>}
          {filterMeta.loggers.map((l) => (
            <option key={l.name} value={l.name}>{l.name} ({l.count})</option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label>Thread / Pod</label>
        <select data-testid="thread-select" className="filter-select">
          {filterMeta.threads.length === 0 && <option value="">Select thread...</option>}
          {filterMeta.threads.map((t) => (
            <option key={t.name} value={t.name}>{t.name} ({t.count})</option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label>Exception</label>
        <select data-testid="exception-select" className="filter-select">
          {filterMeta.exceptions.length === 0 && <option value="">Select exception...</option>}
          {filterMeta.exceptions.map((e) => (
            <option key={e.name} value={e.name}>{e.name} ({e.count})</option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label>Category</label>
        <select data-testid="category-select" className="filter-select">
          <option value="">All categories</option>
          <option>Sling</option>
          <option>OSGi</option>
          <option>Replication</option>
          <option>JCR</option>
          <option>Oak</option>
          <option>Security</option>
          <option>Performance</option>
          <option>Configuration</option>
          <option>Workflow</option>
          <option>Search</option>
          <option>Other</option>
        </select>
      </div>
    </div>
  )
}
