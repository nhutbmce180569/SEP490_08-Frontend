import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useCancellationRequests } from "../hooks/useCancellationRequests";
import type { CancellationRequestListDTO } from "../types/cancellation";
import { MANAGER_ROUTES } from "../../../config/routes/manager.routes";

const PAGE_SIZE = 5;

const formatDate = (date?: string) => {
  if (!date) return "";
  return new Date(date).toLocaleString();
};

const formatCurrency = (amount?: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount ?? 0);
};

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error && error.message ? error.message : fallback;
};

export const CancellationListPage: React.FC = () => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useCancellationRequests(statusFilter, page, PAGE_SIZE);
  const navigate = useNavigate();

  const requests = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.currentPage ?? page;
  const totalItems = data?.total ?? 0;

  const columns: Column<CancellationRequestListDTO>[] = useMemo(
    () => [
      {
        header: t("booking.orderId"),
        render: (item) => (
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <FileText className="h-4 w-4 text-slate-400" /> #{item.orderId}
          </div>
        ),
      },
      {
        header: t("booking.requestedAt"),
        render: (item) => <span className="text-sm text-slate-500">{formatDate(item.requestedAt) || t("common.na")}</span>,
      },
      {
        header: t("booking.refundAmount"),
        render: (item) => <span className="font-semibold text-emerald-600">{formatCurrency(item.refundAmount)}</span>,
      },
      {
        header: t("common.status"),
        render: (item) => {
          const normalizedStatus = item.status?.toLowerCase();
          const isPending = normalizedStatus === "pending";
          const isApproved = normalizedStatus === "approved";

          return (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                isPending
                  ? "bg-amber-50 text-amber-600"
                  : isApproved
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
              }`}
            >
              {isPending ? (
                <Clock className="h-3 w-3" />
              ) : isApproved ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {item.status}
            </span>
          );
        },
      },
      {
        header: t("common.actions"),
        render: (item) => {
          return (
            <div className="flex items-center gap-2">
              <ActionButton
                variant="secondary"
                className="h-9 w-9"
                title={t("booking.processRequest")}
                onClick={() => navigate(MANAGER_ROUTES.PROCESS_CANCELLATION(item.id))}
              >
                <Eye className="h-4 w-4" />
              </ActionButton>
            </div>
          );
        },
      },
    ],
    [t, navigate],
  );

  return (
    <div className="rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[15px] font-bold leading-tight text-slate-900">{t("booking.tourCancellationRequests")}</h2>
      </div>

      <div className="border-b border-slate-100 px-6 py-4">
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white"
        >
          <option value="">{t("booking.allStatuses")}</option>
          <option value="Pending">{t("common.pending")}</option>
          <option value="Approved">{t("common.approved")}</option>
          <option value="Rejected">{t("common.rejected")}</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10 text-slate-500">{t("booking.loadingRequests")}</div>
      ) : error ? (
        <div className="flex justify-center p-10 text-rose-500">
          {getErrorMessage(error, t("booking.failedLoadRequests"))}
        </div>
      ) : (
        <Table data={requests} columns={columns} keyExtractor={(item) => item.id} emptyMessage={t("booking.noCancellationRequests")} />
      )}

      <PaginationButton
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
};
