import { useFilterStore, FilterState } from './useFilters';

interface FilterPreset {
  id: string;
  name: string;
  filters: Pick<FilterState, 'dateRange' | 'logType' | 'packages' | 'loggers' | 'threads' | 'exceptions'>;
}

const STORAGE_KEY = 'aem_filterPresets';

export function savePreset(name: string): void {
  const state = useFilterStore.getState();
  const presets = loadPresets();
  presets.push({
    id: crypto.randomUUID(),
    name,
    filters: {
      dateRange: state.dateRange,
      logType: state.logType,
      packages: state.packages,
      loggers: state.loggers,
      threads: state.threads,
      exceptions: state.exceptions,
    },
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function loadPresets(): FilterPreset[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function deletePreset(id: string): void {
  const presets = loadPresets().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function applyPreset(preset: FilterPreset): void {
  const { setDateRange, setLogType, addPackage, addLogger, addThread, addException, clear } = useFilterStore.getState();
  clear();
  setDateRange(preset.filters.dateRange);
  setLogType(preset.filters.logType);
  preset.filters.packages.forEach(addPackage);
  preset.filters.loggers.forEach(addLogger);
  preset.filters.threads.forEach(addThread);
  preset.filters.exceptions.forEach(addException);
}

export function FilterPresetUI() {
  const presets = loadPresets();

  const handleSave = () => {
    const name = prompt('Enter preset name:');
    if (name) savePreset(name);
  };

  return (
    <div className="filter-preset">
      <button onClick={handleSave}>Save Preset</button>
      <ul>
        {presets.map((preset) => (
          <li key={preset.id}>
            {preset.name}
            <button onClick={() => deletePreset(preset.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}