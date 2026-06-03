import React, { useMemo, useState } from 'react';
import {
  Clock,
  DollarSign,
  Package,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useTranslation } from '../contexts/LocaleContext';

type Stat = {
  label: string;
  value: string;
  deltaLabel: string;
  deltaDirection: 'up' | 'down';
  icon: React.ReactNode;
  iconBgClass: string;
  deltaColorClass: string;
};

type Deal = {
  productName: string;
  location: string;
  dateTime: string;
  piece: number;
  amount: string;
  status: 'Delivered' | 'Pending' | 'Rejected';
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function makeLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
}

function makeAreaPath(points: Array<{ x: number; y: number }>, height: number) {
  if (points.length === 0) return '';
  const line = makeLinePath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x.toFixed(2)} ${height.toFixed(2)} L ${first.x.toFixed(
    2,
  )} ${height.toFixed(2)} Z`;
}

function SalesChart({
  data,
  width,
  height,
  stroke = '#3b82f6',
  ariaLabel,
}: {
  data: number[];
  width: number;
  height: number;
  stroke?: string;
  ariaLabel: string;
}) {
  const paddingX = 10;
  const paddingY = 10;
  const innerW = Math.max(1, width - paddingX * 2);
  const innerH = Math.max(1, height - paddingY * 2);

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1, max - min);

  const pts = data.map((v, i) => {
    const t = data.length <= 1 ? 0 : i / (data.length - 1);
    const x = paddingX + t * innerW;
    const y = paddingY + (1 - (v - min) / range) * innerH;
    return { x, y };
  });

  const linePath = makeLinePath(pts);
  const areaPath = makeAreaPath(pts, height - paddingY);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={ariaLabel}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="salesArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      {Array.from({ length: 5 }).map((_, i) => {
        const y = paddingY + (i / 4) * innerH;
        return (
          <line
            key={i}
            x1={paddingX}
            x2={width - paddingX}
            y1={y}
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        );
      })}

      <path d={areaPath} fill="url(#salesArea)" />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {pts.length ? (
        <g>
          <circle cx={pts[4]?.x ?? pts[pts.length - 1].x} cy={pts[4]?.y ?? pts[pts.length - 1].y} r="4" fill={stroke} />
          <circle cx={pts[4]?.x ?? pts[pts.length - 1].x} cy={pts[4]?.y ?? pts[pts.length - 1].y} r="8" fill={stroke} opacity="0.15" />
        </g>
      ) : null}
    </svg>
  );
}

export default function PartnerDashboard() {
  const { t } = useTranslation();
  const [month, setMonth] = useState('october');

  const months = useMemo(
    () => [
      { value: 'october', label: t('dashboard.october') },
      { value: 'september', label: t('dashboard.september') },
      { value: 'august', label: t('dashboard.august') },
    ],
    [t],
  );

  const statusPillClass: Record<Deal['status'], string> = {
    Delivered: 'bg-emerald-500 text-white',
    Pending: 'bg-amber-400 text-white',
    Rejected: 'bg-rose-500 text-white',
  };

  const statusLabel: Record<Deal['status'], string> = {
    Delivered: t('dashboard.delivered'),
    Pending: t('dashboard.pending'),
    Rejected: t('dashboard.rejected'),
  };

  const stats = useMemo<Stat[]>(
    () => [
      {
        label: t('dashboard.totalUser'),
        value: '40,689',
        deltaLabel: t('dashboard.deltaUpYesterday'),
        deltaDirection: 'up',
        icon: <Users className="h-5 w-5 text-indigo-500" />,
        iconBgClass: 'bg-indigo-50',
        deltaColorClass: 'text-emerald-600',
      },
      {
        label: t('dashboard.totalOrder'),
        value: '10293',
        deltaLabel: t('dashboard.deltaUpPastWeek'),
        deltaDirection: 'up',
        icon: <Package className="h-5 w-5 text-amber-500" />,
        iconBgClass: 'bg-amber-50',
        deltaColorClass: 'text-emerald-600',
      },
      {
        label: t('dashboard.totalSales'),
        value: '$89,000',
        deltaLabel: t('dashboard.deltaDownYesterday'),
        deltaDirection: 'down',
        icon: <DollarSign className="h-5 w-5 text-emerald-500" />,
        iconBgClass: 'bg-emerald-50',
        deltaColorClass: 'text-rose-600',
      },
      {
        label: t('dashboard.totalPending'),
        value: '2040',
        deltaLabel: t('dashboard.deltaUpYesterdayShort'),
        deltaDirection: 'up',
        icon: <Clock className="h-5 w-5 text-brand" />,
        iconBgClass: 'bg-brand-light',
        deltaColorClass: 'text-emerald-600',
      },
    ],
    [t],
  );

  const tableHeaders = useMemo(
    () => [
      t('dashboard.productName'),
      t('dashboard.location'),
      t('dashboard.dateTime'),
      t('dashboard.piece'),
      t('dashboard.amount'),
      t('dashboard.status'),
    ],
    [t],
  );

  const deals = useMemo<Deal[]>(
    () => [
      {
        productName: 'Apple Watch',
        location: '6096 Marjolaine Landing',
        dateTime: '12.09.2026 - 12:53 PM',
        piece: 423,
        amount: '$34,295',
        status: 'Delivered',
      },
      {
        productName: 'Apple Watch',
        location: '6096 Marjolaine Landing',
        dateTime: '12.09.2026 - 12:53 PM',
        piece: 423,
        amount: '$34,295',
        status: 'Pending',
      },
      {
        productName: 'Apple Watch',
        location: '6096 Marjolaine Landing',
        dateTime: '12.09.2026 - 12:53 PM',
        piece: 423,
        amount: '$34,295',
        status: 'Rejected',
      },
    ],
    [],
  );

  const salesData = useMemo(
    () => [22, 30, 52, 33, 54, 48, 56, 40, 32, 28, 46, 44, 60, 25, 31, 29, 47, 49, 58, 55],
    [],
  );

  const yTicks = useMemo(() => [100, 80, 60, 40, 20], []);
  const xTicks = useMemo(() => ['5k', '10k', '15k', '20k', '25k', '30k', '35k', '40k', '45k', '50k', '55k', '60k'], []);

  return (
    <div className="space-y-6">
      <div className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
        {t('dashboard.title')}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <section
            key={s.label}
            className="rounded-2xl bg-white p-5 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900/70">
                  {s.label}
                </div>
                <div className="mt-2 text-2xl font-bold tracking-[0.5px] text-slate-900">
                  {s.value}
                </div>
              </div>
              <div className={['grid h-11 w-11 place-items-center rounded-2xl', s.iconBgClass].join(' ')}>
                {s.icon}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm">
              {s.deltaDirection === 'up' ? (
                <TrendingUp className={['h-4 w-4', s.deltaColorClass].join(' ')} />
              ) : (
                <TrendingDown className={['h-4 w-4', s.deltaColorClass].join(' ')} />
              )}
              <span className={['font-semibold', s.deltaColorClass].join(' ')}>
                {s.deltaLabel}
              </span>
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-bold text-slate-900 md:text-xl">
            {t('dashboard.salesDetails')}
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="sales-month">
              {t('dashboard.month')}
            </label>
            <select
              id="sales-month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[56px_1fr]">
          <div className="hidden flex-col justify-between pb-7 pt-3 text-xs font-semibold text-slate-400 md:flex">
            {yTicks.map((tick) => (
              <div key={tick}>{tick}%</div>
            ))}
          </div>

          <div className="min-h-[280px] rounded-xl bg-white">
            <div className="h-[280px] w-full">
              <SalesChart
                data={salesData.map((n) => clamp(n, 0, 100))}
                width={980}
                height={280}
                ariaLabel={t('ai.salesChart')}
              />
            </div>

            <div className="mt-2 hidden grid-cols-12 gap-1 text-center text-xs font-semibold text-slate-400 md:grid">
              {xTicks.map((tick) => (
                <div key={tick}>{tick}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-bold text-slate-900 md:text-xl">
            {t('dashboard.dealsDetails')}
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="deals-month">
              {t('dashboard.month')}
            </label>
            <select
              id="deals-month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[820px] w-full border-separate border-spacing-0">
            <thead>
              <tr className="rounded-xl bg-slate-50">
                {tableHeaders.map((h, idx) => (
                  <th
                    key={h}
                    className={[
                      'px-4 py-3 text-left text-xs font-bold text-slate-800',
                      idx === 0 ? 'rounded-l-xl' : '',
                      idx === 5 ? 'rounded-r-xl' : '',
                    ].join(' ')}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.map((d, i) => (
                <tr key={`${d.productName}-${i}`} className="border-b border-slate-100">
                  <td className="px-4 py-4 text-sm font-semibold text-slate-900/80">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                        AW
                      </span>
                      {d.productName}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-900/80">
                    {d.location}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-900/80">
                    {d.dateTime}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-900/80">
                    {d.piece}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-900/80">
                    {d.amount}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={[
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold',
                        statusPillClass[d.status],
                      ].join(' ')}
                    >
                      {statusLabel[d.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
