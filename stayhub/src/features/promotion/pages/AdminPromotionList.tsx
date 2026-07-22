import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Lock, Unlock, Filter } from 'lucide-react';
import { Table, type Column } from '../../../components/dashboard/Table';
import { PaginationButton } from '../../../components/dashboard/PaginationButton';
import { ActionButton } from '../../../components/dashboard/ActionButton';
import { ConfirmDialog } from '../../../components/dashboard/ConfirmDialog';
import { useTranslation } from '../../../contexts/LocaleContext';
import { usePromotions } from '../hooks/usePromotions';
import type { Promotion } from '../types/promotion';
import { promotionService } from '../services/promotion.service';

export const AdminPromotionList: React.FC = () => {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [statusChange, setStatusChange] = useState<{ id: number | string, newStatus: string } | null>(null);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: status || undefined,
    }),
    [search, status],
  );

  const {
    data,
    isLoading,
    error,
    pageSize,
    setPageSize,
    setPage,
    handleCreate,
    handleEdit,
    refetch
  } = usePromotions(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchInput) {
        setPage(1);
        setSearch(searchInput);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, search, setPage]);

  const handleChangeStatusConfirm = async () => {
    if (!statusChange) return;
    try {
      await promotionService.changeStatus(statusChange.id, statusChange.newStatus);
      refetch();
    } catch (error) {
      console.error('Failed to change promotion status', error);
    } finally {
      setStatusChange(null);
    }
  };

  const promotions = data?.data || [];
  // Assuming the API returns total directly, we can calculate totalPages
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const currentPage = data?.page || 1;

  const columns: Column<Promotion>[] = useMemo(
    () => [
      {
        header: t('admin.promotionCode'),
        className: 'w-1/6 min-w-[150px]',
        render: (item) => <span className="font-semibold text-slate-800">{item.code}</span>,
      },
      {
        header: t('admin.promotionName'),
        className: 'w-1/4 min-w-[200px]',
        render: (item) => <span className="text-sm text-slate-600">{item.name}</span>,
      },
      {
        header: t('admin.promotionDiscount'),
        className: 'w-1/6 min-w-[150px] text-right',
        render: (item) => (
          <div className="text-sm">
            <div className="font-medium text-slate-800">
              {item.discountType?.toString().toUpperCase() === 'PERCENTAGE' 
                ? `${item.discountValue}%` 
                : `${item.discountValue.toLocaleString()} VND`}
            </div>
          </div>
        ),
      },
      {
        header: t('admin.promotionValidPeriod'),
        className: 'w-44 text-right',
        render: (item) => (
          <div className="flex flex-col items-end">
            <div className="inline-block">
              <div className="flex items-center gap-2 text-sm text-slate-700 mb-1">
                <span className="text-slate-400 text-xs w-8 text-left">{t('common.from', { defaultValue: 'From' })}</span>
                <span className="font-medium text-right min-w-[75px]">{new Date(item.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span className="text-slate-400 text-xs w-8 text-left">{t('common.to', { defaultValue: 'To' })}</span>
                <span className="font-medium text-right min-w-[75px]">{new Date(item.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        header: t('common.status'),
        className: 'w-36',
        render: (item) => (
          <span
            className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              item.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {item.status === 'Active' ? t('common.active') : t('common.inactive')}
          </span>
        ),
      },
      {
        header: t('common.actions'),
        className: 'w-32',
        render: (item) => (
          <div className="flex items-center gap-1.5">
            <ActionButton
              variant="secondary"
              onClick={() => handleEdit(item.id)}
              className="h-8 w-8"
              title={t('common.edit', { defaultValue: "Edit" })}
            >
              <Pencil className="h-3.5 w-3.5" />
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => setStatusChange({
                id: item.id,
                newStatus: item.status === 'Active' ? 'Inactive' : 'Active'
              })}
              className={`h-8 w-8 ${
                item.status === 'Active'
                  ? 'text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700'
                  : 'text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
              title={item.status === 'Active' ? t('admin.deactivatePromotion') : t('admin.activatePromotion')}
            >
              {item.status === 'Active' ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Unlock className="h-3.5 w-3.5" />
              )}
            </ActionButton>
          </div>
        ),
      },
    ],
    [handleEdit, t],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap flex-1 items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white shrink-0 w-full sm:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder={t("admin.searchByPromotion")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white shrink-0">
            <Filter className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className="bg-transparent text-sm text-slate-700 outline-none"
            >
              <option value="">{t("common.allStatus", { defaultValue: "All Statuses" })}</option>
              <option value="Active">{t("common.active")}</option>
              <option value="Inactive">{t("common.inactive")}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white shrink-0">
            <select
              className="bg-transparent text-sm text-slate-700 outline-none"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5 {t("common.perPage")}</option>
              <option value={10}>10 {t("common.perPage")}</option>
              <option value={15}>15 {t("common.perPage")}</option>
              <option value={20}>20 {t("common.perPage")}</option>
              <option value={50}>50 {t("common.perPage")}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center shrink-0">
          <ActionButton variant="primary" onClick={handleCreate} className="gap-2 px-4 py-2 text-sm whitespace-nowrap shrink-0">
            <Plus className="h-4 w-4" /> {t("admin.addPromotion")}
          </ActionButton>
        </div>
      </div>

      {error ? (
        <div className="flex justify-center p-10 text-rose-500">{error}</div>
      ) : (
        <Table
          data={promotions}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage={t("admin.noPromotionsFound")}
          isLoading={isLoading}
          skeletonRows={pageSize}
        />
      )}

      <PaginationButton
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={!!statusChange}
        onClose={() => setStatusChange(null)}
        onConfirm={handleChangeStatusConfirm}
        title={statusChange?.newStatus === 'Inactive' ? t("admin.deactivatePromotion") : t("admin.activatePromotion")}
        message={
          statusChange?.newStatus === 'Inactive'
            ? t("admin.deactivatePromotionConfirm")
            : t("admin.activatePromotionConfirm")
        }
        variant={statusChange?.newStatus === 'Inactive' ? "warning" : "primary"}
      />
    </div>
  );
};
