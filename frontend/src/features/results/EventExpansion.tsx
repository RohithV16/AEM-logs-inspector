import { useState } from 'react';

import { LogEvent } from './types';

interface EventExpansionProps {
  event: LogEvent;
  onClose: () => void;
}

export function EventExpansion({ event, onClose }: EventExpansionProps) {
  const [viewMode, setViewMode] = useState<'json' | 'raw'>('json');

  const { id, raw, ...displayJson } = event;

  return (
    <div className="event-expansion">
      <div className="expansion-header">
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'json' ? 'active' : ''}`}
            onClick={() => setViewMode('json')}
          >
            JSON View
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'raw' ? 'active' : ''}`}
            onClick={() => setViewMode('raw')}
          >
            Raw View
          </button>
        </div>
        <button className="expansion-close" onClick={onClose}>×</button>
      </div>
      
      <div className="expansion-content">
        {viewMode === 'raw' ? (
          <pre className="raw-content-view">
            {raw || 'Original log line not available.'}
          </pre>
        ) : (
          <div className="json-content">
            {Object.entries(displayJson).map(([key, value]) => (
              <div key={key} className="json-entry">
                <span className="json-key">{key}:</span>
                <span className="json-value">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}