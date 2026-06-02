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

interface CustomerListPanelProps {
  dateParams: DateRangeParams;
  onViewCustomer: (id: number) => void;
}

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'totalSpend', label: 'Spend' },
  { value: 'orderCount', label: 'Orders' },
  { value: 'reviewCount', label: 'Reviews' },
  { value: 'wishlistCount', label: 'Wishlist' },
  { value: 'createdAt', label: 'Joined Date' },
  { value: 'lastOrderAt', label: 'Last Order' },
];

export const CustomerListPanel: React.FC<CustomerListPanelProps> = ({
  dateParams,
  onViewCustomer,
}) => {
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
        header: 'Customer',
        render: (c) => (
          <div className="flex items-center gap-3">
            {c.avatarUrl ? (
              <img
                src={getImg(c.avatarUrl)}
                alt={c.fullName}
                className="h-9 w-9 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                {c.fullName.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <div className="font-semibold text-slate-800">{c.fullName}</div>
              <div className="text-xs text-slate-400">{c.email}</div>
            </div>
          </div>
        ),
      },
      {
        header: 'Segment',
        render: (c) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${SEGMENT_STYLES[c.customerSegment] ?? 'bg-slate-100 text-slate-600'}`}
          >
            {getSegmentLabel(c.customerSegment)}
          </span>
        ),
      },
      {
        header: 'Status',
        render: (c) =>
          c.status ? (
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[c.status] ?? 'bg-slate-100 text-slate-600'}`}
            >
              {c.status}
            </span>
          ) : (
            '—'
          ),
      },
      {
        header: 'Spend',
        render: (c) => (
          <span className="font-semibold text-slate-800">{formatCompactVnd(c.totalSpend)}</span>
        ),
      },
      {
        header: 'Orders',
        render: (c) => formatNumber(c.totalOrders),
      },
      {
        header: 'Engagement',
        render: (c) => (
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              {c.reviewCount}
            </span>
            <span>♥ {c.wishlistCount}</span>
          </div>
        ),
      },
      {
        header: 'Last Order',
        render: (c) => (
          <span className="text-sm text-slate-600">{formatDateTime(c.lastOrderAt)}</span>
        ),
      },
      {
        header: '',
        className: 'w-16',
        render: (c) => (
          <button
            type="button"
            onClick={() => onViewCustomer(c.customerId)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand hover:bg-brand-light"
            aria-label="View customer"
          >
            <Eye className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [onViewCustomer],
  );

  return (
    <div className="rounded-2xl bg-white shadow-[6px_6px_54px_0px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Customer List</h3>
          <p className="text-sm text-slate-500">Search, sort, and view individual customer details</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email..."
              className="w-48 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as SortBy);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value as SortOrder);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="px-6 py-4 text-sm text-rose-600">
          Unable to load customer list.
        </div>
      )}

      <Table
        data={customers}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={(c) => c.customerId}
        emptyMessage="No customers found."
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
