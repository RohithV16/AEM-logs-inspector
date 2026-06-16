import { useState } from 'react'

const LEVELS = ['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG'] as const

interface LevelChipsProps {
  levelCounts?: Record<string, number>
  onLevelChange?: (level: string | undefined) => void
}

export function LevelChips({ levelCounts, onLevelChange }: LevelChipsProps) {
  const [active, setActive] = useState<string>('ALL')

  const handleClick = (level: string) => {
    const next = level === active ? 'ALL' : level
    setActive(next)
    onLevelChange?.(next === 'ALL' ? undefined : next)
  }

  return (
    <div className="level-filters" data-testid="level-chips">
      {LEVELS.map((level) => {
        const count = level === 'ALL'
          ? undefined
          : (levelCounts?.[level] ?? 0)
        const isActive = active === level
        return (
          <button
            key={level}
            data-testid={`level-chip-${level.toLowerCase()}`}
            className={`level-chip ${isActive ? 'active' : ''} ${level === 'ALL' ? '' : level.toLowerCase()}`}
            onClick={() => handleClick(level)}
          >
            {level}
            {count !== undefined && <span>{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
