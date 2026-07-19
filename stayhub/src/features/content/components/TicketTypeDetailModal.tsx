import React from 'react';
import ReactDOM from 'react-dom';
import { X, Ticket } from 'lucide-react';
import { useTranslation } from '../../../contexts/LocaleContext';
import type { ReadTicketTypeDTO } from '../types/ticketType';
import { ActionButton } from '../../../components/dashboard/ActionButton';

interface TicketTypeDetailModalProps {
  open: boolean;
  onClose: () => void;
  ticketType: ReadTicketTypeDTO | null;
}

export const TicketTypeDetailModal: React.FC<TicketTypeDetailModalProps> = ({
  open,
  onClose,
  ticketType,
}) => {
  const { t } = useTranslation();

  if (!open || !ticketType) return null;

  const formatDate = (date?: string | null) => {
    if (!date) return t("common.na");
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return t("common.na");
    return parsed.toLocaleString();
  };

  const isActive = ticketType.isActive === true;

  return ReactDOM.createPortal(
    <div
      className="glass-overlay fixed inset-0 z-[500] flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="glass-modal relative w-full max-w-lg overflow-hidden p-6 sm:p-8 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="icon-btn absolute right-4 top-4"
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4 border-b border-slate-100 pb-5 mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Ticket className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800" id="modal-title">
              {t("content.ticketTypeDetail")}
            </h3>
            <p className="text-sm text-slate-500">#{ticketType.id}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("content.ticketTypeName")}</label>
            <p className="text-base font-medium text-slate-800 mt-1">{ticketType.name}</p>
          </div>
          
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("common.description")}</label>
            <div className="mt-1 max-h-40 overflow-y-auto rounded-lg bg-slate-50 p-3 text-sm text-slate-600 border border-slate-100">
              {ticketType.description || t("common.na")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("common.status")}</label>
              <div className="mt-1">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {isActive ? t("common.active") : t("common.inactive")}
                </span>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("content.created")}</label>
              <p className="text-sm font-medium text-slate-700 mt-1">{formatDate(ticketType.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <ActionButton variant="secondary" onClick={onClose} className="px-6 py-2.5">
            {t("common.close")}
          </ActionButton>
        </div>
      </div>
    </div>,
    document.body,
  );
};
