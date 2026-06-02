import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { PlatformHealthAnalytics } from '../types/platformAnalytics.types';
import {
  formatIndicatorValue,
  INDICATOR_STATUS_BADGE,
  INDICATOR_STATUS_STYLES,
  OVERALL_STATUS_LABELS,
  OVERALL_STATUS_STYLES,
} from '../utils/platformHelpers';
import { formatNumber, formatPercent } from '../../customer-analytics/utils/analyticsHelpers';

interface HealthPanelProps {
  data: PlatformHealthAnalytics | undefined;
  isLoading?: boolean;
}

const OverallIcon: React.FC<{ status: PlatformHealthAnalytics['overallStatus'] }> = ({
  status,
}) => {
  if (status === 'Healthy') return <CheckCircle2 className="h-8 w-8 text-emerald-500" />;
  if (status === 'Critical') return <XCircle className="h-8 w-8 text-rose-500" />;
  if (status === 'NeedsAttention') return <AlertTriangle className="h-8 w-8 text-orange-500" />;
  return <Activity className="h-8 w-8 text-amber-500" />;
};

export const HealthPanel: React.FC<HealthPanelProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-36 animate-pulse rounded-2xl bg-slate-100" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const summaryCards = [
    { label: 'Schedule Occupancy', value: formatPercent(data.scheduleOccupancyRate) },
    { label: 'Check-in Rate', value: formatPercent(data.checkInRate) },
    { label: 'Review Response', value: formatPercent(data.reviewResponseRate) },
    { label: 'Voucher Redemption', value: formatPercent(data.voucherRedemptionRate) },
  ];

  return (
    <div className="space-y-6">
      <section
        className={`flex flex-col gap-4 rounded-2xl p-6 ring-1 sm:flex-row sm:items-center sm:justify-between ${OVERALL_STATUS_STYLES[data.overallStatus]}`}
      >
        <div className="flex items-center gap-4">
          <OverallIcon status={data.overallStatus} />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-70">
              Platform Health
            </div>
            <div className="text-2xl font-bold">
              {OVERALL_STATUS_LABELS[data.overallStatus]}
            </div>
            <p className="mt-1 text-sm opacity-80">
              {data.pendingCancellationRequests > 0
                ? `${formatNumber(data.pendingCancellationRequests)} pending cancellation request(s)`
                : 'All operational indicators within acceptable range'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl bg-white/60 px-4 py-3 text-center backdrop-blur-sm"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                {card.label}
              </div>
              <div className="mt-1 text-lg font-bold">{card.value}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {data.indicators.map((indicator) => {
          const maxValue = indicator.unit === '%' ? 100 : Math.max(indicator.value * 1.5, 10);
          const barWidth =
            indicator.unit === '%'
              ? Math.min(indicator.value, 100)
              : Math.min((indicator.value / maxValue) * 100, 100);

          return (
            <div
              key={indicator.name}
              className="rounded-2xl bg-white p-5 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900">{indicator.name}</h4>
                  {indicator.description && (
                    <p className="mt-0.5 text-xs text-slate-500">{indicator.description}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${INDICATOR_STATUS_BADGE[indicator.status]}`}
                >
                  {indicator.status}
                </span>
              </div>
              <div className="mb-2 text-2xl font-bold text-slate-900">
                {formatIndicatorValue(indicator.value, indicator.unit)}
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${INDICATOR_STATUS_STYLES[indicator.status]}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
