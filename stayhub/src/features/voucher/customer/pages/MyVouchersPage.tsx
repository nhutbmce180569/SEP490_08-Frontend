import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, TicketPercent } from 'lucide-react';
import { PaginationButton } from '../../../../components/dashboard/PaginationButton';
import { SaveVoucherInput } from '../components/SaveVoucherInput';
import { VoucherWalletCard } from '../components/VoucherWalletCard';
import { useMyVouchers } from '../hooks/useMyVouchers';
import { useSaveVoucher } from '../hooks/useSaveVoucher';
import { useToast } from '../../../../contexts/ToastContext';
import { useTranslation } from '../../../../contexts/LocaleContext';
import type { WalletTab } from '../types/customerVoucher';

export const MyVouchersPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<WalletTab>('all');
  const { success } = useToast();

  const tabs = useMemo(
    () =>
      [
        { key: 'all' as WalletTab, label: t('voucher.tabAll') },
        { key: 'available' as WalletTab, label: t('voucher.tabAvailable') },
        { key: 'used' as WalletTab, label: t('voucher.tabUsed') },
        { key: 'expired' as WalletTab, label: t('voucher.tabExpired') },
      ],
    [t],
  );

  const { vouchers, isLoading, error, pageSize, setPage, resetPage, data } = useMyVouchers(activeTab);
  const { code, setCode, error: saveError, isSaving, handleSave } = useSaveVoucher(resetPage);

  useEffect(() => { resetPage(); }, [activeTab, resetPage]);

  const handleCopyCode = async (voucherCode: string) => {
    try {
      await navigator.clipboard.writeText(voucherCode);
      success(t('voucher.copiedToClipboard', { code: voucherCode }));
    } catch {
      success(t('voucher.codeCopied', { code: voucherCode }));
    }
  };

  const activeTabLabel = tabs.find((tab) => tab.key === activeTab)?.label ?? activeTab;

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-slate-900">
          <TicketPercent className="text-brand" size={24} />
          {t('voucher.myVouchers')}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">{t('voucher.myVouchersDesc')}</p>
      </div>

      <div className="mb-6">
        <SaveVoucherInput code={code} error={saveError} isSaving={isSaving} onCodeChange={setCode} onSave={handleSave} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-brand text-white shadow-md shadow-brand/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
            {activeTab === 'all' ? t('voucher.emptyAll') : t('voucher.emptyTab', { tab: activeTabLabel })}
          </p>
          <p className="max-w-sm text-sm text-slate-400">
            {activeTab === 'all' ? t('voucher.emptyAllHint') : t('voucher.emptyTabHint')}
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
