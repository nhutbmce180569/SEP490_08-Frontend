import React, { useMemo, useState } from 'react';
import { BarChart3, RefreshCw, RotateCcw, Ticket, CalendarDays } from 'lucide-react';
import {
  DateRangeFilter,
  useDateRangeState,
} from '../../customer-analytics/components/DateRangeFilter';
import {
  CHART_COLORS,
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
import { useBookingStatistics } from '../hooks/useBookingStatistics';
import type {
  BookingStatisticsGroupBy,
  RevenueTrendPoint,
  EventSales,
} from '../types/bookingStatistics.types';

const GROUP_BY_OPTIONS: BookingStatisticsGroupBy[] = ['Day', 'Month', 'Year'];

export const BookingStatisticsPage: React.FC = () => {
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

  const validTotalOrders = data ? data.metrics.paidOrders + data.metrics.cancelledOrders : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="travel-eyebrow">{t('booking.statistics.eyebrow')}</p>
          <h1 className="travel-heading text-2xl md:text-3xl">{t('booking.statistics.title')}</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            {t('booking.statistics.subtitle')}
            <span className="ml-1 text-slate-400">
              {formatDate(from)} - {formatDate(to)}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => statisticsQuery.refetch()}
          disabled={statisticsQuery.isFetching}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${statisticsQuery.isFetching ? 'animate-spin' : ''}`} />
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
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">{t('booking.statistics.groupBy')}</span>
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                {GROUP_BY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setGroupBy(option)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      groupBy === option
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
            <div className="space-y-5">
              <MetricStrip
                columns={3}
                items={[
                  {
                    label: t('booking.statistics.totalBooking'),
                    value: formatNumber(validTotalOrders),
                    hint: t('booking.statistics.totalBookingHint'),
                  },
                  {
                    label: t('booking.statistics.successfulBooking'),
                    value: formatNumber(data.metrics.paidOrders),
                    hint: t('booking.statistics.successfulBookingHint'),
                  },
                  {
                    label: t('booking.statistics.cancelledBooking'),
                    value: formatNumber(data.metrics.cancelledOrders),
                    hint: t('booking.statistics.cancelledBookingHint'),
                  },
                ]}
              />

              <MetricStrip
                columns={4}
                items={[
                  {
                    label: t('booking.statistics.completionRate'),
                    value: formatPercent(
                      validTotalOrders > 0
                        ? (data.metrics.paidOrders / validTotalOrders) * 100
                        : 0,
                    ),
                    hint: '',
                  },
                  {
                    label: t('booking.statistics.cancellationRate'),
                    value: formatPercent(
                      validTotalOrders > 0
                        ? (data.metrics.cancelledOrders / validTotalOrders) * 100
                        : 0,
                    ),
                    hint: '',
                  },
                  {
                    label: t('booking.statistics.ticketsSold'),
                    value: formatNumber(data.metrics.totalTicketsSold),
                    hint: t('booking.statistics.ticketsSoldHint'),
                  },
                  {
                    label: t('booking.statistics.totalCustomers'),
                    value: formatNumber(data.metrics.newCustomers + data.metrics.repeatCustomers),
                    hint: t('booking.statistics.totalCustomersHint'),
                  },
                ]}
              />

              <AnalyticsPanel
                title={t('booking.statistics.bookingTrendTitle')}
                subtitle={t('booking.statistics.groupedBy', {
                  group: t(groupByLabelKey(groupBy)).toLowerCase(),
                })}
              >
                <BookingLineChart data={data.revenueTrend} groupBy={groupBy} />
              </AnalyticsPanel>

              <ChartGrid columns={2}>
                <AnalyticsPanel
                  title={t('booking.statistics.bookingStatusTitle')}
                  subtitle={''}
                >
                  <BookingStatusPieChart
                    total={data.metrics.paidOrders + data.metrics.cancelledOrders}
                    paid={data.metrics.paidOrders}
                    cancelled={data.metrics.cancelledOrders}
                  />
                </AnalyticsPanel>

                <AnalyticsPanel
                  title={t('booking.statistics.topEventsByBooking')}
                  subtitle={''}
                >
                  <EventBookingBars
                    data={data.salesByEvent
                      .sort((a, b) => b.totalTickets - a.totalTickets)
                      .slice(0, 5)}
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
    <LoadingPanel height="h-24" />
    <LoadingPanel height="h-80" />
    <div className="grid gap-5 lg:grid-cols-2">
      <LoadingPanel height="h-72" />
      <LoadingPanel height="h-72" />
    </div>
  </div>
);

const BookingLineChart: React.FC<{
  data: RevenueTrendPoint[];
  groupBy: BookingStatisticsGroupBy;
}> = ({ data, groupBy }) => {
  const width = 920;
  const height = 260;
  const padding = 28;
  const maxOrder = Math.max(...data.map((item) => item.orderCount), 1);

  const points = data.map((item, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (item.orderCount / maxOrder) * (height - padding * 2);
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
          {Array.from({ length: 5 }).map((_, index) => {
            const y = padding + (index / 4) * (height - padding * 2);
            const value = maxOrder - (index / 4) * maxOrder;
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
                  {formatNumber(Math.round(value))}
                </text>
              </g>
            );
          })}

          <path
            d={`${linePath} L ${points[points.length - 1].x.toFixed(2)} ${height - padding} L ${points[0].x.toFixed(2)} ${height - padding} Z`}
            fill="#0068E0"
            opacity="0.1"
          />
          <path
            d={linePath}
            fill="none"
            stroke="#0068E0"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          {points.map((point) => (
            <circle key={point.period} cx={point.x} cy={point.y} r="4" fill="#0068E0" />
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

const BookingStatusPieChart: React.FC<{
  total: number;
  paid: number;
  cancelled: number;
}> = ({ total, paid, cancelled }) => {
  const { t } = useTranslation();
  let current = 0;

  if (total <= 0) return <EmptyChart icon={<RotateCcw className="h-5 w-5" />} />;

  const chartData = [
    { label: t('booking.statistics.successfulBooking'), count: paid, color: CHART_COLORS[0] },
    { label: t('booking.statistics.cancelledBooking'), count: cancelled, color: CHART_COLORS[2] },
  ].filter(item => item.count > 0);

  return (
    <div className="flex flex-col sm:flex-row xl:flex-col 2xl:flex-row items-center gap-5 sm:gap-6 xl:gap-5 2xl:gap-6 w-full">
      <div className="relative mx-auto h-40 w-40 shrink-0">
        <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90" role="img">
          {chartData.length === 1 ? (
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke={chartData[0].color}
              strokeWidth="18"
            />
          ) : (
            chartData.map((item) => {
              const start = current;
              const fraction = item.count / total;
              current += fraction;
              return (
                <path
                  key={item.label}
                  d={describeStrokeArc(60, 60, 48, start, current)}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="18"
                  strokeLinecap="round"
                />
              );
            })
          )}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-2xl font-black text-slate-900">{formatNumber(total)}</div>
            <div className="text-xs font-semibold text-slate-400">
              {t('booking.statistics.totalBooking')}
            </div>
          </div>
        </div>
      </div>
      <LegendList
        data={chartData.map((item) => ({
          label: item.label,
          value: `${formatNumber(item.count)} (${formatPercent((item.count / total) * 100)})`,
          color: item.color,
        }))}
      />
    </div>
  );
};

const EventBookingBars: React.FC<{
  data: EventSales[];
}> = ({ data }) => {
  const { t } = useTranslation();
  const max = Math.max(...data.map((item) => item.totalTickets), 1);

  if (data.length === 0) return <EmptyChart icon={<CalendarDays className="h-5 w-5" />} />;

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={`${item.scheduleId}-${index}`}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold text-slate-700" title={item.tourName || t('booking.statistics.eventLabel', { id: item.scheduleId })}>
              {item.tourName || t('booking.statistics.eventLabel', { id: item.scheduleId })}
            </span>
            <span className="shrink-0 font-bold text-slate-500">{formatNumber(item.totalTickets)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(item.totalTickets / max) * 100}%`,
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

export default BookingStatisticsPage;
