export const formatVnd = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(amount) + ' VND';

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

export const formatDateOnly = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
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
  Active: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  Inactive: 'bg-slate-100 text-slate-600 border border-slate-200',
  Expired: 'bg-amber-50 text-amber-600 border border-amber-200',
  Available: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  Used: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
  Redeemed: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
  Cancelled: 'bg-rose-50 text-rose-600 border border-rose-200',
  Scheduled: 'bg-sky-50 text-sky-600 border border-sky-200',
  Depleted: 'bg-rose-50 text-rose-600 border border-rose-200',
};

export const getSafeUsage = (used?: number, available?: number, remaining?: number) => {
  const safeUsed = Math.max(0, used ?? 0);
  const rawAvailable = Math.max(0, available ?? 0);

  let totalAvailable = rawAvailable;
  let safeRemaining = remaining != null && remaining >= 0 ? remaining : (rawAvailable - safeUsed);

  // Handle legacy DB seed data where AvailableCount was stored as remaining count instead of total count
  if (rawAvailable < safeUsed || safeRemaining < 0) {
    totalAvailable = safeUsed + rawAvailable;
    safeRemaining = rawAvailable;
  }

  return {
    usedCount: safeUsed,
    availableCount: totalAvailable,
    remainingCount: safeRemaining,
  };
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
  } else if (value < 10000) {
    return 'Discount amount must be at least 10,000 VND.';
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
