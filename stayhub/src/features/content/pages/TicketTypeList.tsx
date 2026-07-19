import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Lock, Pencil, Plus, Search, Ticket, Unlock } from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { ConfirmDialog } from "../../../components/dashboard/ConfirmDialog";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { Table, type Column } from "../../../components/dashboard/Table";
import { TicketTypeDetailModal } from "../components/TicketTypeDetailModal";
import { useChangeTicketTypeStatus } from "../hooks/useChangeTicketTypeStatus";
import { useTicketTypes } from "../hooks/useTicketTypes";
import { useTranslation } from "../../../contexts/LocaleContext";
import type { ReadTicketTypeDTO } from "../types/ticketType";

export const TicketTypeList: React.FC = () => {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTarget, setStatusTarget] = useState<ReadTicketTypeDTO | null>(null);
  const [detailTarget, setDetailTarget] = useState<ReadTicketTypeDTO | null>(null);
  const { data, isLoading, error, pageSize, setPageSize, setPage, handleCreate, handleEdit } =
    useTicketTypes(searchTerm);
  const { executeStatusChange, updatingId } = useChangeTicketTypeStatus();

  const formatDate = useCallback((date?: string | null) => {
    if (!date) return t("common.na");
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return t("common.na");
    return parsed.toLocaleString();
  }, [t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== searchInput) {
        setPage(1);
        setSearchTerm(searchInput);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, searchTerm, setPage]);

  const ticketTypes = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;
  const totalItems = data?.total || 0;
  const statusTargetIsActive = statusTarget?.isActive === true;

  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return;

    await executeStatusChange(statusTarget.id, statusTargetIsActive);
    setStatusTarget(null);
  };

  const columns: Column<ReadTicketTypeDTO>[] = useMemo(
    () => [
      {
        header: t("content.ticketType"),
        className: "w-1/4 min-w-[200px]",
        render: (ticketType) => (
          <div className="flex items-center gap-3">
            <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-brand">
              <Ticket className="h-5 w-5" />
            </div>
            <span className="font-semibold text-slate-800 truncate" title={ticketType.name}>
              {ticketType.name.length > 30 ? `${ticketType.name.substring(0, 30)}...` : ticketType.name}
            </span>
          </div>
        ),
      },
      {
        header: t("common.description"),
        className: "w-1/3 min-w-[250px]",
        render: (ticketType) => (
          <span
            className="block max-w-[320px] truncate text-sm text-slate-500"
            title={ticketType.description || undefined}
          >
            {ticketType.description || t("common.na")}
          </span>
        ),
      },
      {
        header: t("common.status"),
        className: "w-36",
        render: (ticketType) => {
          const isActive = ticketType.isActive === true;
          return (
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
              }`}
            >
              {isActive ? t("common.active") : t("common.inactive")}
            </span>
          );
        },
      },
      {
        header: t("content.created"),
        className: "w-36",
        render: (ticketType) => (
          <span className="text-sm text-slate-500">{formatDate(ticketType.createdAt)}</span>
        ),
      },
      {
        header: t("content.updated"),
        className: "w-36",
        render: (ticketType) => (
          <span className="text-sm text-slate-500">{formatDate(ticketType.updatedAt)}</span>
        ),
      },
      {
        header: t("common.actions"),
        className: "w-24",
        render: (ticketType) => {
          const isActive = ticketType.isActive === true;
          return (
            <div className="flex items-center gap-1.5">
              <ActionButton
                variant="secondary"
                onClick={() => setDetailTarget(ticketType)}
                className="h-8 w-8"
                title={t("common.detail", { defaultValue: "Detail" })}
              >
                <Eye className="h-3.5 w-3.5" />
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => handleEdit(ticketType.id)}
                className="h-8 w-8"
                title={t("content.edit")}
              >
                <Pencil className="h-3.5 w-3.5" />
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => setStatusTarget(ticketType)}
                className={`h-8 w-8 ${updatingId === ticketType.id ? "cursor-wait opacity-50" : ""} ${
                  isActive
                    ? "text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    : "text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
                title={isActive ? t("content.deactivate") : t("content.activate")}
                disabled={updatingId === ticketType.id}
              >
                {isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              </ActionButton>
            </div>
          );
        },
      },
    ],
    [t, formatDate, handleEdit, updatingId],
  );

  return (
    <div className="rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-slate-100 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors sm:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder={t("content.searchByTicketTypeName")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors">
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

        <div className="flex items-center shrink-0 mt-3 sm:mt-0">
          <ActionButton variant="primary" onClick={handleCreate} className="gap-2 px-4 py-2 text-sm whitespace-nowrap">
            <Plus className="h-4 w-4" /> {t("content.addTicketType")}
          </ActionButton>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10 text-slate-500">{t("content.loadingTicketTypes")}</div>
      ) : error ? (
        <div className="flex justify-center p-10 text-rose-500">{error}</div>
      ) : (
        <Table
          data={ticketTypes}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage={t("content.noTicketTypesFound")}
        />
      )}

      <PaginationButton
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <TicketTypeDetailModal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        ticketType={detailTarget}
      />

      <ConfirmDialog
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleConfirmStatusChange}
        title={statusTargetIsActive ? t("content.deactivate") : t("content.activate")}
        message={
          <span>
            {statusTargetIsActive
              ? t("content.deactivateTicketTypeConfirm")
              : t("content.activateTicketTypeConfirm")}
            {statusTarget && (
              <span className="mt-2 block font-semibold text-slate-700">
                {statusTarget.name}
              </span>
            )}
          </span>
        }
        confirmText="Confirm"
        cancelText="Cancel"
        variant={statusTargetIsActive ? "warning" : "primary"}
        icon={
          statusTargetIsActive ? (
            <Lock className="h-6 w-6 text-rose-500" />
          ) : (
            <Unlock className="h-6 w-6 text-emerald-500" />
          )
        }
      />
    </div>
  );
};
