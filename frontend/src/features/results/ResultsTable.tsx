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
  success?: boolean;
  events: LogEvent[];
  total: number;
  levelCounts?: { ALL: number; ERROR: number; WARN: number; INFO: number };
  logType: string;
  packages?: string[];
  loggers?: string[];
  threads?: string[];
  exceptions?: string[];
  methods?: string[];
  statuses?: string[];
  pods?: string[];
  cacheStatuses?: string[];
  countries?: string[];
  pops?: string[];
  hosts?: string[];
  error?: string;
}

export function ResultsTable() {
  const { page, perPage, setPage, setPerPage } = usePaginationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [level, setLevel] = useState<string>('ALL');
  
  const filters = useFilterStore();
  const { currentFilePath } = useAnalysisStore();
  const setAvailableTokens = useFilterStore((state) => state.setAvailableTokens);

  const { data, isLoading, isError, error } = useQuery<EventsResponse>({
    queryKey: ['rawEvents', currentFilePath, page, perPage, searchQuery, level, filters],
    queryFn: async () => {
      if (!currentFilePath) {
        return { success: true, events: [], total: 0, logType: 'default' };
      }
      
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
      const payload = await response.json() as EventsResponse;

      if (!response.ok) {
        throw new Error(`Failed to load events (HTTP ${response.status}).`);
      }
      if (!payload.success) {
        throw new Error(payload.error || 'Failed to load events.');
      }

      if (payload.packages || payload.loggers || payload.threads || payload.exceptions) {
        setAvailableTokens({
          packages: payload.packages,
          loggers: payload.loggers,
          threads: payload.threads,
          exceptions: payload.exceptions,
        });
      } else if (payload.methods || payload.statuses || payload.pods) {
        setAvailableTokens({
          methods: payload.methods,
          statuses: payload.statuses,
          pods: payload.pods,
        });
      } else if (payload.methods || payload.statuses || payload.cacheStatuses || payload.countries || payload.pops || payload.hosts) {
        setAvailableTokens({
          methods: payload.methods,
          statuses: payload.statuses,
          cacheStatuses: payload.cacheStatuses,
          countries: payload.countries,
          pops: payload.pops,
          hosts: payload.hosts,
        });
      }

      return payload;
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
        ) : isError ? (
          <div className="error-message">{error instanceof Error ? error.message : 'Failed to load events.'}</div>
        ) : (
          <div id="rawEvents">
            {(data?.events || []).map((event: LogEvent, idx: number) => (
              <div key={event.id || idx} className={`raw-event ${event.level?.toLowerCase() || 'info'}`}>
                <div className="raw-event-header">
                  <span className="event-time">{event.timestamp}</span>
                  {!isCdn && !isRequest && (
                    <span className={`level-badge ${event.level?.toUpperCase() || 'INFO'}`}>{event.level || 'INFO'}</span>
                  )}
                  {isCdn && (
                    <>
                      <span className={`level-badge ${event.cache === 'HIT' ? 'INFO' : event.cache === 'ERROR' ? 'ERROR' : 'WARN'}`}>{event.cache}</span>
                      <span className="level-badge INFO">{event.method}</span>
                      <span className={`level-badge ${Number(event.status) >= 400 ? 'ERROR' : 'INFO'}`}>{event.status}</span>
                    </>
                  )}
                  <div className="event-message">
                    {isCdn && <strong style={{color: 'var(--color-primary)', marginRight: '8px'}}>{event.host}</strong>}
                    {event.message || event.url}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
