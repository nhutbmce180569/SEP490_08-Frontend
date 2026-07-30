import React from 'react';
import { AlertCircle, ShieldCheck, TicketPercent } from 'lucide-react';
import { PaginationButton } from '../../../../components/dashboard/PaginationButton';
import { SaveVoucherInput } from '../components/SaveVoucherInput';
import { VoucherWalletCard } from '../components/VoucherWalletCard';
import { useMyVouchers } from '../hooks/useMyVouchers';
import { useSaveVoucher } from '../hooks/useSaveVoucher';
import { useToast } from '../../../../contexts/ToastContext';
import { useTranslation } from '../../../../contexts/LocaleContext';

export const MyVouchersPage: React.FC = () => {
  const { t } = useTranslation();
  const { success } = useToast();

  const { vouchers, isLoading, error, pageSize, setPage, resetPage, data } = useMyVouchers();
  const { code, setCode, error: saveError, isSaving, handleSave } = useSaveVoucher(resetPage);

  const handleCopyCode = async (voucherCode: string) => {
    try {
      await navigator.clipboard.writeText(voucherCode);
      success(t('voucher.copiedToClipboard', { code: voucherCode }));
    } catch {
      success(t('voucher.codeCopied', { code: voucherCode }));
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-slate-900">
            <TicketPercent className="text-brand" size={26} />
            {t('voucher.myVouchers')}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">{t('voucher.myVouchersDesc')}</p>
        </div>

        <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200/60 shadow-xs">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>{t('voucher.tabAvailable')} ({vouchers.length})</span>
        </div>
      </div>

      <div className="mb-6">
        <SaveVoucherInput code={code} error={saveError} isSaving={isSaving} onCodeChange={setCode} onSave={handleSave} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-12 text-center text-rose-700">
          <AlertCircle size={28} className="text-rose-400" />
          <p className="font-semibold">{t('voucher.loadError')}</p>
          <p className="text-sm text-rose-500">{error}</p>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <TicketPercent size={40} className="text-slate-300" />
          <p className="font-semibold text-slate-700">
            {t('voucher.emptyAll')}
          </p>
          <p className="max-w-sm text-sm text-slate-400">
            {t('voucher.emptyAllHint')}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {vouchers.map((voucher) => (
              <VoucherWalletCard key={voucher.userVoucherId} voucher={voucher} onCopy={handleCopyCode} />
            ))}
          </div>
          <PaginationButton
            currentPage={data?.currentPage ?? 1}
            totalPages={data?.totalPages ?? 1}
            totalItems={data?.total ?? 0}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};
