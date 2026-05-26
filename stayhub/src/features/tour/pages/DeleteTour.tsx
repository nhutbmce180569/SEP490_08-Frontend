import React from "react";
import { AlertTriangle, ArrowLeft, Trash2, Hash, Tag, FileText } from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useDeleteTour } from "../hooks/useDeleteTour";

export const DeleteTourConfirm: React.FC = () => {
  const { tour, isFetching, fetchError, isDeleting, handleConfirmDelete, handleCancel } = useDeleteTour();

  // Render Loading & Error state cho quá trình lấy dữ liệu
  if (isFetching) return <div className="flex justify-center p-10 text-slate-500">Loading tour details...</div>;
  if (fetchError) return <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>;
  if (!tour) return <div className="flex justify-center p-10 text-slate-500">Tour not found.</div>;

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Nút Quay lại */}
      <button 
        onClick={handleCancel}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tour List
      </button>

      {/* Main Card Xác Nhận */}
      <div className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
        
        {/* Header (Phần Cảnh báo) */}
        <div className="flex items-start gap-4 border-b border-rose-100 bg-rose-50/50 px-6 py-5">
          <div className="mt-0.5 rounded-full bg-rose-100 p-2 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-rose-700">Delete Tour Confirmation</h2>
            <p className="mt-1 text-sm text-rose-600/90">
              Are you absolutely sure you want to delete this tour? This action will permanently remove the data and cannot be undone.
            </p>
          </div>
        </div>

        {/* Nội dung Tóm tắt Tour sắp bị xóa */}
        <div className="p-6">
          <div className="mb-4 text-sm font-bold text-slate-800">Tour Details to be deleted:</div>
          
          <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400 shadow-sm">
              <FileText className="h-8 w-8" />
            </div>
            
            <div className="flex-1 space-y-2.5">
              <h3 className="line-clamp-2 text-base font-bold text-slate-900">{tour.name}</h3>
              
              <div className="flex flex-col gap-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-slate-400" />
                  <span>Category ID: {tour.categoryId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-slate-400" />
                  <span>Status: {tour.status || "Draft"}</span>
                </div>
                {tour.description && (
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span className="line-clamp-2">{tour.description}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer (Chứa 2 Action Buttons) */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <ActionButton variant="secondary" onClick={handleCancel} className="px-5 py-2.5 text-sm">
            Cancel
          </ActionButton>
          
          <ActionButton variant="warning" onClick={handleConfirmDelete} className="gap-2 px-5 py-2.5 text-sm !bg-rose-600 !text-white !border-rose-600 hover:!bg-rose-700 hover:!border-rose-700">
            <Trash2 className="h-4 w-4" />
            Yes, Delete Tour
          </ActionButton>
        </div>
      </div>

      {/* Màn hình Loading khi đang xóa */}
      <LoadingOverlay isOpen={isDeleting} message="Deleting tour data..." />
    </div>
  );
};