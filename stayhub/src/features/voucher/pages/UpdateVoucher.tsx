import React, { useMemo, useContext } from 'react';
import {
  Calendar,
  Hash,
  Percent,
  Tag,
  Ticket,
  AlertCircle,
} from 'lucide-react';
import { DynamicForm, type FormField } from '../../../components/dashboard/DynamicForm';
import { LoadingOverlay } from '../../../components/dashboard/LoadingOverlay';
import { useTranslation } from '../../../contexts/LocaleContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { createDefaultVoucherTarget, VoucherTargetEditor, type VoucherTargetValue } from '../components/VoucherTargetEditor';
import { useUpdateVoucher } from '../hooks/useUpdateVoucher';
import { useTourOptions } from '../hooks/useTourOptions';
import { toDateTimeLocal } from '../utils/voucherHelpers';

export const UpdateVoucher: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.roles?.includes('Admin') ?? false;
  const {
    id,
    voucher,
    isFetching,
    fetchError,
    isSubmitting,
    serverErrors,
    handleSubmit,
    handleCancel,
  } = useUpdateVoucher();
  const { options: tourOptions } = useTourOptions(isAdmin);
  const isUsed = (voucher?.usedCount ?? 0) > 0;

  const voucherFields: FormField[] = useMemo(
    () => {
      if (!voucher) return [];
      return [
      {
        name: 'code',
        label: t('voucher.voucherCode'),
        type: 'text',
        readOnly: true,
        colSpan: 2,
      },
      {
        name: 'tourId',
        label: t('voucher.applicableTour'),
        type: 'searchable-select',
        icon: <Ticket className="h-4 w-4" />,
        colSpan: 2,
        readOnly: isUsed,
        options: tourOptions,
        required: !isAdmin,
      },
      {
        name: 'discountType',
        label: t('voucher.discountType'),
        type: 'select',
        icon: <Percent className="h-4 w-4" />,
        readOnly: isUsed,
        options: [
          { label: t('voucher.percentType'), value: 'Percent' },
          { label: t('voucher.amountType'), value: 'Amount' },
        ],
      },
      {
        name: 'discountValue',
        label: t('voucher.discountValue'),
        type: 'number',
        icon: <Hash className="h-4 w-4" />,
        readOnly: isUsed,
      },
      {
        name: 'maxDiscountAmount',
        label: t('voucher.maxDiscountAmount'),
        type: 'number',
        icon: <Hash className="h-4 w-4" />,
        readOnly: isUsed,
        visible: (formData) => (formData.discountType || voucher.discountType) === 'Percent',
      },
      {
        name: 'minOrderAmount',
        label: t('voucher.minOrderAmount'),
        type: 'number',
        placeholder: t('voucher.minOrderAmountPlaceholder'),
        icon: <Hash className="h-4 w-4" />,
      },
      {
        name: 'availableCount',
        label: t('voucher.availableCount'),
        type: 'number',
        icon: <Hash className="h-4 w-4" />,
      },
      {
        name: 'startDate',
        label: t('voucher.startDate'),
        type: 'datetime-local',
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        name: 'endDate',
        label: t('voucher.endDate'),
        type: 'datetime-local',
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        name: 'description',
        label: t('common.description'),
        type: 'textarea',
        icon: <Tag className="h-4 w-4" />,
        colSpan: 2,
      },
      {
        name: 'voucherTarget',
        label: t('voucher.addCustomerAssignments'),
        type: 'custom',
        colSpan: 2,
        render: (value, onChange, error) => (
          <VoucherTargetEditor
            value={(value as VoucherTargetValue) || createDefaultVoucherTarget()}
            onChange={onChange}
            error={error}
          />
        ),
      },
    ];
    },
    [t, isUsed, tourOptions, voucher],
  );

  if (isFetching) {
    return (
      <div className="flex justify-center p-10 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p>{t('voucher.loadingVoucherDetails')}</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-800">{t('voucher.errorLoading')}</h2>
        <p className="mt-2 text-sm text-slate-500">{fetchError}</p>
        <button
          type="button"
          onClick={handleCancel}
          className="mt-6 rounded-lg bg-slate-100 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
        >
          {t('voucher.backToVouchers')}
        </button>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Ticket className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-800">{t('voucher.voucherNotFound')}</h2>
        <p className="mt-2 text-sm text-slate-500">{t('voucher.voucherNotFoundDesc', { defaultValue: 'The voucher you are looking for does not exist or has been removed.' })}</p>
        <button
          type="button"
          onClick={handleCancel}
          className="mt-6 rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand/90"
        >
          {t('voucher.backToVouchers')}
        </button>
      </div>
    );
  }

  if (voucher.isActive) {
    return (
      <div className="mx-auto max-w-2xl py-8 text-center">
        <p className="text-sm text-slate-600">{t('voucher.voucherActiveNoEdit', { defaultValue: 'Voucher đang hoạt động, vui lòng tắt voucher trước khi chỉnh sửa.' })}</p>
        <button
          type="button"
          onClick={handleCancel}
          className="mt-4 text-sm font-semibold text-brand hover:underline"
        >
          {t('voucher.backToVouchers')}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-4xl">
        {isUsed && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t('voucher.voucherUsedWarning', { count: voucher.usedCount })}
          </div>
        )}
        {serverErrors._form && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverErrors._form}
          </div>
        )}
      </div>

      <DynamicForm
        title={t('voucher.updateVoucher')}
        description={t('voucher.updateVoucherDesc', { id: String(id), code: voucher.code })}
        fields={voucherFields}
        initialValues={{
          code: voucher.code,
          tourId: voucher.tourId ? String(voucher.tourId) : '',
          discountType: voucher.discountType,
          discountValue: voucher.discountValue,
          maxDiscountAmount: voucher.maxDiscountAmount ?? '',
          minOrderAmount: voucher.minOrderAmount ?? '',
          availableCount: voucher.availableCount,
          startDate: toDateTimeLocal(voucher.startDate),
          endDate: toDateTimeLocal(voucher.endDate),
          description: voucher.description || '',
          voucherTarget: createDefaultVoucherTarget(),
        }}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
        submitText={t('common.saveChanges')}
        cancelText={t('common.cancel')}
        isSubmitting={isSubmitting}
      />
      <LoadingOverlay isOpen={isSubmitting} message={t('voucher.updatingVoucher')} />
    </>
  );
};
