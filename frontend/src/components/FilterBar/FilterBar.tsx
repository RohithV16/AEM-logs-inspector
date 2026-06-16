import { useCallback, useState } from 'react'
import { isSafeRegexSync } from '../../utils/regex'
import { getSearchLabel } from '../../utils/files'
import { useLogContext } from '../../context/LogContext'

interface FilterBarProps {
  searchRef: React.RefObject<HTMLInputElement | null>
}

export function FilterBar({ searchRef }: FilterBarProps) {
  const { selectedFilters, setSelectedFilters, clearAllFilters } = useLogContext()
  const [searchError, setSearchError] = useState<string | null>(null)

  const updateFilter = useCallback((key: string, value: unknown) => {
    if (!value || (typeof value === 'string' && value === '')) {
      const { [key]: _, ...rest } = selectedFilters
      setSelectedFilters(rest)
    } else {
      setSelectedFilters({ ...selectedFilters, [key]: value })
    }
  }, [selectedFilters, setSelectedFilters])

  const handleDateChange = useCallback((key: string, rawValue: string) => {
    if (!rawValue) {
      updateFilter(key, undefined)
      return
    }
    const utc = new Date(rawValue).toISOString()
    updateFilter(key, utc)
  }, [updateFilter])

  const search = (selectedFilters.search as string) || ''
  const startDate = (selectedFilters.startDate as string) || ''
  const endDate = (selectedFilters.endDate as string) || ''
  const regexMode = (selectedFilters.regex as boolean) || false

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val && regexMode) {
      const result = isSafeRegexSync(val)
      setSearchError(result.ok ? null : result.error || null)
    } else {
      setSearchError(null)
    }
    updateFilter('search', val || undefined)
  }, [regexMode, updateFilter])

  const toggleRegex = useCallback(() => {
    const next = !regexMode
    updateFilter('regex', next || undefined)
  }, [regexMode, updateFilter])

  return (
    <div className="filter-card" data-testid="filter-bar" style={{ marginTop: '1rem' }}>
      <div className="filter-section-header">
        <p className="filter-section-label">Date range & Search</p>
      </div>
      <div className="filter-bar-row" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="date-range-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label className="date-field">
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>From</span>
            <input
              data-testid="start-date-input"
              type="datetime-local"
              className="filter-input date-input"
              style={{ width: '100%' }}
              value={startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              placeholder="Start date"
            />
          </label>
          <label className="date-field">
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>To</span>
            <input
              data-testid="end-date-input"
              type="datetime-local"
              className="filter-input date-input"
              style={{ width: '100%' }}
              value={endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              placeholder="End date"
            />
          </label>
        </div>

        <div className="search-group" style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            ref={searchRef}
            data-testid="raw-search-input"
            type="text"
            className="filter-input"
            style={{ width: '100%' }}
            placeholder={getSearchLabel()}
            value={search}
            onChange={handleSearchChange}
          />
          <button
            data-testid="search-regex-toggle"
            className={`btn-clear ${regexMode ? 'active' : ''}`}
            onClick={toggleRegex}
            title="Toggle regex mode"
          >
            .*
          </button>
        </div>
        {searchError && <div className="field-error">{searchError}</div>}

        <div className="filter-actions" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            data-testid="clear-filters"
            className="btn-clear"
            style={{ flex: 1 }}
            onClick={clearAllFilters}
          >
            Clear
          </button>
        </div>
      </div>

    </div>
  )
}
