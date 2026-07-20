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
  <section className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_12px_40px_0px_rgba(0,0,0,0.08)]">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</div>
        <div className="mt-2 text-2xl font-black tracking-tight text-slate-900 group-hover:text-brand transition-colors">
          {value}
        </div>
        {subLabel && (
          <div className="mt-1.5 text-xs font-medium text-slate-500 leading-relaxed">{subLabel}</div>
        )}
      </div>
      <div
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl shadow-sm transition-transform duration-200 group-hover:scale-110 ${iconBgClass}`}
      >
        {icon}
      </div>
    </div>
    {trend && (
      <div className="mt-4 text-xs font-bold">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
            trend.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {trend.value}
        </span>
      </div>
    )}
  </section>
);
