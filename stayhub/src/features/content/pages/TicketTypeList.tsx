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
    return parsed.toLocaleString().replace(",", "");
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
        className: "w-[250px] min-w-[250px] max-w-[250px]",
        render: (ticketType) => (
          <div className="flex items-center gap-3">
            <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-brand">
              <Ticket className="h-5 w-5" />
            </div>
            <span className="font-semibold text-slate-800 truncate" title={ticketType.name}>
              {ticketType.name.length > 25 ? `${ticketType.name.substring(0, 25)}...` : ticketType.name}
            </span>
          </div>
        ),
      },
      {
        header: t("common.description"),
        className: "w-[300px] min-w-[300px] max-w-[300px]",
        render: (ticketType) => (
          <span
            className="block w-full truncate text-sm text-slate-500"
            title={ticketType.description || undefined}
          >
            {ticketType.description || t("common.na")}
          </span>
        ),
      },
      {
        header: t("content.ageRange", { defaultValue: "Age Range" }),
        className: "w-[150px] min-w-[150px] max-w-[150px]",
        render: (ticketType) => {
          if (ticketType.minAge == null && ticketType.maxAge == null) return <span className="text-sm text-slate-500">{t("common.na")}</span>;
          if (ticketType.minAge != null && ticketType.maxAge == null) return <span className="text-sm text-slate-500">≥ {ticketType.minAge}</span>;
          if (ticketType.minAge == null && ticketType.maxAge != null) return <span className="text-sm text-slate-500">≤ {ticketType.maxAge}</span>;
          return <span className="text-sm text-slate-500">{ticketType.minAge} - {ticketType.maxAge}</span>;
        },
      },
      {
        header: t("common.status"),
        className: "w-[120px] min-w-[120px] max-w-[120px]",
        render: (ticketType) => {
          const isActive = ticketType.isActive === true;
          return (
            <span
              className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                isActive
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              {isActive ? t("common.active") : t("common.inactive")}
            </span>
          );
        },
      },
      {
        header: t("common.actions"),
        className: "w-[120px] min-w-[120px] max-w-[120px]",
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap flex-1 items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white shrink-0 w-full sm:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder={t("content.searchByTicketTypeName")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
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
            <Plus className="h-4 w-4" /> {t("content.addTicketType")}
          </ActionButton>
        </div>
      </div>

      {error ? (
        <div className="flex justify-center p-10 text-rose-500">{error}</div>
      ) : (
        <Table
          data={ticketTypes}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage={t("content.noTicketTypesFound")}
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
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
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
