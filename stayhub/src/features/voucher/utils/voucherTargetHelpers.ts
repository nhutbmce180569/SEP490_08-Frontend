import type { DateRangeParams } from '../../customer-analytics/types/customerAnalytics.types';
import type { VoucherTargetValue } from '../components/VoucherTargetEditor';
import type { TopCustomerVoucherAssignmentDTO } from '../types/voucher';

export const getRevenuePeriodRange = (assignment: TopCustomerVoucherAssignmentDTO): DateRangeParams => {
  const now = new Date();
  const period = assignment.revenuePeriod;

  if (period === 'Custom') {
    return { from: assignment.fromDate, to: assignment.toDate };
  }

  if (period === 'AllTime') {
    return {};
  }

  if (period === 'Month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: from.toISOString(), to: now.toISOString() };
  }

  const from = new Date(now.getFullYear(), 0, 1);
  return { from: from.toISOString(), to: now.toISOString() };
};

export const getAssignedQuantity = (target: VoucherTargetValue): number => {
  if (target.type === 'specific') {
    return target.customerAssignments.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }

  if (target.type === 'topRevenue') {
    return target.topCustomerAssignment.top * target.topCustomerAssignment.quantity;
  }

  return 0;
};
