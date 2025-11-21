import React, { useState } from 'react';

interface SearchBarConfig {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export const SearchBarReact: React.FC<SearchBarConfig> = ({
  placeholder,
  onSearch,
  debounceMs,
}) => {
  return (
    <div className={'search-bar'}>
      <input type={'text'} className={'search-bar'} placeholder={'this.placeholder'}></input>
      <span className={'search-bar-icon'}>🔍</span>
    </div>
  )
}