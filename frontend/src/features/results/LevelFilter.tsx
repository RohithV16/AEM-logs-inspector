
interface LevelFilterProps {
  activeLevel: string;
  onLevelChange: (level: string) => void;
  counts: Record<string, number>;
}

export function LevelFilter({ activeLevel, onLevelChange, counts }: LevelFilterProps) {
  const levels = ['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG'];

  return (
    <div id="levelFilters" className="level-filters">
      {levels.map((l) => (
        <button
          key={l}
          className={`level-chip ${l.toLowerCase()} ${activeLevel === l ? 'active' : ''}`}
          onClick={() => onLevelChange(l)}
        >
          {l} <span id={`count${l}`}>{counts[l] || 0}</span>
        </button>
      ))}
    </div>
  );
}