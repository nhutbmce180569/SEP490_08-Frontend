import React from 'react';
import { Heart, MessageSquare, Star } from 'lucide-react';
import { DistributionChart } from './DistributionChart';
import { StatCard } from './StatCard';
import type { CustomerEngagementAnalytics } from '../types/customerAnalytics.types';
import { formatNumber, formatPercent } from '../utils/analyticsHelpers';
import { useTranslation } from '../../../contexts/LocaleContext';

interface EngagementPanelProps {
  data?: CustomerEngagementAnalytics;
  isLoading?: boolean;
}

export const EngagementPanel: React.FC<EngagementPanelProps> = ({ data, isLoading }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const tableHeaders = [
    t('analytics.engagement.colHash'),
    t('analytics.engagement.colTour'),
    t('analytics.engagement.colReviews'),
    t('analytics.engagement.colAvgRating'),
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('analytics.engagement.totalReviews')}
          value={formatNumber(data.totalReviews)}
          subLabel={t('analytics.engagement.reviewsVisibleHidden', {
            visible: formatNumber(data.visibleReviews),
            hidden: formatNumber(data.hiddenReviews),
          })}
          icon={<MessageSquare className="h-5 w-5 text-indigo-500" />}
          iconBgClass="bg-indigo-50"
        />
        <StatCard
          label={t('analytics.engagement.uniqueReviewers')}
          value={formatNumber(data.uniqueReviewers)}
          subLabel={t('analytics.engagement.participationRate', {
            rate: formatPercent(data.reviewParticipationRate),
          })}
          icon={<Star className="h-5 w-5 text-amber-500" />}
          iconBgClass="bg-amber-50"
        />
        <StatCard
          label={t('analytics.engagement.averageRating')}
          value={`${data.averageRating.toFixed(1)} ★`}
          icon={<Star className="h-5 w-5 text-emerald-500" />}
          iconBgClass="bg-emerald-50"
        />
        <StatCard
          label={t('analytics.engagement.wishlists')}
          value={formatNumber(data.totalWishlists)}
          subLabel={t('analytics.engagement.wishlistSub', {
            customers: formatNumber(data.uniqueWishlistCustomers),
            avg: data.averageWishlistsPerCustomer.toFixed(1),
          })}
          icon={<Heart className="h-5 w-5 text-rose-500" />}
          iconBgClass="bg-rose-50"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionChart title={t('analytics.engagement.ratingDistribution')} data={data.ratingDistribution} />

        <section className="rounded-2xl bg-white p-5 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
          <h3 className="mb-4 text-base font-bold text-slate-900">{t('analytics.engagement.mostWishlistedTours')}</h3>
          {data.topWishlistedTours.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">{t('analytics.engagement.noData')}</p>
          ) : (
            <div className="space-y-2">
              {data.topWishlistedTours.map((tour, i) => (
                <div
                  key={tour.tourId}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-50 text-xs font-bold text-rose-600">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {tour.tourName ?? t('analytics.engagement.tourFallback', { id: tour.tourId })}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-rose-500">
                    <Heart className="h-3.5 w-3.5 fill-current" />
                    {formatNumber(tour.count)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
        <h3 className="mb-4 text-base font-bold text-slate-900">{t('analytics.engagement.mostReviewedTours')}</h3>
        {data.topReviewedTours.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">{t('analytics.engagement.noData')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[560px] w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {tableHeaders.map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.topReviewedTours.map((tour, i) => (
                  <tr key={tour.tourId} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-sm font-bold text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {tour.tourName ?? t('analytics.engagement.tourFallback', { id: tour.tourId })}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatNumber(tour.count)}</td>
                    <td className="px-4 py-3">
                      {tour.averageRating != null ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {tour.averageRating.toFixed(1)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
