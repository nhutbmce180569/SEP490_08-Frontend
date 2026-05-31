import React, { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Lock,
  Pencil,
  Plus,
  Search,
  Unlock,
} from 'lucide-react';
import { Table, type Column } from '../../../components/dashboard/Table';
import { PaginationButton } from '../../../components/dashboard/PaginationButton';
import { ActionButton } from '../../../components/dashboard/ActionButton';
import { useVouchers } from '../hooks/useVouchers';
import { useChangeVoucherStatus } from '../hooks/useChangeVoucherStatus';
import { useTourOptions } from '../hooks/useTourOptions';
import type { ReadVoucherDTO } from '../types/voucher';
import {
  formatDateTime,
  formatDiscount,
  formatVnd,
  STATUS_STYLES,
} from '../utils/voucherHelpers';

export const VoucherList: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [discountType, setDiscountType] = useState('');
  const [status, setStatus] = useState('');
  const [isActive, setIsActive] = useState('');
  const [tourId, setTourId] = useState('');

  const { options: tourOptions } = useTourOptions();

  const filters = useMemo(
    () => ({
      search: search || undefined,
      discountType: discountType || undefined,
      status: status || undefined,
      tourId: tourId ? Number(tourId) : undefined,
      isActive: isActive === '' ? undefined : isActive === 'true',
    }),
    [search, discountType, status, tourId, isActive],
  );

  const {
    data,
    isLoading,
    error,
    pageSize,
    setPage,
    handleCreate,
    handleEdit,
    handleView,
  } = useVouchers(filters);

  const { executeStatusChange, updatingId } = useChangeVoucherStatus();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchInput) {
        setPage(1);
        setSearch(searchInput);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, search, setPage]);

  const vouchers = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;
  const totalItems = data?.total || 0;

  const columns: Column<ReadVoucherDTO>[] = useMemo(
    () => [
      {
        header: 'Code',
        render: (voucher) => (
          <span className="font-semibold tracking-wide text-slate-800">{voucher.code}</span>
        ),
      },
      {
        header: 'Discount',
        render: (voucher) => (
          <div className="text-sm">
            <div className="font-medium text-slate-800">
              {formatDiscount(voucher.discountType, voucher.discountValue)}
            </div>
            {voucher.discountType === 'Percent' && voucher.maxDiscountAmount && (
              <div className="text-xs text-slate-500">
                Max {formatVnd(voucher.maxDiscountAmount)}
              </div>
            )}
          </div>
        ),
      },
      {
        header: 'Tour',
        render: (voucher) => (
          <span className="text-sm text-slate-600">
            {voucher.tourName || 'All tours'}
          </span>
        ),
      },
      {
        header: 'Usage',
        render: (voucher) => (
          <span className="text-sm text-slate-600">
            {voucher.usedCount}/{voucher.availableCount}
            <span className="ml-1 text-xs text-slate-400">
              ({voucher.remainingCount} left)
            </span>
          </span>
        ),
      },
      {
        header: 'Valid Period',
        render: (voucher) => (
          <div className="text-xs text-slate-600">
            <div>{formatDateTime(voucher.startDate)}</div>
            <div className="text-slate-400">to {formatDateTime(voucher.endDate)}</div>
          </div>
        ),
      },
      {
        header: 'Status',
        render: (voucher) => (
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              STATUS_STYLES[voucher.status] || 'bg-slate-100 text-slate-600'
            }`}
          >
            {voucher.status}
          </span>
        ),
      },
      {
        header: 'Action',
        render: (voucher) => (
          <div className="flex items-center gap-1.5">
            <ActionButton
              variant="secondary"
              onClick={() => executeStatusChange(voucher.id, voucher.isActive)}
              className={`h-8 w-8 ${
                updatingId === voucher.id ? 'cursor-wait opacity-50' : ''
              } ${
                voucher.isActive
                  ? 'text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700'
                  : 'text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
              title={voucher.isActive ? 'Deactivate' : 'Activate'}
              disabled={updatingId === voucher.id}
            >
              {voucher.isActive ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Unlock className="h-3.5 w-3.5" />
              )}
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => handleView(voucher.id)}
              className="h-8 w-8"
              title="View details"
            >
              <Eye className="h-3.5 w-3.5" />
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => handleEdit(voucher.id)}
              className="h-8 w-8"
              title="Edit voucher"
              disabled={!voucher.isActive}
            >
              <Pencil className="h-3.5 w-3.5" />
            </ActionButton>
          </div>
        ),
      },
    ],
    [executeStatusChange, handleEdit, handleView, updatingId],
  );

  return (
    <div className="rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-bold leading-tight text-slate-900">Voucher Management</h2>
          <p className="mt-0.5 text-xs text-slate-500">Create and manage discount vouchers for your tours.</p>
        </div>
        <ActionButton variant="primary" onClick={handleCreate} className="gap-2 px-4 py-2 text-sm">
          <Plus className="h-4 w-4" /> Create Voucher
        </ActionButton>
      </div>

      <div className="grid gap-3 border-b border-slate-100 px-6 py-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search code or description..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-[#EB662B] focus:bg-white focus:ring-4 focus:ring-[#EB662B]/10"
          />
        </div>

        <select
          value={tourId}
          onChange={(event) => {
            setPage(1);
            setTourId(event.target.value);
          }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#EB662B] focus:bg-white"
        >
          <option value="">All tours</option>
          {tourOptions
            .filter((option) => option.value !== '')
            .map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>

        <select
          value={discountType}
          onChange={(event) => {
            setPage(1);
            setDiscountType(event.target.value);
          }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#EB662B] focus:bg-white"
        >
          <option value="">All discount types</option>
          <option value="Percent">Percent</option>
          <option value="Amount">Amount</option>
        </select>

        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#EB662B] focus:bg-white"
        >
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Expired">Expired</option>
          <option value="Depleted">Depleted</option>
        </select>

        <select
          value={isActive}
          onChange={(event) => {
            setPage(1);
            setIsActive(event.target.value);
          }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#EB662B] focus:bg-white"
        >
          <option value="">Active flag</option>
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10 text-slate-500">Loading vouchers...</div>
      ) : error ? (
        <div className="flex justify-center p-10 text-rose-500">{error}</div>
      ) : (
        <Table
          data={vouchers}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage="No vouchers found."
        />
      )}

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
