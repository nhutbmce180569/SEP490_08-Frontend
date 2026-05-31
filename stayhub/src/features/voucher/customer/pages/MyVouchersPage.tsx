import React, { useEffect, useState } from 'react';
import { AlertCircle, TicketPercent } from 'lucide-react';
import { PaginationButton } from '../../../../components/dashboard/PaginationButton';
import { SaveVoucherInput } from '../components/SaveVoucherInput';
import { VoucherWalletCard } from '../components/VoucherWalletCard';
import { useMyVouchers } from '../hooks/useMyVouchers';
import { useSaveVoucher } from '../hooks/useSaveVoucher';
import { useToast } from '../../../../contexts/ToastContext';
import type { WalletTab } from '../types/customerVoucher';

const TABS: { key: WalletTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'used', label: 'Used' },
  { key: 'expired', label: 'Expired' },
];

export const MyVouchersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WalletTab>('all');
  const { success } = useToast();

  const { vouchers, isLoading, error, pageSize, setPage, resetPage, data } = useMyVouchers(activeTab);
  const { code, setCode, error: saveError, isSaving, handleSave } = useSaveVoucher(resetPage);

  useEffect(() => { resetPage(); }, [activeTab, resetPage]);

  const handleCopyCode = async (voucherCode: string) => {
    try {
      await navigator.clipboard.writeText(voucherCode);
      success(`Copied ${voucherCode} to clipboard.`);
    } catch {
      success(`Code: ${voucherCode}`);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-slate-900">
          <TicketPercent className="text-[#EB662B]" size={24} />
          My Vouchers
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Save promo codes to your wallet and apply them when booking tours.
        </p>
      </div>

      <div className="mb-6">
        <SaveVoucherInput code={code} error={saveError} isSaving={isSaving} onCodeChange={setCode} onSave={handleSave} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-[#EB662B] text-white shadow-md shadow-orange-500/20'
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
          <p className="font-semibold">Unable to load vouchers</p>
          <p className="text-sm text-rose-500">{error}</p>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <TicketPercent size={40} className="text-slate-300" />
          <p className="font-semibold text-slate-700">
            {activeTab === 'all' ? 'No vouchers saved yet' : `No ${activeTab} vouchers`}
          </p>
          <p className="max-w-sm text-sm text-slate-400">
            {activeTab === 'all' ? 'Enter a voucher code above to save it to your wallet.' : 'Try another tab or save a new voucher code.'}
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
