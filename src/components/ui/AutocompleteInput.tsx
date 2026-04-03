import React, { useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import { SearchResult } from '../../types';
import { fuzzySearch } from '../../utils/autocompleteEngine';
import { useDebounce } from '../../hooks/useDebounce';

interface AutocompleteInputProps<T> {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: T) => void;
  items: T[];
  searchFields: (keyof T)[];
  renderItem: (item: T, query: string, highlightRanges: [number, number][]) => ReactNode;
  placeholder?: string;
  maxResults?: number;
  debounceMs?: number;
  icon?: ReactNode;
  className?: string;
  autoFocus?: boolean;
}

function AutocompleteInput<T>({
  value,
  onChange,
  onSelect,
  items,
  searchFields,
  renderItem,
  placeholder = 'Search...',
  maxResults = 10,
  debounceMs = 150,
  icon,
  className = '',
  autoFocus = false,
}: AutocompleteInputProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(value, debounceMs);

  const results = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) return [];
    return fuzzySearch(debouncedQuery, items, searchFields, { maxResults });
  }, [debouncedQuery, items, searchFields, maxResults]);

  useEffect(() => {
    if (results.length > 0) {
      setIsOpen(true);
      setSelectedIndex(0);
    } else if (value.length > 0) {
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [results, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && results[selectedIndex]) {
        e.preventDefault();
        onSelect(results[selectedIndex].item);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        {icon && <div className="absolute left-4 text-gray-400">{icon}</div>}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`
            w-full py-3 px-4 ${icon ? 'pl-12' : ''}
            bg-[#E0E5EC] rounded-2xl shadow-neumorphic-inset
            text-gray-700 font-medium placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-purple-500/20
            transition-all
          `}
        />
      </div>

      {isOpen && value.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#E0E5EC] rounded-2xl shadow-2xl overflow-hidden max-h-[240px] overflow-y-auto custom-scrollbar border border-white/20"
        >
          {results.length > 0 ? (
            results.map((res, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelect(res.item);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`
                  cursor-pointer transition-all border-l-4
                  ${selectedIndex === idx 
                    ? 'bg-purple-100/50 border-purple-500' 
                    : 'bg-transparent border-transparent'}
                `}
              >
                {renderItem(res.item, value, res.highlightRanges)}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-400 italic text-sm">
              No results for "{value}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AutocompleteInput;
