import { useState } from 'react';
import { customerVoucherService } from '../services/customerVoucher.service';
import { useToast } from '../../../../contexts/ToastContext';
import { getApiErrorMessage } from '../../../content/utils/apiError';
import { validateVoucherCode } from '../../utils/voucherHelpers';
import type { ApplyVoucherResultDTO } from '../types/customerVoucher';

export interface AppliedVoucherState {
  code: string;
  voucherId: number;
  discountAmount: number;
  finalAmount: number;
  billAmount: number;
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number;
}

const toAppliedState = (result: ApplyVoucherResultDTO): AppliedVoucherState => ({
  code: result.code,
  voucherId: result.voucherId,
  discountAmount: result.discountAmount,
  finalAmount: result.finalAmount,
  billAmount: result.billAmount,
  discountType: result.discountType,
  discountValue: result.discountValue,
  maxDiscountAmount: result.maxDiscountAmount,
});

export const useApplyVoucher = () => {
  const [voucherCode, setVoucherCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucherState | null>(null);
  const { success, error: showError } = useToast();

  const clearAppliedVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
  };

  const applyVoucher = async (tourId: number, billAmount: number, codeOverride?: string) => {
    const code = (codeOverride ?? voucherCode).trim();
    if (!code) {
      showError('Please enter a voucher code.');
      return null;
    }

    const validationError = validateVoucherCode(code);
    if (validationError) {
      showError(validationError);
      return null;
    }

    if (billAmount <= 0) {
      showError('Bill amount must be greater than 0 to apply a voucher.');
      return null;
    }

    setIsApplying(true);
    try {
      const result = await customerVoucherService.applyVoucher({
        code: code.toUpperCase(),
        tourId,
        billAmount,
      });

      const applied = toAppliedState(result);
      setAppliedVoucher(applied);
      setVoucherCode(result.code);
      success(result.message || `Voucher ${result.code} applied successfully.`);
      return applied;
    } catch (err: unknown) {
      setAppliedVoucher(null);
      showError(getApiErrorMessage(err, 'Failed to apply voucher.'));
      return null;
    } finally {
      setIsApplying(false);
    }
  };

  const applySavedVoucher = (code: string, tourId: number, billAmount: number) => {
    setVoucherCode(code);
    return applyVoucher(tourId, billAmount, code);
  };

  return {
    voucherCode,
    setVoucherCode,
    isApplying,
    appliedVoucher,
    applyVoucher,
    applySavedVoucher,
    clearAppliedVoucher,
  };
};
