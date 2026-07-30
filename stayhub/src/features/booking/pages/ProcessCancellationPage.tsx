import React, { useState, useContext } from "react";
import { AuthContext } from "../../../contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { Check, X, ArrowLeft, HelpCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useCancellationDetails } from "../hooks/useCancellationDetails";
import { useProcessCancellation } from "../hooks/useProcessCancellation";
import { useToast } from "../../../contexts/ToastContext";
import { MANAGER_ROUTES } from "../../../config/routes/manager.routes";
import { ConfirmDialog } from "../../../components/dashboard/ConfirmDialog";
import { getGenderDisplay } from "../../auth/pages/UserList";
import { categoryService } from "../../content/services/category.service";
import { MoneyDisplay } from "../../currency/MoneyDisplay";
import { DynamicText } from "../../../components/DynamicText";

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error && error.message ? error.message : fallback;
};

const DetailRow = ({ label, value, vertical = false }: { label: string; value: React.ReactNode; vertical?: boolean }) => (
  <div className={`flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 ${
    vertical ? "justify-between" : "sm:flex-row sm:items-start sm:justify-between"
  }`}>
    <span className={`text-xs font-bold uppercase text-slate-400 shrink-0 ${vertical ? "pt-0.5" : "sm:mr-4 sm:pt-0.5"}`}>{label}</span>
    <span className={`font-semibold text-slate-800 ${
      vertical ? "text-base sm:text-left mt-0.5 whitespace-nowrap overflow-x-auto" : "text-sm sm:text-right flex-1 min-w-0 break-words"
    }`}>{value}</span>
  </div>
);

const getStatusDisplay = (status: string, t: any) => {
  if (!status) return "";
  const normalized = status.toLowerCase();
  if (normalized === "pending") return t("common.pending");
  if (normalized === "approved") return t("common.approved");
  if (normalized === "rejected") return t("common.rejected");
  if (normalized === "refunded") return t("common.refunded");
  if (normalized === "active") return t("common.active");
  if (normalized === "inactive") return t("common.inactive");
  if (normalized === "cancelled" || normalized === "canceled") return t("common.cancelled");
  if (normalized === "completed") return t("common.completed");
  if (normalized === "draft") return t("common.draft") || t("tour.draft") || "Bản nháp";
  return status;
};

export const ProcessCancellationPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
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
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);

  const { data: categoryData } = useQuery({
    queryKey: ["category", detail?.tour?.categoryId],
    queryFn: () => categoryService.getCategoryById(Number(detail!.tour!.categoryId)),
    enabled: !!detail?.tour?.categoryId,
  });

  const formatDate = (date?: string | null) => {
    if (!date) return t("common.na");
    const parsedDate = new Date(date);
    return Number.isNaN(parsedDate.getTime()) ? t("common.na") : parsedDate.toLocaleString();
  };

  const formatDateOnly = (date?: string | null) => {
    if (!date) return t("common.na");
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split("-");
      return `${day}/${month}/${year}`;
    }
    const parsedDate = new Date(date);
    return Number.isNaN(parsedDate.getTime()) ? t("common.na") : parsedDate.toLocaleDateString();
  };

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") return t("common.na");
    if (typeof value === "number") return value.toLocaleString("vi-VN");
    if (typeof value === "boolean") return value ? t("common.yes") : t("common.no");
    if (typeof value === "string") {
      const display = getStatusDisplay(value, t);
      if (display && display !== value) return display;
    }
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
  const isOwnTour = detail.tour?.operatorId ? Number(detail.tour.operatorId) === Number(user?.id) : true;
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
    <div className="mx-auto max-w-7xl">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0 sm:pr-4">
            <button
              onClick={() => navigate(MANAGER_ROUTES.CANCELLATION_REQUESTS)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
              title={t("booking.backToRequests")}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900 break-words">
                {t("booking.requestDetails", { id: detail.id })}
              </h2>
              <p className="mt-1 text-sm text-slate-500 break-words flex flex-wrap items-center">
                {t("booking.tourCustomer", {
                  tour: "___TOUR___",
                  id: detail.customer?.id ?? t("common.na"),
                }).split("___TOUR___").map((part, index, array) => (
                  <React.Fragment key={index}>
                    {part}
                    {index < array.length - 1 && (
                      detail.tour?.name ? <DynamicText text={detail.tour.name} /> : t("booking.tourNa")
                    )}
                  </React.Fragment>
                ))}
              </p>
            </div>
          </div>

          {isPending && isOwnTour && (
            <div className="flex flex-wrap gap-2 shrink-0">
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
          {isPending && !isOwnTour && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800 shrink-0">
              {t("booking.onlyOwnTourProcess") || "⚠️ Bạn chỉ có thể duyệt/từ chối yêu cầu hủy khi tour này thuộc quyền quản lý của bạn."}
            </div>
          )}
        </div>

        <div className="grid gap-6 p-6">
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
                      {getStatusDisplay(detail.status || "", t)}
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
                <p className="mt-3 whitespace-pre-wrap break-words rounded-lg border border-rose-100 bg-white/70 p-3 text-sm text-rose-700">
                  {detail.rejectReason}
                </p>
              )}
            </section>
          )}

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
            <DetailRow label={t("booking.requestId")} value={`#${detail.id}`} vertical />
            <DetailRow
              label={t("booking.tourId")}
              value={detail.tour?.id ? `#${detail.tour.id}` : t("common.na")}
              vertical
            />
            <DetailRow
              label={t("booking.customerId")}
              value={detail.customer?.id ? `#${detail.customer.id}` : t("common.na")}
              vertical
            />
            <DetailRow label={t("common.status")} value={getStatusDisplay(detail.status || "", t) || t("common.na")} vertical />
            <DetailRow label={t("booking.requestedAt")} value={formatDate(detail.requestedAt)} vertical />
            <DetailRow label={t("booking.processedAt")} value={formatDate(detail.processedAt)} vertical />
          </div>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-slate-800">
                {t("booking.financialDetails")}
              </h3>
              <button
                type="button"
                onClick={() => setIsPolicyOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand/20 bg-brand/5 px-2.5 py-1 text-xs font-semibold text-brand transition hover:bg-brand/10"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                {t("booking.cancellationPolicyInfo") || "Chính sách hủy & hoàn tiền"}
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DetailRow label={t("booking.originalAmount")} value={<MoneyDisplay amountVnd={detail.originalAmount ?? 0} compact />} vertical />
              <DetailRow label={t("booking.feePercent")} value={`${detail.feePercent ?? 0}%`} vertical />
              <DetailRow
                label={t("booking.cancellationFeeLabel")}
                value={<MoneyDisplay amountVnd={detail.cancellationFee ?? 0} compact />}
                vertical
              />
              <DetailRow
                label={t("booking.refundAmount")}
                value={<span className="text-emerald-600 font-bold"><MoneyDisplay amountVnd={detail.refundAmount ?? 0} compact /></span>}
                vertical
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
                      className="h-12 w-12 rounded-full object-cover shrink-0"
                    />
                    <span className="text-sm font-semibold text-slate-800 min-w-0 break-words">
                      {t("booking.customerAvatar")}
                    </span>
                  </div>
                )}
                <DetailRow
                  label={t("booking.customerId")}
                  value={detail.customer?.id ? `#${detail.customer.id}` : t("common.na")}
                />
                <DetailRow label={t("booking.fullNameLabel")} value={formatValue(detail.customer?.fullName)} />
                <DetailRow label={t("booking.genderLabel")} value={getGenderDisplay(detail.customer?.gender, t)} />
                <DetailRow
                  label={t("common.dateOfBirth")}
                  value={
                    detail.customer?.dateOfBirth
                      ? formatDateOnly(detail.customer.dateOfBirth)
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
            <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shrink-0">
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
              <div className="grid gap-3 md:grid-cols-2 min-w-0">
                <DetailRow
                  label={t("booking.tourId")}
                  value={detail.tour?.id ? `#${detail.tour.id}` : t("common.na")}
                />
                <DetailRow
                  label={t("booking.categoryName") || "Tên danh mục"}
                  value={
                    categoryData?.name ? (
                      <DynamicText text={categoryData.name} />
                    ) : detail.tour?.categoryId ? (
                      `#${detail.tour.categoryId}`
                    ) : (
                      t("common.na")
                    )
                  }
                />
                <DetailRow label={t("common.name")} value={detail.tour?.name ? <DynamicText text={detail.tour.name} /> : t("common.na")} />
                <DetailRow label={t("common.status")} value={formatValue(detail.tour?.status)} />
                <DetailRow label={t("booking.averageStar")} value={formatValue(detail.tour?.averageStar)} />
                <DetailRow label={t("booking.country")} value={detail.tour?.country ? <DynamicText text={detail.tour.country} /> : t("common.na")} />
                <DetailRow label={t("booking.city")} value={detail.tour?.city ? <DynamicText text={detail.tour.city} /> : t("common.na")} />
                <DetailRow label={t("content.address")} value={detail.tour?.address ? <DynamicText text={detail.tour.address} /> : t("common.na")} />
              </div>
            </div>
            {detail.tour?.description && (
              <div className="whitespace-pre-wrap break-words rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                <DynamicText text={detail.tour.description} />
              </div>
            )}
          </section>

          <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-800">{t("booking.customerReason")}</h3>
            <div className="whitespace-pre-wrap break-words rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
              {detail.reason ? <DynamicText text={detail.reason} /> : t("common.na")}
            </div>
          </section>

          {additionalDetails.length > 0 && (
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="border-b border-slate-100 pb-2 font-semibold text-slate-800">
                {t("booking.additionalInformation")}
              </h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 min-w-0">
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
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        variant={confirmState.action === "Approve" ? "primary" : "warning"}
        isLoading={isProcessing}
      />
      {isPolicyOpen && (
        <div
          className="fixed inset-0 z-[9000] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsPolicyOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand font-bold">
                  %
                </span>
                <h3 className="font-bold text-slate-900">
                  {t("booking.cancellationPolicyInfo") || "Chính sách hủy & hoàn tiền"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPolicyOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3.5 px-5 py-4 text-sm text-slate-700">
              <p className="font-medium leading-relaxed text-slate-800">
                {t("booking.feeRule")}
              </p>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-100 font-semibold text-slate-700">
                    <tr>
                      <th className="px-3 py-2">{t("booking.policyTimeBeforeDeparture") || "Thời gian trước khởi hành"}</th>
                      <th className="px-3 py-2 text-right">{t("booking.policyCancellationFeeRate") || "Phí hủy (%)"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="px-3 py-2">{t("booking.policyRefundMoreThan15") || "> 15 ngày"}</td>
                      <td className="px-3 py-2 text-right text-emerald-600">{t("booking.policyRefund100") || "0% (Hoàn 100%)"}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">{t("booking.policyRefund11to15") || "11 - 15 ngày"}</td>
                      <td className="px-3 py-2 text-right text-amber-600">5%</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">{t("booking.policyRefund6to10") || "6 - 10 ngày"}</td>
                      <td className="px-3 py-2 text-right text-amber-600">10%</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">{t("booking.policyRefund3to5") || "3 - 5 ngày"}</td>
                      <td className="px-3 py-2 text-right text-orange-600">15%</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">{t("booking.policyRefund1to2") || "1 - 2 ngày"}</td>
                      <td className="px-3 py-2 text-right text-rose-600">20%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 italic">
                {t("booking.policyFeeNote") || "* Phí hủy được trừ trực tiếp vào tổng tiền thanh toán ban đầu để tính ra số tiền hoàn lại cho khách hàng."}
              </p>
            </div>
          </div>
        </div>
      )}
      <LoadingOverlay isOpen={isProcessing} message={t("booking.processingRequest")} />
    </div>
  );
};
