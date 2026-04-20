import { useState, useEffect } from 'react';

interface SearchInputProps {
  onSearch: (query: string) => void;
}

export function SearchInput({ onSearch }: SearchInputProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => onSearch(query), 300);
    return () => clearTimeout(timeout);
  }, [query, onSearch]);

  return (
    <div className="raw-search-row">
      <input 
        type="text" 
        className="filter-input"
        style={{ flex: 1 }}
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
        placeholder="Search events (regex supported natively)..." 
      />
      {query && (
        <button className="btn-clear" onClick={() => setQuery('')}>
          Clear
        </button>
      )}
    </div>
  );
}