import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useTranslation } from '../../contexts/LocaleContext';

interface Option {
  label: string;
  value: string | number;
}

interface Props {
  options: Option[];
  value: string | number;
  onChange: (val: string | number) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  direction?: 'up' | 'down';
  icon?: React.ReactNode;
}

export const SearchableSelect: React.FC<Props> = ({
  options,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  direction = 'down',
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );
  const selectedOption = options.find(o => String(o.value) === String(value));

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        className={`relative flex w-full items-center justify-between rounded-xl border bg-white py-2.5 ${
          icon ? 'pl-10 pr-4' : 'px-4'
        } text-sm transition-colors ${
          disabled
            ? 'cursor-not-allowed bg-slate-100 opacity-80 border-slate-200'
            : `cursor-pointer ${
                error
                  ? 'border-rose-500 bg-rose-50/30'
                  : 'border-slate-200 hover:border-brand focus-within:border-brand'
              }`
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {icon && (
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${error ? 'text-rose-400' : 'text-slate-400'}`}>
            {icon}
          </div>
        )}
        <span className={`truncate mr-2 ${selectedOption ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption.label : placeholder || t('common.select')}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </div>

      {isOpen && (
        <div
          className={`absolute z-[9999] ${
            direction === 'up' ? 'bottom-full mb-1' : 'mt-1'
          } max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg`}
        >
          <div className="sticky top-0 bg-white p-1 pb-2 z-10">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-brand focus:bg-white"
                placeholder={t('common.search', { defaultValue: 'Search...' })}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="p-3 text-center text-sm text-slate-400">
              {t('common.noData', { defaultValue: 'No results found' })}
            </div>
          ) : (
            filtered.map(opt => (
              <div
                key={String(opt.value)}
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-50 ${
                  String(opt.value) === String(value)
                    ? 'bg-brand/10 text-brand font-semibold'
                    : 'text-slate-700'
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
