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
import { AnalyticsPanel, LoadingPanel, MetricStrip } from './AnalyticsLayout';
import { useTranslation } from '../../../contexts/LocaleContext';

const OVERALL_STATUS_KEYS = {
  Healthy: 'analytics.platform.statusHealthy',
  Fair: 'analytics.platform.statusFair',
  NeedsAttention: 'analytics.platform.statusNeedsAttention',
  Critical: 'analytics.platform.statusCritical',
} as const;

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
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="space-y-5">
        <LoadingPanel height="h-36" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingPanel key={i} height="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5">
      <section
        className={`overflow-hidden rounded-2xl border p-5 ring-1 ring-inset sm:p-6 ${OVERALL_STATUS_STYLES[data.overallStatus]}`}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <OverallIcon status={data.overallStatus} />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-70">
                {t('analytics.platform.platformHealth')}
              </div>
              <div className="text-2xl font-bold">{t(OVERALL_STATUS_KEYS[data.overallStatus])}</div>
              <p className="mt-1 text-sm opacity-80">
                {data.pendingCancellationRequests > 0
                  ? t('analytics.platform.pendingCancellationsCount', { count: formatNumber(data.pendingCancellationRequests) })
                  : t('analytics.platform.operationalOk')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <MetricStrip
            columns={4}
            items={[
              { label: 'Schedule occupancy', value: formatPercent(data.scheduleOccupancyRate) },
              { label: 'Check-in rate', value: formatPercent(data.checkInRate) },
              { label: 'Review response', value: formatPercent(data.reviewResponseRate) },
              { label: 'Voucher redemption', value: formatPercent(data.voucherRedemptionRate) },
            ]}
          />
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
            <AnalyticsPanel key={indicator.name} title={indicator.name} subtitle={indicator.description}>
              <div className="flex items-start justify-between gap-3">
                <div className="text-2xl font-bold text-slate-900">
                  {formatIndicatorValue(indicator.value, indicator.unit)}
                </div>
                <span
                  className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${INDICATOR_STATUS_BADGE[indicator.status]}`}
                >
                  {indicator.status}
                </span>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${INDICATOR_STATUS_STYLES[indicator.status]}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </AnalyticsPanel>
          );
        })}
      </div>
    </div>
  );
};
