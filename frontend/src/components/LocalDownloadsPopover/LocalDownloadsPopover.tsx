import { useState } from 'react'

export function LocalDownloadsPopover() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  return (
    <>
      <button
        className="popover-trigger"
        onClick={() => { setOpen(true); setLoading(true); setTimeout(() => setLoading(false), 500) }}
      >
        Local Downloads
      </button>

      {open && (
        <div className="popover-backdrop" onClick={() => setOpen(false)}>
          <div
            className="popover-panel"
            data-testid="popover-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="popover-header">
              <h3>Cached Downloads</h3>
              <button onClick={() => setOpen(false)}>Close</button>
            </div>

            {loading ? (
              <div className="popover-loading" data-testid="popover-loading">Loading...</div>
            ) : (
              <div className="popover-body">
                <p className="popover-empty">No cached downloads found.</p>
              </div>
            )}

            <div className="popover-actions">
              <button data-testid="popover-refresh" onClick={() => setLoading(true)}>Refresh</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
