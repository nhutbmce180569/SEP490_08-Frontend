import React, { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Lock,
  Pencil,
  Plus,
  Search,
  Unlock,
} from 'lucide-react';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, type Column } from '../../../components/dashboard/Table';
import { PATH } from '../../../config/routes/route';
import { PaginationButton } from '../../../components/dashboard/PaginationButton';
import { ActionButton } from '../../../components/dashboard/ActionButton';
import { useTranslation } from '../../../contexts/LocaleContext';
import { useVouchers } from '../hooks/useVouchers';
import { useChangeVoucherStatus } from '../hooks/useChangeVoucherStatus';
import { useTourOptions } from '../hooks/useTourOptions';
import { AuthContext } from '../../../contexts/AuthContext';
import type { ReadVoucherDTO } from '../types/voucher';
import {
  formatDateTime,
  formatDiscount,
  formatVnd,
  STATUS_STYLES,
} from '../utils/voucherHelpers';
import { BirthdayDistributeModal } from '../components/BirthdayDistributeModal';

export const AdminVoucherList: React.FC = () => {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [discountType, setDiscountType] = useState('');
  const [status, setStatus] = useState('');

  const [createdByMe, setCreatedByMe] = useState('');
  const [tourId, setTourId] = useState('');
  const [voucherType, setVoucherType] = useState('');
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);

  const { options: tourOptions } = useTourOptions();

  const filters = useMemo(
    () => ({
      search: search || undefined,
      discountType: discountType || undefined,
      status: status || undefined,
      tourId: tourId ? Number(tourId) : undefined,
      voucherType: voucherType || undefined,
      createdByMe: createdByMe === '' ? undefined : createdByMe === 'true',
    }),
    [search, discountType, status, tourId, voucherType, createdByMe],
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
  
  const { user } = useContext(AuthContext);
  const isAdmin = user?.roles?.includes('Admin');

  const navigate = useNavigate();

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
        header: t('voucher.code'),
        render: (voucher) => {
          const isMine = voucher.creatorId === user?.id;
          return (
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-wide text-slate-800">{voucher.code}</span>
              {!isAdmin && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${isMine ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  {isMine ? (t('voucher.myVoucherBadge') || 'Mine') : (t('voucher.otherVoucherBadge') || 'Others')}
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: t('voucher.discount'),
        render: (voucher) => (
          <div className="text-sm">
            <div className="font-medium text-slate-800">
              {formatDiscount(voucher.discountType, voucher.discountValue)}
            </div>
            {voucher.discountType === 'Percent' && voucher.maxDiscountAmount && (
              <div className="text-xs text-slate-500">
                {t('voucher.max')} {formatVnd(voucher.maxDiscountAmount)}
              </div>
            )}
          </div>
        ),
      },
      {
        header: t('voucher.tour'),
        render: (voucher) => (
          <span className="text-sm text-slate-600">
            {voucher.tourName || t('voucher.allTours')}
          </span>
        ),
      },
      {
        header: t('voucher.usage'),
        render: (voucher) => (
          <span className="text-sm text-slate-600">
            {voucher.usedCount}/{voucher.availableCount}
            <span className="ml-1 text-xs text-slate-400">
              ({voucher.remainingCount} {t('voucher.left')})
            </span>
          </span>
        ),
      },
      {
        header: t('voucher.validPeriod'),
        render: (voucher) => (
          <div className="text-xs text-slate-600">
            <div>{formatDateTime(voucher.startDate)}</div>
            <div className="text-slate-400">{t('voucher.to')} {formatDateTime(voucher.endDate)}</div>
          </div>
        ),
      },
      {
        header: t('common.status'),
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
        header: t('common.actions'),
        render: (voucher) => {
          const isMine = voucher.creatorId === user?.id;
          const canEdit = isAdmin || isMine;

          return (
            <div className="flex items-center gap-1.5">
              <ActionButton
                variant="secondary"
                onClick={() => executeStatusChange(voucher.id, voucher.isActive)}
                className={`h-8 w-8 ${
                  updatingId === voucher.id ? 'cursor-wait opacity-50' : ''
                } ${
                  !canEdit ? 'opacity-50 cursor-not-allowed' :
                  voucher.isActive
                    ? 'text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700'
                    : 'text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
                title={voucher.isActive ? t('voucher.deactivate') : t('voucher.activate')}
                disabled={updatingId === voucher.id || !canEdit}
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
                title={t('content.viewDetails')}
              >
                <Eye className="h-3.5 w-3.5" />
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => handleEdit(voucher.id)}
                className={`h-8 w-8 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={t('voucher.editVoucher')}
                disabled={voucher.isActive || !canEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
              </ActionButton>
            </div>
          );
        },
      },
    ],
    [t, executeStatusChange, handleEdit, handleView, updatingId],
  );

  return (
    <div className="rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-slate-100 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-bold leading-tight text-slate-900">{t('voucher.management')}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{t('voucher.managementDesc')}</p>
        </div>
        <div className="flex items-center gap-2">
          <ActionButton 
            variant="secondary" 
            onClick={() => setIsBirthdayModalOpen(true)} 
            className="gap-2 px-4 py-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100"
          >
            🎁 {t('admin.distributeBirthdayVoucher') || 'Distribute Birthday Vouchers'}
          </ActionButton>
          <ActionButton variant="primary" onClick={handleCreate} className="gap-2 px-4 py-2 text-sm">
            <Plus className="h-4 w-4" /> {t('voucher.createVoucher')}
          </ActionButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 py-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('voucher.searchCodeOrDesc')}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
          />
        </div>

        <select
          value={tourId}
          onChange={(event) => {
            setPage(1);
            setTourId(event.target.value);
          }}
          disabled={voucherType === 'birthday'}
          className="flex-1 min-w-[140px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white disabled:opacity-50 disabled:bg-slate-100"
        >
          <option value="">{t('voucher.allTours')}</option>
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
          className="flex-1 min-w-[140px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white"
        >
          <option value="">{t('voucher.allDiscountTypes')}</option>
          <option value="Percent">{t('voucher.percent')}</option>
          <option value="Amount">{t('voucher.amount')}</option>
        </select>

        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
          className="flex-1 min-w-[140px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white"
        >
          <option value="">{t('voucher.allStatuses')}</option>
          <option value="Active">{t('common.active')}</option>
          <option value="Inactive">{t('common.inactive')}</option>
          <option value="Scheduled">{t('voucher.scheduled')}</option>
          <option value="Expired">{t('tour.expired')}</option>
          <option value="Depleted">{t('voucher.depleted')}</option>
        </select>

        <select
          value={voucherType}
          onChange={(event) => {
            setPage(1);
            setVoucherType(event.target.value);
            if (event.target.value === 'birthday') setTourId('');
          }}
          className="flex-1 min-w-[140px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white"
        >
          <option value="">{t('voucher.allTypes') || 'Tất cả loại voucher'}</option>
          <option value="birthday">{t('voucher.birthdayVouchers') || 'Voucher Sinh Nhật'}</option>
          <option value="tour">{t('voucher.tourVouchers') || 'Voucher Tour'}</option>
        </select>




      </div>

      {isLoading ? (
        <div className="flex justify-center p-10 text-slate-500">{t('voucher.loadingVouchers')}</div>
      ) : error ? (
        <div className="flex justify-center p-10 text-rose-500">{error}</div>
      ) : (
        <Table
          data={vouchers}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage={t('voucher.noVouchersFound')}
        />
      )}

      <PaginationButton
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
      <BirthdayDistributeModal 
        open={isBirthdayModalOpen} 
        onClose={() => setIsBirthdayModalOpen(false)} 
      />
    </div>
  );
};
