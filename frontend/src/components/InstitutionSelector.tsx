/**
 * InstitutionSelector — Searchable dropdown for selecting an academic institution.
 *
 * Renders a custom combobox with live filter-as-you-type search.
 * Default selection is SIET with additional mock institutions available.
 */

import { useState, useRef, useEffect, useId } from 'react';

export interface Institution {
  id: string;
  shortName: string;
  fullName: string;
}

export const INSTITUTIONS: Institution[] = [
  {
    id: 'siet',
    shortName: 'SIET',
    fullName: 'Sri Shakthi Institute of Engineering and Technology (SIET)',
  },
  {
    id: 'psg',
    shortName: 'PSG',
    fullName: 'PSG College of Technology',
  },
  {
    id: 'kpr',
    shortName: 'KPR',
    fullName: 'KPR Institute of Engineering and Technology',
  },
];

interface InstitutionSelectorProps {
  value: Institution | null;
  onChange: (inst: Institution) => void;
  error?: string;
  required?: boolean;
}

export default function InstitutionSelector({
  value,
  onChange,
  error,
  required,
}: InstitutionSelectorProps) {
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = INSTITUTIONS.filter(
    (inst) =>
      inst.fullName.toLowerCase().includes(query.toLowerCase()) ||
      inst.shortName.toLowerCase().includes(query.toLowerCase()),
  );

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  function handleSelect(inst: Institution) {
    onChange(inst);
    setOpen(false);
    setQuery('');
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setOpen(true);
  }

  function handleInputFocus() {
    setOpen(true);
  }

  const displayValue = open ? query : (value?.fullName ?? '');

  return (
    <div className="space-y-1" ref={containerRef}>
      <label htmlFor={inputId} className="form-label">
        Institution / College
        {required && <span className="required-star" aria-hidden="true"> *</span>}
      </label>

      <div className="relative">
        {/* Input */}
        <div
          className={`flex items-center gap-2 rounded border bg-white transition-colors duration-150 ${
            open || value
              ? 'border-siet-sky ring-1 ring-siet-sky'
              : error
              ? 'border-siet-error'
              : 'border-siet-border'
          }`}
        >
          {/* Institution badge icon */}
          <span className="pl-3 text-siet-muted shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
              />
            </svg>
          </span>

          <input
            id={inputId}
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-required={required}
            className="flex-1 py-2.5 pr-2 text-sm text-siet-slate placeholder-siet-muted bg-transparent border-none outline-none"
            placeholder="Search institution…"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
          />

          {/* Clear / chevron button */}
          <button
            type="button"
            tabIndex={-1}
            className="pr-3 text-siet-muted hover:text-siet-slate transition-colors"
            onClick={() => {
              setOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 20 20"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8l4 4 4-4" />
            </svg>
          </button>
        </div>

        {/* Dropdown list */}
        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-50 w-full mt-1 bg-white border border-siet-border rounded shadow-card-md max-h-56 overflow-auto animate-fade-in"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-siet-muted italic">No institutions found.</li>
            ) : (
              filtered.map((inst) => (
                <li
                  key={inst.id}
                  role="option"
                  aria-selected={value?.id === inst.id}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer text-sm transition-colors duration-100 ${
                    value?.id === inst.id
                      ? 'bg-blue-50 text-siet-sky font-medium'
                      : 'text-siet-slate hover:bg-gray-50'
                  }`}
                  onMouseDown={() => handleSelect(inst)}
                >
                  <span className="mt-0.5">
                    {value?.id === inst.id ? (
                      <svg className="w-4 h-4 text-siet-sky" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span className="w-4 h-4 inline-block" />
                    )}
                  </span>
                  <span>
                    <span className="font-semibold text-siet-navy">{inst.shortName}</span>
                    <br />
                    <span className="text-xs text-siet-muted">{inst.fullName}</span>
                  </span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {error && (
        <p className="text-xs text-siet-error mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
