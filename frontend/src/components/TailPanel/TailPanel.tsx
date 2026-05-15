import { useState, useRef, useCallback, useEffect } from 'react'
import { useWebSocket } from '../../hooks/useWebSocket'
import { isSafeRegexSync } from '../../utils/regex'
import { LevelChips } from '../FilterSidebar/LevelChips'

interface TailEntry {
  id: number
  level: string
  timestamp: string
  message: string
  source?: string
  stackTrace?: string
}

const MAX_BUFFER = 500

export function TailPanel() {
  const [entries, setEntries] = useState<TailEntry[]>([])
  const [search, setSearch] = useState('')
  const [regexMode, setRegexMode] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const [levelFilter, setLevelFilter] = useState<string | undefined>()
  const [newCount, setNewCount] = useState(0)
  const feedRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)

  const handleMessage = useCallback((data: string) => {
    try {
      const entry = JSON.parse(data) as TailEntry
      if (!entry.id) entry.id = ++idRef.current
      setEntries((prev) => {
        const next = [...prev, entry]
        return next.length > MAX_BUFFER ? next.slice(next.length - MAX_BUFFER) : next
      })
      setNewCount((c) => c + 1)
    } catch {
      // non-JSON message, ignore
    }
  }, [])

  const { status } = useWebSocket({
    url: import.meta.env.VITE_WS_URL || `ws://localhost:3000`,
    onMessage: handleMessage,
  })

  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
      setNewCount(0)
    }
  }, [entries, autoScroll])

  const filtered = entries.filter((e) => {
    if (levelFilter && e.level !== levelFilter) return false
    if (!search) return true
    if (regexMode) {
      const safe = isSafeRegexSync(search)
      if (!safe.ok) return false
      try {
        return new RegExp(search, 'i').test(e.message)
      } catch {
        return false
      }
    }
    return e.message.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="tail-panel" data-testid="tail-panel">
      <div className="tail-header">
        <span className="tail-status">
          {status === 'connecting' ? 'Connecting...' :
           status === 'connected' ? `Connected (${entries.length} entries)` :
           'Disconnected. Retrying...'}
        </span>
        <LevelChips levelCounts={undefined} onLevelChange={setLevelFilter} />
      </div>

      <div className="tail-toolbar">
        <input
          data-testid="tail-search"
          type="text"
          placeholder="Filter tail entries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          data-testid="tail-regex-toggle"
          className={`regex-toggle ${regexMode ? 'active' : ''}`}
          onClick={() => setRegexMode((p) => !p)}
        >
          .*
        </button>
        <button
          data-testid="tail-auto-scroll"
          className={`auto-scroll-btn ${autoScroll ? 'active' : ''}`}
          onClick={() => setAutoScroll((p) => !p)}
        >
          {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
        </button>
        <button data-testid="tail-clear" onClick={() => setEntries([])}>Clear</button>
      </div>

      {!autoScroll && newCount > 0 && (
        <div className="new-entries-banner" onClick={() => { feedRef.current?.scrollTo(0, feedRef.current.scrollHeight); setNewCount(0) }}>
          {newCount} new entries
        </div>
      )}

      <div className="tail-feed" ref={feedRef}>
        {filtered.length === 0 ? (
          <div className="tail-empty">No tail entries yet.</div>
        ) : (
          filtered.map((entry) => (
            <div key={entry.id} className={`tail-entry level-${entry.level.toLowerCase()}`}>
              <span className="entry-level">{entry.level}</span>
              <span className="entry-ts">{entry.timestamp}</span>
              {entry.source && <span className="entry-source">{entry.source}</span>}
              <span className="entry-msg">{entry.message}</span>
            </div>
          ))
        )}
      </div>

      <div className="tail-exports">
        <button data-testid="tail-export-json">Export JSON</button>
        <button data-testid="tail-export-csv">Export CSV</button>
        <button data-testid="tail-stop">Stop</button>
      </div>
    </div>
  )
}
