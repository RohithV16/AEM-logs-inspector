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
            placeholder={tokens.length === 0 ? `Analyze a log file to see ${label.toLowerCase()}` : `Search ${label.toLowerCase()}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => tokens.length > 0 && setIsOpen(true)}
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
  const { packages, availablePackages, addPackage, removePackage } = useFilterStore();
  const tokens = availablePackages.length > 0 ? availablePackages : [];
  return (
    <TokenPicker
      label="Packages"
      tokens={tokens}
      selected={packages}
      onAdd={addPackage}
      onRemove={removePackage}
    />
  );
}

export function LoggerTokenPicker() {
  const { loggers, availableLoggers, addLogger, removeLogger } = useFilterStore();
  const tokens = availableLoggers.length > 0 ? availableLoggers : [];
  return (
    <TokenPicker
      label="Loggers"
      tokens={tokens}
      selected={loggers}
      onAdd={addLogger}
      onRemove={removeLogger}
    />
  );
}

export function ThreadTokenPicker() {
  const { threads, availableThreads, addThread, removeThread } = useFilterStore();
  const tokens = availableThreads.length > 0 ? availableThreads : [];
  return (
    <TokenPicker
      label="Threads"
      tokens={tokens}
      selected={threads}
      onAdd={addThread}
      onRemove={removeThread}
    />
  );
}

export function ExceptionTokenPicker() {
  const { exceptions, availableExceptions, addException, removeException } = useFilterStore();
  const tokens = availableExceptions.length > 0 ? availableExceptions : [];
  return (
    <TokenPicker
      label="Exceptions"
      tokens={tokens}
      selected={exceptions}
      onAdd={addException}
      onRemove={removeException}
    />
  );
}

export function MethodTokenPicker() {
  const { methods, availableMethods, addMethod, removeMethod } = useFilterStore();
  return (
    <TokenPicker
      label="Methods"
      tokens={availableMethods}
      selected={methods}
      onAdd={addMethod}
      onRemove={removeMethod}
    />
  );
}

export function StatusTokenPicker() {
  const { statuses, availableStatuses, addStatus, removeStatus } = useFilterStore();
  return (
    <TokenPicker
      label="Statuses"
      tokens={availableStatuses}
      selected={statuses}
      onAdd={addStatus}
      onRemove={removeStatus}
    />
  );
}

export function PodTokenPicker() {
  const { pods, availablePods, addPod, removePod } = useFilterStore();
  return (
    <TokenPicker
      label="Pods"
      tokens={availablePods}
      selected={pods}
      onAdd={addPod}
      onRemove={removePod}
    />
  );
}

export function CacheStatusTokenPicker() {
  const { cacheStatuses, availableCacheStatuses, addCacheStatus, removeCacheStatus } = useFilterStore();
  return (
    <TokenPicker
      label="Cache Status"
      tokens={availableCacheStatuses}
      selected={cacheStatuses}
      onAdd={addCacheStatus}
      onRemove={removeCacheStatus}
    />
  );
}

export function CountryTokenPicker() {
  const { countries, availableCountries, addCountry, removeCountry } = useFilterStore();
  return (
    <TokenPicker
      label="Countries"
      tokens={availableCountries}
      selected={countries}
      onAdd={addCountry}
      onRemove={removeCountry}
    />
  );
}

export function PopTokenPicker() {
  const { pops, availablePops, addPop, removePop } = useFilterStore();
  return (
    <TokenPicker
      label="PoPs"
      tokens={availablePops}
      selected={pops}
      onAdd={addPop}
      onRemove={removePop}
    />
  );
}

export function HostTokenPicker() {
  const { hosts, availableHosts, addHost, removeHost } = useFilterStore();
  return (
    <TokenPicker
      label="Hosts"
      tokens={availableHosts}
      selected={hosts}
      onAdd={addHost}
      onRemove={removeHost}
    />
  );
}