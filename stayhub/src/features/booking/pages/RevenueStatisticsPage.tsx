import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  RefreshCw,
  RotateCcw,
  Ticket,
  CircleDollarSign,
  Banknote,
  Receipt,
  CalendarDays
} from 'lucide-react';
import {
  DateRangeFilter,
  useDateRangeState,
} from '../../customer-analytics/components/DateRangeFilter';
import {
  CHART_COLORS,
  formatAnalyticsMoney,
  formatCompactAnalyticsMoney,
  formatDate,
  formatNumber,
  formatPercent,
} from '../../customer-analytics/utils/analyticsHelpers';
import {
  AnalyticsPanel,
  ChartGrid,
  ErrorState,
  LoadingPanel,
  MetricStrip,
} from '../../platform-analytics/components/AnalyticsLayout';
import { useTranslation } from '../../../contexts/LocaleContext';
import { useCurrency } from '../../currency/CurrencyContext';
import { CurrencyToggle } from '../../currency/CurrencyToggle';
import { useBookingStatistics } from '../hooks/useBookingStatistics';
import type {
  BookingStatisticsGroupBy,
  RevenueTrendPoint,
  EventSales
} from '../types/bookingStatistics.types';

const GROUP_BY_OPTIONS: BookingStatisticsGroupBy[] = ['Day', 'Month', 'Year'];

export const RevenueStatisticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { mode, usdToVndRate } = useCurrency();
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

  return (
    <div className="space-y-6">
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

          <div className="flex flex-wrap items-center gap-4">
            <CurrencyToggle className="inline-flex" />
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
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <CircleDollarSign className="h-5 w-5" />
                    <span className="text-sm font-bold">{t('booking.statistics.grossRevenue')}</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {formatAnalyticsMoney(data.metrics.grossRevenue, mode, usdToVndRate)}
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    {t('booking.statistics.grossRevenueHint')}
                  </p>
                </div>

                <div className="flex flex-col gap-1 rounded-2xl border border-brand/20 bg-brand/5 p-5">
                  <div className="flex items-center gap-2 text-brand">
                    <Banknote className="h-5 w-5" />
                    <span className="text-sm font-bold">{t('booking.statistics.netRevenue')}</span>
                  </div>
                  <div className="mt-2 text-3xl font-black text-slate-900">
                    {formatAnalyticsMoney(data.metrics.totalRevenue, mode, usdToVndRate)}
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    {t('booking.statistics.netRevenueHint')}
                  </p>
                </div>

                <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Banknote className="h-5 w-5" />
                    <span className="text-sm font-bold">{t('booking.statistics.discounts')}</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {formatAnalyticsMoney(data.metrics.totalDiscount + (data.metrics.totalPromotionDiscount || 0), mode, usdToVndRate)}
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
                    {formatAnalyticsMoney(data.metrics.totalRefundAmount, mode, usdToVndRate)}
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    {t('booking.statistics.refundedHint')}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">{t('booking.statistics.averageOrderValue')}</p>
                    <p className="text-xs text-slate-400">{t('booking.statistics.averageOrderValueHint')}</p>
                  </div>
                  <span className="text-2xl font-black text-slate-800">
                    {formatAnalyticsMoney(data.metrics.paidOrders > 0 ? data.metrics.totalRevenue / data.metrics.paidOrders : 0, mode, usdToVndRate)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">{t('booking.statistics.revenuePerTicket')}</p>
                    <p className="text-xs text-slate-400">{t('booking.statistics.revenuePerTicketHint')}</p>
                  </div>
                  <span className="text-2xl font-black text-slate-800">
                    {formatAnalyticsMoney(data.metrics.totalTicketsSold > 0 ? data.metrics.totalRevenue / data.metrics.totalTicketsSold : 0, mode, usdToVndRate)}
                  </span>
                </div>
              </div>

              <AnalyticsPanel
                title={t('booking.statistics.revenueTrendTitle')}
                subtitle={t('booking.statistics.groupedBy', {
                  group: t(groupByLabelKey(groupBy)).toLowerCase(),
                })}
              >
                <RevenueLineChart data={data.revenueTrend} groupBy={groupBy} mode={mode} usdToVndRate={usdToVndRate} />
              </AnalyticsPanel>

              <ChartGrid columns={2}>
                <AnalyticsPanel
                  title={t('booking.statistics.salesByTicketType')}
                  subtitle={t('booking.statistics.revenueShare')}
                >
                  <TicketTypePieChart
                    data={data.salesByTicketType.map((item) => ({
                      label: item.ticketTypeName || t('booking.statistics.ticketTypeLabel', { id: item.ticketTypeId }),
                      count: item.quantitySold,
                      value: item.revenue,
                    }))}
                    mode={mode}
                    usdToVndRate={usdToVndRate}
                  />
                </AnalyticsPanel>

                <AnalyticsPanel
                  title={t('booking.statistics.topEventsByRevenue')}
                  subtitle={''}
                >
                  <EventRevenueBars
                    data={data.salesByEvent
                      .sort((a, b) => b.totalRevenue - a.totalRevenue)
                      .slice(0, 5)}
                    mode={mode}
                    usdToVndRate={usdToVndRate}
                  />
                </AnalyticsPanel>
              </ChartGrid>
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
    <div className="grid gap-5 lg:grid-cols-2">
      <LoadingPanel height="h-72" />
      <LoadingPanel height="h-72" />
    </div>
  </div>
);

const RevenueLineChart: React.FC<{
  data: RevenueTrendPoint[];
  groupBy: BookingStatisticsGroupBy;
  mode?: string | null;
  usdToVndRate?: number | null;
}> = ({ data, groupBy, mode, usdToVndRate }) => {
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
                  {formatCompactAnalyticsMoney(value, mode, usdToVndRate)}
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

          {points
            .filter((_, index) => index % tickStep === 0 || index === data.length - 1)
            .map((point) => {
              let textAnchor = 'middle';
              if (point.x < padding + 20) textAnchor = 'start';
              else if (point.x > width - padding - 20) textAnchor = 'end';

              return (
                <text
                  key={point.period}
                  x={point.x}
                  y={height - 2}
                  fontSize="12"
                  fontWeight="600"
                  fill="#94a3b8"
                  textAnchor={textAnchor}
                >
                  {formatPeriod(point.period, groupBy)}
                </text>
              );
            })}
        </svg>
      </div>
    </div>
  );
};

const TicketTypePieChart: React.FC<{
  data: Array<{ label: string; count: number; value: number }>;
  mode?: string | null;
  usdToVndRate?: number | null;
}> = ({ data, mode, usdToVndRate }) => {
  const { t } = useTranslation();
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const totalTickets = data.reduce((sum, item) => sum + item.count, 0);
  let current = 0;

  if (data.length === 0 || totalValue <= 0) return <EmptyChart icon={<Ticket className="h-5 w-5" />} />;

  return (
    <div className="flex flex-col sm:flex-row xl:flex-col 2xl:flex-row items-center gap-5 sm:gap-6 xl:gap-5 2xl:gap-6 w-full">
      <div className="relative mx-auto h-40 w-40 shrink-0">
        <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90" role="img">
          {data.length === 1 ? (
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke={CHART_COLORS[0]}
              strokeWidth="18"
            />
          ) : (
            data.map((item, index) => {
              const start = current;
              const fraction = item.value / totalValue;
              current += fraction;
              return (
                <path
                  key={item.label}
                  d={describeStrokeArc(60, 60, 48, start, current)}
                  fill="none"
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth="18"
                  strokeLinecap="round"
                />
              );
            })
          )}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-2xl font-black text-slate-900">{formatNumber(totalTickets)}</div>
            <div className="text-xs font-semibold text-slate-400">
              {t('booking.statistics.ticketTotalLabel')}
            </div>
          </div>
        </div>
      </div>
      <LegendList
        data={data.map((item, index) => ({
          label: item.label,
          value: t('booking.statistics.ticketValue', {
            amount: formatAnalyticsMoney(item.value, mode, usdToVndRate),
            count: formatNumber(item.count),
          }),
          color: CHART_COLORS[index % CHART_COLORS.length],
        }))}
      />
    </div>
  );
};

const EventRevenueBars: React.FC<{
  data: EventSales[];
  mode?: string | null;
  usdToVndRate?: number | null;
}> = ({ data, mode, usdToVndRate }) => {
  const { t } = useTranslation();
  const max = Math.max(...data.map((item) => item.totalRevenue), 1);

  if (data.length === 0) return <EmptyChart icon={<CalendarDays className="h-5 w-5" />} />;

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={`${item.scheduleId}-${index}`}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold text-slate-700" title={item.tourName || t('booking.statistics.eventLabel', { id: item.scheduleId })}>
              {item.tourName || t('booking.statistics.eventLabel', { id: item.scheduleId })}
            </span>
            <span className="shrink-0 font-bold text-slate-500">{formatAnalyticsMoney(item.totalRevenue, mode, usdToVndRate)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(item.totalRevenue / max) * 100}%`,
                backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const LegendList: React.FC<{
  data: Array<{ label: string; value: string; color: string }>;
}> = ({ data }) => (
  <div className="w-full min-w-0 flex-1 space-y-3">
    {data.map((item) => (
      <div key={item.label} className="flex flex-col gap-0.5 text-sm">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="font-bold text-slate-800 break-words">{item.label}</span>
        </div>
        <div className="pl-4 text-xs font-semibold text-slate-500 break-words">{item.value}</div>
      </div>
    ))}
  </div>
);

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

function describeStrokeArc(cx: number, cy: number, r: number, startFraction: number, endFraction: number) {
  const startAngle = startFraction * Math.PI * 2 - Math.PI / 2;
  const endAngle = endFraction * Math.PI * 2 - Math.PI / 2;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endFraction - startFraction > 0.5 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function formatPeriod(period: string, groupBy: BookingStatisticsGroupBy) {
  if (groupBy === 'Day') {
    const [, month, day] = period.split('-');
    return `${day}/${month}`;
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

export default RevenueStatisticsPage;
