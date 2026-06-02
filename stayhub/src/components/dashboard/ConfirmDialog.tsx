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
    <div
      className="glass-overlay fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="glass-modal relative w-full max-w-md transform overflow-hidden p-6 transition-all sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="icon-btn absolute right-4 top-4"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 ring-4 ring-rose-50/80">
            {icon}
          </div>

          <h3 className="travel-heading mb-2 text-xl text-navy" id="modal-title">
            {title}
          </h3>
          <p className="mb-8 text-sm text-slate-500">{message}</p>

          <div className="flex w-full gap-3 sm:flex-row">
            <ActionButton variant="secondary" onClick={onClose} className="flex-1 justify-center py-2.5">
              {cancelText}
            </ActionButton>
            <ActionButton variant={variant === 'warning' ? 'warning' : variant} onClick={onConfirm} className="flex-1 justify-center py-2.5">
              {confirmText}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
};
