import React from 'react';
import { CHART_COLORS } from '../utils/analyticsHelpers';
import type { AnalyticsLabelCount } from '../types/customerAnalytics.types';
import { formatNumber, formatPercent } from '../utils/analyticsHelpers';

interface DistributionChartProps {
  title: string;
  data: AnalyticsLabelCount[];
  emptyMessage?: string;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({
  title,
  data,
  emptyMessage = 'No data available',
}) => {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
      <h3 className="mb-4 text-base font-bold text-slate-900">{title}</h3>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">{item.label}</span>
                <span className="text-slate-500">
                  {formatNumber(item.count)}{' '}
                  <span className="text-slate-400">({formatPercent(item.percentage)})</span>
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.count / maxCount) * 100}%`,
                    backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

interface SegmentCardProps {
  label: string;
  count: number;
  description: string;
  colorClass: string;
  icon: React.ReactNode;
}

export const SegmentCard: React.FC<SegmentCardProps> = ({
  label,
  count,
  description,
  colorClass,
  icon,
}) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
    <div className="flex items-start justify-between gap-2">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </div>
        <div className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(count)}</div>
        <div className="mt-1 text-xs text-slate-500">{description}</div>
      </div>
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${colorClass}`}>{icon}</div>
    </div>
  </div>
);
