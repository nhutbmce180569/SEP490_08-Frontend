import React from 'react';
import { Search, X } from 'lucide-react';

interface WishlistSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
}

export const WishlistSearchInput: React.FC<WishlistSearchInputProps> = ({
  value,
  onChange,
  resultCount,
}) => (
  <div className="relative mb-5">
    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search saved tours by name..."
      maxLength={100}
      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-brand/50 focus:bg-white focus:ring-2 focus:ring-brand/15"
      aria-label="Search wishlist"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
        aria-label="Clear search"
      >
        <X className="h-4 w-4" />
      </button>
    )}
    {value.trim() && (
      <p className="mt-2 text-xs font-semibold text-slate-500">
        {resultCount} tour{resultCount !== 1 ? 's' : ''} match your search
      </p>
    )}
  </div>
);
