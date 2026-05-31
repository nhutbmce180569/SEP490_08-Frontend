export const formatVnd = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export const formatDiscount = (discountType: string, discountValue: number) => {
  if (discountType.toLowerCase() === 'percent') {
    return `${discountValue}%`;
  }
  return formatVnd(discountValue);
};

export const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const toDateTimeLocal = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const toIsoDateTime = (localValue: string) => {
  if (!localValue) return '';
  return new Date(localValue).toISOString();
};

export const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-600',
  Inactive: 'bg-slate-100 text-slate-600',
  Scheduled: 'bg-blue-50 text-blue-600',
  Expired: 'bg-amber-50 text-amber-600',
  Depleted: 'bg-rose-50 text-rose-600',
};

export const CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

export const validateVoucherCode = (code: string) => {
  const trimmed = code.trim();
  if (trimmed.length < 3 || trimmed.length > 50) {
    return 'Code must be between 3 and 50 characters.';
  }
  if (!CODE_PATTERN.test(trimmed)) {
    return 'Code must contain only letters, numbers, hyphens, and underscores.';
  }
  return undefined;
};

export const validateDiscountValue = (discountType: string, value: number) => {
  if (discountType === 'Percent') {
    if (value < 1 || value > 100) return 'Percent discount must be between 1 and 100.';
  } else if (value <= 0) {
    return 'Amount discount must be greater than 0.';
  }
  return undefined;
};

export const validateMaxDiscountAmount = (discountType: string, maxDiscountAmount?: number | null) => {
  if (discountType === 'Percent') {
    if (!maxDiscountAmount || maxDiscountAmount <= 0) {
      return 'Max discount amount is required for percent vouchers.';
    }
  } else if (maxDiscountAmount != null && maxDiscountAmount > 0) {
    return 'Max discount amount only applies to percent vouchers.';
  }
  return undefined;
};

export const validateDateRange = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return undefined;
  if (new Date(endDate) <= new Date(startDate)) {
    return 'End date must be later than start date.';
  }
  return undefined;
};
