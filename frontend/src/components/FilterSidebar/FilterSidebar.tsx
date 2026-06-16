import { useCallback } from 'react'
import { LevelChips } from './LevelChips'
import { MultiSelect } from './MultiSelect'
import { PresetManager } from '../PresetManager/PresetManager'
import { AdvancedRulesBuilder } from '../AdvancedRules/AdvancedRulesBuilder'
import { useLogContext } from '../../context/LogContext'
import type { AdvancedRule, FilterState } from '../../types'

export function FilterSidebar() {
  const { levelCounts, filteredFilterMeta, selectedFilters, setSelectedFilters } = useLogContext()

  const updateFilter = useCallback((key: string, value: unknown) => {
    setSelectedFilters({ ...selectedFilters, [key]: value })
  }, [selectedFilters, setSelectedFilters])

  const handleLevelChange = useCallback((level: string | undefined) => {
    updateFilter('level', level)
  }, [updateFilter])

  const currentFilterState: FilterState = {
    level: selectedFilters.level as string | undefined,
    search: selectedFilters.search as string | undefined,
    from: selectedFilters.startDate as string | undefined,
    to: selectedFilters.endDate as string | undefined,
    package: selectedFilters.package as string[] | undefined,
    logger: selectedFilters.logger as string[] | undefined,
    thread: selectedFilters.thread as string | undefined,
    exception: selectedFilters.exception as string | undefined,
    category: selectedFilters.category as string | undefined,
    advancedRules: selectedFilters.advancedRules as AdvancedRule[] | undefined,
  }

  const handleLoadPreset = useCallback((filters: FilterState) => {
    const loaded: Record<string, unknown> = {}
    if (filters.level) loaded.level = filters.level
    if (filters.search) loaded.search = filters.search
    if (filters.from) loaded.startDate = filters.from
    if (filters.to) loaded.endDate = filters.to
    if (filters.package) loaded.package = filters.package
    if (filters.logger) loaded.logger = filters.logger
    if (filters.thread) loaded.thread = filters.thread
    if (filters.exception) loaded.exception = filters.exception
    if (filters.category) loaded.category = filters.category
    if (filters.advancedRules) loaded.advancedRules = filters.advancedRules
    setSelectedFilters(loaded)
  }, [setSelectedFilters])

  const advancedRules = (selectedFilters.advancedRules as AdvancedRule[]) || []

  return (
    <div className="filter-card" data-testid="filter-sidebar">
      <div className="sidebar-body">
        <LevelChips levelCounts={levelCounts} onLevelChange={handleLevelChange} />
        <div className="filter-group">
          <MultiSelect
            label="Package"
            placeholder="Select packages..."
            options={filteredFilterMeta.packages}
            selected={(selectedFilters.package as string[]) || []}
            onChange={(v) => updateFilter('package', v)}
          />
        </div>
        <div className="filter-group">
          <MultiSelect
            label="Logger"
            placeholder="Select loggers..."
            options={filteredFilterMeta.loggers}
            selected={(selectedFilters.logger as string[]) || []}
            onChange={(v) => updateFilter('logger', v)}
          />
        </div>
        <div className="filter-group">
          <label className="filter-section-label">Thread / Pod</label>
          <select
            data-testid="thread-select"
            className="filter-select"
            value={(selectedFilters.thread as string) || ''}
            onChange={(e) => updateFilter('thread', e.target.value)}
          >
            <option value="">Select thread...</option>
            {filteredFilterMeta.threads.map((t) => (
              <option key={t.name} value={t.name}>{t.name} ({t.count})</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-section-label">Exception</label>
          <select
            data-testid="exception-select"
            className="filter-select"
            value={(selectedFilters.exception as string) || ''}
            onChange={(e) => updateFilter('exception', e.target.value)}
          >
            <option value="">Select exception...</option>
            {filteredFilterMeta.exceptions.map((e) => (
              <option key={e.name} value={e.name}>{e.name} ({e.count})</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-section-label">Category</label>
          <select
            data-testid="category-select"
            className="filter-select"
            value={(selectedFilters.category as string) || ''}
            onChange={(e) => updateFilter('category', e.target.value)}
          >
            <option value="">All categories</option>
            {filteredFilterMeta.categories.map((c) => (
              <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
            ))}
          </select>
        </div>
        <PresetManager currentFilters={currentFilterState} onLoadPreset={handleLoadPreset} />
        <AdvancedRulesBuilder rules={advancedRules} onChange={(rules) => updateFilter('advancedRules', rules)} />
      </div>
    </div>
  )
}