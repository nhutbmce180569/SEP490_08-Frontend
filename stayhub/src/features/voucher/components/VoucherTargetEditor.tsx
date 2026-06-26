import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../../../contexts/LocaleContext';
import { analyticsKeys } from '../../customer-analytics/hooks/useCustomerAnalytics';
import { customerAnalyticsService } from '../../customer-analytics/services/customerAnalytics.service';
import { formatVnd } from '../utils/voucherHelpers';
import { getRevenuePeriodRange } from '../utils/voucherTargetHelpers';
import type { RevenuePeriod, TopCustomerVoucherAssignmentDTO, VoucherTargetType } from '../types/voucher';
import { CustomerAssignmentEditor, type CustomerAssignmentRow } from './CustomerAssignmentEditor';

export interface VoucherTargetValue {
  type: VoucherTargetType;
  customerAssignments: CustomerAssignmentRow[];
  topCustomerAssignment: TopCustomerVoucherAssignmentDTO;
}

interface VoucherTargetEditorProps {
  value: VoucherTargetValue;
  onChange: (value: VoucherTargetValue) => void;
  error?: string;
  readOnly?: boolean;
}

const DEFAULT_TOP_ASSIGNMENT: TopCustomerVoucherAssignmentDTO = {
  top: 10,
  revenuePeriod: 'Month',
  quantity: 1,
};

export const VoucherTargetEditor: React.FC<VoucherTargetEditorProps> = ({
  value,
  onChange,
  error,
  readOnly = false,
}) => {
  const { t } = useTranslation();

  const topDateParams = useMemo(
    () => getRevenuePeriodRange(value.topCustomerAssignment),
    [value.topCustomerAssignment],
  );

  const previewEnabled = value.type === 'topRevenue' && value.topCustomerAssignment.top > 0;
  const previewParams = {
    top: value.topCustomerAssignment.top,
    ...topDateParams,
  };
  const { data: previewCustomers = [], isLoading: isPreviewLoading } = useQuery({
    queryKey: analyticsKeys.topCustomers(previewParams),
    queryFn: () => customerAnalyticsService.getTopCustomers(previewParams),
    enabled: previewEnabled,
  });

  const handleTypeChange = (type: VoucherTargetType) => {
    onChange({
      ...value,
      type,
      customerAssignments: type === 'specific' ? value.customerAssignments : [],
      topCustomerAssignment:
        type === 'topRevenue'
          ? value.topCustomerAssignment ?? DEFAULT_TOP_ASSIGNMENT
          : DEFAULT_TOP_ASSIGNMENT,
    });
  };

  const handleTopFieldChange = (
    field: keyof TopCustomerVoucherAssignmentDTO,
    fieldValue: number | RevenuePeriod,
  ) => {
    onChange({
      ...value,
      topCustomerAssignment: {
        ...value.topCustomerAssignment,
        [field]: fieldValue,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-slate-800">{t('voucher.targetAudience')}</h4>
        <p className="text-xs text-slate-500">{t('voucher.targetAudienceDesc')}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {([
          { type: 'public' as const, label: t('voucher.targetPublic'), desc: t('voucher.targetPublicDesc') },
          { type: 'specific' as const, label: t('voucher.targetSpecific'), desc: t('voucher.targetSpecificDesc') },
          { type: 'topRevenue' as const, label: t('voucher.targetTopRevenue'), desc: t('voucher.targetTopRevenueDesc') },
        ]).map((option) => (
          <button
            key={option.type}
            type="button"
            disabled={readOnly}
            onClick={() => handleTypeChange(option.type)}
            className={`rounded-xl border p-3 text-left transition ${
              value.type === option.type
                ? 'border-brand bg-brand/5 ring-2 ring-brand/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            } ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
          >
            <p className="text-sm font-semibold text-slate-800">{option.label}</p>
            <p className="mt-1 text-xs text-slate-500">{option.desc}</p>
          </button>
        ))}
      </div>

      {value.type === 'public' && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
          {t('voucher.publicVoucherAvailable')}
        </div>
      )}

      {value.type === 'specific' && (
        <CustomerAssignmentEditor
          value={value.customerAssignments}
          onChange={(customerAssignments) => onChange({ ...value, customerAssignments })}
          error={error}
          readOnly={readOnly}
        />
      )}

      {value.type === 'topRevenue' && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {t('voucher.topCustomerCount')}
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={value.topCustomerAssignment.top}
                disabled={readOnly}
                onChange={(event) => handleTopFieldChange('top', Number(event.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {t('voucher.revenuePeriod')}
              </label>
              <select
                value={value.topCustomerAssignment.revenuePeriod}
                disabled={readOnly}
                onChange={(event) =>
                  handleTopFieldChange('revenuePeriod', event.target.value as RevenuePeriod)
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
              >
                <option value="Month">{t('voucher.revenuePeriodMonth')}</option>
                <option value="Year">{t('voucher.revenuePeriodYear')}</option>
                <option value="AllTime">{t('voucher.revenuePeriodAllTime')}</option>
                <option value="Custom">{t('voucher.revenuePeriodCustom', 'Custom Range')}</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {t('voucher.quantityPerCustomer')}
              </label>
              <input
                type="number"
                min={1}
                value={value.topCustomerAssignment.quantity}
                disabled={readOnly}
                onChange={(event) => handleTopFieldChange('quantity', Number(event.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
            </div>
          </div>

          {value.topCustomerAssignment.revenuePeriod === 'Custom' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {t('voucher.fromDate', 'From Date')}
                </label>
                <input
                  type="date"
                  value={value.topCustomerAssignment.fromDate ? value.topCustomerAssignment.fromDate.split('T')[0] : ''}
                  disabled={readOnly}
                  onChange={(event) => handleTopFieldChange('fromDate', event.target.value ? new Date(event.target.value).toISOString() : '')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {t('voucher.toDate', 'To Date')}
                </label>
                <input
                  type="date"
                  value={value.topCustomerAssignment.toDate ? value.topCustomerAssignment.toDate.split('T')[0] : ''}
                  disabled={readOnly}
                  onChange={(event) => handleTopFieldChange('toDate', event.target.value ? new Date(event.target.value).toISOString() : '')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
                />
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-600">{t('voucher.topCustomersPreview')}</p>
              {isPreviewLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            </div>

            {previewCustomers.length === 0 && !isPreviewLoading ? (
              <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">
                {t('voucher.noTopCustomersPreview')}
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">{t('voucher.customerIdLabel')}</th>
                      <th className="px-3 py-2">{t('voucher.customer')}</th>
                      <th className="px-3 py-2">{t('voucher.totalSpend')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewCustomers.map((customer) => (
                      <tr key={customer.customerId} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-700">{customer.customerId}</td>
                        <td className="px-3 py-2 text-slate-600">
                          <span className="font-medium text-slate-800">{customer.fullName}</span>
                          <span className="block text-xs text-slate-500">{customer.email}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-700">{formatVnd(customer.totalSpend)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {error && value.type !== 'specific' && (
        <p className="text-sm text-rose-600">{error}</p>
      )}
    </div>
  );
};

export const createDefaultVoucherTarget = (): VoucherTargetValue => ({
  type: 'public',
  customerAssignments: [],
  topCustomerAssignment: DEFAULT_TOP_ASSIGNMENT,
});
