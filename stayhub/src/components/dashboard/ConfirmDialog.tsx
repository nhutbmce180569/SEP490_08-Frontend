import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { ActionButton, type ActionButtonProps } from './ActionButton';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ActionButtonProps['variant'];
  icon?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  icon = <AlertTriangle className="h-6 w-6 text-rose-500" />,
}) => {
  if (!open) return null;

  return (
    // Lớp phủ (Overlay)
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {/* Dialog */}
      <div
        className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all sm:p-8"
        onClick={(e) => e.stopPropagation()} // Ngăn dialog đóng khi click bên trong
      >
        {/* Nút đóng (X) góc trên phải */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 ring-4 ring-rose-50/50">
            {icon}
          </div>

          {/* Nội dung */}
          <h3 className="mb-2 text-xl font-bold text-slate-800" id="modal-title">
            {title}
          </h3>
          <p className="mb-8 text-sm text-slate-500">{message}</p>

          {/* Các nút hành động */}
          <div className="flex w-full gap-3 sm:flex-row">
            <ActionButton variant="secondary" onClick={onClose} className="flex-1 justify-center py-2.5 text-sm">
              {cancelText}
            </ActionButton>
            <ActionButton variant={variant} onClick={onConfirm} className="flex-1 justify-center py-2.5 text-sm">
              {confirmText}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
};