import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Gift, CheckCircle2, Ticket, Users, Mail, X } from 'lucide-react';
import { useTranslation } from '../../../contexts/LocaleContext';
import { ActionButton } from '../../../components/dashboard/ActionButton';
import { useToast } from '../../../contexts/ToastContext';
import { voucherService } from '../services/voucher.service';

interface BirthdayDistributeModalProps {
  open: boolean;
  onClose: () => void;
}

export const BirthdayDistributeModal: React.FC<BirthdayDistributeModalProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  
  const currentMonth = new Date().getMonth() + 1;
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    voucherCode: string;
    totalEligibleCustomers: number;
    emailsSent: number;
  } | null>(null);
  const [isDistributed, setIsDistributed] = useState<boolean | null>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (open) {
      checkStatus(currentMonth);
    }
  }, [open, currentMonth]);

  const checkStatus = async (month: number) => {
    setIsLoading(true);
    try {
      const res = await voucherService.checkBirthdayVoucherStatus(month, currentYear);
      setIsDistributed(res.isDistributed);
    } catch (error) {
      setIsDistributed(null);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDistribute = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await voucherService.distributeBirthdayVouchers(currentMonth);
      setResult({
        voucherCode: response.voucherCode,
        totalEligibleCustomers: response.totalEligibleCustomers,
        emailsSent: response.emailsSent,
      });
      addToast({
        title: t('admin.distributeSuccess') || 'Success!',
        message: response.message || 'Vouchers distributed successfully.',
        type: 'success',
      });
    } catch (error: any) {
      addToast({
        title: t('admin.distributeError') || 'Error',
        message: error?.response?.data?.message || error.message || 'Failed to distribute vouchers',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setResult(null);
      setIsDistributed(null);
      onClose();
    }
  };

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="glass-overlay fixed inset-0 z-[500] flex items-center justify-center p-4"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="glass-modal relative w-full max-w-lg overflow-hidden p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="icon-btn absolute right-4 top-4"
          disabled={isLoading}
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Gift size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800" id="modal-title">
              {t('admin.distributeBirthdayVoucher') || 'Distribute Birthday Vouchers'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t('admin.birthdayVoucherDesc') || 'Automatically distribute discount vouchers to customers with birthdays in the current month.'}
            </p>
          </div>
        </div>

        {!result ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="text-sm font-medium text-indigo-800">
                {t('admin.distributeConfirmMessage', { month: currentMonth, year: currentYear }) || `Bạn đang chuẩn bị phát voucher sinh nhật cho các khách hàng có sinh nhật trong tháng ${currentMonth}/${currentYear}.`}
              </p>
            </div>

            {isDistributed && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                <p>{t('admin.alreadyDistributedMessage', { month: currentMonth, year: currentYear }) || `Voucher sinh nhật cho tháng ${currentMonth}/${currentYear} đã được phát rồi. Bạn không thể phát lại cho tháng này.`}</p>
              </div>
            )}

            <div className="flex w-full gap-3 sm:flex-row mt-4">
              <ActionButton variant="secondary" onClick={handleClose} disabled={isLoading} className="flex-1 justify-center py-2.5">
                {t('common.cancel')}
              </ActionButton>
              <ActionButton 
                variant="primary" 
                onClick={handleDistribute} 
                disabled={isLoading || isDistributed === true}
                className="flex-1 justify-center py-2.5"
              >
                {isLoading ? t('common.loading') || 'Đang xử lý...' : t('admin.distribute') || 'Auto Distribute'}
              </ActionButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
            <div className="mb-4 flex flex-col items-center justify-center text-emerald-600">
              <CheckCircle2 size={40} className="mb-2 text-emerald-500" />
              <h3 className="text-lg font-bold">{t('admin.distributeSuccess') || 'Success!'}</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <Ticket className="text-brand" size={18} />
                  <span className="text-sm font-semibold text-slate-700">{t('admin.voucherCode') || 'Voucher Code'}</span>
                </div>
                <span className="font-black text-brand">{result.voucherCode}</span>
              </div>
              
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <Users className="text-blue-500" size={18} />
                  <span className="text-sm font-semibold text-slate-700">{t('admin.eligibleCustomers') || 'Eligible Customers'}</span>
                </div>
                <span className="font-bold text-slate-800">{result.totalEligibleCustomers}</span>
              </div>
              
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <Mail className="text-amber-500" size={18} />
                  <span className="text-sm font-semibold text-slate-700">{t('admin.emailsSent') || 'Emails Sent'}</span>
                </div>
                <span className="font-bold text-slate-800">{result.emailsSent}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <ActionButton variant="primary" onClick={handleClose} className="w-full justify-center py-2.5">
                {t('common.close') || 'Close'}
              </ActionButton>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
