import React from 'react';
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
import { CustomerAssignmentEditor, type CustomerAssignmentRow } from '../components/CustomerAssignmentEditor';
import { useCreateVoucher } from '../hooks/useCreateVoucher';
import { useTourOptions } from '../hooks/useTourOptions';
import { validateVoucherCode } from '../utils/voucherHelpers';

export const CreateVoucher: React.FC = () => {
  const { handleSubmit, handleCancel, isSubmitting, serverErrors } = useCreateVoucher();
  const { options: tourOptions } = useTourOptions();

  const voucherFields: FormField[] = [
    {
      name: 'code',
      label: 'Voucher Code',
      type: 'text',
      placeholder: 'e.g. SUMMER2026',
      icon: <Type className="h-4 w-4" />,
      colSpan: 2,
      required: true,
      validate: (value) => validateVoucherCode(String(value || '')),
    },
    {
      name: 'tourId',
      label: 'Applicable Tour',
      type: 'select',
      icon: <Ticket className="h-4 w-4" />,
      colSpan: 2,
      options: tourOptions,
    },
    {
      name: 'discountType',
      label: 'Discount Type',
      type: 'select',
      icon: <Percent className="h-4 w-4" />,
      required: true,
      options: [
        { label: 'Percent (%)', value: 'Percent' },
        { label: 'Fixed Amount (VND)', value: 'Amount' },
      ],
    },
    {
      name: 'discountValue',
      label: 'Discount Value',
      type: 'number',
      placeholder: 'e.g. 10 for 10% or 50000 for amount',
      icon: <Hash className="h-4 w-4" />,
      required: true,
    },
    {
      name: 'maxDiscountAmount',
      label: 'Max Discount Amount (VND)',
      type: 'number',
      placeholder: 'Required for percent vouchers',
      icon: <Hash className="h-4 w-4" />,
      visible: (formData) => formData.discountType === 'Percent',
      required: true,
    },
    {
      name: 'availableCount',
      label: 'Available Count',
      type: 'number',
      placeholder: 'Total number of uses',
      icon: <Hash className="h-4 w-4" />,
      required: true,
      validate: (value) => {
        if (!value || Number(value) < 1) return 'Available count must be at least 1.';
        return undefined;
      },
    },
    {
      name: 'startDate',
      label: 'Start Date',
      type: 'datetime-local',
      icon: <Calendar className="h-4 w-4" />,
      required: true,
    },
    {
      name: 'endDate',
      label: 'End Date',
      type: 'datetime-local',
      icon: <Calendar className="h-4 w-4" />,
      required: true,
      validate: (value, formData) => {
        if (!value || !formData.startDate) return undefined;
        if (new Date(value) <= new Date(formData.startDate)) {
          return 'End date must be later than start date.';
        }
        return undefined;
      },
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Optional description for this voucher',
      icon: <Tag className="h-4 w-4" />,
      colSpan: 2,
    },
    {
      name: 'customerAssignments',
      label: 'Customer Assignments',
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
      {serverErrors._form && (
        <div className="mx-auto mb-4 max-w-4xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {serverErrors._form}
        </div>
      )}
      <DynamicForm
        title="Create New Voucher"
        description="Set up a discount voucher for your tours. Code will be saved in uppercase."
        fields={voucherFields}
        initialValues={{
          discountType: 'Percent',
          availableCount: 1,
          customerAssignments: [],
        }}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
        submitText="Create Voucher"
      />
      <LoadingOverlay isOpen={isSubmitting} message="Creating voucher..." />
    </>
  );
};
