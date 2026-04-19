import { useState, useEffect, useCallback } from 'react';

interface SearchInputProps {
  onSearch: (query: string, isRegex: boolean) => void;
}

export function SearchInput({ onSearch }: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [isRegex, setIsRegex] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => onSearch(query, isRegex), 300);
    return () => clearTimeout(timeout);
  }, [query, isRegex, onSearch]);

  return (
    <div className="search-input">
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." />
      <button className={isRegex ? 'active' : ''} onClick={() => setIsRegex(!isRegex)}>.*</button>
      {query && <button onClick={() => setQuery('')}>×</button>}
    </div>
  );
}