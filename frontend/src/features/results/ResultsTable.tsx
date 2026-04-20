import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LevelFilter } from './LevelFilter';
import { SearchInput } from './SearchInput';
import { usePaginationStore } from './usePagination';
import { useFilterStore } from '../filters/useFilters';
import { useAnalysisStore } from '../analysis/useAnalysisStore';
import { EventExpansion } from './EventExpansion';
import { LogEvent, EventsResponse } from './types';

export function ResultsTable() {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const { page, perPage, setPage, setPerPage } = usePaginationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [level, setLevel] = useState<string>('ALL');
  
  const filters = useFilterStore();
  const { currentFilePath, logType: storeLogType, mergedResults } = useAnalysisStore();
  const setAvailableTokens = useFilterStore((state) => state.setAvailableTokens);

  const toggleEventExpansion = useCallback((eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, []);

  const isMerged = storeLogType === 'merged' && mergedResults;

  // Reset page to 1 when file changes
  useEffect(() => {
    if (currentFilePath) {
      setPage(1);
    }
  }, [currentFilePath, setPage]);

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
          method: filters.methods,
          httpStatus: filters.statuses,
          pod: filters.pods,
          cache: filters.cacheStatuses,
          clientCountry: filters.countries,
          pop: filters.pops,
          host: filters.hosts,
          url: filters.urls,
        })
      });
      const payload = await response.json() as EventsResponse;

      if (!response.ok) {
        throw new Error(`Failed to load events (HTTP ${response.status}).`);
      }
      if (!payload.success) {
        throw new Error(payload.error || 'Failed to load events.');
      }

      setAvailableTokens({
        packages: payload.packages,
        loggers: payload.loggers,
        threads: payload.threads,
        exceptions: payload.exceptions,
        methods: payload.methods,
        statuses: payload.statuses,
        pods: payload.pods,
        cacheStatuses: payload.cacheStatuses,
        countries: payload.countries,
        pops: payload.pops,
        hosts: payload.hosts,
      });

      return payload;
    },
    enabled: !isMerged,
    refetchOnMount: true,
    staleTime: 0,
  });

  const totalPages = isMerged 
    ? Math.ceil((mergedResults?.totalEntries || 0) / perPage)
    : Math.ceil((data?.total || 0) / perPage);
  const isCdn = isMerged ? mergedResults?.logTypesPresent.includes('cdn') : data?.logType === 'cdn';
  const isRequest = isMerged ? mergedResults?.logTypesPresent.includes('request') : data?.logType === 'request';

  const getEventsForPage = (): LogEvent[] => {
    if (isMerged && mergedResults) {
      const start = (page - 1) * perPage;
      return mergedResults.entries.slice(start, start + perPage).map((entry: Record<string, unknown>) => ({
        ...entry,
        id: entry.timestamp as string,
      })) as LogEvent[];
    }
    return data?.events || [];
  };

  const events = isMerged ? getEventsForPage() : data?.events || [];

  // Extract filter tokens from merged results
  useEffect(() => {
    if (isMerged && mergedResults?.entries?.length > 0) {
      const entries = mergedResults.entries;
      const methods = [...new Set(entries.map((e: Record<string, unknown>) => e.method).filter(Boolean))] as string[];
      const statuses = [...new Set(entries.map((e: Record<string, unknown>) => e.status).filter(Boolean))] as number[];
      const pods = [...new Set(entries.map((e: Record<string, unknown>) => e.pod).filter(Boolean))] as string[];
      const hosts = [...new Set(entries.map((e: Record<string, unknown>) => e.host).filter(Boolean))] as string[];
      const cacheStatuses = [...new Set(entries.map((e: Record<string, unknown>) => e.cache).filter(Boolean))] as string[];
      const loggers = [...new Set(entries.map((e: Record<string, unknown>) => e.logger).filter(Boolean))] as string[];
      const urls = [...new Set(entries.map((e: Record<string, unknown>) => e.url || e.path).filter(Boolean))] as string[];
      
      setAvailableTokens({
        methods: methods.slice(0, 50),
        statuses: statuses.slice(0, 50).map(String),
        pods: pods.slice(0, 50),
        hosts: hosts.slice(0, 50),
        cacheStatuses: cacheStatuses.slice(0, 50),
        loggers: loggers.slice(0, 50),
        urls: urls.slice(0, 50),
      });
    }
  }, [isMerged, mergedResults]);

  return (
    <section id="eventsView" className="result-view-panel active">
      <div className="pagination-info">
        <div className="pagination-controls">
          <button className="upload-btn secondary compact" onClick={() => setPage(1)} disabled={page === 1}>« First</button>
          <button className="upload-btn secondary compact" onClick={() => setPage(page - 1)} disabled={page === 1}>‹ Prev</button>
          <span className="pagination-status">Page {page} of {totalPages || 1}</span>
          <button className="upload-btn secondary compact" onClick={() => setPage(page + 1)} disabled={page >= (totalPages || 1)}>Next ›</button>
          <button className="upload-btn secondary compact" onClick={() => setPage(totalPages || 1)} disabled={page >= (totalPages || 1)}>Last »</button>
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
          counts={isMerged 
            ? { ALL: (mergedResults?.combinedSummary.totalErrors || 0) + (mergedResults?.combinedSummary.totalWarnings || 0), ERROR: mergedResults?.combinedSummary.totalErrors || 0, WARN: mergedResults?.combinedSummary.totalWarnings || 0, INFO: 0 }
            : data?.levelCounts || { ALL: 0, ERROR: 0, WARN: 0, INFO: 0 }
          } 
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
            {events.map((event: LogEvent, idx: number) => {
              const eventId = event.id || `${event.timestamp}-${idx}`;
              const isExpanded = expandedEvents.has(eventId);
              return (
                <div key={eventId} className={`raw-event-wrapper ${isExpanded ? 'expanded' : ''}`}>
                  <div 
                    className={`raw-event clickable ${event.level?.toLowerCase() || 'info'}`}
                    onClick={() => toggleEventExpansion(eventId)}
                  >
                    <div className="raw-event-header">
                      <span className="event-time">{event.timestamp}</span>
                      {/* Log Type Badge for Merged View */}
                      {isMerged && (
                        <span className="level-badge TYPE">{event.logType?.toUpperCase()}</span>
                      )}
                      
                      {/* Error / Generic Log Badges */}
                      {(!isCdn && !isRequest && (!isMerged || event.logType === 'error')) && (
                        <span className={`level-badge ${event.level?.toUpperCase() || 'INFO'}`}>{event.level || 'INFO'}</span>
                      )}

                      {/* CDN Log Badges */}
                      {(isCdn || (isMerged && event.logType === 'cdn')) && (
                        <>
                          {event.cache && <span className={`level-badge ${event.cache === 'HIT' ? 'INFO' : 'WARN'}`}>{event.cache}</span>}
                          {event.method && <span className="level-badge INFO">{event.method}</span>}
                          {event.status && <span className={`level-badge ${Number(event.status) >= 400 ? 'ERROR' : 'INFO'}`}>{event.status}</span>}
                        </>
                      )}

                      {/* Request Log Badges */}
                      {(isRequest || (isMerged && event.logType === 'request')) && (
                        <>
                          {event.method && <span className="level-badge INFO">{event.method}</span>}
                          {event.status && <span className={`level-badge ${Number(event.status) >= 400 ? 'ERROR' : 'SUCCESS'}`}>{event.status}</span>}
                        </>
                      )}
                      <div className="event-message">
                        {(isCdn || (isMerged && event.logType === 'cdn')) && <strong style={{color: 'var(--color-primary)', marginRight: '8px'}}>{event.host}</strong>}
                        {event.message || event.url || event.path}
                        {isMerged && event.sourceFile && <span className="source-file-tag"> [{event.sourceFile}]</span>}
                        {isExpanded && <span className="expand-indicator">▼</span>}
                        {!isExpanded && <span className="expand-indicator">▶</span>}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <EventExpansion 
                      event={event} 
                      onClose={() => toggleEventExpansion(eventId)} 
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
