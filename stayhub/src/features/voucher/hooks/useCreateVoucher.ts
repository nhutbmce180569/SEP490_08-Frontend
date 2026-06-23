import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PATH } from '../../../config/routes/route';
import { voucherService } from '../services/voucher.service';
import type { VoucherTargetValue } from '../components/VoucherTargetEditor';
import type { CreateVoucherDTO } from '../types/voucher';
import { getAssignedQuantity } from '../utils/voucherTargetHelpers';
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
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const queryClient = useQueryClient();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: CreateVoucherDTO) => voucherService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      navigate(isAdminRoute ? PATH.ADMIN.SYSTEM_VOUCHERS : PATH.MANAGER.VOUCHERS);
    },
    onError: (error: unknown) => {
      const validationErrors = getApiValidationErrors(error);
      if (validationErrors) {
        setServerErrors(validationErrors as Record<string, string>);
        return;
      }
      setServerErrors({ _form: getApiErrorMessage(error, 'Failed to create voucher.') });
    },
  });

  const handleSubmit = (data: Record<string, unknown>) => {
    setServerErrors({});

    const discountType = data.discountType as string;
    const discountValue = Number(data.discountValue);
    const maxDiscountAmount = data.maxDiscountAmount ? Number(data.maxDiscountAmount) : undefined;
    const startDate = toIsoDateTime(data.startDate as string);
    const endDate = toIsoDateTime(data.endDate as string);
    const voucherTarget = (data.voucherTarget || { type: 'public', customerAssignments: [], topCustomerAssignment: { top: 10, revenuePeriod: 'Month', quantity: 1 } }) as VoucherTargetValue;

    const localErrors: Record<string, string> = {};
    const codeError = validateVoucherCode(String(data.code || ''));
    const discountError = validateDiscountValue(discountType, discountValue);
    const maxDiscountError = validateMaxDiscountAmount(discountType, maxDiscountAmount);
    const dateError = validateDateRange(startDate, endDate);

    if (codeError) localErrors.code = codeError;
    if (discountError) localErrors.discountValue = discountError;
    if (maxDiscountError) localErrors.maxDiscountAmount = maxDiscountError;
    if (dateError) localErrors.endDate = dateError;

    if (voucherTarget.type === 'specific') {
      const hasInvalidCustomer = voucherTarget.customerAssignments.some(
        (item) => !item.userId || item.userId <= 0,
      );
      if (hasInvalidCustomer) {
        localErrors.voucherTarget = 'Please select customers by ID before creating the voucher.';
      }
    }

    if (voucherTarget.type === 'topRevenue') {
      if (!voucherTarget.topCustomerAssignment.top || voucherTarget.topCustomerAssignment.top <= 0) {
        localErrors.voucherTarget = 'Top customer count must be at least 1.';
      }
    }

    const totalAssigned = getAssignedQuantity(voucherTarget);
    const availableCount = Number(data.availableCount);
    if (totalAssigned > availableCount) {
      localErrors.voucherTarget = 'Total assigned quantity cannot exceed available count.';
    }

    if (Object.keys(localErrors).length > 0) {
      setServerErrors(localErrors);
      return;
    }

    mutation.mutate({
      code: String(data.code).trim().toUpperCase(),
      tourId: data.tourId ? Number(data.tourId) : undefined,
      discountType,
      discountValue,
      maxDiscountAmount: discountType === 'Percent' ? maxDiscountAmount : undefined,
      availableCount,
      startDate,
      endDate,
      description: data.description ? String(data.description).trim() : undefined,
      customerAssignments:
        voucherTarget.type === 'specific' && voucherTarget.customerAssignments.length > 0
          ? voucherTarget.customerAssignments.map(({ userId, quantity }) => ({ userId, quantity }))
          : undefined,
      topCustomerAssignment:
        voucherTarget.type === 'topRevenue' ? voucherTarget.topCustomerAssignment : undefined,
    });
  };

  const handleCancel = () => navigate(isAdminRoute ? PATH.ADMIN.SYSTEM_VOUCHERS : PATH.MANAGER.VOUCHERS);

  return { handleSubmit, handleCancel, isSubmitting: mutation.isPending, serverErrors };
};
