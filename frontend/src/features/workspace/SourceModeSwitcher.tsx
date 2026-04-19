import { useState, useEffect } from 'react';

type SourceMode = 'local' | 'cloudmanager';

export function SourceModeSwitcher() {
  const [mode, setMode] = useState<SourceMode>(() => {
    return (localStorage.getItem('aem_sourceMode') as SourceMode) || 'local';
  });

  useEffect(() => {
    localStorage.setItem('aem_sourceMode', mode);
  }, [mode]);

  return (
    <div role="radiogroup">
      <label>
        <input
          type="radio"
          name="sourceMode"
          value="local"
          checked={mode === 'local'}
          onChange={() => setMode('local')}
        />
        Local
      </label>
      <label>
        <input
          type="radio"
          name="sourceMode"
          value="cloudmanager"
          checked={mode === 'cloudmanager'}
          onChange={() => setMode('cloudmanager')}
        />
        Cloud Manager
      </label>
    </div>
  );
}