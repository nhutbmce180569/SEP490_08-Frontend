import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PATH } from '../../../config/routes/route';
import { voucherService } from '../services/voucher.service';
import type { VoucherTargetValue } from '../components/VoucherTargetEditor';
import { baseVoucherSchema } from '../schemas/voucherSchema';
import { getAssignedQuantity } from '../utils/voucherTargetHelpers';
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from '../../content/utils/apiError';
import { toIsoDateTime } from '../utils/voucherHelpers';
import { useToast } from '../../../contexts/ToastContext';
import { useTranslation } from '../../../contexts/LocaleContext';

export const useCreateVoucher = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const queryClient = useQueryClient();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: any) => voucherService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      toast.success(t('voucher.createSuccess'));
      navigate(isAdminRoute ? PATH.ADMIN.SYSTEM_VOUCHERS : PATH.MANAGER.VOUCHERS);
    },
    onError: (error: unknown) => {
      const validationErrors = getApiValidationErrors(error);
      if (validationErrors) {
        setServerErrors(validationErrors as Record<string, string>);
        return;
      }
      setServerErrors({ _form: getApiErrorMessage(error, t('voucher.createFailed', { defaultValue: 'Failed to create voucher.' })) });
    },
  });

  const handleSubmit = (data: Record<string, unknown>) => {
    setServerErrors({});

    const discountType = data.discountType as string;
    const discountValue = Number(data.discountValue);
    const maxDiscountAmount = data.maxDiscountAmount ? Number(data.maxDiscountAmount) : undefined;
    const minOrderAmount = data.minOrderAmount ? Number(data.minOrderAmount) : undefined;
    const availableCount = data.availableCount ? Number(data.availableCount) : 0;
    const startDate = data.startDate ? toIsoDateTime(data.startDate as string) : '';
    const endDate = data.endDate ? toIsoDateTime(data.endDate as string) : '';
    const voucherTarget = (data.voucherTarget || { type: 'public', customerAssignments: [], topCustomerAssignment: { top: 10, revenuePeriod: 'Month', quantity: 1 } }) as VoucherTargetValue;

    const parsedData = {
      code: String(data.code || '').trim().toUpperCase(),
      tourId: data.tourId ? Number(data.tourId) : undefined,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
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
    };

    const validationResult = baseVoucherSchema.safeParse(parsedData);
    const localErrors: Record<string, string> = {};

    if (!validationResult.success) {
      const issues = validationResult.error?.errors || (validationResult.error as any)?.issues || [];
      issues.forEach((err: any) => {
        const path = err.path.join('.');
        localErrors[path] = t(`voucher.${err.message}`, { defaultValue: err.message });
      });
    }

    if (voucherTarget.type === 'specific') {
      const hasInvalidCustomer = voucherTarget.customerAssignments.some(
        (item) => !item.userId || item.userId <= 0,
      );
      if (hasInvalidCustomer) {
        localErrors.voucherTarget = t('voucher.invalidCustomerSelection', { defaultValue: 'Please select customers by ID before creating the voucher.' });
      }
    }

    if (voucherTarget.type === 'topRevenue') {
      if (!voucherTarget.topCustomerAssignment.top || voucherTarget.topCustomerAssignment.top <= 0) {
        localErrors.voucherTarget = t('voucher.invalidTopCustomer', { defaultValue: 'Top customer count must be at least 1.' });
      }
    }

    const totalAssigned = getAssignedQuantity(voucherTarget);
    if (totalAssigned > availableCount) {
      localErrors.voucherTarget = t('voucher.targetExceedsAvailable', { defaultValue: 'Total assigned quantity cannot exceed available count.' });
    }

    if (Object.keys(localErrors).length > 0) {
      setServerErrors(localErrors);
      return;
    }

    mutation.mutate(parsedData);
  };

  const handleCancel = () => navigate(isAdminRoute ? PATH.ADMIN.SYSTEM_VOUCHERS : PATH.MANAGER.VOUCHERS);

  return { handleSubmit, handleCancel, isSubmitting: mutation.isPending, serverErrors };
};
