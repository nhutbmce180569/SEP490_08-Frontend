import React, { useMemo } from 'react';
import { Crown, Medal, Star } from 'lucide-react';
import { getImg } from '../../../config/api/api';
import type { TopCustomerAnalytics } from '../types/customerAnalytics.types';
import {
  formatCompactVnd,
  formatDateTime,
  formatNumber,
} from '../utils/analyticsHelpers';

interface TopCustomersTableProps {
  customers: TopCustomerAnalytics[];
  isLoading?: boolean;
  onViewCustomer?: (id: number) => void;
}

const RANK_STYLES = [
  'bg-amber-100 text-amber-700',
  'bg-slate-200 text-slate-600',
  'bg-orange-100 text-orange-700',
];

export const TopCustomersTable: React.FC<TopCustomersTableProps> = ({
  customers,
  isLoading,
  onViewCustomer,
}) => {
  const rows = useMemo(() => customers.slice(0, 10), [customers]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-400">
        No customer data available for this time period
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[720px] w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            {['#', 'Customer', 'Spend', 'Orders', 'Tickets', 'Reviews', 'Last Order'].map(
              (h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((c, idx) => (
            <tr
              key={c.customerId}
              className={`border-b border-slate-100 transition-colors hover:bg-slate-50/80 ${onViewCustomer ? 'cursor-pointer' : ''}`}
              onClick={() => onViewCustomer?.(c.customerId)}
            >
              <td className="px-5 py-3.5">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${RANK_STYLES[idx] ?? 'bg-slate-100 text-slate-500'}`}
                >
                  {idx < 3 ? <Medal className="h-3.5 w-3.5" /> : idx + 1}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {c.avatarUrl ? (
                    <img
                      src={getImg(c.avatarUrl)}
                      alt={c.fullName}
                      className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                    />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                      {c.fullName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      {c.fullName}
                      {idx === 0 && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                    </div>
                    <div className="text-xs text-slate-400">{c.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5 font-bold text-brand">
                {formatCompactVnd(c.totalSpend)}
              </td>
              <td className="px-5 py-3.5 text-sm text-slate-700">{formatNumber(c.orderCount)}</td>
              <td className="px-5 py-3.5 text-sm text-slate-700">{formatNumber(c.totalTickets)}</td>
              <td className="px-5 py-3.5">
                <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {c.reviewCount}
                  {c.averageRatingGiven != null && (
                    <span className="text-slate-400">({c.averageRatingGiven.toFixed(1)})</span>
                  )}
                </span>
              </td>
              <td className="px-5 py-3.5 text-sm text-slate-600">
                {formatDateTime(c.lastOrderAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
