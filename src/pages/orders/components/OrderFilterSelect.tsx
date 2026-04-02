import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import clsx from 'clsx';

export interface OrderFilterOption {
  value: number | string;
  label: string;
}

interface OrderFilterSelectProps {
  value?: number | string;
  options: OrderFilterOption[];
  allLabel: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: number | string | undefined) => void;
}

const normalizeValue = (value: number | string | undefined) =>
  value === undefined || value === '' ? undefined : String(value);

const OrderFilterSelect: React.FC<OrderFilterSelectProps> = ({
  value,
  options,
  allLabel,
  placeholder,
  disabled = false,
  onChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const normalizedValue = normalizeValue(value);
  const selectedOption = options.find(option => String(option.value) === normalizedValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selectedOption?.label ?? '');

  useEffect(() => {
    if (!open) {
      setQuery(selectedOption?.label ?? '');
    }
  }, [open, selectedOption]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const filteredOptions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return options;
    }

    return options.filter(option => option.label.toLowerCase().includes(keyword));
  }, [options, query]);

  const handleSelect = (nextValue?: number | string) => {
    onChange(nextValue);
    setOpen(false);
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-disabled={disabled}
          disabled={disabled}
          placeholder={placeholder ?? allLabel}
          value={open ? query : (selectedOption?.label ?? '')}
          onFocus={handleInputFocus}
          onChange={event => {
            setQuery(event.target.value);
            if (!open) {
              setOpen(true);
            }
          }}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              setOpen(false);
              return;
            }
            if (event.key === 'Enter' && filteredOptions.length > 0) {
              event.preventDefault();
              handleSelect(filteredOptions[0].value);
            }
          }}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-16 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 eyecare:border-border eyecare:bg-background eyecare:text-foreground"
        />
        {normalizedValue ? (
          <button
            type="button"
            onClick={() => handleSelect(undefined)}
            className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-600 eyecare:hover:bg-muted"
            aria-label={allLabel}
          >
            <X className="h-3.5 w-3.5 text-slate-400" />
          </button>
        ) : null}
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {open ? (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800 eyecare:border-border eyecare:bg-card">
          <button
            type="button"
            onClick={() => handleSelect(undefined)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 eyecare:text-foreground eyecare:hover:bg-muted"
          >
            <Check
              className={clsx(
                'h-4 w-4',
                normalizedValue ? 'opacity-0' : 'text-brand-500 opacity-100'
              )}
            />
            <span>{allLabel}</span>
          </button>

          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => {
              const isSelected = String(option.value) === normalizedValue;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 eyecare:text-foreground eyecare:hover:bg-muted"
                >
                  <Check
                    className={clsx(
                      'h-4 w-4',
                      isSelected ? 'text-brand-500 opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 eyecare:text-muted-foreground">
              无匹配选项
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default OrderFilterSelect;
