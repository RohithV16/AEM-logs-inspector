import { useState } from 'react'

interface HistoryEntry {
  id: string
  program: string
  environment: string
  timestamp: string
}

export function CloudManagerHistory() {
  const [entries] = useState<HistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem('aem_cmHistory')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [search, setSearch] = useState('')
  const [filterEnv, setFilterEnv] = useState('')

  const filtered = entries.filter((e) => {
    if (search && !e.program.toLowerCase().includes(search.toLowerCase()) && !e.environment.toLowerCase().includes(search.toLowerCase())) return false
    if (filterEnv && e.environment !== filterEnv) return false
    return true
  })

  const uniqueEnvs = [...new Set(entries.map((e) => e.environment))]

  return (
    <div className="cm-history" data-testid="cm-history-list">
      <div className="cloudmanager-history-filters">
        <input
          data-testid="cm-history-search"
          type="text"
          placeholder="Search history..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          data-testid="cm-history-filter"
          value={filterEnv}
          onChange={(e) => setFilterEnv(e.target.value)}
        >
          <option value="">All environments</option>
          {uniqueEnvs.map((env) => (
            <option key={env} value={env}>{env}</option>
          ))}
        </select>
      </div>
      {filtered.length === 0 ? (
        <p className="history-empty">No history entries found.</p>
      ) : (
        <ul className="cloudmanager-history-list">
          {filtered.map((entry) => (
            <li key={entry.id} className="cloudmanager-history-item">
              <span>{entry.program} / {entry.environment}</span>
              <span className="history-date">{entry.timestamp}</span>
              <button>Reuse Setup</button>
              <button>Analyze Latest</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
