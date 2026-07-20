import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Search, Star } from 'lucide-react';
import { Table, type Column } from '../../../components/dashboard/Table';
import { PaginationButton } from '../../../components/dashboard/PaginationButton';
import { getImg } from '../../../config/api/api';
import { useCustomerList } from '../hooks/useCustomerAnalytics';
import type {
  CustomerListItemAnalytics,
  DateRangeParams,
  SortBy,
  SortOrder,
} from '../types/customerAnalytics.types';
import {
  formatCompactVnd,
  formatDateTime,
  formatNumber,
  getSegmentLabel,
  SEGMENT_STYLES,
  STATUS_STYLES,
} from '../utils/analyticsHelpers';
import { useTranslation } from '../../../contexts/LocaleContext';

interface CustomerListPanelProps {
  dateParams: DateRangeParams;
  onViewCustomer: (id: number) => void;
}

export const CustomerListPanel: React.FC<CustomerListPanelProps> = ({
  dateParams,
  onViewCustomer,
}) => {
  const { t, locale } = useTranslation();

  const getSegmentLabelTranslated = (segment: string) => {
    if (segment === 'NeverPurchased') return t('analytics.customer.neverPurchased');
    if (segment === 'OneTimeBuyer') return t('analytics.customer.oneTimeBuyer');
    if (segment === 'RepeatBuyer') return t('analytics.customer.repeatBuyer');
    return segment;
  };

  const getStatusLabelTranslated = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'active') return t('analytics.customer.activeStatus');
    if (s === 'blocked') return t('analytics.customer.blockedStatus');
    if (s === 'inactive') return t('analytics.customer.inactiveStatus');
    return status;
  };

  const SORT_OPTIONS: { value: SortBy; label: string }[] = useMemo(
    () => [
      { value: 'totalSpend', label: t('analytics.customer.sortSpend') },
      { value: 'orderCount', label: t('analytics.customer.sortOrders') },
      { value: 'reviewCount', label: t('analytics.customer.sortReviews') },
      { value: 'wishlistCount', label: t('analytics.customer.sortWishlist') },
      { value: 'createdAt', label: t('analytics.customer.sortJoined') },
      { value: 'lastOrderAt', label: t('analytics.customer.sortLastOrder') },
    ],
    [t],
  );
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>('totalSpend');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const pageSize = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchInput) {
        setPage(1);
        setSearch(searchInput);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const queryParams = useMemo(
    () => ({ ...dateParams, search, page, pageSize, sortBy, sortOrder }),
    [dateParams, search, page, sortBy, sortOrder],
  );

  const { data, isLoading, error } = useCustomerList(queryParams);

  const customers = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.currentPage ?? 1;
  const totalItems = data?.total ?? 0;

  const columns: Column<CustomerListItemAnalytics>[] = useMemo(
    () => [
      {
        header: t('analytics.customer.colCustomer'),
        render: (c) => (
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
              <div className="font-bold text-slate-800 text-sm">{c.fullName}</div>
              <div className="text-xs text-slate-400 font-medium">{c.email}</div>
            </div>
          </div>
        ),
      },
      {
        header: t('analytics.customer.colSegment'),
        render: (c) => (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold shadow-xs ${
              SEGMENT_STYLES[c.customerSegment] ?? 'bg-slate-100 text-slate-600'
            }`}
          >
            {getSegmentLabelTranslated(c.customerSegment)}
          </span>
        ),
      },
      {
        header: t('analytics.customer.colStatus'),
        render: (c) =>
          c.status ? (
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold shadow-xs ${
                STATUS_STYLES[c.status] ?? 'bg-slate-100 text-slate-600'
              }`}
            >
              {getStatusLabelTranslated(c.status)}
            </span>
          ) : (
            '—'
          ),
      },
      {
        header: t('analytics.customer.colSpend'),
        render: (c) => (
          <span className="font-black text-brand text-sm">{formatCompactVnd(c.totalSpend)}</span>
        ),
      },
      {
        header: t('analytics.customer.colOrders'),
        render: (c) => <span className="font-bold text-slate-700">{formatNumber(c.totalOrders)}</span>,
      },
      {
        header: t('analytics.customer.colEngagement'),
        render: (c) => (
          <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {c.reviewCount}
            </span>
            <span className="flex items-center gap-1 text-rose-500">
              ♥ {c.wishlistCount}
            </span>
          </div>
        ),
      },
      {
        header: t('analytics.customer.colLastOrder'),
        render: (c) => (
          <span className="text-xs font-semibold text-slate-500">{formatDateTime(c.lastOrderAt, locale)}</span>
        ),
      },
      {
        header: '',
        className: 'w-16 text-right',
        render: (c) => (
          <button
            type="button"
            onClick={() => onViewCustomer(c.customerId)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand hover:bg-brand hover:text-white transition-all shadow-xs"
            title={t('analytics.customer.viewCustomer')}
            aria-label={t('analytics.customer.viewCustomer')}
          >
            <Eye className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [onViewCustomer, t, locale],
  );

  return (
    <div className="rounded-2xl bg-white shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)] border border-slate-100">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{t('analytics.customer.customerList')}</h3>
          <p className="text-xs font-medium text-slate-500 mt-0.5">{t('analytics.customer.customerListDesc')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 shadow-xs transition-focus focus-within:border-brand focus-within:bg-white">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('analytics.customer.searchPlaceholder')}
              className="w-48 bg-transparent text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as SortBy);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs cursor-pointer hover:bg-slate-50 outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t('analytics.customer.sortBy', { label: o.label })}
              </option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value as SortOrder);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs cursor-pointer hover:bg-slate-50 outline-none"
          >
            <option value="desc">{t('analytics.customer.descending')}</option>
            <option value="asc">{t('analytics.customer.ascending')}</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="px-6 py-4 text-sm font-medium text-rose-600 bg-rose-50/50 border-b border-rose-100">
          {t('analytics.customer.errorList')}
        </div>
      )}

      <Table
        data={customers}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={(c) => c.customerId}
        emptyMessage={t('analytics.customer.noCustomersFound')}
      />

      <PaginationButton
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
};
