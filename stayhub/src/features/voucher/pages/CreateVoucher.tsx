import React, { useMemo } from 'react';
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
import { CustomerAssignmentEditor, type CustomerAssignmentRow } from '../components/CustomerAssignmentEditor';
import { useCreateVoucher } from '../hooks/useCreateVoucher';
import { useTourOptions } from '../hooks/useTourOptions';
import { validateVoucherCode } from '../utils/voucherHelpers';

export const CreateVoucher: React.FC = () => {
  const { t } = useTranslation();
  const { handleSubmit, handleCancel, isSubmitting, serverErrors } = useCreateVoucher();
  const { options: tourOptions } = useTourOptions();

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
        validate: (value) => validateVoucherCode(String(value || '')),
      },
      {
        name: 'tourId',
        label: t('voucher.applicableTour'),
        type: 'select',
        icon: <Ticket className="h-4 w-4" />,
        colSpan: 2,
        options: tourOptions,
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
        name: 'availableCount',
        label: t('voucher.availableCount'),
        type: 'number',
        placeholder: t('voucher.availableCountPlaceholder'),
        icon: <Hash className="h-4 w-4" />,
        required: true,
        validate: (value) => {
          if (!value || Number(value) < 1) return t('voucher.availableCountMin');
          return undefined;
        },
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
        validate: (value, formData) => {
          if (!value || !formData.startDate) return undefined;
          if (new Date(value) <= new Date(formData.startDate)) {
            return t('voucher.endDateAfterStart');
          }
          return undefined;
        },
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
        name: 'customerAssignments',
        label: t('voucher.customerAssignments'),
        type: 'custom',
        colSpan: 2,
        render: (value, onChange, error) => (
          <CustomerAssignmentEditor
            value={(value as CustomerAssignmentRow[]) || []}
            onChange={onChange}
            error={error}
          />
        ),
      },
    ],
    [t, tourOptions],
  );

  return (
    <>
      {serverErrors._form && (
        <div className="mx-auto mb-4 max-w-4xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {serverErrors._form}
        </div>
      )}
      <DynamicForm
        title={t('voucher.createNewVoucher')}
        description={t('voucher.createVoucherDesc')}
        fields={voucherFields}
        initialValues={{
          discountType: 'Percent',
          availableCount: 1,
          customerAssignments: [],
        }}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
        submitText={t('voucher.createVoucher')}
      />
      <LoadingOverlay isOpen={isSubmitting} message={t('voucher.creatingVoucher')} />
    </>
  );
};
