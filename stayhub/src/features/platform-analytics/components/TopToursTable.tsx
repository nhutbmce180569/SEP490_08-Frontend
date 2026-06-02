import React from 'react';
import type { TopBookedTour } from '../types/platformAnalytics.types';
import { formatNumber } from '../../customer-analytics/utils/analyticsHelpers';

interface TopToursTableProps {
  tours: TopBookedTour[];
  isLoading?: boolean;
}

export const TopToursTable: React.FC<TopToursTableProps> = ({ tours, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (tours.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-400">
        No booking data available for the selected period.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <th className="px-6 py-3">#</th>
            <th className="px-4 py-3">Tour</th>
            <th className="px-4 py-3 text-right">Bookings</th>
          </tr>
        </thead>
        <tbody>
          {tours.map((tour, index) => (
            <tr
              key={tour.tourId}
              className="border-b border-slate-50 transition hover:bg-slate-50/80"
            >
              <td className="px-6 py-4">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                    index < 3
                      ? 'bg-brand/10 text-brand'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {index + 1}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="font-semibold text-slate-900">
                  {tour.tourName ?? `Tour #${tour.tourId}`}
                </div>
                <div className="text-xs text-slate-400">ID: {tour.tourId}</div>
              </td>
              <td className="px-4 py-4 text-right font-bold text-slate-900">
                {formatNumber(tour.count)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
