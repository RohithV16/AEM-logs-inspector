import { useState, useEffect } from 'react';
import { useFilterStore } from '../filters/useFilters';
import { 
  PackageTokenPicker, 
  LoggerTokenPicker, 
  ThreadTokenPicker, 
  ExceptionTokenPicker,
  MethodTokenPicker,
  StatusTokenPicker,
  PodTokenPicker,
  CacheStatusTokenPicker,
  CountryTokenPicker,
  PopTokenPicker,
  HostTokenPicker
} from '../filters/TokenPicker';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('aem_sidebarCollapsed') === '1';
  });

  const { 
    dateRange, setDateRange, 
    logType, setLogType, 
    category, setCategory,
    clear,
    advancedRules, addAdvancedRule, removeAdvancedRule
  } = useFilterStore();

  useEffect(() => {
    localStorage.setItem('aem_sidebarCollapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const handleApply = () => {
    // Logic to trigger re-fetch or apply filters
    console.log('Filters applied:', { dateRange, logType, category });
  };

  return (
    <aside id="sidebar" className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="filter-card">
        <div className="sidebar-header">
          <div className="sidebar-header-copy">
            <div className="sidebar-title-row">
              <h3>Filters</h3>
            </div>
          </div>
          <div className="sidebar-header-actions">
            <span className="filter-badge">Live</span>
            <button 
              className="sidebar-toggle-btn" 
              type="button" 
              onClick={() => setCollapsed(!collapsed)}
            >
              <span className="sidebar-toggle-icon">{collapsed ? '▶' : '◀'}</span>
              <span className="sidebar-toggle-label">{collapsed ? 'Expand' : 'Collapse'}</span>
            </button>
          </div>
        </div>

        {!collapsed && (
          <div id="sidebarBody" className="sidebar-body">
            {/* Filter Mode Selector (Sub-tabs) */}
            <div className="mixed-filter-tabs">
              {['error', 'request', 'cdn', 'all'].map((type) => (
                <button 
                  key={type}
                  type="button" 
                  className={`mixed-filter-tab ${logType === type ? 'active' : ''}`}
                  onClick={() => setLogType(type as any)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            <section className="filter-group">
              <div className="filter-section-header">
                <p className="filter-section-label">Date range</p>
              </div>
              <div className="date-range-group">
                <label className="date-field">
                  <span>From</span>
                  <input 
                    type="text" 
                    className="filter-input date-input" 
                    placeholder="YYYY-MM-DD HH:mm"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                </label>
                <label className="date-field">
                  <span>To</span>
                  <input 
                    type="text" 
                    className="filter-input date-input" 
                    placeholder="YYYY-MM-DD HH:mm"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </label>
              </div>
            </section>

            {/* General Log Filters */}
            <PackageTokenPicker />
            <LoggerTokenPicker />
            <ThreadTokenPicker />

            {/* Context-Specific Filters */}
            {logType === 'error' && (
              <>
                <ExceptionTokenPicker />
                <section className="filter-group">
                  <div className="filter-section-header">
                    <p className="filter-section-label">Category</p>
                  </div>
                  <select 
                    className="filter-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    <option value="replication">Replication</option>
                    <option value="sightly">Sightly / HTL</option>
                    <option value="query">JCR Query</option>
                    <option value="indexing">Oak Indexing</option>
                  </select>
                </section>
              </>
            )}

            {logType === 'request' && (
              <>
                <MethodTokenPicker />
                <StatusTokenPicker />
                <PodTokenPicker />
              </>
            )}

            {logType === 'cdn' && (
              <>
                <CacheStatusTokenPicker />
                <CountryTokenPicker />
                <PopTokenPicker />
                <HostTokenPicker />
              </>
            )}

            <div className="filter-actions">
              <button className="btn-apply" onClick={handleApply}>Apply filters</button>
              <button className="btn-clear secondary" onClick={clear}>Clear</button>
            </div>

            <section className="advanced-search-card filter-group">
              <div className="filter-section-header">
                <p className="filter-section-label">Advanced search</p>
              </div>
              <div className="advanced-search-rules">
                {advancedRules.map((rule, i) => (
                  <div key={i} className="search-rule">
                    <span>{rule.field} {rule.op} "{rule.value}"</span>
                    <button onClick={() => removeAdvancedRule(i)}>&times;</button>
                  </div>
                ))}
              </div>
              <div className="filter-actions">
                <button 
                  className="btn-apply" 
                  onClick={() => addAdvancedRule({ field: 'message', op: 'contains', value: '' })}
                >
                  Add rule
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </aside>
  );
}