import React from 'react';
import { CalendarDays } from 'lucide-react';
import type { DatePreset } from '../utils/analyticsHelpers';
import {
  dateInputToIso,
  getDateRangeFromPreset,
  toDateInputValue,
} from '../utils/analyticsHelpers';

interface DateRangeFilterProps {
  preset: DatePreset;
  from: string;
  to: string;
  onPresetChange: (preset: DatePreset) => void;
  onFromChange: (iso: string) => void;
  onToChange: (iso: string) => void;
}

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'custom', label: 'Custom' },
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  preset,
  from,
  to,
  onPresetChange,
  onFromChange,
  onToChange,
}) => {
  const handlePreset = (value: DatePreset) => {
    onPresetChange(value);
    if (value !== 'custom') {
      const range = getDateRangeFromPreset(value);
      onFromChange(range.from);
      onToChange(range.to);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
        <CalendarDays className="h-4 w-4 text-brand" />
        <span>Date range</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => handlePreset(p.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              preset === p.value
                ? 'bg-brand text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={toDateInputValue(from)}
            onChange={(e) => onFromChange(dateInputToIso(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
          />
          <span className="text-sm text-slate-400">→</span>
          <input
            type="date"
            value={toDateInputValue(to)}
            onChange={(e) => onToChange(dateInputToIso(e.target.value, true))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
          />
        </div>
      )}
    </div>
  );
};

export const useDateRangeState = () => {
  const initial = getDateRangeFromPreset('30d');
  const [preset, setPreset] = React.useState<DatePreset>('30d');
  const [from, setFrom] = React.useState(initial.from);
  const [to, setTo] = React.useState(initial.to);

  const dateParams = React.useMemo(() => ({ from, to }), [from, to]);

  return { preset, setPreset, from, setFrom, to, setTo, dateParams };
};
