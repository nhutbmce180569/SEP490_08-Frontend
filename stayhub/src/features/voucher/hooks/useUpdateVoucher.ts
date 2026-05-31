import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PATH } from '../../../config/routes/route';
import { voucherService } from '../services/voucher.service';
import type { CreateUserVoucherAssignmentDTO, UpdateVoucherDTO } from '../types/voucher';
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from '../../content/utils/apiError';
import {
  toIsoDateTime,
  validateDateRange,
  validateDiscountValue,
  validateMaxDiscountAmount,
} from '../utils/voucherHelpers';

export const useUpdateVoucher = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const { data: voucher, isLoading: isFetching, error } = useQuery({
    queryKey: ['voucher', id],
    queryFn: () => voucherService.getById(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateVoucherDTO) => voucherService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher', id] });
      navigate(PATH.MANAGER.VOUCHERS);
    },
    onError: (err: any) => {
      const validationErrors = getApiValidationErrors(err);
      if (validationErrors) {
        setServerErrors(validationErrors as Record<string, string>);
        return;
      }
      setServerErrors({ _form: getApiErrorMessage(err, 'Failed to update voucher.') });
    },
  });

  const handleSubmit = (data: Record<string, any>) => {
    if (!voucher) return;
    setServerErrors({});

    const discountType = (data.discountType || voucher.discountType) as string;
    const discountValue = data.discountValue !== undefined && data.discountValue !== ''
      ? Number(data.discountValue)
      : voucher.discountValue;
    const maxDiscountAmount = data.maxDiscountAmount !== undefined && data.maxDiscountAmount !== ''
      ? Number(data.maxDiscountAmount)
      : undefined;
    const startDate = data.startDate ? toIsoDateTime(data.startDate) : voucher.startDate;
    const endDate = data.endDate ? toIsoDateTime(data.endDate) : voucher.endDate;
    const customerAssignments = (data.customerAssignments || []) as CreateUserVoucherAssignmentDTO[];

    const discountError = validateDiscountValue(discountType, discountValue);
    const maxDiscountError = validateMaxDiscountAmount(discountType, maxDiscountAmount);
    const dateError = validateDateRange(startDate, endDate);

    const localErrors: Record<string, string> = {};
    if (discountError) localErrors.discountValue = discountError;
    if (maxDiscountError) localErrors.maxDiscountAmount = maxDiscountError;
    if (dateError) localErrors.endDate = dateError;

    const totalAssigned = voucher.assignedCustomers.reduce((sum, item) => sum + item.quantity, 0)
      + customerAssignments.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const availableCount = data.availableCount !== undefined && data.availableCount !== ''
      ? Number(data.availableCount)
      : voucher.availableCount;

    if (totalAssigned > availableCount) {
      localErrors.customerAssignments = 'Total assigned quantity cannot exceed available count.';
    }

    if (Object.keys(localErrors).length > 0) {
      setServerErrors(localErrors);
      return;
    }

    const dto: UpdateVoucherDTO = {
      tourId: data.tourId ? Number(data.tourId) : undefined,
      discountType: data.discountType || undefined,
      discountValue: data.discountValue !== undefined && data.discountValue !== ''
        ? Number(data.discountValue)
        : undefined,
      maxDiscountAmount: discountType === 'Percent' ? maxDiscountAmount : undefined,
      availableCount: data.availableCount !== undefined && data.availableCount !== ''
        ? Number(data.availableCount)
        : undefined,
      startDate: data.startDate ? startDate : undefined,
      endDate: data.endDate ? endDate : undefined,
      description: data.description !== undefined ? (data.description?.trim() || '') : undefined,
      customerAssignments: customerAssignments.length > 0 ? customerAssignments : undefined,
    };

    mutation.mutate(dto);
  };

  const handleCancel = () => navigate(PATH.MANAGER.VOUCHERS);

  return {
    id,
    voucher,
    isFetching,
    fetchError: error ? 'Failed to fetch voucher details.' : null,
    isSubmitting: mutation.isPending,
    serverErrors,
    handleSubmit,
    handleCancel,
  };
};
