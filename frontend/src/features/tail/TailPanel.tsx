import { useVirtualizer } from '@tanstack/react-virtual';
import { useState, useRef } from 'react';
import { useTailSocket } from './useTailSocket';

export function TailPanel() {
  const { entries, connected, error, connect, disconnect, clear } = useTailSocket();
  const [autoScroll, setAutoScroll] = useState(true);
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });

  return (
    <div className="tail-panel">
      <div className="tail-status">
        <span className={connected ? 'connected' : 'disconnected'}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
        <button onClick={connected ? disconnect : connect}>
          {connected ? 'Stop' : 'Start'}
        </button>
        <button onClick={clear}>Clear</button>
        <label>
          <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
          Auto-scroll
        </label>
      </div>
      {error && <div className="tail-error">{error}</div>}
      <div ref={parentRef} className="tail-entries">
        <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => (
            <div key={virtualRow.key} style={{
              position: 'absolute', top: 0, left: 0, width: '100%',
              height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)`,
            }}>
              {entries[virtualRow.index]?.timestamp} {entries[virtualRow.index]?.level} {entries[virtualRow.index]?.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}