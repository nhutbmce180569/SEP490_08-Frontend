import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTranslation } from '../../../contexts/LocaleContext';

// ─── Panel (Card Container) ──────────────────────────────────────────────────
export const AnalyticsPanel: React.FC<{
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
}> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
  padded = true,
}) => (
  <section
    className={`glass-card overflow-hidden ${className}`}
  >
    {(title || subtitle || action) && (
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
        <div>
          {title && <h3 className="font-display text-base font-bold text-[var(--color-navy)]">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-sm text-[var(--text-muted)]">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    <div className={padded ? `p-5 ${bodyClassName}` : bodyClassName}>{children}</div>
  </section>
);

// ─── KPI Card ─────────────────────────────────────────────────────────────────
export type TrendDir = 'up' | 'down' | 'neutral';

type KpiAccent = 'brand' | 'accent' | 'emerald' | 'amber' | 'rose' | 'slate';

const ACCENT_STYLES: Record<KpiAccent, { bar: string; icon: string; trend: { up: string; down: string; neutral: string } }> = {
  brand:   { bar: 'from-brand to-brand-deep',          icon: 'from-brand to-brand-deep',          trend: { up: 'bg-brand-muted text-brand', down: 'bg-rose-50 text-rose-600', neutral: 'bg-[var(--border-subtle)] text-[var(--text-muted)]' } },
  accent:  { bar: 'from-accent to-accent-hover',       icon: 'from-accent to-accent-hover',       trend: { up: 'bg-accent-light text-accent', down: 'bg-rose-50 text-rose-600', neutral: 'bg-[var(--border-subtle)] text-[var(--text-muted)]' } },
  emerald: { bar: 'from-emerald-500 to-teal-600',      icon: 'from-emerald-500 to-teal-600',      trend: { up: 'bg-emerald-50 text-emerald-600', down: 'bg-rose-50 text-rose-600', neutral: 'bg-slate-100 text-slate-500' } },
  amber:   { bar: 'from-amber-400 to-orange-500',      icon: 'from-amber-400 to-orange-500',      trend: { up: 'bg-amber-50 text-amber-700', down: 'bg-rose-50 text-rose-600', neutral: 'bg-slate-100 text-slate-500' } },
  rose:    { bar: 'from-rose-500 to-pink-600',         icon: 'from-rose-500 to-pink-600',         trend: { up: 'bg-rose-50 text-rose-600', down: 'bg-rose-100 text-rose-700', neutral: 'bg-slate-100 text-slate-500' } },
  slate:   { bar: 'from-slate-400 to-slate-600',       icon: 'from-slate-400 to-slate-600',       trend: { up: 'bg-slate-100 text-slate-600', down: 'bg-rose-50 text-rose-600', neutral: 'bg-slate-100 text-slate-500' } },
};

export const KpiCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  accent?: KpiAccent;
  trend?: { dir: TrendDir; label: string };
}> = ({ label, value, sub, icon, accent = 'brand', trend }) => {
  const styles = ACCENT_STYLES[accent];
  const trendCls = trend
    ? trend.dir === 'up' ? styles.trend.up : trend.dir === 'down' ? styles.trend.down : styles.trend.neutral
    : '';

  return (
    <div className="glass-card group relative flex flex-col overflow-hidden p-5 transition-all duration-250 hover:-translate-y-0.5">
      {/* top gradient accent line */}
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${styles.bar}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
          <p className="mt-2 font-display text-[1.625rem] font-extrabold leading-none tracking-tight text-[var(--color-navy)]">
            {value}
          </p>
          {sub && <p className="mt-1.5 text-xs text-[var(--text-muted)]">{sub}</p>}
          {trend && (
            <div className={`mt-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${trendCls}`}>
              {trend.dir === 'up' ? <TrendingUp className="h-3 w-3" />
                : trend.dir === 'down' ? <TrendingDown className="h-3 w-3" />
                : <Minus className="h-3 w-3" />}
              {trend.label}
            </div>
          )}
        </div>

        {icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${styles.icon} text-white shadow-[0_4px_14px_rgba(0,104,224,0.25)]`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── KPI Grid ─────────────────────────────────────────────────────────────────
export const KpiGrid: React.FC<{
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
}> = ({ children, cols = 4 }) => {
  const cls =
    cols === 2 ? 'sm:grid-cols-2'
    : cols === 3 ? 'sm:grid-cols-2 lg:grid-cols-3'
    : 'sm:grid-cols-2 lg:grid-cols-4';
  return <div className={`grid grid-cols-1 gap-4 ${cls}`}>{children}</div>;
};

// ─── Legacy MetricStrip ────────────────────────────────────────────────────────
export const MetricStrip: React.FC<{
  items: { label: string; value: React.ReactNode; hint?: string }[];
  columns?: 2 | 3 | 4 | 5 | 6;
}> = ({ items, columns = 4 }) => {
  const colClass =
    columns === 2 ? 'sm:grid-cols-2'
    : columns === 3 ? 'sm:grid-cols-3'
    : columns === 5 ? 'sm:grid-cols-2 lg:grid-cols-5'
    : columns === 6 ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
    : 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--border-subtle)] shadow-[var(--shadow-card-value)] ${colClass}`}>
      {items.map((item) => (
        <div key={item.label} className="bg-[var(--surface-card)] px-5 py-4">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--text-muted)]">{item.label}</div>
          <div className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-[var(--color-navy)]">{item.value}</div>
          {item.hint && <div className="mt-0.5 text-xs text-[var(--text-muted)]">{item.hint}</div>}
        </div>
      ))}
    </div>
  );
};

// ─── Stat Row with optional progress bar ──────────────────────────────────────
const BAR_COLORS: Record<string, string> = {
  brand:   'bg-brand',
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-400',
  rose:    'bg-rose-500',
  slate:   'bg-slate-400',
};

export const StatRow: React.FC<{
  label: string;
  value: React.ReactNode;
  bar?: number;       // 0-100
  barColor?: string;  // one of BAR_COLORS keys or fallback
}> = ({ label, value, bar, barColor = 'brand' }) => (
  <div>
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <span className="text-sm font-bold tabular-nums text-[var(--color-navy)]">{value}</span>
    </div>
    {bar !== undefined && (
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--border-subtle)]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${BAR_COLORS[barColor] ?? barColor}`}
          style={{ width: `${Math.min(Math.max(bar, 0), 100)}%` }}
        />
      </div>
    )}
  </div>
);

// ─── Metric Group Card ────────────────────────────────────────────────────────
export const MetricGroup: React.FC<{
  title: string;
  icon?: React.ReactNode;
  items: { label: string; value: string; bar?: number; barColor?: string }[];
}> = ({ title, icon, items }) => (
  <div className="glass-card p-5">
    <div className="mb-4 flex items-center gap-2">
      {icon && (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-muted text-brand">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-bold text-[var(--color-navy)]">{title}</h4>
    </div>
    <div className="space-y-3.5">
      {items.map((item) => <StatRow key={item.label} {...item} />)}
    </div>
  </div>
);

// ─── Role Card (gradient, brand-aligned) ──────────────────────────────────────
const ROLE_GRADIENTS = [
  'from-brand to-brand-deep',
  'from-brand-hover to-brand-deep',
  'from-accent to-accent-hover',
  'from-[#0068e0] to-[#05073c]',
] as const;

export const RoleCard: React.FC<{
  label: string;
  count: number;
  description: string;
  icon: React.ReactNode;
  gradient?: string;       // pass Tailwind gradient string
  gradientIndex?: number;  // or use predefined brand gradient by index
}> = ({ label, count, description, icon, gradient, gradientIndex = 0 }) => {
  const grad = gradient ?? ROLE_GRADIENTS[gradientIndex % ROLE_GRADIENTS.length];
  return (
    <div className={`relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br p-5 text-white shadow-[var(--shadow-card-value)] ${grad}`}>
      {/* decorative circles */}
      <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 right-8 h-16 w-16 rounded-full bg-white/[0.07]" />
      <div className="relative">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          {icon}
        </div>
        <div className="font-display text-[1.875rem] font-extrabold tracking-tight leading-none">
          {count.toLocaleString()}
        </div>
        <div className="mt-1 text-sm font-bold opacity-95">{label}</div>
        <div className="mt-0.5 text-xs opacity-70">{description}</div>
      </div>
    </div>
  );
};

// ─── Chart Grid ───────────────────────────────────────────────────────────────
export const ChartGrid: React.FC<{ children: React.ReactNode; columns?: 2 | 3 }> = ({
  children,
  columns = 2,
}) => (
  <div className={`grid gap-4 ${columns === 3 ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2'}`}>
    {children}
  </div>
);

// ─── Loading / Error ──────────────────────────────────────────────────────────
export const LoadingPanel: React.FC<{ height?: string }> = ({ height = 'h-40' }) => (
  <div className={`${height} animate-pulse rounded-[var(--radius-card)] bg-[var(--border-subtle)]`} />
);

export const LoadingKpiGrid: React.FC<{ count?: number; cols?: 2 | 3 | 4 }> = ({
  count = 4,
  cols = 4,
}) => (
  <KpiGrid cols={cols}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-32 animate-pulse rounded-[var(--radius-card)] bg-[var(--border-subtle)]" />
    ))}
  </KpiGrid>
);

export const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => {
  const { t } = useTranslation();
  return (
    <AnalyticsPanel>
      <div className="py-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
          <span className="text-2xl">⚠️</span>
        </div>
        <p className="text-sm font-medium text-rose-600">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover active:scale-95"
        >
          {t('analytics.tryAgain')}
        </button>
      </div>
    </AnalyticsPanel>
  );
};
