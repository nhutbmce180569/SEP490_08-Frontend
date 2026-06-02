import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, X, ArrowLeft } from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCancellationDetails } from "../hooks/useCancellationDetails";
import { useProcessCancellation } from "../hooks/useProcessCancellation";
import { useToast } from "../../../contexts/ToastContext";
import { MANAGER_ROUTES } from "../../../config/routes/manager.routes";
import { ConfirmDialog } from "../../../components/dashboard/ConfirmDialog";

const formatCurrency = (amount?: number | null) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount ?? 0);
};

const formatDate = (date?: string | null) => {
  if (!date) return "N/A";
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? "N/A" : parsedDate.toLocaleString();
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "number") return value.toLocaleString("vi-VN");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <span className="text-xs font-bold uppercase text-slate-400">{label}</span>
    <span className="text-sm font-semibold text-slate-800 sm:text-right">{value}</span>
  </div>
);

export const ProcessCancellationPage: React.FC = () => {
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

  if (isLoading) return <div className="p-10 text-center text-slate-500">Loading details...</div>;
  if (error || !detail) return <div className="p-10 text-center text-rose-500">Request not found.</div>;

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
      showError("Please provide a reason for rejection.");
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
      success(`Request has been ${action.toLowerCase()}d successfully.`);
      navigate(MANAGER_ROUTES.CANCELLATION_REQUESTS);
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to process the request.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <button
        onClick={() => navigate(MANAGER_ROUTES.CANCELLATION_REQUESTS)}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Requests
      </button>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Request Details #{detail.id}</h2>
            <span className="text-sm text-slate-500">
              {detail.tour?.name || "Tour N/A"} - Customer #{detail.customer?.id ?? "N/A"}
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
                <X className="h-4 w-4" /> Reject Request
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={() => handleProcessClick("Approve")}
                disabled={isProcessing}
                className="gap-2 px-4 py-2 text-sm"
              >
                <Check className="h-4 w-4" /> Approve & Refund
              </ActionButton>
            </div>
          )}
        </div>

        <div className="grid gap-6 p-6">
          {/* Ô nhập lý do từ chối (Chỉ hiển thị khi trạng thái là Pending) */}
          {isPending && (
            <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5">
              <label className="text-sm font-semibold text-slate-800">
                Reject Reason <span className="font-normal text-slate-500">(Required if rejecting)</span>
              </label>
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-brand"
                rows={2}
                placeholder="Why is this request rejected?"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </section>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DetailRow label="Request ID" value={`#${detail.id}`} />
            <DetailRow label="Tour ID" value={detail.tour?.id ? `#${detail.tour.id}` : "N/A"} />
            <DetailRow label="Customer ID" value={detail.customer?.id ? `#${detail.customer.id}` : "N/A"} />
            <DetailRow label="Status" value={detail.status || "N/A"} />
            <DetailRow label="Requested At" value={formatDate(detail.requestedAt)} />
            <DetailRow label="Processed At" value={formatDate(detail.processedAt)} />
          </div>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="border-b border-slate-100 pb-2 font-semibold text-slate-800">Financial Details</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DetailRow label="Original Amount" value={formatCurrency(detail.originalAmount)} />
              <DetailRow label="Fee Percent" value={`${detail.feePercent ?? 0}%`} />
              <DetailRow label="Cancellation Fee" value={formatCurrency(detail.cancellationFee)} />
              <DetailRow label="Refund Amount" value={<span className="text-emerald-600">{formatCurrency(detail.refundAmount)}</span>} />
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="border-b border-slate-100 pb-2 font-semibold text-slate-800">Customer Information</h3>
              <div className="grid gap-3">
                {detail.customer?.avatarUrl && (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <img
                      src={detail.customer.avatarUrl}
                      alt="Customer avatar"
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <span className="text-sm font-semibold text-slate-800">Customer avatar</span>
                  </div>
                )}
                <DetailRow label="Customer ID" value={detail.customer?.id ? `#${detail.customer.id}` : "N/A"} />
                <DetailRow label="Full Name" value={formatValue(detail.customer?.fullName)} />
                <DetailRow label="Gender" value={formatValue(detail.customer?.gender)} />
                <DetailRow label="Date of Birth" value={detail.customer?.dateOfBirth ? formatDate(detail.customer.dateOfBirth) : "N/A"} />
                <DetailRow label="Created At" value={formatDate(detail.customer?.createdAt)} />
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="border-b border-slate-100 pb-2 font-semibold text-slate-800">Refund Bank Information</h3>
              <div className="grid gap-3">
                <DetailRow label="Bank Name" value={detail.bankName || "N/A"} />
                <DetailRow label="Account Number" value={detail.accountNumber || "N/A"} />
                <DetailRow label="Account Holder" value={detail.accountHolderName || "N/A"} />
              </div>
            </section>
          </div>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="border-b border-slate-100 pb-2 font-semibold text-slate-800">Tour Information</h3>
            <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                {detail.tour?.imageUrl ? (
                  <img src={detail.tour.imageUrl} alt={detail.tour.name} className="h-44 w-full object-cover" />
                ) : (
                  <div className="flex h-44 items-center justify-center text-sm font-semibold text-slate-400">
                    No image
                  </div>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <DetailRow label="Tour ID" value={detail.tour?.id ? `#${detail.tour.id}` : "N/A"} />
                <DetailRow label="Category ID" value={detail.tour?.categoryId ? `#${detail.tour.categoryId}` : "N/A"} />
                <DetailRow label="Name" value={formatValue(detail.tour?.name)} />
                <DetailRow label="Status" value={formatValue(detail.tour?.status)} />
                <DetailRow label="Average Star" value={formatValue(detail.tour?.averageStar)} />
                <DetailRow label="Country" value={formatValue(detail.tour?.country)} />
                <DetailRow label="City" value={formatValue(detail.tour?.city)} />
                <DetailRow label="Address" value={formatValue(detail.tour?.address)} />
              </div>
            </div>
            {detail.tour?.description && (
              <p className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {detail.tour.description}
              </p>
            )}
          </section>

          <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-800">Customer Reason</h3>
            <p className="whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
              {detail.reason || "N/A"}
            </p>
          </section>

          {!isPending && (
            <section className={`rounded-2xl border p-5 ${normalizedStatus === "approved" ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
              <h3 className="mb-3 font-semibold text-slate-800">Processing Result</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <DetailRow label="Status" value={<span className={normalizedStatus === "approved" ? "text-emerald-700" : "text-rose-700"}>{detail.status}</span>} />
                <DetailRow label="Processed By" value={detail.processedBy ? `Staff #${detail.processedBy}` : "N/A"} />
                <DetailRow label="Processed At" value={formatDate(detail.processedAt)} />
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
              <h3 className="border-b border-slate-100 pb-2 font-semibold text-slate-800">Additional Information</h3>
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
        title={confirmState.action === "Approve" ? "Approve Request" : "Reject Request"}
        message={confirmState.action === "Approve" ? "Are you sure you want to approve this cancellation request? The refund will be processed." : "Are you sure you want to reject this cancellation request?"}
        confirmText={confirmState.action === "Approve" ? "Yes, Approve" : "Yes, Reject"}
        variant={confirmState.action === "Approve" ? "primary" : "warning"}
      />
      <LoadingOverlay isOpen={isProcessing} message="Processing request..." />
    </div>
  );
};