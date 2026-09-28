import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface CountryOption {
  value: string;
  label: string;
  icon: React.ComponentType<{ country: string; label: string }>;
}

interface SearchableCountrySelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: CountryOption[];
}

export default function SearchableCountrySelect({
  value,
  onChange,
  options,
}: SearchableCountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safeOptions = options || [];
  const selectedOption = safeOptions.find((o) => o.value === value) || safeOptions[0];
  const Icon = selectedOption?.icon;

  const filteredOptions = safeOptions.filter((o) => {
    if (!o.value) return false; // Skip the "ZZ" or International empty option if it lacks value
    return o?.label?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="relative flex items-center" ref={wrapperRef}>
      <button
        type="button"
        className="flex items-center gap-1.5 focus:outline-none"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch('');
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {Icon ? <Icon country={selectedOption.value} label={selectedOption.label} /> : null}
        <svg
          className="w-4 h-4 text-siet-slate"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-siet-border rounded shadow-lg z-50 flex flex-col max-h-64">
          <div className="p-2 border-b border-siet-border sticky top-0 bg-white">
            <input
              type="text"
              autoFocus
              placeholder="Search country..."
              className="w-full text-sm p-1.5 border border-siet-border rounded focus:outline-none focus:border-siet-sky"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul
            className="overflow-y-auto"
            role="listbox"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const OptionIcon = option.icon;
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={option.value === value}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50',
                      option.value === value && 'bg-blue-50 text-siet-navy font-medium'
                    )}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                  >
                    {OptionIcon ? <OptionIcon country={option.value} label={option.label} /> : null}
                    <span className="truncate">{option.label}</span>
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-2 text-sm text-siet-slate text-center">No countries found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
