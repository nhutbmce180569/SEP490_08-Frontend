import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerVoucherService } from '../services/customerVoucher.service';
import { useToast } from '../../../../contexts/ToastContext';
import { getApiErrorMessage } from '../../../content/utils/apiError';
import { validateVoucherCode } from '../../utils/voucherHelpers';

export const useSaveVoucher = (onSaved?: () => void) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const mutation = useMutation({
    mutationFn: (voucherCode: string) =>
      customerVoucherService.saveVoucher({ code: voucherCode.trim().toUpperCase() }),
    onSuccess: (saved) => {
      success(`Voucher ${saved.code} saved to your wallet.`);
      setCode('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['myVouchers'] });
      onSaved?.();
    },
    onError: (err: unknown) => {
      const message = getApiErrorMessage(err, 'Failed to save voucher.');
      setError(message);
      showError(message);
    },
  });

  const handleSave = () => {
    const validationError = validateVoucherCode(code);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    mutation.mutate(code);
  };

  return { code, setCode, error, isSaving: mutation.isPending, handleSave };
};
