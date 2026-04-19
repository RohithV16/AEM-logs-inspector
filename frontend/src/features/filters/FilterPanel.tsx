import { useFilterStore } from './useFilters';

export function FilterPanel() {
  const { dateRange, setDateRange, logType, setLogType, clear } = useFilterStore();

  return (
    <div className="filter-panel">
      <fieldset>
        <legend>Date Range</legend>
        <label>
          From
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Log Type</legend>
        <label><input type="radio" name="logType" value="error" checked={logType === 'error'} onChange={() => setLogType('error')} /> Error</label>
        <label><input type="radio" name="logType" value="request" checked={logType === 'request'} onChange={() => setLogType('request')} /> Request</label>
        <label><input type="radio" name="logType" value="cdn" checked={logType === 'cdn'} onChange={() => setLogType('cdn')} /> CDN</label>
        <label><input type="radio" name="logType" value="all" checked={logType === 'all'} onChange={() => setLogType('all')} /> All</label>
      </fieldset>

      <button onClick={clear}>Clear Filters</button>
    </div>
  );
}