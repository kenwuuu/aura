import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface SearchBarConfig {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarConfig> = ({
  placeholder = 'Search cards...',
  onSearch,
  debounceMs = 150,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debounceMs, onSearch]);

  return (
    <div className="search-bar">
      <i className="search-bar-icon">🔍</i>

      <Input
        className="search-bar-input"
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
};
