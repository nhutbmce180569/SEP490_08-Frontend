import React, { useMemo } from 'react';
import { CHART_COLORS, formatPeriodLabel } from '../utils/analyticsHelpers';
import type { Granularity } from '../types/customerAnalytics.types';

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
  return `${line} L ${last.x.toFixed(2)} ${height.toFixed(2)} L ${first.x.toFixed(2)} ${height.toFixed(2)} Z`;
}

interface Series {
  label: string;
  data: number[];
  color?: string;
}

interface TrendLineChartProps {
  labels: string[];
  series: Series[];
  height?: number;
  granularity?: Granularity;
  formatValue?: (v: number) => string;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  labels,
  series,
  height = 280,
  granularity = 'day',
  formatValue = (v) => String(v),
}) => {
  const width = 980;
  const paddingX = 16;
  const paddingY = 16;
  const innerW = Math.max(1, width - paddingX * 2);
  const innerH = Math.max(1, height - paddingY * 2);

  const allValues = series.flatMap((s) => s.data);
  const min = Math.min(...allValues, 0);
  const max = Math.max(...allValues, 1);
  const range = Math.max(1, max - min);

  const seriesPaths = useMemo(
    () =>
      series.map((s, si) => {
        const color = s.color ?? CHART_COLORS[si % CHART_COLORS.length];
        const pts = s.data.map((v, i) => {
          const t = s.data.length <= 1 ? 0 : i / (s.data.length - 1);
          const x = paddingX + t * innerW;
          const y = paddingY + (1 - (v - min) / range) * innerH;
          return { x, y };
        });
        return { color, pts, linePath: makeLinePath(pts), areaPath: makeAreaPath(pts, height - paddingY) };
      }),
    [series, innerW, innerH, min, range, height, paddingX, paddingY],
  );

  const tickCount = Math.min(labels.length, 8);
  const tickIndices =
    labels.length <= tickCount
      ? labels.map((_, i) => i)
      : Array.from({ length: tickCount }, (_, i) =>
          Math.round((i / (tickCount - 1)) * (labels.length - 1)),
        );

  const { t, locale } = useTranslation();

  if (labels.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm font-medium text-slate-400">
        {t('analytics.customer.noTrendData')}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4">
        {series.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span
              className="h-3 w-3 rounded-full shadow-xs"
              style={{ backgroundColor: s.color ?? CHART_COLORS[i % CHART_COLORS.length] }}
            />
            {s.label}
          </div>
        ))}
      </div>

      <div className="h-[280px] w-full">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" role="img">
          {Array.from({ length: 5 }).map((_, i) => {
            const y = paddingY + (i / 4) * innerH;
            const val = max - (i / 4) * range;
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  x2={width - paddingX}
                  y1={y}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text x={4} y={y + 4} fontSize="10" fill="#94a3b8" fontWeight="600">
                  {formatValue(Math.round(val))}
                </text>
              </g>
            );
          })}

          {seriesPaths.map((sp, i) => (
            <g key={i}>
              <path d={sp.areaPath} fill={sp.color} opacity="0.1" />
              <path
                d={sp.linePath}
                fill="none"
                stroke={sp.color}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-2 flex justify-between px-4 text-xs font-bold text-slate-400">
        {tickIndices.map((idx) => (
          <span key={idx}>{formatPeriodLabel(labels[idx], granularity, locale)}</span>
        ))}
      </div>
    </div>
  );
};
