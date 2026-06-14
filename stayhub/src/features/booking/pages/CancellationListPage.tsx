import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, FileText, Check, X, CheckCircle, Clock, XCircle } from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useToast } from "../../../contexts/ToastContext";
import { useCancellationRequests } from "../hooks/useCancellationRequests";
import { useProcessCancellation } from "../hooks/useProcessCancellation";
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
  const [rejectingRequest, setRejectingRequest] = useState<CancellationRequestListDTO | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { data, isLoading, error } = useCancellationRequests(statusFilter, page, PAGE_SIZE);
  const { mutateAsync: processRequest, isPending: isProcessing } = useProcessCancellation();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const requests = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.currentPage ?? page;
  const totalItems = data?.total ?? 0;

  const processCancellation = useCallback(
    async (
      request: CancellationRequestListDTO,
      action: "Approve" | "Reject",
      reason?: string,
    ) => {
      try {
        await processRequest({
          id: request.id,
          data: {
            Action: action,
            RejectReason: action === "Reject" ? reason?.trim() : undefined,
          },
        });
        success(t("booking.requestProcessed", { action: action.toLowerCase() }));
        setRejectingRequest(null);
        setRejectReason("");
      } catch (requestError: unknown) {
        showError(getErrorMessage(requestError, t("booking.processRequestFailed")));
      }
    },
    [processRequest, showError, success, t],
  );

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      showError(t("booking.rejectReasonRequiredError"));
      return;
    }

    if (rejectingRequest) {
      await processCancellation(rejectingRequest, "Reject", rejectReason);
    }
  };

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
          const isPending = item.status?.toLowerCase() === "pending";

          return (
            <div className="flex items-center gap-2">
              {isPending && (
                <>
                  <ActionButton
                    variant="primary"
                    className="gap-1 px-3 py-2 text-xs"
                    disabled={isProcessing}
                    onClick={() => processCancellation(item, "Approve")}
                  >
                    <Check className="h-4 w-4" /> {t("booking.approveRequest")}
                  </ActionButton>
                  <ActionButton
                    variant="warning"
                    className="gap-1 px-3 py-2 text-xs"
                    disabled={isProcessing}
                    onClick={() => {
                      setRejectingRequest(item);
                      setRejectReason("");
                    }}
                  >
                    <X className="h-4 w-4" /> {t("booking.rejectRequest")}
                  </ActionButton>
                </>
              )}
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
    [t, navigate, isProcessing, processCancellation]
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

      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">{t("booking.rejectRequest")}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {t("booking.orderId")} #{rejectingRequest.orderId}
            </p>
            <label className="mt-5 block text-sm font-semibold text-slate-800">
              {t("booking.rejectReason")} <span className="text-rose-600">*</span>
            </label>
            <textarea
              autoFocus
              rows={4}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder={t("booking.rejectReasonPlaceholder")}
              className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand"
            />
            <div className="mt-5 flex justify-end gap-2">
              <ActionButton
                variant="secondary"
                disabled={isProcessing}
                onClick={() => {
                  setRejectingRequest(null);
                  setRejectReason("");
                }}
              >
                {t("common.cancel")}
              </ActionButton>
              <ActionButton
                variant="warning"
                disabled={isProcessing || !rejectReason.trim()}
                onClick={submitReject}
              >
                {t("booking.rejectRequest")}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
