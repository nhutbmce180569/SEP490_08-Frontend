import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PATH } from '../../../config/routes/route';
import { voucherService } from '../services/voucher.service';
import type { VoucherTargetValue } from '../components/VoucherTargetEditor';
import type { UpdateVoucherDTO } from '../types/voucher';
import { updateVoucherSchema } from '../schemas/voucherSchema';
import { getAssignedQuantity } from '../utils/voucherTargetHelpers';
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from '../../content/utils/apiError';
import { toIsoDateTime } from '../utils/voucherHelpers';
import { useToast } from '../../../contexts/ToastContext';
import { useTranslation } from '../../../contexts/LocaleContext';

export const useUpdateVoucher = () => {
  const { t } = useTranslation();
  const toast = useToast();
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
      toast.success(t('voucher.updateSuccess'));
      navigate(isAdminRoute ? PATH.ADMIN.SYSTEM_VOUCHERS : PATH.MANAGER.VOUCHERS);
    },
    onError: (err: unknown) => {
      const validationErrors = getApiValidationErrors(err);
      if (validationErrors) {
        setServerErrors(validationErrors as Record<string, string>);
        return;
      }
      setServerErrors({ _form: getApiErrorMessage(err, t('voucher.updateFailed', { defaultValue: 'Failed to update voucher.' })) });
    },
  });

  const handleSubmit = (data: Record<string, unknown>) => {
    if (!voucher) return;
    setServerErrors({});

    const isUsed = (voucher.usedCount ?? 0) > 0;
    const discountType = (data.discountType || voucher.discountType) as string;
    const discountValue = data.discountValue !== undefined && data.discountValue !== ''
      ? Number(data.discountValue)
      : voucher.discountValue;
    const maxDiscountAmount = data.maxDiscountAmount !== undefined && data.maxDiscountAmount !== ''
      ? Number(data.maxDiscountAmount)
      : undefined;
    const minOrderAmount = data.minOrderAmount !== undefined && data.minOrderAmount !== ''
      ? Number(data.minOrderAmount)
      : undefined;
    const startDate = data.startDate ? toIsoDateTime(data.startDate as string) : voucher.startDate;
    const endDate = data.endDate ? toIsoDateTime(data.endDate as string) : voucher.endDate;
    const availableCount = data.availableCount !== undefined && data.availableCount !== ''
      ? Number(data.availableCount)
      : voucher.availableCount;
    const voucherTarget = (data.voucherTarget || { type: 'public', customerAssignments: [], topCustomerAssignment: { top: 10, revenuePeriod: 'Month', quantity: 1 } }) as VoucherTargetValue;

    const parsedData = {
      tourId: data.tourId ? Number(data.tourId) : undefined,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      availableCount,
      startDate,
      endDate,
      description: data.description !== undefined ? String(data.description).trim() : undefined,
      customerAssignments:
        voucherTarget.type === 'specific' && voucherTarget.customerAssignments.length > 0
          ? voucherTarget.customerAssignments.map(({ userId, quantity }) => ({ userId, quantity }))
          : undefined,
      topCustomerAssignment:
        voucherTarget.type === 'topRevenue' ? voucherTarget.topCustomerAssignment : undefined,
    };

    const validationResult = updateVoucherSchema.safeParse(parsedData);
    const localErrors: Record<string, string> = {};

    if (!validationResult.success) {
      // If the voucher is used, we only care about errors on fields that are actually allowed to be updated.
      validationResult.error.errors.forEach(err => {
        const path = err.path.join('.');
        if (isUsed && ['tourId', 'discountType', 'discountValue', 'maxDiscountAmount'].includes(path)) {
          return;
        }
        localErrors[path] = t(`voucher.${err.message}`, { defaultValue: err.message });
      });
    }

    if (voucherTarget.type === 'specific') {
      const hasInvalidCustomer = voucherTarget.customerAssignments.some(
        (item) => !item.userId || item.userId <= 0,
      );
      if (hasInvalidCustomer) {
        localErrors.voucherTarget = t('voucher.invalidCustomerSelection', { defaultValue: 'Please select customers by ID before updating the voucher.' });
      }
    }

    const existingAssigned = voucher.assignedCustomers.reduce((sum, item) => sum + item.quantity, 0);
    const newAssigned = getAssignedQuantity(voucherTarget);
    if (existingAssigned + newAssigned > availableCount) {
      localErrors.voucherTarget = t('voucher.targetExceedsAvailable', { defaultValue: 'Total assigned quantity cannot exceed available count.' });
    }

    if (Object.keys(localErrors).length > 0) {
      setServerErrors(localErrors);
      return;
    }

    mutation.mutate({
      tourId: isUsed ? undefined : parsedData.tourId,
      discountType: isUsed ? undefined : parsedData.discountType,
      discountValue: isUsed ? undefined : parsedData.discountValue,
      maxDiscountAmount: isUsed ? undefined : parsedData.maxDiscountAmount,
      minOrderAmount: isUsed ? undefined : parsedData.minOrderAmount,
      availableCount: parsedData.availableCount,
      startDate: data.startDate ? startDate : undefined,
      endDate: data.endDate ? endDate : undefined,
      description: parsedData.description,
      customerAssignments: parsedData.customerAssignments,
      topCustomerAssignment: parsedData.topCustomerAssignment,
    });
  };

  const handleCancel = () => navigate(isAdminRoute ? PATH.ADMIN.SYSTEM_VOUCHERS : PATH.MANAGER.VOUCHERS);

  return {
    id,
    voucher,
    isFetching,
    fetchError: error ? t('voucher.fetchError', { defaultValue: 'Failed to fetch voucher details.' }) : null,
    isSubmitting: mutation.isPending,
    serverErrors,
    handleSubmit,
    handleCancel,
  };
};
