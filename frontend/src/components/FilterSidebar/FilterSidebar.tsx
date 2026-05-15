import { LevelChips } from './LevelChips'

export function FilterSidebar() {
  return (
    <div className="filter-sidebar" data-testid="filter-sidebar">
      <LevelChips />
      <div className="filter-group">
        <label>Package</label>
        <select multiple data-testid="package-select" className="filter-select">
          <option value="">Select packages...</option>
        </select>
      </div>
      <div className="filter-group">
        <label>Logger</label>
        <select multiple data-testid="logger-select" className="filter-select">
          <option value="">Select loggers...</option>
        </select>
      </div>
      <div className="filter-group">
        <label>Thread / Pod</label>
        <select data-testid="thread-select" className="filter-select">
          <option value="">Select thread...</option>
        </select>
      </div>
      <div className="filter-group">
        <label>Exception</label>
        <select data-testid="exception-select" className="filter-select">
          <option value="">Select exception...</option>
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
