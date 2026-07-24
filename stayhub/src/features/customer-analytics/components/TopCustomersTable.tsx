import React, { useMemo } from 'react';
import { Crown, Medal, Star } from 'lucide-react';
import { getImg } from '../../../config/api/api';
import type { TopCustomerAnalytics } from '../types/customerAnalytics.types';
import {
  formatCompactAnalyticsMoney,
  formatDateTime,
  formatNumber,
} from '../utils/analyticsHelpers';
import { useTranslation } from '../../../contexts/LocaleContext';
import { useCurrency } from '../../currency/CurrencyContext';

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
  const { t, locale } = useTranslation();
  const { mode, usdToVndRate } = useCurrency();

  const rows = useMemo(() => customers.slice(0, 10), [customers]);

  const headers = useMemo(
    () => [
      t('analytics.customer.colRank'),
      t('analytics.customer.colCustomer'),
      t('analytics.customer.colSpend'),
      t('analytics.customer.colOrders'),
      t('analytics.customer.colTickets'),
      t('analytics.customer.colReviews'),
      t('analytics.customer.colLastOrder'),
    ],
    [t],
  );

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
      <p className="py-12 text-center text-sm font-medium text-slate-400">
        {t('analytics.customer.noCustomerData')}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[720px] w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80">
            {headers.map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((c, idx) => (
            <tr
              key={c.customerId}
              className={`group transition-colors hover:bg-slate-50/90 ${
                onViewCustomer ? 'cursor-pointer' : ''
              }`}
              onClick={() => onViewCustomer?.(c.customerId)}
            >
              <td className="px-5 py-4">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-black shadow-sm ${
                    RANK_STYLES[idx] ?? 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {idx < 3 ? <Medal className="h-4 w-4" /> : idx + 1}
                </span>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  {c.avatarUrl ? (
                    <img
                      src={getImg(c.avatarUrl)}
                      alt={c.fullName}
                      className="h-10 w-10 rounded-full border border-slate-200 object-cover shadow-sm"
                    />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-sm font-black text-brand">
                      {c.fullName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800 group-hover:text-brand transition-colors">
                      {c.fullName}
                      {idx === 0 && <Crown className="h-4 w-4 text-amber-500 fill-amber-400" />}
                    </div>
                    <div className="text-xs font-medium text-slate-400">{c.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 font-black text-brand text-sm">
                {formatCompactAnalyticsMoney(c.totalSpend, mode, usdToVndRate)}
              </td>
              <td className="px-5 py-4 text-sm font-bold text-slate-700">
                {formatNumber(c.orderCount)}
              </td>
              <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                {formatNumber(c.totalTickets)}
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-700">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {c.reviewCount}
                  {c.averageRatingGiven != null && (
                    <span className="text-xs font-medium text-slate-400">
                      ({c.averageRatingGiven.toFixed(1)})
                    </span>
                  )}
                </span>
              </td>
              <td className="px-5 py-4 text-xs font-semibold text-slate-500">
                {formatDateTime(c.lastOrderAt, locale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
