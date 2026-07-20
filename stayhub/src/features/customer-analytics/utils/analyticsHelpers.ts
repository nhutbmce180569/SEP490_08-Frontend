import type { CustomerSegment } from '../types/customerAnalytics.types';

export const formatVnd = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(amount) + ' VND';

export const formatCompactVnd = (amount: number) => {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B VND`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M VND`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K VND`;
  return formatVnd(amount);
};

export const formatPercent = (value: number, decimals = 1) =>
  `${value.toFixed(decimals)}%`;

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN').format(value);

export const formatDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatPeriodLabel = (period: string, granularity: string) => {
  if (granularity === 'day') {
    const [, m, d] = period.split('-');
    return `${m}/${d}`;
  }
  if (granularity === 'week') return period.replace('-W', ' W');
  if (granularity === 'month') {
    const [y, m] = period.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(m, 10) - 1]} '${y.slice(2)}`;
  }
  return period;
};

export const SEGMENT_LABELS: Record<string, string> = {
  NeverPurchased: 'Never Purchased',
  OneTimeBuyer: 'One-Time Buyer',
  RepeatBuyer: 'Repeat Buyer',
};

export const SEGMENT_STYLES: Record<string, string> = {
  NeverPurchased: 'bg-slate-100 text-slate-600',
  OneTimeBuyer: 'bg-blue-50 text-blue-600',
  RepeatBuyer: 'bg-emerald-50 text-emerald-600',
};

export const getSegmentLabel = (segment: CustomerSegment | string) =>
  SEGMENT_LABELS[segment] ?? segment;

export const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-600',
  Blocked: 'bg-rose-50 text-rose-600',
  Unknown: 'bg-slate-100 text-slate-500',
};

export const CHART_COLORS = [
  '#0068E0',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#64748b',
];

export type DatePreset = '7d' | '30d' | '90d' | 'custom';

export const getDateRangeFromPreset = (preset: DatePreset): { from: string; to: string } => {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date(to);

  if (preset === '7d') from.setDate(from.getDate() - 7);
  else if (preset === '30d') from.setDate(from.getDate() - 30);
  else if (preset === '90d') from.setDate(from.getDate() - 90);
  else from.setDate(from.getDate() - 30);

  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
};

export const toDateInputValue = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const dateInputToIso = (dateStr: string, endOfDay = false) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (endOfDay) date.setHours(23, 59, 59, 999);
  else date.setHours(0, 0, 0, 0);
  return date.toISOString();
};
