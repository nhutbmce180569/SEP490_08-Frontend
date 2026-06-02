import React from 'react';

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
    className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`}
  >
    {(title || subtitle || action) && (
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    <div className={padded ? `p-5 ${bodyClassName}` : bodyClassName}>{children}</div>
  </section>
);

export const MetricStrip: React.FC<{
  items: { label: string; value: string; hint?: string }[];
  columns?: 2 | 3 | 4 | 5 | 6;
}> = ({ items, columns = 4 }) => {
  const colClass =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 3
        ? 'sm:grid-cols-3'
        : columns === 5
          ? 'sm:grid-cols-2 lg:grid-cols-5'
          : columns === 6
            ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
            : 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div
      className={`grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100/80 ${colClass}`}
    >
      {items.map((item) => (
        <div key={item.label} className="bg-white px-4 py-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {item.label}
          </div>
          <div className="mt-1 text-xl font-bold tracking-tight text-slate-900">{item.value}</div>
          {item.hint && <div className="mt-0.5 text-xs text-slate-500">{item.hint}</div>}
        </div>
      ))}
    </div>
  );
};

export const MetricGroup: React.FC<{
  title: string;
  items: { label: string; value: string }[];
}> = ({ title, items }) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h4>
    <dl className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
          <dt className="text-slate-500">{item.label}</dt>
          <dd className="font-bold tabular-nums text-slate-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  </div>
);

export const ChartGrid: React.FC<{ children: React.ReactNode; columns?: 2 | 3 }> = ({
  children,
  columns = 2,
}) => (
  <div
    className={`grid gap-4 ${columns === 3 ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2'}`}
  >
    {children}
  </div>
);

export const LoadingPanel: React.FC<{ height?: string }> = ({ height = 'h-40' }) => (
  <div className={`${height} animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100`} />
);

export const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <AnalyticsPanel>
    <div className="py-10 text-center">
      <p className="text-sm text-rose-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
      >
        Try again
      </button>
    </div>
  </AnalyticsPanel>
);
