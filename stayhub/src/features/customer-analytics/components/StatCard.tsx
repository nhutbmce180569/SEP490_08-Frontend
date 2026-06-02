import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  subLabel?: string;
  icon: React.ReactNode;
  iconBgClass?: string;
  trend?: { value: string; positive?: boolean };
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subLabel,
  icon,
  iconBgClass = 'bg-indigo-50',
  trend,
}) => (
  <section className="rounded-2xl bg-white p-5 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900/70">{label}</div>
        <div className="mt-2 text-2xl font-bold tracking-[0.5px] text-slate-900">{value}</div>
        {subLabel && (
          <div className="mt-1 text-xs font-medium text-slate-400">{subLabel}</div>
        )}
      </div>
      <div
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${iconBgClass}`}
      >
        {icon}
      </div>
    </div>
    {trend && (
      <div className="mt-4 text-sm">
        <span
          className={`font-semibold ${trend.positive ? 'text-emerald-600' : 'text-slate-500'}`}
        >
          {trend.value}
        </span>
      </div>
    )}
  </section>
);
