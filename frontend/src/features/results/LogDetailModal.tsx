import React from 'react';

interface LogEvent {
  id: string;
  timestamp: string;
  level?: string;
  message?: string;
  raw?: string;
  [key: string]: any;
}

interface LogDetailModalProps {
  event: LogEvent | null;
  onClose: () => void;
}

export function LogDetailModal({ event, onClose }: LogDetailModalProps) {
  const [viewMode, setViewMode] = React.useState<'json' | 'raw'>('json');

  if (!event) return null;

  // Filter out internal fields if showing JSON
  const { id, raw, ...displayJson } = event;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content log-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Log Entry Detail</h3>
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
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="detail-meta">
            <span className={`level-badge ${event.level?.toUpperCase() || 'INFO'}`}>
              {event.level || 'INFO'}
            </span>
            <span className="event-time">{event.timestamp}</span>
          </div>

          <div className="detail-content">
            {viewMode === 'raw' ? (
              <pre className="raw-content-view">
                {event.raw || 'Original log line not available.'}
              </pre>
            ) : (
              <pre className="json-content-view">
                {JSON.stringify(displayJson, null, 2)}
              </pre>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="upload-btn secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
