import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Lock, Unlock, ListFilter } from 'lucide-react';
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
        header: 'Code',
        render: (item) => <span className="font-semibold text-slate-800">{item.code}</span>,
      },
      {
        header: 'Name',
        render: (item) => <span className="text-sm text-slate-600">{item.name}</span>,
      },
      {
        header: 'Discount',
        render: (item) => (
          <div className="text-sm">
            <div className="font-medium text-slate-800">
              {item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : `${item.discountValue.toLocaleString()} VND`}
            </div>
          </div>
        ),
      },
      {
        header: 'Valid Period',
        render: (item) => (
          <div className="text-xs text-slate-600">
            <div>{new Date(item.startDate).toLocaleDateString()}</div>
            <div className="text-slate-400">To {new Date(item.endDate).toLocaleDateString()}</div>
          </div>
        ),
      },
      {
        header: 'Status',
        render: (item) => (
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {item.status}
          </span>
        ),
      },
      {
        header: 'Actions',
        render: (item) => (
          <div className="flex items-center gap-1.5">
            <ActionButton
              variant="secondary"
              onClick={() => handleEdit(item.id)}
              className="h-8 w-8"
              title="Edit"
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
              title={item.status === 'Active' ? 'Deactivate' : 'Activate'}
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
    [handleEdit],
  );

  return (
    <div className="rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-slate-100 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-bold leading-tight text-slate-900">Promotions Management</h2>
          <p className="mt-0.5 text-xs text-slate-500">Manage system-wide promotional codes and discounts</p>
        </div>
        <div className="flex items-center gap-2">
          <ActionButton variant="primary" onClick={handleCreate} className="gap-2 px-4 py-2 text-sm">
            <Plus className="h-4 w-4" /> Create Promotion
          </ActionButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 py-4">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors min-w-[200px] flex-1">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code or name"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors min-w-[140px] flex-1">
          <ListFilter className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <select
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            className="w-full bg-transparent text-sm text-slate-700 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10 text-slate-500">Loading promotions...</div>
      ) : error ? (
        <div className="flex justify-center p-10 text-rose-500">{error}</div>
      ) : (
        <Table
          data={promotions}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage="No promotions found."
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
        title={statusChange?.newStatus === 'Inactive' ? "Deactivate Promotion" : "Activate Promotion"}
        message={
          statusChange?.newStatus === 'Inactive'
            ? "Are you sure you want to deactivate this promotion? It will no longer be usable."
            : "Are you sure you want to activate this promotion? It will become usable."
        }
        variant={statusChange?.newStatus === 'Inactive' ? "warning" : "primary"}
      />
    </div>
  );
};
