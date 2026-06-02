import React from 'react';
import { Heart, MessageSquare, Star } from 'lucide-react';
import { DistributionChart } from './DistributionChart';
import { StatCard } from './StatCard';
import type { CustomerEngagementAnalytics } from '../types/customerAnalytics.types';
import { formatNumber, formatPercent } from '../utils/analyticsHelpers';

interface EngagementPanelProps {
  data?: CustomerEngagementAnalytics;
  isLoading?: boolean;
}

export const EngagementPanel: React.FC<EngagementPanelProps> = ({ data, isLoading }) => {
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Reviews"
          value={formatNumber(data.totalReviews)}
          subLabel={`${formatNumber(data.visibleReviews)} visible · ${formatNumber(data.hiddenReviews)} hidden`}
          icon={<MessageSquare className="h-5 w-5 text-indigo-500" />}
          iconBgClass="bg-indigo-50"
        />
        <StatCard
          label="Unique Reviewers"
          value={formatNumber(data.uniqueReviewers)}
          subLabel={`Participation rate: ${formatPercent(data.reviewParticipationRate)}`}
          icon={<Star className="h-5 w-5 text-amber-500" />}
          iconBgClass="bg-amber-50"
        />
        <StatCard
          label="Average Rating"
          value={`${data.averageRating.toFixed(1)} ★`}
          icon={<Star className="h-5 w-5 text-emerald-500" />}
          iconBgClass="bg-emerald-50"
        />
        <StatCard
          label="Wishlists"
          value={formatNumber(data.totalWishlists)}
          subLabel={`${formatNumber(data.uniqueWishlistCustomers)} customers · Avg ${data.averageWishlistsPerCustomer.toFixed(1)}/customer`}
          icon={<Heart className="h-5 w-5 text-rose-500" />}
          iconBgClass="bg-rose-50"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionChart title="Rating Distribution" data={data.ratingDistribution} />

        <section className="rounded-2xl bg-white p-5 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
          <h3 className="mb-4 text-base font-bold text-slate-900">Most Wishlisted Tours</h3>
          {data.topWishlistedTours.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No data available</p>
          ) : (
            <div className="space-y-2">
              {data.topWishlistedTours.map((t, i) => (
                <div
                  key={t.tourId}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-50 text-xs font-bold text-rose-600">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {t.tourName ?? `Tour #${t.tourId}`}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-rose-500">
                    <Heart className="h-3.5 w-3.5 fill-current" />
                    {formatNumber(t.count)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
        <h3 className="mb-4 text-base font-bold text-slate-900">Most Reviewed Tours</h3>
        {data.topReviewedTours.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[560px] w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['#', 'Tour', 'Reviews', 'Avg. Rating'].map((h) => (
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
                {data.topReviewedTours.map((t, i) => (
                  <tr key={t.tourId} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-sm font-bold text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {t.tourName ?? `Tour #${t.tourId}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatNumber(t.count)}</td>
                    <td className="px-4 py-3">
                      {t.averageRating != null ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {t.averageRating.toFixed(1)}
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
