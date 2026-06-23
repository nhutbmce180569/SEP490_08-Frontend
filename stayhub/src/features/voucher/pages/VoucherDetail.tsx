import React, { useMemo } from 'react';
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
import { useTranslation } from '../../../contexts/LocaleContext';
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
  const { t } = useTranslation();
  const { voucher, isLoading, error, handleEdit, handleBack, refetch } = useVoucherDetail();
  const { executeStatusChange, updatingId } = useChangeVoucherStatus(refetch);

  const assignmentColumns: Column<ReadUserVoucherDTO>[] = useMemo(
    () => [
      {
        header: t('voucher.customer'),
        render: (item) => (
          <div>
            <div className="font-medium text-slate-800">
              {item.userFullName || t('voucher.userId', { id: item.userId })}
            </div>
            <div className="text-xs text-slate-500">
              {item.userEmail || `ID: ${item.userId}`}
            </div>
          </div>
        ),
      },
      {
        header: t('voucher.quantity'),
        render: (item) => <span className="text-sm text-slate-600">{item.quantity}</span>,
      },
      {
        header: t('common.status'),
        render: (item) => (
          <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            {item.status}
          </span>
        ),
      },
    ],
    [t],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-10 text-slate-500">
        {t('voucher.loadingVoucherDetails')}
      </div>
    );
  }

  if (error) {
    return <div className="flex justify-center p-10 text-rose-500">{error}</div>;
  }

  if (!voucher) {
    return (
      <div className="flex justify-center p-10 text-slate-500">{t('voucher.voucherNotFound')}</div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-2">
      <button
        type="button"
        onClick={handleBack}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> {t('voucher.backToVouchers')}
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
              {voucher.description || t('content.noDescriptionProvided')}
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
                  <Lock className="h-4 w-4" /> {t('voucher.deactivate')}
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" /> {t('voucher.activate')}
                </>
              )}
            </ActionButton>
            <ActionButton
              variant="primary"
              onClick={handleEdit}
              className="gap-2 px-4 py-2 text-sm"
              disabled={voucher.isActive}
            >
              <Pencil className="h-4 w-4" /> {t('common.edit')}
            </ActionButton>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailCard
            icon={<Hash className="h-4 w-4" />}
            label={t('voucher.discount')}
            value={formatDiscount(voucher.discountType, voucher.discountValue)}
            hint={
              voucher.discountType === 'Percent' && voucher.maxDiscountAmount
                ? t('voucher.maxDiscountHint', {
                    amount: formatVnd(voucher.maxDiscountAmount),
                  })
                : undefined
            }
          />
          <DetailCard
            icon={<Ticket className="h-4 w-4" />}
            label={t('voucher.tour')}
            value={voucher.tourName || t('voucher.allTours')}
          />
          <DetailCard
            icon={<Hash className="h-4 w-4" />}
            label={t('voucher.usage')}
            value={t('voucher.usedSlashAvailable', {
              used: voucher.usedCount,
              available: voucher.availableCount,
            })}
            hint={t('voucher.remainingHint', { count: voucher.remainingCount })}
          />
          <DetailCard
            icon={<Calendar className="h-4 w-4" />}
            label={t('voucher.startDate')}
            value={formatDateTime(voucher.startDate)}
          />
          <DetailCard
            icon={<Calendar className="h-4 w-4" />}
            label={t('voucher.endDate')}
            value={formatDateTime(voucher.endDate)}
          />
          <DetailCard
            icon={<User className="h-4 w-4" />}
            label={t('voucher.createdBy')}
            value={voucher.creatorName || t('voucher.userId', { id: voucher.creatorId })}
          />
        </div>

        <div className="border-t border-slate-100 px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              {t('voucher.assignedCustomersCount', { count: voucher.assignedCustomerCount })}
            </h3>
            <span className="text-xs text-slate-500">
              {voucher.isCustomerSpecific
                ? t('voucher.customerSpecificVoucher')
                : t('voucher.publicVoucher')}
            </span>
          </div>

          {voucher.assignedCustomers.length > 0 ? (
            <Table
              data={voucher.assignedCustomers}
              columns={assignmentColumns}
              keyExtractor={(item) => item.id}
              emptyMessage={t('voucher.noAssignedCustomers')}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              {t('voucher.publicVoucherAvailable')}
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
