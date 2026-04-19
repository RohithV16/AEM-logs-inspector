import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LevelFilter } from './LevelFilter';
import { SearchInput } from './SearchInput';
import { usePaginationStore } from './usePagination';
import { useFilterStore } from '../filters/useFilters';
import { useAnalysisStore } from '../analysis/useAnalysisStore';

interface LogEvent {
  id: string;
  timestamp: string;
  level?: string;
  message?: string;
  // CDN fields
  host?: string;
  url?: string;
  status?: number;
  method?: string;
  cache?: string;
}

interface EventsResponse {
  events: LogEvent[];
  total: number;
  levelCounts?: { ALL: number; ERROR: number; WARN: number; INFO: number };
  logType: string;
}

export function ResultsTable() {
  const { page, perPage, setPage, setPerPage } = usePaginationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [level, setLevel] = useState<string>('ALL');
  
  const filters = useFilterStore();
  const { currentFilePath } = useAnalysisStore();

  const { data, isLoading } = useQuery<EventsResponse>({
    queryKey: ['rawEvents', currentFilePath, page, perPage, searchQuery, level, filters],
    queryFn: async () => {
      if (!currentFilePath) return { events: [], total: 0, logType: 'default' };
      
      const response = await fetch(`/api/raw-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: currentFilePath,
          page,
          perPage,
          search: searchQuery,
          level,
          from: filters.dateRange.start,
          to: filters.dateRange.end,
          logger: filters.loggers,
          thread: filters.threads,
          package: filters.packages,
          exception: filters.exceptions,
          category: filters.category,
          // Forward CDN/Request specific filters if needed
          host: filters.advancedRules.find(r => r.field === 'host')?.value,
          clientCountry: filters.advancedRules.find(r => r.field === 'country')?.value,
          cache: filters.advancedRules.find(r => r.field === 'cache')?.value,
        })
      });
      return response.json();
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / perPage);
  const isCdn = data?.logType === 'cdn';
  const isRequest = data?.logType === 'request';

  return (
    <section id="eventsView" className="result-view-panel active">
      <div className="pagination-info">
        <div className="pagination-controls">
          <button className="upload-btn secondary compact" onClick={() => setPage(1)} disabled={page === 1}>« First</button>
          <button className="upload-btn secondary compact" onClick={() => setPage(page - 1)} disabled={page === 1}>‹ Prev</button>
          <span className="pagination-status">Page {page} of {totalPages || 1}</span>
          <button className="upload-btn secondary compact" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>Next ›</button>
          <button className="upload-btn secondary compact" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>Last »</button>
        </div>
        <div className="per-page-selector">
          <span>Show:</span>
          <select 
            value={perPage} 
            onChange={(e) => setPerPage(parseInt(e.target.value))}
            className="filter-select compact"
          >
            {[50, 100, 150, 200].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>

      {!isCdn && !isRequest && (
        <LevelFilter 
          activeLevel={level} 
          onLevelChange={setLevel} 
          counts={data?.levelCounts || { ALL: 0, ERROR: 0, WARN: 0, INFO: 0 }} 
        />
      )}

      <SearchInput onSearch={setSearchQuery} />

      <div className="raw-events-section">
        {isLoading ? (
          <div className="loading-state">Loading events...</div>
        ) : (
          <div id="rawEvents">
            {(data?.events || []).map((event: LogEvent, idx: number) => (
              <div key={event.id || idx} className={`log-entry ${event.level?.toLowerCase() || 'info'}`}>
                <div className="log-header">
                  <span className="log-timestamp">{event.timestamp}</span>
                  {!isCdn && !isRequest && (
                    <span className={`level-chip ${event.level?.toLowerCase() || 'info'}`}>{event.level || 'INFO'}</span>
                  )}
                  {isCdn && (
                    <>
                      <span className={`level-chip ${event.cache === 'HIT' ? 'info' : 'warn'}`}>{event.cache}</span>
                      <span className="level-chip info">{event.method}</span>
                      <span className={`level-chip ${Number(event.status) >= 400 ? 'error' : 'info'}`}>{event.status}</span>
                    </>
                  )}
                </div>
                <div className="log-message">
                  {isCdn && <strong style={{color: 'var(--color-primary)', marginRight: '8px'}}>{event.host}</strong>}
                  {event.message || event.url}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}