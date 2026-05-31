import React from 'react';
import {
  ArrowLeft,
  Calendar,
  Hash,
  Lock,
  Pencil,
  Ticket,
  Unlock,
  User,
} from 'lucide-react';
import { ActionButton } from '../../../components/dashboard/ActionButton';
import { Table, type Column } from '../../../components/dashboard/Table';
import { useVoucherDetail } from '../hooks/useVoucherDetail';
import { useChangeVoucherStatus } from '../hooks/useChangeVoucherStatus';
import type { ReadUserVoucherDTO } from '../types/voucher';
import {
  formatDateTime,
  formatDiscount,
  formatVnd,
  STATUS_STYLES,
} from '../utils/voucherHelpers';

export const VoucherDetail: React.FC = () => {
  const { voucher, isLoading, error, handleEdit, handleBack, refetch } = useVoucherDetail();
  const { executeStatusChange, updatingId } = useChangeVoucherStatus(refetch);

  if (isLoading) {
    return <div className="flex justify-center p-10 text-slate-500">Loading voucher details...</div>;
  }

  if (error) {
    return <div className="flex justify-center p-10 text-rose-500">{error}</div>;
  }

  if (!voucher) {
    return <div className="flex justify-center p-10 text-slate-500">Voucher not found.</div>;
  }

  const assignmentColumns: Column<ReadUserVoucherDTO>[] = [
    {
      header: 'Customer',
      render: (item) => (
        <div>
          <div className="font-medium text-slate-800">{item.userFullName || `User #${item.userId}`}</div>
          <div className="text-xs text-slate-500">{item.userEmail || `ID: ${item.userId}`}</div>
        </div>
      ),
    },
    {
      header: 'Quantity',
      render: (item) => <span className="text-sm text-slate-600">{item.quantity}</span>,
    },
    {
      header: 'Status',
      render: (item) => (
        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
          {item.status}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl py-2">
      <button
        type="button"
        onClick={handleBack}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Vouchers
      </button>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">{voucher.code}</h2>
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  STATUS_STYLES[voucher.status] || 'bg-slate-100 text-slate-600'
                }`}
              >
                {voucher.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {voucher.description || 'No description provided.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionButton
              variant="secondary"
              onClick={() => executeStatusChange(voucher.id, voucher.isActive)}
              className={`gap-2 px-4 py-2 text-sm ${
                updatingId === voucher.id ? 'cursor-wait opacity-50' : ''
              }`}
              disabled={updatingId === voucher.id}
            >
              {voucher.isActive ? (
                <>
                  <Lock className="h-4 w-4" /> Deactivate
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" /> Activate
                </>
              )}
            </ActionButton>
            <ActionButton
              variant="primary"
              onClick={handleEdit}
              className="gap-2 px-4 py-2 text-sm"
              disabled={!voucher.isActive}
            >
              <Pencil className="h-4 w-4" /> Edit
            </ActionButton>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailCard
            icon={<Hash className="h-4 w-4" />}
            label="Discount"
            value={formatDiscount(voucher.discountType, voucher.discountValue)}
            hint={
              voucher.discountType === 'Percent' && voucher.maxDiscountAmount
                ? `Max ${formatVnd(voucher.maxDiscountAmount)}`
                : undefined
            }
          />
          <DetailCard
            icon={<Ticket className="h-4 w-4" />}
            label="Tour"
            value={voucher.tourName || 'All tours'}
          />
          <DetailCard
            icon={<Hash className="h-4 w-4" />}
            label="Usage"
            value={`${voucher.usedCount} / ${voucher.availableCount} used`}
            hint={`${voucher.remainingCount} remaining`}
          />
          <DetailCard
            icon={<Calendar className="h-4 w-4" />}
            label="Start Date"
            value={formatDateTime(voucher.startDate)}
          />
          <DetailCard
            icon={<Calendar className="h-4 w-4" />}
            label="End Date"
            value={formatDateTime(voucher.endDate)}
          />
          <DetailCard
            icon={<User className="h-4 w-4" />}
            label="Created By"
            value={voucher.creatorName || `User #${voucher.creatorId}`}
          />
        </div>

        <div className="border-t border-slate-100 px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Assigned Customers ({voucher.assignedCustomerCount})
            </h3>
            <span className="text-xs text-slate-500">
              {voucher.isCustomerSpecific ? 'Customer-specific voucher' : 'Public voucher'}
            </span>
          </div>

          {voucher.assignedCustomers.length > 0 ? (
            <Table
              data={voucher.assignedCustomers}
              columns={assignmentColumns}
              keyExtractor={(item) => item.id}
              emptyMessage="No assigned customers."
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              This voucher is available to all customers.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}> = ({ icon, label, value, hint }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {icon}
      {label}
    </div>
    <div className="text-sm font-semibold text-slate-900">{value}</div>
    {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
  </div>
);
