import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  RefreshCw,
  RotateCcw,
  Ticket,
  CircleDollarSign,
  Banknote,
  Receipt
} from 'lucide-react';
import {
  DateRangeFilter,
  useDateRangeState,
} from '../../customer-analytics/components/DateRangeFilter';
import {
  CHART_COLORS,
  formatCompactVnd,
  formatDate,
  formatNumber,
  formatPercent,
  formatVnd,
} from '../../customer-analytics/utils/analyticsHelpers';
import {
  AnalyticsPanel,
  ChartGrid,
  ErrorState,
  LoadingPanel,
  MetricStrip,
} from '../../platform-analytics/components/AnalyticsLayout';
import { useTranslation } from '../../../contexts/LocaleContext';
import { ticketTypeService } from '../../content/services/ticketType.service';
import { useBookingStatistics } from '../hooks/useBookingStatistics';
import type {
  BookingStatisticsGroupBy,
  CheckInStatusRatio,
  RevenueTrendPoint,
} from '../types/bookingStatistics.types';

const GROUP_BY_OPTIONS: BookingStatisticsGroupBy[] = ['Day', 'Month', 'Year'];

export const RevenueStatisticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { preset, setPreset, from, setFrom, to, setTo } = useDateRangeState();
  const [groupBy, setGroupBy] = useState<BookingStatisticsGroupBy>('Day');

  const request = useMemo(
    () => ({
      startDate: from,
      endDate: to,
      groupBy,
    }),
    [from, groupBy, to],
  );

  const statisticsQuery = useBookingStatistics(request);
  const data = statisticsQuery.data;

  const { data: ticketTypesData } = useQuery({
    queryKey: ['ticket-types-all'],
    queryFn: () => ticketTypeService.getAll(1, 100),
  });

  const ticketTypes = useMemo(() => {
    if (!ticketTypesData?.data) return {};
    return ticketTypesData.data.reduce((acc, curr) => {
      acc[curr.id] = curr.name;
      return acc;
    }, {} as Record<number, string>);
  }, [ticketTypesData]);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="travel-eyebrow">{t('booking.statistics.eyebrow')}</p>
          <h1 className="travel-heading text-2xl md:text-3xl">{t('booking.statistics.revenueTitle')}</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            {t('booking.statistics.revenueSubtitle')}
            <span className="ml-1 text-slate-400">
              {formatDate(from)} - {formatDate(to)}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => statisticsQuery.refetch()}
          disabled={statisticsQuery.isFetching}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-brand ${statisticsQuery.isFetching ? 'animate-spin' : ''}`} />
          {t('booking.statistics.refresh')}
        </button>
      </div>

      <AnalyticsPanel padded={false}>
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <DateRangeFilter
            preset={preset}
            from={from}
            to={to}
            onPresetChange={setPreset}
            onFromChange={setFrom}
            onToChange={setTo}
          />

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">{t('booking.statistics.groupBy')}</span>
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {GROUP_BY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setGroupBy(option)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${groupBy === option
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                  {t(groupByLabelKey(option))}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5">
          {statisticsQuery.isLoading ? (
            <BookingStatisticsSkeleton />
          ) : !data ? (
            <ErrorState
              message={t('booking.statistics.unableToLoad')}
              onRetry={() => statisticsQuery.refetch()}
            />
          ) : (
            <div className="space-y-6">
              {/* Highlighted Metric Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1 rounded-2xl border border-brand/20 bg-brand/5 p-5">
                  <div className="flex items-center gap-2 text-brand">
                    <CircleDollarSign className="h-5 w-5" />
                    <span className="text-sm font-bold">{t('booking.statistics.actualRevenue')}</span>
                  </div>
                  <div className="mt-2 text-3xl font-black text-slate-900">
                    {formatVnd(data.metrics.totalRevenue)}
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    {t('booking.statistics.actualRevenueHint')}
                  </p>
                </div>

                <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Banknote className="h-5 w-5" />
                    <span className="text-sm font-bold">{t('booking.statistics.discounts')}</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {formatVnd(data.metrics.totalDiscount)}
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    {t('booking.statistics.discountsHint')}
                  </p>
                </div>

                <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-rose-500">
                    <Receipt className="h-5 w-5" />
                    <span className="text-sm font-bold">{t('booking.statistics.refunded')}</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {formatVnd(data.metrics.totalRefundAmount)}
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    {t('booking.statistics.refundedHint')}
                  </p>
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">{t('booking.statistics.orders')}</p>
                    <p className="text-xs text-slate-400">{t('booking.statistics.ordersHint')}</p>
                  </div>
                  <span className="text-2xl font-black text-slate-800">{formatNumber(data.metrics.totalOrders)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">{t('booking.statistics.ticketsSold')}</p>
                    <p className="text-xs text-slate-400">{t('booking.statistics.ticketsSoldHint')}</p>
                  </div>
                  <span className="text-2xl font-black text-slate-800">{formatNumber(data.metrics.totalTicketsSold)}</span>
                </div>
              </div>

              <AnalyticsPanel
                title={t('booking.statistics.revenueOverTime')}
                subtitle={t('booking.statistics.groupedBy', {
                  group: t(groupByLabelKey(groupBy)).toLowerCase(),
                })}
              >
                <RevenueLineChart data={data.revenueTrend} groupBy={groupBy} />
              </AnalyticsPanel>

            </div>
          )}
        </div>
      </AnalyticsPanel>
    </div>
  );
};

const BookingStatisticsSkeleton = () => (
  <div className="space-y-5">
    <LoadingPanel height="h-24" />
    <LoadingPanel height="h-80" />
  </div>
);

const RevenueLineChart: React.FC<{
  data: RevenueTrendPoint[];
  groupBy: BookingStatisticsGroupBy;
}> = ({ data, groupBy }) => {
  const width = 920;
  const height = 260;
  const padding = 28;
  const maxRevenue = Math.max(...data.map((item) => item.revenue), 1);

  const points = data.map((item, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (item.revenue / maxRevenue) * (height - padding * 2);
    return { ...item, x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const tickStep = Math.max(1, Math.ceil(data.length / 6));

  if (data.length === 0) return <EmptyChart icon={<BarChart3 className="h-5 w-5" />} />;

  return (
    <div>
      <div className="h-[260px] w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img">
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0068E0" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#0068E0" stopOpacity={0} />
            </linearGradient>
          </defs>
          {Array.from({ length: 5 }).map((_, index) => {
            const y = padding + (index / 4) * (height - padding * 2);
            const value = maxRevenue - (index / 4) * maxRevenue;
            return (
              <g key={index}>
                <line
                  x1={padding}
                  x2={width - padding}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
                <text x="0" y={y + 4} fontSize="11" fontWeight="700" fill="#94a3b8">
                  {formatCompactVnd(value)}
                </text>
              </g>
            );
          })}

          <path
            d={`${linePath} L ${points[points.length - 1].x.toFixed(2)} ${height - padding} L ${points[0].x.toFixed(2)} ${height - padding} Z`}
            fill="url(#colorRevenue)"
          />
          <path
            d={linePath}
            fill="none"
            stroke="#0068E0"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3.5"
          />
          {points.map((point) => (
            <circle key={point.period} cx={point.x} cy={point.y} r="5" fill="#fff" stroke="#0068E0" strokeWidth="2" />
          ))}
        </svg>
      </div>

      <div className="mt-2 flex justify-between px-4 text-xs font-semibold text-slate-400">
        {data
          .filter((_, index) => index % tickStep === 0 || index === data.length - 1)
          .map((item) => (
            <span key={item.period}>{formatPeriod(item.period, groupBy)}</span>
          ))}
      </div>
    </div>
  );
};

function formatPeriod(period: string, groupBy: BookingStatisticsGroupBy) {
  if (groupBy === 'Day') {
    const [, month, day] = period.split('-');
    return `${month}/${day}`;
  }
  if (groupBy === 'Month') {
    const [year, month] = period.split('-');
    return `${month}/${year.slice(2)}`;
  }
  return period;
}

function groupByLabelKey(groupBy: BookingStatisticsGroupBy) {
  if (groupBy === 'Month') return 'booking.statistics.groupMonth';
  if (groupBy === 'Year') return 'booking.statistics.groupYear';
  return 'booking.statistics.groupDay';
}

const EmptyChart: React.FC<{ icon: React.ReactNode }> = ({ icon }) => (
  <EmptyChartContent icon={icon} />
);

const EmptyChartContent: React.FC<{ icon: React.ReactNode }> = ({ icon }) => {
  const { t } = useTranslation();

  return (
    <div className="grid h-56 place-items-center text-center">
      <div>
        <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-400">
          {icon}
        </div>
        <p className="text-sm font-semibold text-slate-400">{t('booking.statistics.noData')}</p>
      </div>
    </div>
  );
};

export default RevenueStatisticsPage;
