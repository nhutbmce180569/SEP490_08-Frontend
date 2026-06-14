import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, X, ArrowLeft } from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useCancellationDetails } from "../hooks/useCancellationDetails";
import { useProcessCancellation } from "../hooks/useProcessCancellation";
import { useToast } from "../../../contexts/ToastContext";
import { MANAGER_ROUTES } from "../../../config/routes/manager.routes";
import { ConfirmDialog } from "../../../components/dashboard/ConfirmDialog";

const formatCurrency = (amount?: number | null) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount ?? 0);
};

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error && error.message ? error.message : fallback;
};

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <span className="text-xs font-bold uppercase text-slate-400">{label}</span>
    <span className="text-sm font-semibold text-slate-800 sm:text-right">{value}</span>
  </div>
);

export const ProcessCancellationPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const requestId = Number(id);
  const navigate = useNavigate();

  const { data: detail, isLoading, error } = useCancellationDetails(requestId);
  const { mutateAsync: processRequest, isPending: isProcessing } = useProcessCancellation();
  const { success, error: showError } = useToast();

  const [rejectReason, setRejectReason] = useState("");
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; action: "Approve" | "Reject" | null }>({
    isOpen: false,
    action: null,
  });

  const formatDate = (date?: string | null) => {
    if (!date) return t("common.na");
    const parsedDate = new Date(date);
    return Number.isNaN(parsedDate.getTime()) ? t("common.na") : parsedDate.toLocaleString();
  };

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") return t("common.na");
    if (typeof value === "number") return value.toLocaleString("vi-VN");
    if (typeof value === "boolean") return value ? t("common.yes") : t("common.no");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  if (isLoading)
    return (
      <div className="p-10 text-center text-slate-500">{t("booking.loadingDetails")}</div>
    );
  if (error || !detail)
    return (
      <div className="p-10 text-center text-rose-500">
        {getErrorMessage(error, t("booking.requestNotFound"))}
      </div>
    );

  const normalizedStatus = detail.status?.toLowerCase();
  const isPending = normalizedStatus === "pending";
  const knownDetailKeys = new Set([
    "id",
    "tour",
    "customer",
    "bankName",
    "accountNumber",
    "accountHolderName",
    "requestedAt",
    "originalAmount",
    "cancellationFee",
    "feePercent",
    "refundAmount",
    "reason",
    "status",
    "rejectReason",
    "processedAt",
    "processedBy",
  ]);
  const additionalDetails = Object.entries(detail as unknown as Record<string, unknown>).filter(
    ([key, value]) => !knownDetailKeys.has(key) && value !== undefined && value !== null && value !== "",
  );

  const handleProcessClick = (action: "Approve" | "Reject") => {
    if (action === "Reject" && !rejectReason.trim()) {
      showError(t("booking.rejectReasonRequiredError"));
      return;
    }
    setConfirmState({ isOpen: true, action });
  };

  const handleConfirmProcess = async () => {
    const { action } = confirmState;
    if (!action) return;

    setConfirmState({ isOpen: false, action: null });

    try {
      await processRequest({
        id: requestId,
        data: { Action: action, RejectReason: action === "Reject" ? rejectReason : undefined },
      });
      success(t("booking.requestProcessed", { action: action.toLowerCase() }));
      navigate(MANAGER_ROUTES.CANCELLATION_REQUESTS);
    } catch (err: unknown) {
      showError(getErrorMessage(err, t("booking.processRequestFailed")));
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <button
        onClick={() => navigate(MANAGER_ROUTES.CANCELLATION_REQUESTS)}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> {t("booking.backToRequests")}
      </button>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {t("booking.requestDetails", { id: detail.id })}
            </h2>
            <span className="text-sm text-slate-500">
              {t("booking.tourCustomer", {
                tour: detail.tour?.name || t("booking.tourNa"),
                id: detail.customer?.id ?? t("common.na"),
              })}
            </span>
          </div>

          {isPending && (
            <div className="flex flex-wrap gap-2">
              <ActionButton
                variant="warning"
                onClick={() => handleProcessClick("Reject")}
                disabled={isProcessing}
                className="gap-2 px-4 py-2 text-sm"
              >
                <X className="h-4 w-4" /> {t("booking.rejectRequest")}
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={() => handleProcessClick("Approve")}
                disabled={isProcessing}
                className="gap-2 px-4 py-2 text-sm"
              >
                <Check className="h-4 w-4" /> {t("booking.approveRefund")}
              </ActionButton>
            </div>
          )}
        </div>

        <div className="grid gap-6 p-6">
          {isPending && (
            <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5">
              <label className="text-sm font-semibold text-slate-800">
                {t("booking.rejectReason")}{" "}
                <span className="font-normal text-slate-500">{t("booking.rejectReasonRequired")}</span>
              </label>
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-brand"
                rows={2}
                placeholder={t("booking.rejectReasonPlaceholder")}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </section>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DetailRow label={t("booking.requestId")} value={`#${detail.id}`} />
            <DetailRow
              label={t("booking.tourId")}
              value={detail.tour?.id ? `#${detail.tour.id}` : t("common.na")}
            />
            <DetailRow
              label={t("booking.customerId")}
              value={detail.customer?.id ? `#${detail.customer.id}` : t("common.na")}
            />
            <DetailRow label={t("common.status")} value={detail.status || t("common.na")} />
            <DetailRow label={t("booking.requestedAt")} value={formatDate(detail.requestedAt)} />
            <DetailRow label={t("booking.processedAt")} value={formatDate(detail.processedAt)} />
          </div>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="border-b border-slate-100 pb-2 font-semibold text-slate-800">
              {t("booking.financialDetails")}
            </h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DetailRow label={t("booking.originalAmount")} value={formatCurrency(detail.originalAmount)} />
              <DetailRow label={t("booking.feePercent")} value={`${detail.feePercent ?? 0}%`} />
              <DetailRow
                label={t("booking.cancellationFeeLabel")}
                value={formatCurrency(detail.cancellationFee)}
              />
              <DetailRow
                label={t("booking.refundAmount")}
                value={<span className="text-emerald-600">{formatCurrency(detail.refundAmount)}</span>}
              />
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="border-b border-slate-100 pb-2 font-semibold text-slate-800">
                {t("booking.customerInformation")}
              </h3>
              <div className="grid gap-3">
                {detail.customer?.avatarUrl && (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <img
                      src={detail.customer.avatarUrl}
                      alt={t("booking.customerAvatar")}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <span className="text-sm font-semibold text-slate-800">
                      {t("booking.customerAvatar")}
                    </span>
                  </div>
                )}
                <DetailRow
                  label={t("booking.customerId")}
                  value={detail.customer?.id ? `#${detail.customer.id}` : t("common.na")}
                />
                <DetailRow label={t("booking.fullNameLabel")} value={formatValue(detail.customer?.fullName)} />
                <DetailRow label={t("booking.genderLabel")} value={formatValue(detail.customer?.gender)} />
                <DetailRow
                  label={t("common.dateOfBirth")}
                  value={
                    detail.customer?.dateOfBirth
                      ? formatDate(detail.customer.dateOfBirth)
                      : t("common.na")
                  }
                />
                <DetailRow label={t("content.createdAt")} value={formatDate(detail.customer?.createdAt)} />
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="border-b border-slate-100 pb-2 font-semibold text-slate-800">
                {t("booking.refundBankInfo")}
              </h3>
              <div className="grid gap-3">
                <DetailRow label={t("booking.bankName")} value={detail.bankName || t("common.na")} />
                <DetailRow
                  label={t("booking.accountNumber")}
                  value={detail.accountNumber || t("common.na")}
                />
                <DetailRow
                  label={t("booking.accountHolder")}
                  value={detail.accountHolderName || t("common.na")}
                />
              </div>
            </section>
          </div>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="border-b border-slate-100 pb-2 font-semibold text-slate-800">
              {t("booking.tourInformation")}
            </h3>
            <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                {detail.tour?.imageUrl ? (
                  <img
                    src={detail.tour.imageUrl}
                    alt={detail.tour.name}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center text-sm font-semibold text-slate-400">
                    {t("content.noImage")}
                  </div>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <DetailRow
                  label={t("booking.tourId")}
                  value={detail.tour?.id ? `#${detail.tour.id}` : t("common.na")}
                />
                <DetailRow
                  label={t("booking.categoryId")}
                  value={detail.tour?.categoryId ? `#${detail.tour.categoryId}` : t("common.na")}
                />
                <DetailRow label={t("common.name")} value={formatValue(detail.tour?.name)} />
                <DetailRow label={t("common.status")} value={formatValue(detail.tour?.status)} />
                <DetailRow label={t("booking.averageStar")} value={formatValue(detail.tour?.averageStar)} />
                <DetailRow label={t("booking.country")} value={formatValue(detail.tour?.country)} />
                <DetailRow label={t("booking.city")} value={formatValue(detail.tour?.city)} />
                <DetailRow label={t("content.address")} value={formatValue(detail.tour?.address)} />
              </div>
            </div>
            {detail.tour?.description && (
              <p className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {detail.tour.description}
              </p>
            )}
          </section>

          <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-800">{t("booking.customerReason")}</h3>
            <p className="whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
              {detail.reason || t("common.na")}
            </p>
          </section>

          {!isPending && (
            <section
              className={`rounded-2xl border p-5 ${normalizedStatus === "approved" ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}
            >
              <h3 className="mb-3 font-semibold text-slate-800">{t("booking.processingResult")}</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <DetailRow
                  label={t("common.status")}
                  value={
                    <span
                      className={
                        normalizedStatus === "approved" ? "text-emerald-700" : "text-rose-700"
                      }
                    >
                      {detail.status}
                    </span>
                  }
                />
                <DetailRow
                  label={t("booking.processedBy")}
                  value={
                    detail.processedBy
                      ? t("booking.staffNumber", { id: detail.processedBy })
                      : t("common.na")
                  }
                />
                <DetailRow label={t("booking.processedAt")} value={formatDate(detail.processedAt)} />
              </div>
              {detail.rejectReason && (
                <p className="mt-3 whitespace-pre-wrap rounded-lg border border-rose-100 bg-white/70 p-3 text-sm text-rose-700">
                  {detail.rejectReason}
                </p>
              )}
            </section>
          )}

          {additionalDetails.length > 0 && (
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="border-b border-slate-100 pb-2 font-semibold text-slate-800">
                {t("booking.additionalInformation")}
              </h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {additionalDetails.map(([key, value]) => (
                  <DetailRow key={key} label={key} value={formatValue(value)} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, action: null })}
        onConfirm={handleConfirmProcess}
        title={
          confirmState.action === "Approve"
            ? t("booking.approveRequest")
            : t("booking.rejectRequest")
        }
        message={
          confirmState.action === "Approve"
            ? t("booking.approveConfirm")
            : t("booking.rejectConfirm")
        }
        confirmText={
          confirmState.action === "Approve" ? t("booking.yesApprove") : t("booking.yesReject")
        }
        variant={confirmState.action === "Approve" ? "primary" : "warning"}
      />
      <LoadingOverlay isOpen={isProcessing} message={t("booking.processingRequest")} />
    </div>
  );
};
