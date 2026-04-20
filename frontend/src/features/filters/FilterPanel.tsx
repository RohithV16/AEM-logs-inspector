import { useFilterStore } from './useFilters';
import { 
  PackageTokenPicker, 
  LoggerTokenPicker, 
  ThreadTokenPicker, 
  ExceptionTokenPicker 
} from './TokenPicker';

export function FilterPanel() {
  const { dateRange, setDateRange, logType, setLogType, clear } = useFilterStore();

  return (
    <div className="filter-sidebar">
      <div className="filter-group">
        <div className="filter-section-header">
          <p className="filter-section-label">Time Window</p>
        </div>
        <div className="filter-control-row stack">
          <label className="filter-label">
            From
            <input
              type="datetime-local"
              className="filter-input compact"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </label>
          <label className="filter-label">
            To
            <input
              type="datetime-local"
              className="filter-input compact"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </label>
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-section-header">
          <p className="filter-section-label">Log Type</p>
        </div>
        <div className="log-type-selector">
          {['error', 'request', 'cdn', 'all'].map((type) => (
            <button
              key={type}
              className={`type-btn ${logType === type ? 'active' : ''}`}
              onClick={() => setLogType(type as any)}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-scroll-area">
        <PackageTokenPicker />
        <LoggerTokenPicker />
        <ThreadTokenPicker />
        <ExceptionTokenPicker />
      </div>

      <div className="filter-footer">
        <button className="upload-btn secondary full-width" onClick={clear}>
          Clear All Filters
        </button>
      </div>
    </div>
  );
}