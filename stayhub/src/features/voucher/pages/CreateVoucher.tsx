import React, { useMemo, useContext } from 'react';
import {
  Calendar,
  Hash,
  Percent,
  Tag,
  Ticket,
  Type,
} from 'lucide-react';
import { DynamicForm, type FormField } from '../../../components/dashboard/DynamicForm';
import { LoadingOverlay } from '../../../components/dashboard/LoadingOverlay';
import { useTranslation } from '../../../contexts/LocaleContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { createDefaultVoucherTarget, VoucherTargetEditor, type VoucherTargetValue } from '../components/VoucherTargetEditor';
import { useCreateVoucher } from '../hooks/useCreateVoucher';
import { useTourOptions } from '../hooks/useTourOptions';

export const CreateVoucher: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.roles?.includes('Admin') ?? false;
  const { handleSubmit, handleCancel, isSubmitting, serverErrors } = useCreateVoucher();
  const { options: tourOptions } = useTourOptions(isAdmin);

  const voucherFields: FormField[] = useMemo(
    () => [
      {
        name: 'code',
        label: t('voucher.voucherCode'),
        type: 'text',
        placeholder: t('voucher.voucherCodePlaceholder'),
        icon: <Type className="h-4 w-4" />,
        colSpan: 2,
        required: true,
      },
      {
        name: 'tourId',
        label: t('voucher.applicableTour'),
        type: 'searchable-select',
        icon: <Ticket className="h-4 w-4" />,
        colSpan: 2,
        options: tourOptions,
        required: !isAdmin,
      },
      {
        name: 'discountType',
        label: t('voucher.discountType'),
        type: 'select',
        icon: <Percent className="h-4 w-4" />,
        required: true,
        options: [
          { label: t('voucher.percentType'), value: 'Percent' },
          { label: t('voucher.amountType'), value: 'Amount' },
        ],
      },
      {
        name: 'discountValue',
        label: t('voucher.discountValue'),
        type: 'number',
        placeholder: t('voucher.discountValuePlaceholder'),
        icon: <Hash className="h-4 w-4" />,
        required: true,
      },
      {
        name: 'maxDiscountAmount',
        label: t('voucher.maxDiscountAmount'),
        type: 'number',
        placeholder: t('voucher.maxDiscountPlaceholder'),
        icon: <Hash className="h-4 w-4" />,
        visible: (formData) => formData.discountType === 'Percent',
        required: true,
      },
      {
        name: 'minOrderAmount',
        label: t('voucher.minOrderAmount'),
        type: 'number',
        placeholder: t('voucher.minOrderAmountPlaceholder'),
        icon: <Hash className="h-4 w-4" />,
        required: false,
      },
      {
        name: 'availableCount',
        label: t('voucher.availableCount'),
        type: 'number',
        placeholder: t('voucher.availableCountPlaceholder'),
        icon: <Hash className="h-4 w-4" />,
        required: true,
      },
      {
        name: 'startDate',
        label: t('voucher.startDate'),
        type: 'datetime-local',
        icon: <Calendar className="h-4 w-4" />,
        required: true,
      },
      {
        name: 'endDate',
        label: t('voucher.endDate'),
        type: 'datetime-local',
        icon: <Calendar className="h-4 w-4" />,
        required: true,
      },
      {
        name: 'description',
        label: t('common.description'),
        type: 'textarea',
        placeholder: t('voucher.descriptionPlaceholder'),
        icon: <Tag className="h-4 w-4" />,
        colSpan: 2,
      },
      {
        name: 'voucherTarget',
        label: t('voucher.targetAudience'),
        type: 'custom',
        colSpan: 2,
        render: (value: VoucherTargetValue | undefined, onChange) => (
          <VoucherTargetEditor
            value={value || createDefaultVoucherTarget()}
            onChange={onChange}
            error={serverErrors.voucherTarget}
          />
        ),
      },
    ],
    [t, tourOptions, isAdmin, serverErrors.voucherTarget],
  );

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">{t('voucher.createNewVoucher')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('voucher.createVoucherDesc')}</p>
      </div>

      <div className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-8">
        <DynamicForm
          fields={voucherFields}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitText={t('common.create')}
          cancelText={t('common.cancel')}
          isSubmitting={isSubmitting}
          serverErrors={serverErrors}
          gridCols={2}
          defaultValues={{
            discountType: 'Percent',
            availableCount: 1,
            voucherTarget: createDefaultVoucherTarget(),
          }}
        />
        <LoadingOverlay isOpen={isSubmitting} message={t('common.saving')} />
      </div>
    </div>
  );
};
