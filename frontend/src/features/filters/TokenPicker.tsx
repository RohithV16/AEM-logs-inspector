import { useFilterStore } from './useFilters';

interface TokenPickerProps {
  label: string;
  tokens: string[];
  selected: string[];
  onAdd: (token: string) => void;
  onRemove: (token: string) => void;
}

function TokenPicker({ label, tokens, selected, onAdd, onRemove }: TokenPickerProps) {
  const available = tokens.filter((t) => !selected.includes(t));

  return (
    <div className="token-picker">
      <fieldset>
        <legend>{label}</legend>
        <select onChange={(e) => {
          if (e.target.value) {
            onAdd(e.target.value);
            e.target.value = '';
          }
        }}>
          <option value="">Select {label}</option>
          {available.map((token) => (
            <option key={token} value={token}>{token}</option>
          ))}
        </select>
        <div className="selected-tokens">
          {selected.map((token) => (
            <button key={token} type="button" onClick={() => onRemove(token)}>
              {token} ×
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

export function PackageTokenPicker() {
  const { packages, addPackage, removePackage } = useFilterStore();
  return (
    <TokenPicker
      label="Packages"
      tokens={['com.example.app', 'com.example.core', 'com.example.ui']}
      selected={packages}
      onAdd={addPackage}
      onRemove={removePackage}
    />
  );
}

export function LoggerTokenPicker() {
  const { loggers, addLogger, removeLogger } = useFilterStore();
  return (
    <TokenPicker
      label="Loggers"
      tokens={['ERROR', 'WARN', 'INFO', 'DEBUG']}
      selected={loggers}
      onAdd={addLogger}
      onRemove={removeLogger}
    />
  );
}

export function ThreadTokenPicker() {
  const { threads, addThread, removeThread } = useFilterStore();
  return (
    <TokenPicker
      label="Threads"
      tokens={['main', 'pool-1', 'pool-2']}
      selected={threads}
      onAdd={addThread}
      onRemove={removeThread}
    />
  );
}

export function ExceptionTokenPicker() {
  const { exceptions, addException, removeException } = useFilterStore();
  return (
    <TokenPicker
      label="Exceptions"
      tokens={['NullPointerException', 'IOException', 'RuntimeException']}
      selected={exceptions}
      onAdd={addException}
      onRemove={removeException}
    />
  );
}