import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PATH } from '../../../config/routes/route';
import { voucherService } from '../services/voucher.service';
import type { CreateVoucherDTO, CreateUserVoucherAssignmentDTO } from '../types/voucher';
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from '../../content/utils/apiError';
import {
  toIsoDateTime,
  validateDateRange,
  validateDiscountValue,
  validateMaxDiscountAmount,
  validateVoucherCode,
} from '../utils/voucherHelpers';

export const useCreateVoucher = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: CreateVoucherDTO) => voucherService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      navigate(PATH.MANAGER.VOUCHERS);
    },
    onError: (error: any) => {
      const validationErrors = getApiValidationErrors(error);
      if (validationErrors) {
        setServerErrors(validationErrors as Record<string, string>);
        return;
      }
      setServerErrors({ _form: getApiErrorMessage(error, 'Failed to create voucher.') });
    },
  });

  const handleSubmit = (data: Record<string, any>) => {
    setServerErrors({});

    const discountType = data.discountType as string;
    const discountValue = Number(data.discountValue);
    const maxDiscountAmount = data.maxDiscountAmount ? Number(data.maxDiscountAmount) : undefined;
    const startDate = toIsoDateTime(data.startDate);
    const endDate = toIsoDateTime(data.endDate);
    const customerAssignments = (data.customerAssignments || []) as CreateUserVoucherAssignmentDTO[];

    const codeError = validateVoucherCode(data.code || '');
    const discountError = validateDiscountValue(discountType, discountValue);
    const maxDiscountError = validateMaxDiscountAmount(discountType, maxDiscountAmount);
    const dateError = validateDateRange(startDate, endDate);

    const localErrors: Record<string, string> = {};
    if (codeError) localErrors.code = codeError;
    if (discountError) localErrors.discountValue = discountError;
    if (maxDiscountError) localErrors.maxDiscountAmount = maxDiscountError;
    if (dateError) localErrors.endDate = dateError;

    const totalAssigned = customerAssignments.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const availableCount = Number(data.availableCount);
    if (totalAssigned > availableCount) {
      localErrors.customerAssignments = 'Total assigned quantity cannot exceed available count.';
    }

    if (Object.keys(localErrors).length > 0) {
      setServerErrors(localErrors);
      return;
    }

    const dto: CreateVoucherDTO = {
      code: data.code.trim().toUpperCase(),
      tourId: data.tourId ? Number(data.tourId) : undefined,
      discountType,
      discountValue,
      maxDiscountAmount: discountType === 'Percent' ? maxDiscountAmount : undefined,
      availableCount,
      startDate,
      endDate,
      description: data.description?.trim() || undefined,
      customerAssignments: customerAssignments.length > 0 ? customerAssignments : undefined,
    };

    mutation.mutate(dto);
  };

  const handleCancel = () => navigate(PATH.MANAGER.VOUCHERS);

  return {
    handleSubmit,
    handleCancel,
    isSubmitting: mutation.isPending,
    serverErrors,
  };
};
