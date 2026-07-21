import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { CHART_COLORS } from '../utils/analyticsHelpers';
import type { AnalyticsLabelCount } from '../types/customerAnalytics.types';
import { formatNumber, formatPercent } from '../utils/analyticsHelpers';
import { useTranslation } from '../../../contexts/LocaleContext';

interface DistributionChartProps {
  title: string;
  data: AnalyticsLabelCount[];
  emptyMessage?: string;
  /** Show only first N items until expanded. Ignored when `pageSize` is set. */
  collapseLimit?: number;
  /** Paginate long lists instead of expand/collapse. */
  pageSize?: number;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({
  title,
  data,
  emptyMessage,
  collapseLimit,
  pageSize,
}) => {
  const { t } = useTranslation();
  const resolvedEmpty = emptyMessage ?? t('common.noData');
  const [expanded, setExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setExpanded(false);
    setCurrentPage(1);
  }, [data, collapseLimit, pageSize]);

  const usePagination = Boolean(pageSize && data.length > pageSize);
  const useCollapse = !usePagination && Boolean(collapseLimit && data.length > collapseLimit);

  const visibleData = useMemo(() => {
    if (usePagination && pageSize) {
      const start = (currentPage - 1) * pageSize;
      return data.slice(start, start + pageSize);
    }

    if (useCollapse && collapseLimit && !expanded) {
      return data.slice(0, collapseLimit);
    }

    return data;
  }, [collapseLimit, currentPage, data, expanded, pageSize, useCollapse, usePagination]);

  const maxCount = Math.max(...visibleData.map((d) => d.count), 1);
  const totalPages = usePagination && pageSize ? Math.ceil(data.length / pageSize) : 1;
  const pageStart = usePagination && pageSize ? (currentPage - 1) * pageSize : 0;

  const getTranslatedLabel = (rawLabel: string): string => {
    const norm = rawLabel.trim();
    const lower = norm.toLowerCase();
    
    if (lower === 'male') return t('analytics.customer.genderMale');
    if (lower === 'female') return t('analytics.customer.genderFemale');
    if (lower === 'other') return t('analytics.customer.genderOther');
    if (lower === 'unspecified') return t('analytics.customer.genderUnspecified');

    if (lower === 'local') return t('analytics.customer.providerLocal');
    if (lower === 'google') return t('analytics.customer.providerGoogle');
    if (lower === 'facebook') return t('analytics.customer.providerFacebook');

    if (lower === 'active') return t('analytics.customer.activeStatus');
    if (lower === 'blocked') return t('analytics.customer.blockedStatus');
    if (lower === 'inactive') return t('analytics.customer.inactiveStatus');

    if (lower === 'paid') return t('analytics.customer.statusPaid');
    if (lower === 'completed') return t('analytics.customer.statusCompleted');
    if (lower === 'pending') return t('analytics.customer.statusPending');
    if (lower === 'cancelled') return t('analytics.customer.statusCancelled');

    if (norm === 'NeverPurchased') return t('analytics.customer.neverPurchased');
    if (norm === 'OneTimeBuyer') return t('analytics.customer.oneTimeBuyer');
    if (norm === 'RepeatBuyer') return t('analytics.customer.repeatBuyer');

    if (lower.includes('star')) return norm.replace(/stars?/i, '★');

    return norm;
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)] border border-slate-100 transition-all hover:shadow-md">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
        {data.length > 0 && (
          <span className="shrink-0 rounded-full bg-brand/10 px-3 py-1 text-xs font-extrabold text-brand">
            {data.length} {data.length === 1 ? t('analytics.customer.item') : t('analytics.customer.items')}
          </span>
        )}
      </div>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm font-medium text-slate-400">{resolvedEmpty}</p>
      ) : (
        <>
          <div className="space-y-3.5">
            {visibleData.map((item, i) => {
              const colorIndex = usePagination ? pageStart + i : i;
              const displayLabel = getTranslatedLabel(item.label);
              return (
                <div key={`${item.label}-${colorIndex}`} className="group">
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-bold">
                    <span className="min-w-0 truncate text-slate-800 group-hover:text-brand transition-colors">
                      {displayLabel}
                    </span>
                    <span className="shrink-0 text-slate-600">
                      {formatNumber(item.count)}{' '}
                      <span className="text-slate-400 font-semibold">({formatPercent(item.percentage)})</span>
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 p-0.5 shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                      style={{
                        width: `${(item.count / maxCount) * 100}%`,
                        backgroundColor: CHART_COLORS[colorIndex % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {useCollapse && collapseLimit && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  {t('analytics.customer.showLess')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  {t('analytics.customer.showAllItems', { count: data.length })}
                </>
              )}
            </button>
          )}

          {usePagination && pageSize && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500">
                {t('analytics.platform.showingPagination', {
                  start: pageStart + 1,
                  end: Math.min(pageStart + pageSize, data.length),
                  total: data.length,
                })}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[4.5rem] text-center text-xs font-semibold text-slate-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
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
