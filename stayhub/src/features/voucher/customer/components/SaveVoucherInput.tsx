import React from 'react';
import { TicketPercent, Loader2 } from 'lucide-react';

interface SaveVoucherInputProps {
  code: string;
  error: string | null;
  isSaving: boolean;
  onCodeChange: (value: string) => void;
  onSave: () => void;
}

export const SaveVoucherInput: React.FC<SaveVoucherInputProps> = ({
  code,
  error,
  isSaving,
  onCodeChange,
  onSave,
}) => (
  <div className="overflow-hidden rounded-2xl border border-[#EB662B]/20 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-5 shadow-sm">
    <div className="mb-4 flex items-start gap-3">
      <div className="rounded-xl bg-[#EB662B] p-2.5 text-white shadow-md shadow-orange-500/20">
        <TicketPercent size={22} />
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-900">Enter Voucher Code</h3>
        <p className="mt-0.5 text-sm text-slate-500">
          Save vouchers to your wallet and use them at checkout.
        </p>
      </div>
    </div>

    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        type="text"
        value={code}
        onChange={(event) => onCodeChange(event.target.value.toUpperCase())}
        onKeyDown={(event) => { if (event.key === 'Enter') onSave(); }}
        placeholder="e.g. SUMMER2026"
        maxLength={50}
        className={`flex-1 rounded-xl border bg-white px-4 py-3 text-sm font-semibold uppercase tracking-wide outline-none transition-all focus:ring-4 focus:ring-[#EB662B]/10 ${
          error ? 'border-rose-300 focus:border-rose-400' : 'border-slate-200 focus:border-[#EB662B]'
        }`}
      />
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || !code.trim()}
        className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-[#EB662B] px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition-all hover:bg-[#d85a26] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? (<><Loader2 className="h-4 w-4 animate-spin" />Saving...</>) : 'Save Voucher'}
      </button>
    </div>

    {error && <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
  </div>
);
