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

export const ProcessCancellationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const requestId = Number(id);
  const navigate = useNavigate();

  const { data: detail, isLoading, error } = useCancellationDetails(requestId);
  const { mutateAsync: processRequest, isPending: isProcessing } = useProcessCancellation();
  const { success, error: showError } = useToast();
  
  const [rejectReason, setRejectReason] = useState("");
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; action: "Approve" | "Reject" | null }>({ isOpen: false, action: null });

  if (isLoading) return <div className="p-10 text-center text-slate-500">Loading details...</div>;
  if (error || !detail) return <div className="p-10 text-center text-rose-500">Request not found.</div>;

  const isPending = detail.status === "Pending";

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
      await processRequest({ id: requestId, data: { action, rejectReason: action === "Reject" ? rejectReason : undefined } });
      success(`Request has been ${action.toLowerCase()}d successfully.`);
      navigate(MANAGER_ROUTES.CANCELLATION_REQUESTS);
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to process the request.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl py-8 px-4">
      <button onClick={() => navigate(MANAGER_ROUTES.CANCELLATION_REQUESTS)} className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to Requests
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Request Details #{detail.id}</h2>
          <span className="text-sm text-slate-500">Order #{detail.orderId} • Customer #{detail.customerId}</span>
        </div>

        <div className="p-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 border-b pb-2">Refund Information</h3>
            <div className="text-sm text-slate-600">
              <p><span className="font-medium text-slate-900">Bank Name:</span> {detail.bankName}</p>
              <p><span className="font-medium text-slate-900">Account No:</span> {detail.accountNumber}</p>
              <p><span className="font-medium text-slate-900">Holder Name:</span> {detail.accountHolderName}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 border-b pb-2">Financial Details</h3>
            <div className="text-sm text-slate-600">
              <p><span className="font-medium text-slate-900">Original Amount:</span> {detail.originalAmount} VND</p>
              <p><span className="font-medium text-slate-900">Cancellation Fee:</span> {detail.cancellationFee} VND ({detail.feePercent}%)</p>
              <p className="mt-2 text-base font-bold text-emerald-600">Refund: {detail.refundAmount} VND</p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <h3 className="font-semibold text-slate-800">Customer Reason</h3>
            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{detail.reason}</p>
          </div>

          {!isPending && (
            <div className={`md:col-span-2 p-4 rounded-xl border ${detail.status === "Approved" ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
              <p className="font-semibold">Status: <span className={detail.status === "Approved" ? "text-emerald-700" : "text-rose-700"}>{detail.status}</span></p>
              {detail.rejectReason && <p className="text-sm mt-1 text-rose-600">Reason: {detail.rejectReason}</p>}
              <p className="text-xs text-slate-500 mt-2">Processed By: Staff #{detail.processedBy} at {new Date(detail.processedAt!).toLocaleString()}</p>
            </div>
          )}
        </div>

        {isPending && (
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-5">
            <h3 className="mb-3 font-semibold text-slate-800">Process Request</h3>
            
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700">Reject Reason (Required if rejecting)</label>
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#EB662B]"
                rows={2}
                placeholder="Why is this request rejected?"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              ></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => handleProcessClick("Reject")} className="!text-rose-600 hover:!bg-rose-50 border-rose-200">
                <X className="h-4 w-4 mr-1" /> Reject Request
              </ActionButton>
              <ActionButton variant="primary" onClick={() => handleProcessClick("Approve")} className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600">
                <Check className="h-4 w-4 mr-1" /> Approve & Refund
              </ActionButton>
            </div>
          </div>
        )}
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