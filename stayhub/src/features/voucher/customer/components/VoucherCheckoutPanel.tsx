import React, { useEffect, useState } from 'react';
import { ChevronDown, Percent, Tag, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { customerVoucherService } from '../services/customerVoucher.service';
import type { ReadSavedVoucherDTO } from '../types/customerVoucher';
import type { AppliedVoucherState } from '../hooks/useApplyVoucher';
import { formatDiscount, formatVnd } from '../../utils/voucherHelpers';

interface VoucherCheckoutPanelProps {
  tourId: number;
  billAmount: number;
  voucherCode: string;
  isApplying: boolean;
  appliedVoucher: AppliedVoucherState | null;
  onCodeChange: (code: string) => void;
  onApply: () => void;
  onApplySaved: (code: string) => void;
  onClear: () => void;
}

export const VoucherCheckoutPanel: React.FC<VoucherCheckoutPanelProps> = ({
  tourId,
  billAmount,
  voucherCode,
  isApplying,
  appliedVoucher,
  onCodeChange,
  onApply,
  onApplySaved,
  onClear,
}) => {
  const [showWallet, setShowWallet] = useState(false);

  const { data: walletData } = useQuery({
    queryKey: ['myVouchers', 'checkout', tourId],
    queryFn: () => customerVoucherService.getMyVouchers(1, 50, 'Available'),
    enabled: billAmount > 0,
  });

  const applicableVouchers = (walletData?.data ?? []).filter(
    (voucher) =>
      voucher.status === 'Available' &&
      voucher.isActive &&
      voucher.voucherStatus === 'Active' &&
      voucher.quantity > 0 &&
      (!voucher.tourId || voucher.tourId === tourId),
  );

  useEffect(() => {
    if (appliedVoucher) setShowWallet(false);
  }, [appliedVoucher]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-brand" />
          <span className="text-sm font-bold text-slate-800">Shop Voucher / Promo Code</span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {appliedVoucher ? (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Voucher Applied</p>
              <p className="mt-1 font-mono text-sm font-black text-emerald-900">{appliedVoucher.code}</p>
              <p className="mt-1 text-xs text-emerald-700">You save {formatVnd(appliedVoucher.discountAmount)}</p>
            </div>
            <button type="button" onClick={onClear} className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            {applicableVouchers.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowWallet((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-xl border border-dashed border-brand/40 bg-brand-light/50 px-3 py-2.5 text-left text-sm font-semibold text-brand hover:bg-brand-light"
                >
                  <span>Select from My Vouchers ({applicableVouchers.length})</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showWallet ? 'rotate-180' : ''}`} />
                </button>

                {showWallet && (
                  <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
                    {applicableVouchers.map((voucher) => (
                      <WalletPickerItem
                        key={voucher.userVoucherId}
                        voucher={voucher}
                        onSelect={() => onApplySaved(voucher.code)}
                        disabled={isApplying}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={voucherCode}
                onChange={(event) => onCodeChange(event.target.value.toUpperCase())}
                placeholder="Enter voucher code"
                maxLength={50}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold uppercase tracking-wide outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
              <button
                type="button"
                onClick={onApply}
                disabled={isApplying || !voucherCode.trim() || billAmount <= 0}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Percent className="h-4 w-4" />
                {isApplying ? 'Applying...' : 'Apply'}
              </button>
            </div>
          </>
        )}

        {billAmount > 0 && (
          <div className="space-y-1.5 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatVnd(billAmount)}</span>
            </div>
            {appliedVoucher && (
              <div className="flex justify-between font-medium text-emerald-700">
                <span>Voucher discount</span>
                <span>-{formatVnd(appliedVoucher.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
              <span>Total</span>
              <span className="text-brand">{formatVnd(appliedVoucher?.finalAmount ?? billAmount)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const WalletPickerItem: React.FC<{
  voucher: ReadSavedVoucherDTO;
  onSelect: () => void;
  disabled?: boolean;
}> = ({ voucher, onSelect, disabled }) => (
  <button
    type="button"
    onClick={onSelect}
    disabled={disabled}
    className="flex w-full items-center justify-between gap-3 rounded-lg border border-white bg-white px-3 py-2.5 text-left hover:border-brand/30 hover:shadow-sm disabled:opacity-60"
  >
    <div className="min-w-0">
      <div className="font-mono text-xs font-black text-slate-800">{voucher.code}</div>
      <div className="truncate text-[11px] text-slate-500">
        {formatDiscount(voucher.discountType, voucher.discountValue)}
        {voucher.tourName ? ` · ${voucher.tourName}` : ' · All tours'}
      </div>
    </div>
    <span className="shrink-0 text-xs font-bold text-brand">Apply</span>
  </button>
);
