import { useState, useCallback } from 'react'
import { normalizeDateTimeForApi, validateDateString } from '../../utils/dates'
import { isSafeRegexSync } from '../../utils/regex'
import { getSearchLabel } from '../../utils/files'
import { useLogContext } from '../../context/LogContext'

interface FilterBarProps {
  searchRef: React.RefObject<HTMLInputElement | null>
}

export function FilterBar({ searchRef }: FilterBarProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [regexMode, setRegexMode] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const { filePath, setPayload } = useLogContext()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearch(val)
    if (regexMode && val) {
      const result = isSafeRegexSync(val)
      setSearchError(result.ok ? null : result.error || null)
    } else {
      setSearchError(null)
    }
  }

  const handleApply = useCallback(() => {
    if (startDate) {
      const r = validateDateString(startDate)
      if (!r.valid) { setDateError(r.error || null); return }
    }
    if (endDate) {
      const r = validateDateString(endDate)
      if (!r.valid) { setDateError(r.error || null); return }
    }
    setDateError(null)
    const filters: Record<string, unknown> = {}
    if (startDate) {
      filters.startDate = normalizeDateTimeForApi(new Date(startDate))
    }
    if (endDate) {
      filters.endDate = normalizeDateTimeForApi(new Date(endDate))
    }
    if (search) {
      filters.search = search
    }
    if (filePath) {
      setPayload({ filePath, filters })
    }
  }, [startDate, endDate, search, filePath, setPayload])

  return (
    <div className="filter-bar" data-testid="filter-bar">
      <div className="filter-bar-row">
        <div className="date-pickers">
          <input
            data-testid="start-date-input"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start date"
          />
          <span className="date-separator">to</span>
          <input
            data-testid="end-date-input"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End date"
          />
        </div>

        <div className="search-group">
          <input
            ref={searchRef}
            data-testid="raw-search-input"
            type="text"
            className="search-input"
            placeholder={getSearchLabel()}
            value={search}
            onChange={handleSearchChange}
          />
          <button
            data-testid="search-regex-toggle"
            className={`regex-toggle ${regexMode ? 'active' : ''}`}
            onClick={() => setRegexMode((p) => !p)}
            title="Toggle regex mode"
          >
            .*
          </button>
        </div>
        {searchError && <div className="field-error">{searchError}</div>}
        {dateError && <div className="field-error">{dateError}</div>}

        <div className="filter-actions">
          <button data-testid="apply-filters" className="apply-btn" onClick={handleApply}>
            Apply Filters
          </button>
          <button
            data-testid="clear-filters"
            className="clear-btn"
            onClick={() => { setStartDate(''); setEndDate(''); setSearch(''); setSearchError(null); setDateError(null) }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="utc-hint">Server treats selected times as UTC (Z appended).</div>
    </div>
  )
}
