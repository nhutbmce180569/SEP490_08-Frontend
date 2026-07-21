import React, { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Lock,
  Pencil,
  Plus,
  Search,
  Unlock,
  ListFilter,
} from "lucide-react";
import { useContext } from "react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { ConfirmDialog } from "../../../components/dashboard/ConfirmDialog";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useVouchers } from "../hooks/useVouchers";
import { useChangeVoucherStatus } from "../hooks/useChangeVoucherStatus";
import { useTourOptions } from "../hooks/useTourOptions";
import { AuthContext } from "../../../contexts/AuthContext";
import type { ReadVoucherDTO } from "../types/voucher";
import {
  formatDateOnly,
  formatDiscount,
  formatVnd,
  getSafeUsage,
  STATUS_STYLES,
} from "../utils/voucherHelpers";
import { BirthdayDistributeModal } from "../components/BirthdayDistributeModal";
import { VoucherDetailModal } from "../components/VoucherDetailModal";

export const AdminVoucherList: React.FC = () => {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  
  // Active Filter state
  const [discountType, setDiscountType] = useState("");
  const [status, setStatus] = useState("");
  const [tourId, setTourId] = useState("");
  const [voucherType, setVoucherType] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: number | string; isActive: boolean } | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState<number | string | null>(null);

  const { options: tourOptions } = useTourOptions(true);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      discountType: discountType || undefined,
      status: status || undefined,
      tourId: tourId ? Number(tourId) : undefined,
      voucherType: voucherType || undefined,
    }),
    [search, discountType, status, tourId, voucherType],
  );

  const {
    data,
    isLoading,
    error,
    pageSize,
    setPage,
    setPageSize,
    handleCreate,
    handleEdit,
  } = useVouchers(filters);

  const { executeStatusChange, updatingId } = useChangeVoucherStatus();
  
  const { user } = useContext(AuthContext);
  const isAdmin = user?.roles?.includes("Admin");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchInput) {
        setPage(1);
        setSearch(searchInput);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, search, setPage]);

  const handleResetFilters = () => {
    setDiscountType("");
    setStatus("");
    setTourId("");
    setVoucherType("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(discountType || status || tourId || voucherType);

  const vouchers = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;
  const totalItems = data?.total || 0;

  const columns: Column<ReadVoucherDTO>[] = useMemo(
    () => [
      {
        header: t("voucher.code"),
        className: "text-left w-[130px]",
        render: (voucher) => {
          const isMine = String(voucher.creatorId) === String(user?.id);
          return (
            <div className="flex flex-col items-start gap-1">
              <span className="font-semibold tracking-wide text-slate-800">{voucher.code}</span>
              {!isAdmin && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${isMine ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                  {isMine ? (t("voucher.myVoucherBadge") || "Mine") : (t("voucher.otherVoucherBadge") || "Others")}
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: t("voucher.discount"),
        className: "text-left w-[130px]",
        render: (voucher) => (
          <div className="text-sm">
            <div className="font-medium text-slate-800">
              {formatDiscount(voucher.discountType, voucher.discountValue)}
            </div>
            {voucher.discountType === "Percent" && voucher.maxDiscountAmount && (
              <div className="text-xs text-slate-500">
                {t("voucher.max")} {formatVnd(voucher.maxDiscountAmount)}
              </div>
            )}
          </div>
        ),
      },
      {
        header: t("voucher.tour"),
        className: "text-left w-[130px]",
        render: (voucher) => (
          <span className="text-sm text-slate-600">
            {voucher.tourName || t("voucher.allTours")}
          </span>
        ),
      },
      {
        header: t("voucher.usage"),
        className: "text-left w-[130px]",
        render: (voucher) => {
          const usage = getSafeUsage(voucher.usedCount, voucher.availableCount, voucher.remainingCount);
          return (
            <div className="flex flex-col text-sm">
              <div className="font-semibold text-slate-800">
                {usage.usedCount} <span className="text-slate-400 font-normal">/</span> {usage.availableCount}
              </div>
              <span className="text-xs text-slate-500 font-normal">
                {usage.remainingCount} {t("voucher.left") || "còn lại"}
              </span>
            </div>
          );
        },
      },
      {
        header: t("voucher.validPeriod"),
        className: "text-left w-[170px]",
        render: (voucher) => (
          <div className="flex flex-col text-sm text-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-xs w-7 shrink-0">{t("common.from", { defaultValue: "From" })}:</span>
              <span className="font-semibold text-slate-800">{formatDateOnly(voucher.startDate)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-xs w-7 shrink-0">{t("common.to", { defaultValue: "To" })}:</span>
              <span className="font-semibold text-slate-800">{formatDateOnly(voucher.endDate)}</span>
            </div>
          </div>
        ),
      },
      {
        header: t("common.status"),
        className: "text-center w-[110px]",
        render: (voucher) => (
          <div className="text-center">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                STATUS_STYLES[voucher.status] || "bg-slate-100 text-slate-600"
              }`}
            >
              {voucher.status}
            </span>
          </div>
        ),
      },
      {
        header: t("common.actions"),
        className: "text-center w-[110px]",
        render: (voucher) => {
          const isMine = String(voucher.creatorId) === String(user?.id);
          const canEdit = isAdmin || isMine;

          return (
            <div className="flex items-center justify-center gap-1.5">
              {/* 1. Detail */}
              <ActionButton
                variant="secondary"
                onClick={() => setSelectedDetailId(voucher.id)}
                className="h-8 w-8"
                title={t("content.viewDetails")}
              >
                <Eye className="h-3.5 w-3.5" />
              </ActionButton>

              {/* 2. Edit */}
              <ActionButton
                variant="secondary"
                onClick={() => handleEdit(voucher.id)}
                className={`h-8 w-8 ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                title={t("voucher.editVoucher")}
                disabled={voucher.isActive || !canEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
              </ActionButton>

              {/* 3. Active / Deactive */}
              <ActionButton
                variant="secondary"
                onClick={() => setPendingStatusChange({ id: voucher.id, isActive: voucher.isActive })}
                className={`h-8 w-8 ${
                  updatingId === voucher.id ? "cursor-wait opacity-50" : ""
                } ${
                  !canEdit ? "opacity-50 cursor-not-allowed text-slate-400" :
                  voucher.isActive
                    ? "text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    : "text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
                title={voucher.isActive ? t("voucher.deactivate") : t("voucher.activate")}
                disabled={updatingId === voucher.id || !canEdit}
              >
                {voucher.isActive ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <Unlock className="h-3.5 w-3.5" />
                )}
              </ActionButton>
            </div>
          );
        },
      },
    ],
    [t, handleEdit, updatingId, user?.id, isAdmin],
  );

  return (
    <div className="rounded-2xl">
      {/* Top action bar structured like TourismInformationList and TicketTypeList */}
      <div className="flex flex-col gap-3 border-b border-slate-100 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("voucher.searchCodeOrDesc")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
          </div>

          {/* Filter Popover Button */}
          <div className="relative">
            <ActionButton
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className={`gap-2 px-3 py-2 text-sm shrink-0 ${hasActiveFilters ? "border-brand bg-brand-light/30 text-brand" : ""}`}
            >
              <ListFilter className="h-4 w-4" />
              {t("common.filter") || "Filter"}
            </ActionButton>

            {showFilters && (
              <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
                <div className="flex flex-col gap-4">
                  {/* Tour filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">{t("voucher.applicableTour")}</label>
                    <select
                      value={tourId}
                      onChange={(e) => {
                        setTourId(e.target.value);
                        setPage(1);
                      }}
                      disabled={voucherType === "birthday"}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white disabled:opacity-50"
                    >
                      <option value="">{t("voucher.allTours")}</option>
                      {tourOptions
                        .filter((option) => option.value !== "")
                        .map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Discount Type filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">{t("voucher.discountType")}</label>
                    <select
                      value={discountType}
                      onChange={(e) => {
                        setDiscountType(e.target.value);
                        setPage(1);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white"
                    >
                      <option value="">{t("voucher.allDiscountTypes")}</option>
                      <option value="Percent">{t("voucher.percent")}</option>
                      <option value="Amount">{t("voucher.amount")}</option>
                    </select>
                  </div>

                  {/* Status filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">{t("common.status")}</label>
                    <select
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white"
                    >
                      <option value="">{t("voucher.allStatuses")}</option>
                      <option value="Active">{t("common.active")}</option>
                      <option value="Inactive">{t("common.inactive")}</option>
                      <option value="Expired">{t("tour.expired")}</option>
                    </select>
                  </div>

                  {/* Voucher Type filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">{t("voucher.allTypes") || "Voucher Type"}</label>
                    <select
                      value={voucherType}
                      onChange={(e) => {
                        setVoucherType(e.target.value);
                        if (e.target.value === "birthday") setTourId("");
                        setPage(1);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white"
                    >
                      <option value="">{t("voucher.allTypes") || "All types"}</option>
                      <option value="birthday">{t("voucher.birthdayVouchers") || "Birthday Vouchers"}</option>
                      <option value="tour">{t("voucher.tourVouchers") || "Tour Vouchers"}</option>
                    </select>
                  </div>

                  {hasActiveFilters && (
                    <ActionButton variant="secondary" onClick={handleResetFilters} className="mt-1 w-full justify-center">
                      {t("content.reset") || "Reset"}
                    </ActionButton>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Per Page Select */}
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

        {/* Right side Buttons */}
        <div className="flex items-center gap-2 shrink-0 mt-3 sm:mt-0">
          <ActionButton 
            variant="secondary" 
            onClick={() => setIsBirthdayModalOpen(true)} 
            className="gap-2 px-3 py-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100"
          >
            🎁 {t("admin.distributeBirthdayVoucher") || "Birthday"}
          </ActionButton>
          <ActionButton variant="primary" onClick={handleCreate} className="gap-2 px-4 py-2 text-sm shrink-0">
            <Plus className="h-4 w-4" /> {t("voucher.createVoucher")}
          </ActionButton>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10 text-slate-500">{t("voucher.loadingVouchers")}</div>
      ) : error ? (
        <div className="flex justify-center p-10 text-rose-500">{error}</div>
      ) : (
        <Table
          data={vouchers}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage={t("voucher.noVouchersFound")}
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

      <VoucherDetailModal
        id={selectedDetailId}
        onClose={() => setSelectedDetailId(null)}
      />

      <ConfirmDialog
        open={!!pendingStatusChange}
        onClose={() => setPendingStatusChange(null)}
        onConfirm={() => {
          if (pendingStatusChange) {
            executeStatusChange(pendingStatusChange.id, pendingStatusChange.isActive);
            setPendingStatusChange(null);
          }
        }}
        title={
          pendingStatusChange?.isActive
            ? t("voucher.confirmDeactivateTitle")
            : t("voucher.confirmActivateTitle")
        }
        message={
          pendingStatusChange?.isActive
            ? t("voucher.confirmDeactivateMessage")
            : t("voucher.confirmActivateMessage")
        }
        confirmText="Confirm"
        cancelText="Cancel"
        variant={pendingStatusChange?.isActive ? "warning" : "primary"}
      />
    </div>
  );
};