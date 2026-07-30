import React from 'react';
import type { AnalyticsLabelCount } from '../../customer-analytics/types/customerAnalytics.types';
import type { HealthStatus, OverallHealthStatus } from '../types/platformAnalytics.types';
import { MoneyDisplay } from '../../currency/MoneyDisplay';

export const OVERALL_STATUS_LABELS: Record<OverallHealthStatus, string> = {
  Healthy: 'Healthy',
  Fair: 'Fair',
  NeedsAttention: 'Needs Attention',
  Critical: 'Critical',
};

export const OVERALL_STATUS_STYLES: Record<OverallHealthStatus, string> = {
  Healthy: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Fair: 'bg-amber-50 text-amber-700 ring-amber-200',
  NeedsAttention: 'bg-orange-50 text-orange-700 ring-orange-200',
  Critical: 'bg-rose-50 text-rose-700 ring-rose-200',
};

export const INDICATOR_STATUS_STYLES: Record<HealthStatus, string> = {
  Good: 'bg-emerald-500',
  Warning: 'bg-amber-500',
  Fair: 'bg-orange-500',
  Critical: 'bg-rose-500',
};

export const INDICATOR_STATUS_BADGE: Record<HealthStatus, string> = {
  Good: 'bg-emerald-50 text-emerald-700',
  Warning: 'bg-amber-50 text-amber-700',
  Fair: 'bg-orange-50 text-orange-700',
  Critical: 'bg-rose-50 text-rose-700',
};

export const formatIndicatorValue = (value: number, unit: string): React.ReactNode => {
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit === 'VND') return React.createElement(MoneyDisplay, { amountVnd: value, compact: true });
  return value.toLocaleString('vi-VN');
};

export const ROLE_LABELS: Record<string, string> = {
  Customer: 'Customer',
  Manager: 'Manager / Operator',
  Staff: 'Staff',
  Admin: 'Admin',
  CUSTOMER: 'Customer',
  MANAGER: 'Manager / Operator',
  STAFF: 'Staff',
  ADMIN: 'Admin',
};

export const getRoleLabel = (role: string) => ROLE_LABELS[role] ?? role;

const CATEGORY_ID_LABEL = /^Category\s+(\d+)$/i;

export const resolveCategoryLabels = (
  items: AnalyticsLabelCount[],
  categoryNames: Record<number, string>,
): AnalyticsLabelCount[] =>
  items.map((item) => {
    const match = item.label.match(CATEGORY_ID_LABEL);
    if (!match) return item;

    const name = categoryNames[Number(match[1])];
    return name ? { ...item, label: name } : item;
  });
