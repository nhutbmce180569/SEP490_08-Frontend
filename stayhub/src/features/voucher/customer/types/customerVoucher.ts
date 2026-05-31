export interface ReadSavedVoucherDTO {
  userVoucherId: number;
  voucherId: number;
  code: string;
  tourId?: number;
  tourName?: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  description?: string;
  quantity: number;
  status: string;
  voucherStatus: string;
  isActive: boolean;
}

export interface SaveVoucherDTO {
  code: string;
}

export interface ApplyVoucherDTO {
  voucherCode?: string;
  /** Backwards-compatible code field — some endpoints may still expect `code` */
  code?: string;
  tourId?: number;
  billAmount: number;
}

export interface ApplyVoucherResultDTO {
  isValid: boolean;
  voucherId: number;
  code: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number;
  billAmount: number;
  discountAmount: number;
  finalAmount: number;
  message?: string;
}

export type WalletTab = 'all' | 'available' | 'used' | 'expired';
