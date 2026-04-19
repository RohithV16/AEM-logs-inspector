import { useVirtualizer } from '@tanstack/react-virtual';
import { useState, useRef, useEffect } from 'react';
import { useTailSocket } from './useTailSocket';

export function TailPanel() {
  const { entries, connected, error, connect, disconnect, clear } = useTailSocket();
  const [autoScroll, setAutoScroll] = useState(true);
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 15,
  });

  // Handle auto-scroll
  useEffect(() => {
    if (autoScroll && entries.length > 0) {
      virtualizer.scrollToIndex(entries.length - 1);
    }
  }, [entries.length, autoScroll, virtualizer]);

  return (
    <section id="tailPanel" className="tail-panel result-view-panel active">
      <div className="tail-header">
        <div className="tail-header-left">
          <div className={`tail-live-indicator ${connected ? 'active' : ''}`}>
            <span className="tail-live-dot"></span>
            <span className="tail-live-text">{connected ? 'Live' : 'Paused'}</span>
          </div>
          <h3 id="tailTitle">{connected ? 'Streaming Logs...' : 'Tail Stopped'}</h3>
        </div>
        <div className="tail-header-actions">
          <button 
            className={`tail-stop-btn ${!connected ? 'start' : ''}`} 
            onClick={connected ? disconnect : () => connect()}
          >
            {connected ? 'Stop Tail' : 'Start Tail'}
          </button>
        </div>
      </div>

      <div className="tail-controls">
        <div className="tail-action-row">
          <button 
            className={`tail-action-btn ${autoScroll ? 'active' : ''}`}
            onClick={() => setAutoScroll(!autoScroll)}
          >
            <span className="tail-action-icon">↓</span> Auto-scroll
          </button>
          <button className="tail-action-btn" onClick={clear}>Clear</button>
        </div>
      </div>

      {error && <div className="tail-status error">{error}</div>}

      <div 
        ref={parentRef} 
        className="tail-feed" 
        style={{ height: '600px', overflowY: 'auto', background: 'var(--bg-card)' }}
      >
        <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const entry = entries[virtualRow.index];
            return (
              <div 
                key={virtualRow.key} 
                className={`tail-entry ${entry.level.toLowerCase()}`}
                style={{
                  position: 'absolute', top: 0, left: 0, width: '100%',
                  height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="tail-entry-header">
                  <span className="entry-time">{entry.timestamp}</span>
                  <span className={`level-badge ${entry.level.toUpperCase()}`}>{entry.level}</span>
                  <span className="entry-message">{entry.message}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}