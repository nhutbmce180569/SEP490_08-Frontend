import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { voucherService } from '../services/voucher.service';
import { useToast } from '../../../contexts/ToastContext';
import { getApiErrorMessage } from '../../content/utils/apiError';

export const useChangeVoucherStatus = (refetch?: () => void) => {
  const [updatingId, setUpdatingId] = useState<number | string | null>(null);
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const executeStatusChange = async (id: number | string, currentIsActive: boolean) => {
    setUpdatingId(id);
    try {
      const result = currentIsActive
        ? await voucherService.deactivate(id)
        : await voucherService.activate(id);

      success(`Voucher ${result.code} ${currentIsActive ? 'deactivated' : 'activated'} successfully.`);

      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher', id] });

      if (refetch) refetch();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, 'Failed to change voucher status.'));
    } finally {
      setUpdatingId(null);
    }
  };

  return { executeStatusChange, updatingId };
};
