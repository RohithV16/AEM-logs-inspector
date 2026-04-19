import { useState } from 'react';
import { useFilterStore } from './useFilters';

interface TokenPickerProps {
  label: string;
  tokens: string[];
  selected: string[];
  onAdd: (token: string) => void;
  onRemove: (token: string) => void;
}

function TokenPicker({ label, tokens, selected, onAdd, onRemove }: TokenPickerProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = tokens.filter(t => 
    t.toLowerCase().includes(query.toLowerCase()) && !selected.includes(t)
  );

  return (
    <div className="filter-group">
      <div className="filter-section-header">
        <p className="filter-section-label">{label}</p>
        <span className="filter-count">{selected.length || ''}</span>
      </div>
      <div className="filter-control-row">
        <div className={`searchable-dropdown ${isOpen ? 'active' : ''}`}>
          <input
            type="text"
            className="filter-input dropdown-search"
            placeholder={`Search ${label.toLowerCase()}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          />
          {isOpen && filtered.length > 0 && (
            <div className="token-picker-results" style={{ display: 'block' }}>
              {filtered.slice(0, 10).map(t => (
                <div 
                  key={t} 
                  className="token-result-item"
                  onClick={() => {
                    onAdd(t);
                    setQuery('');
                    setIsOpen(false);
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="filter-tags">
        {selected.map(token => (
          <span key={token} className="filter-tag">
            {token}
            <button className="tag-remove" onClick={() => onRemove(token)}>&times;</button>
          </span>
        ))}
      </div>
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