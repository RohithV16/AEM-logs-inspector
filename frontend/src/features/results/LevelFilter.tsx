import { useState } from 'react';

type Level = 'ALL' | 'ERROR' | 'WARN' | 'INFO';

interface LevelFilterProps {
  counts: Record<Level, number>;
}

export function LevelFilter({ counts }: LevelFilterProps) {
  const [level, setLevel] = useState<Level>('ALL');

  return (
    <div className="level-filter">
      {(['ALL', 'ERROR', 'WARN', 'INFO'] as Level[]).map((l) => (
        <button key={l} className={level === l ? 'active' : ''} onClick={() => setLevel(l)}>
          {l}
          <span className="count">{counts[l]}</span>
        </button>
      ))}
    </div>
  );
}