import { useState, useEffect, useCallback } from 'react'

interface CachedLog {
  name: string
  path: string
  size: number
  mtime: string
}

export function LocalDownloadsPopover() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cachedLogs, setCachedLogs] = useState<CachedLog[]>([])

  const fetchCachedLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cloudmanager/cache/logs')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setCachedLogs(data)
        } else if (data?.files) {
          setCachedLogs(data.files)
        }
      }
    } catch {
      // ignore network errors, show empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) fetchCachedLogs()
  }, [open, fetchCachedLogs])

  return (
    <>
      <button
        className="local-downloads-trigger"
        onClick={() => setOpen(true)}
      >
        Local Downloads
      </button>

      {open && (
        <div className="local-downloads-backdrop" onClick={() => setOpen(false)}>
          <div
            className="local-downloads-dialog"
            data-testid="popover-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="local-downloads-popover-header">
              <h3>Cached Downloads</h3>
              <button onClick={() => setOpen(false)}>Close</button>
            </div>

            {loading ? (
              <div className="popover-loading-container" data-testid="popover-loading">Loading...</div>
            ) : cachedLogs.length === 0 ? (
              <div className="popover-body">
                <p className="popover-empty">No cached downloads found.</p>
              </div>
            ) : (
              <div className="popover-body">
                {cachedLogs.map((log) => (
                  <div key={log.path} className="cached-log-row">
                    <span className="cached-log-name">{log.name}</span>
                    <span className="cached-log-size">{(log.size / 1024 / 1024).toFixed(1)} MB</span>
                    <span className="cached-log-time">{new Date(log.mtime).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="local-downloads-actions">
              <button data-testid="popover-refresh" onClick={fetchCachedLogs}>Refresh</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}