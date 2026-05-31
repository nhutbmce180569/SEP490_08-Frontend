import React from 'react';
import {
  Calendar,
  Hash,
  Percent,
  Tag,
  Ticket,
} from 'lucide-react';
import { DynamicForm, type FormField } from '../../../components/dashboard/DynamicForm';
import { LoadingOverlay } from '../../../components/dashboard/LoadingOverlay';
import { CustomerAssignmentEditor, type CustomerAssignmentRow } from '../components/CustomerAssignmentEditor';
import { useUpdateVoucher } from '../hooks/useUpdateVoucher';
import { useTourOptions } from '../hooks/useTourOptions';
import { toDateTimeLocal } from '../utils/voucherHelpers';

export const UpdateVoucher: React.FC = () => {
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
  const { options: tourOptions } = useTourOptions();

  if (isFetching) {
    return <div className="flex justify-center p-10 text-slate-500">Loading voucher details...</div>;
  }

  if (fetchError) {
    return <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>;
  }

  if (!voucher) {
    return <div className="flex justify-center p-10 text-slate-500">Voucher not found.</div>;
  }

  if (!voucher.isActive) {
    return (
      <div className="mx-auto max-w-2xl py-8 text-center">
        <p className="text-sm text-slate-600">This voucher is deactivated and cannot be edited.</p>
        <button
          type="button"
          onClick={handleCancel}
          className="mt-4 text-sm font-semibold text-[#0068E0] hover:underline"
        >
          Back to vouchers
        </button>
      </div>
    );
  }

  const isUsed = voucher.usedCount > 0;

  const voucherFields: FormField[] = [
    {
      name: 'code',
      label: 'Voucher Code',
      type: 'text',
      readOnly: true,
      colSpan: 2,
    },
    {
      name: 'tourId',
      label: 'Applicable Tour',
      type: 'select',
      icon: <Ticket className="h-4 w-4" />,
      colSpan: 2,
      readOnly: isUsed,
      options: tourOptions,
    },
    {
      name: 'discountType',
      label: 'Discount Type',
      type: 'select',
      icon: <Percent className="h-4 w-4" />,
      readOnly: isUsed,
      options: [
        { label: 'Percent (%)', value: 'Percent' },
        { label: 'Fixed Amount (VND)', value: 'Amount' },
      ],
    },
    {
      name: 'discountValue',
      label: 'Discount Value',
      type: 'number',
      icon: <Hash className="h-4 w-4" />,
      readOnly: isUsed,
    },
    {
      name: 'maxDiscountAmount',
      label: 'Max Discount Amount (VND)',
      type: 'number',
      icon: <Hash className="h-4 w-4" />,
      readOnly: isUsed,
      visible: (formData) => (formData.discountType || voucher.discountType) === 'Percent',
    },
    {
      name: 'availableCount',
      label: 'Available Count',
      type: 'number',
      icon: <Hash className="h-4 w-4" />,
      validate: (value) => {
        if (!value || Number(value) < voucher.usedCount) {
          return `Available count cannot be less than used count (${voucher.usedCount}).`;
        }
        return undefined;
      },
    },
    {
      name: 'startDate',
      label: 'Start Date',
      type: 'datetime-local',
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      name: 'endDate',
      label: 'End Date',
      type: 'datetime-local',
      icon: <Calendar className="h-4 w-4" />,
      validate: (value, formData) => {
        const start = formData.startDate || toDateTimeLocal(voucher.startDate);
        if (!value || !start) return undefined;
        if (new Date(value) <= new Date(start)) {
          return 'End date must be later than start date.';
        }
        return undefined;
      },
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      icon: <Tag className="h-4 w-4" />,
      colSpan: 2,
    },
    {
      name: 'customerAssignments',
      label: 'Add Customer Assignments',
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
  ];

  return (
    <>
      {isUsed && (
        <div className="mx-auto mb-4 max-w-4xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This voucher has been used {voucher.usedCount} time(s). Discount type, value, max amount, and tour cannot be changed.
        </div>
      )}
      {serverErrors._form && (
        <div className="mx-auto mb-4 max-w-4xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {serverErrors._form}
        </div>
      )}
      <DynamicForm
        title="Update Voucher"
        description={`Edit voucher #${id} (${voucher.code})`}
        fields={voucherFields}
        initialValues={{
          code: voucher.code,
          tourId: voucher.tourId ? String(voucher.tourId) : '',
          discountType: voucher.discountType,
          discountValue: voucher.discountValue,
          maxDiscountAmount: voucher.maxDiscountAmount ?? '',
          availableCount: voucher.availableCount,
          startDate: toDateTimeLocal(voucher.startDate),
          endDate: toDateTimeLocal(voucher.endDate),
          description: voucher.description || '',
          customerAssignments: [],
        }}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
        submitText="Save Changes"
      />
      <LoadingOverlay isOpen={isSubmitting} message="Updating voucher..." />
    </>
  );
};
