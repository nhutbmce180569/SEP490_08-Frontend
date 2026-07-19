import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useTranslation } from '../../contexts/LocaleContext';

interface Option {
  label: string;
  value: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  direction?: 'up' | 'down';
}

export const SearchableSelect: React.FC<Props> = ({ options, value, onChange, placeholder, error, disabled, direction = 'down' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
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

  const filtered = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        className={`w-full flex items-center justify-between rounded-xl border bg-white py-2.5 px-4 text-sm transition-colors ${
          disabled 
            ? "cursor-not-allowed bg-slate-50 opacity-70 border-slate-200" 
            : `cursor-pointer ${error ? "border-rose-500 bg-rose-50/30" : "border-slate-200 hover:border-slate-300"}`
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "text-slate-700" : "text-slate-500"}>
          {selectedOption ? selectedOption.label : (placeholder || t("common.select"))}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </div>

      {isOpen && (
        <div className={`absolute z-[9999] ${direction === 'up' ? 'bottom-full mb-1' : 'mt-1'} max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg`}>
          <div className="sticky top-0 bg-white p-1 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-brand"
                placeholder={t("common.search", { defaultValue: "Search..." })}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="p-2 text-center text-sm text-slate-500">{t("common.noData", { defaultValue: "No results found" })}</div>
          ) : (
            filtered.map(opt => (
              <div
                key={opt.value}
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-50 ${opt.value === value ? 'bg-brand/5 text-brand font-medium' : 'text-slate-700'}`}
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
