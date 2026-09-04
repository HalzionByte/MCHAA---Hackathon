"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';

const PHOTON_URL = 'https://photon.komoot.io/api/';

export default function LocationSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const resp = await fetch(
          `${PHOTON_URL}?q=${encodeURIComponent(query)}&limit=6&lang=en`
        );
        const data = await resp.json();
        setResults(data.features || []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Photon geocoding failed:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleSelect(feature) {
    const [lng, lat] = feature.geometry.coordinates;
    const props = feature.properties;
    const label = [props.name, props.city, props.state, props.country]
      .filter(Boolean)
      .join(', ');

    setSelected({ lat, lng, label });
    setQuery(label);
    setShowDropdown(false);
    setResults([]);

    if (onSelect) onSelect({ lat, lng, label });
  }

  function handleClear() {
    setSelected(null);
    setQuery('');
    setResults([]);
  }

  return (
    <div className="relative z-[1000]" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Search location..."
          className="input-field !py-2 !ps-9 !pe-8 text-sm rounded-lg"
        />
        {(query || selected) && (
          <button
            onClick={handleClear}
            className="absolute end-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--card-border)] transition-colors"
          >
            <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </button>
        )}
      </div>

      {showDropdown && (results.length > 0 || loading) && (
        <div className="absolute top-full mt-1 w-full glass rounded-lg overflow-hidden max-h-64 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-[var(--text-muted)]">
              Searching...
            </div>
          )}
          {results.map((feature, i) => {
            const props = feature.properties;
            const label = [props.name, props.city, props.state, props.country]
              .filter(Boolean)
              .join(', ');
            return (
              <button
                key={i}
                onClick={() => handleSelect(feature)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-start hover:bg-[var(--card-border)] transition-colors border-b border-[var(--card-border)] last:border-b-0"
              >
                <MapPin className="w-4 h-4 text-[var(--cyan)] shrink-0" />
                <span className="text-sm text-[var(--text-primary)] truncate">{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-[var(--emerald)]">
          <MapPin className="w-3 h-3" />
          <span>
            Centered on {selected.label} ({selected.lat.toFixed(4)}, {selected.lng.toFixed(4)})
          </span>
        </div>
      )}
    </div>
  );
}
