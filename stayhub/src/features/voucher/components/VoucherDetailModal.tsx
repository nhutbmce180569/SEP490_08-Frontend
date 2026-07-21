import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Hash,
  Ticket,
  User,
  X,
  Tag,
  Loader2,
} from 'lucide-react';
import { useTranslation } from '../../../contexts/LocaleContext';
import { Table, type Column } from '../../../components/dashboard/Table';
import { voucherService } from '../services/voucher.service';
import type { ReadUserVoucherDTO } from '../types/voucher';
import {
  formatDateTime,
  formatDiscount,
  formatVnd,
  getSafeUsage,
  STATUS_STYLES,
} from '../utils/voucherHelpers';

interface VoucherDetailModalProps {
  id: number | string | null;
  onClose: () => void;
}

export const VoucherDetailModal: React.FC<VoucherDetailModalProps> = ({ id, onClose }) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  const { data: voucher, isLoading, error } = useQuery({
    queryKey: ['voucher-detail', id],
    queryFn: () => voucherService.getById(id!),
    enabled: !!id,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    if (id) {
      setIsVisible(true);
      setCurrentPage(1);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [id]);

  const safeUsage = useMemo(() => {
    if (!voucher) return { usedCount: 0, availableCount: 0, remainingCount: 0 };
    return getSafeUsage(voucher.usedCount, voucher.availableCount, voucher.remainingCount);
  }, [voucher]);

  const assignedList = voucher?.assignedCustomers || [];
  const totalAssignedPages = Math.ceil(assignedList.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return assignedList.slice(start, start + pageSize);
  }, [assignedList, currentPage, pageSize]);

  const assignmentColumns: Column<ReadUserVoucherDTO>[] = useMemo(
    () => [
      {
        header: t('voucher.customer'),
        render: (item) => (
          <div>
            <div className="font-medium text-slate-800">
              {item.userFullName || `${t('voucher.customer')} #${item.userId}`}
            </div>
            <div className="text-xs text-slate-500">
              {item.userEmail ? item.userEmail : `ID: ${item.userId}`}
            </div>
          </div>
        ),
      },
      {
        header: t('voucher.quantity'),
        render: (item) => <span className="text-sm font-semibold text-slate-700">{item.quantity}</span>,
      },
      {
        header: t('common.status'),
        render: (item) => (
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              STATUS_STYLES[item.status] || 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {item.status}
          </span>
        ),
      },
    ],
    [t],
  );

  if (!id) return null;

  const content = (
    <div
      className={`glass-overlay fixed inset-0 z-[500] flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`glass-modal relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden transition-all duration-300 ${
          isVisible ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">{t('voucher.voucherDetail')}</h2>
            {voucher && (
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  STATUS_STYLES[voucher.status] || 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {voucher.status}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center text-rose-500">
            {t('voucher.loadError')}
          </div>
        ) : !voucher ? (
          <div className="flex h-64 items-center justify-center text-slate-500">
            {t('voucher.voucherNotFound')}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Main Badge & Code */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('voucher.code')}</span>
                  <p className="text-2xl font-mono font-black text-slate-900 tracking-wide">{voucher.code}</p>
                </div>
                {voucher.description && (
                  <p className="text-xs text-slate-600 max-w-md sm:text-right">{voucher.description}</p>
                )}
              </div>
            </div>

            {/* Info Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                icon={<Tag className="h-4 w-4" />}
                label={t('voucher.usage')}
                value={t('voucher.usedSlashAvailable', {
                  used: safeUsage.usedCount,
                  available: safeUsage.availableCount,
                })}
                hint={t('voucher.remainingHint', { count: safeUsage.remainingCount })}
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

            {/* Customer Assignments Table */}
            <div className="border-t border-slate-100 pt-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">
                  {t('voucher.assignedCustomersCount', { count: voucher.assignedCustomerCount ?? assignedList.length })}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-500">
                    {voucher.isCustomerSpecific
                      ? t('voucher.customerSpecificVoucher')
                      : t('voucher.publicVoucher')}
                  </span>
                  {assignedList.length > 0 && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
                      <select
                        className="bg-transparent font-medium text-slate-700 outline-none"
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        <option value={5}>5 {t('common.perPage') || '/ page'}</option>
                        <option value={10}>10 {t('common.perPage') || '/ page'}</option>
                        <option value={15}>15 {t('common.perPage') || '/ page'}</option>
                        <option value={20}>20 {t('common.perPage') || '/ page'}</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {assignedList.length > 0 ? (
                <div>
                  <Table
                    data={paginatedCustomers}
                    columns={assignmentColumns}
                    keyExtractor={(item) => item.id}
                    emptyMessage={t('voucher.noAssignedCustomers')}
                  />
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <div>
                      {t('common.showing') || 'Showing'} {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, assignedList.length)} / {assignedList.length}
                    </div>
                    {totalAssignedPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="rounded-md border border-slate-200 px-2.5 py-1 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          &larr; Prev
                        </button>
                        <span className="px-2 font-medium text-slate-700">
                          {currentPage} / {totalAssignedPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(totalAssignedPages, p + 1))}
                          disabled={currentPage === totalAssignedPages}
                          className="rounded-md border border-slate-200 px-2.5 py-1 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Next &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  {t('voucher.publicVoucherAvailable')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
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
