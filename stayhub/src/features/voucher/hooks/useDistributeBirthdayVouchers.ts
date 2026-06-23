import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { voucherService } from '../services/voucher.service';
import { useToast } from '../../../contexts/ToastContext';
import { getApiErrorMessage } from '../../content/utils/apiError';

export const useDistributeBirthdayVouchers = () => {
  const [isDistributing, setIsDistributing] = useState(false);
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const distribute = async (month?: number) => {
    setIsDistributing(true);
    try {
      const result = await voucherService.distributeBirthdayVouchers(month);
      
      success(
        `Success! Code: ${result.voucherCode} | Eligible: ${result.totalEligibleCustomers} | Emails: ${result.emailsSent}`
      );

      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, 'Failed to distribute birthday vouchers.'));
    } finally {
      setIsDistributing(false);
    }
  };

  return { distribute, isDistributing };
};
