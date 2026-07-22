import { useTranslation } from "../../../../contexts/LocaleContext";
import { useState } from 'react';
import { customerVoucherService } from '../services/customerVoucher.service';
import { useToast } from '../../../../contexts/ToastContext';
import { getApiErrorMessage, getApiValidationErrors, normalizeServerErrors } from '../../../content/utils/apiError';
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
  const { t } = useTranslation();

  const clearAppliedVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
  };

  const applyVoucher = async (tourId: number, billAmount: number, codeOverride?: string) => {
    const code = (codeOverride ?? voucherCode).trim();
    if (!code) {
      showError(t('voucher.enterVoucherCode', { defaultValue: 'Please enter a voucher code.' }));
      return null;
    }

    const validationError = validateVoucherCode(code);
    if (validationError) {
      showError(validationError);
      return null;
    }

    if (billAmount <= 0) {
      showError(t('voucher.billAmountInvalid', { defaultValue: 'Bill amount must be greater than 0 to apply a voucher.' }));
      return null;
    }

    setIsApplying(true);
    try {
      const payload = {
        voucherCode: code.toUpperCase(),
        code: code.toUpperCase(),
        tourId,
        billAmount,
      } as const;
      // helpful debug logging in dev
      // eslint-disable-next-line no-console
      console.debug('[voucher] apply payload', payload);

      const result = await customerVoucherService.applyVoucher(payload);

      const applied = toAppliedState(result);
      setAppliedVoucher(applied);
      setVoucherCode(result.code);
      success(result.message || t('voucher.applySuccess', { code: result.code, defaultValue: `Voucher ${result.code} applied successfully.` }));
      return applied;
    } catch (err: unknown) {
      setAppliedVoucher(null);
      // Try to extract validation errors from server and show them
      const validation = getApiValidationErrors(err);
      if (validation && typeof validation === 'object') {
        const norm = normalizeServerErrors(validation as Record<string, unknown>);
        const messages = Object.values(norm).flatMap((v) => (Array.isArray(v) ? v : [v]));
        const text = messages.map((m) => String(m)).join(' · ');
        // eslint-disable-next-line no-console
        console.debug('[voucher] apply error validation', validation, norm);
        showError(text || getApiErrorMessage(err, t('voucher.applyFailed', { defaultValue: 'Failed to apply voucher.' })));
        return null;
      }

      showError(getApiErrorMessage(err, t('voucher.applyFailed', { defaultValue: 'Failed to apply voucher.' })));
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
