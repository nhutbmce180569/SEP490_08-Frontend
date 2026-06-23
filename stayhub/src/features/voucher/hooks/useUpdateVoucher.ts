import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PATH } from '../../../config/routes/route';
import { voucherService } from '../services/voucher.service';
import type { VoucherTargetValue } from '../components/VoucherTargetEditor';
import type { UpdateVoucherDTO } from '../types/voucher';
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
} from '../utils/voucherHelpers';

export const useUpdateVoucher = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
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
      navigate(isAdminRoute ? PATH.ADMIN.SYSTEM_VOUCHERS : PATH.MANAGER.VOUCHERS);
    },
    onError: (err: unknown) => {
      const validationErrors = getApiValidationErrors(err);
      if (validationErrors) {
        setServerErrors(validationErrors as Record<string, string>);
        return;
      }
      setServerErrors({ _form: getApiErrorMessage(err, 'Failed to update voucher.') });
    },
  });

  const handleSubmit = (data: Record<string, unknown>) => {
    if (!voucher) return;
    setServerErrors({});

    const discountType = (data.discountType || voucher.discountType) as string;
    const discountValue = data.discountValue !== undefined && data.discountValue !== ''
      ? Number(data.discountValue)
      : voucher.discountValue;
    const maxDiscountAmount = data.maxDiscountAmount !== undefined && data.maxDiscountAmount !== ''
      ? Number(data.maxDiscountAmount)
      : undefined;
    const startDate = data.startDate ? toIsoDateTime(data.startDate as string) : voucher.startDate;
    const endDate = data.endDate ? toIsoDateTime(data.endDate as string) : voucher.endDate;
    const voucherTarget = (data.voucherTarget || { type: 'public', customerAssignments: [], topCustomerAssignment: { top: 10, revenuePeriod: 'Month', quantity: 1 } }) as VoucherTargetValue;

    const localErrors: Record<string, string> = {};
    const discountError = validateDiscountValue(discountType, discountValue);
    const maxDiscountError = validateMaxDiscountAmount(discountType, maxDiscountAmount);
    const dateError = validateDateRange(startDate, endDate);

    if (discountError) localErrors.discountValue = discountError;
    if (maxDiscountError) localErrors.maxDiscountAmount = maxDiscountError;
    if (dateError) localErrors.endDate = dateError;

    if (voucherTarget.type === 'specific') {
      const hasInvalidCustomer = voucherTarget.customerAssignments.some(
        (item) => !item.userId || item.userId <= 0,
      );
      if (hasInvalidCustomer) {
        localErrors.voucherTarget = 'Please select customers by ID before updating the voucher.';
      }
    }

    const existingAssigned = voucher.assignedCustomers.reduce((sum, item) => sum + item.quantity, 0);
    const newAssigned = getAssignedQuantity(voucherTarget);
    const availableCount = data.availableCount !== undefined && data.availableCount !== ''
      ? Number(data.availableCount)
      : voucher.availableCount;

    if (existingAssigned + newAssigned > availableCount) {
      localErrors.voucherTarget = 'Total assigned quantity cannot exceed available count.';
    }

    if (Object.keys(localErrors).length > 0) {
      setServerErrors(localErrors);
      return;
    }

    mutation.mutate({
      tourId: data.tourId ? Number(data.tourId) : undefined,
      discountType: data.discountType ? String(data.discountType) : undefined,
      discountValue: data.discountValue !== undefined && data.discountValue !== ''
        ? Number(data.discountValue)
        : undefined,
      maxDiscountAmount: discountType === 'Percent' ? maxDiscountAmount : undefined,
      availableCount: data.availableCount !== undefined && data.availableCount !== ''
        ? Number(data.availableCount)
        : undefined,
      startDate: data.startDate ? startDate : undefined,
      endDate: data.endDate ? endDate : undefined,
      description: data.description !== undefined ? String(data.description).trim() : undefined,
      customerAssignments:
        voucherTarget.type === 'specific' && voucherTarget.customerAssignments.length > 0
          ? voucherTarget.customerAssignments.map(({ userId, quantity }) => ({ userId, quantity }))
          : undefined,
      topCustomerAssignment:
        voucherTarget.type === 'topRevenue' ? voucherTarget.topCustomerAssignment : undefined,
    });
  };

  const handleCancel = () => navigate(isAdminRoute ? PATH.ADMIN.SYSTEM_VOUCHERS : PATH.MANAGER.VOUCHERS);

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
