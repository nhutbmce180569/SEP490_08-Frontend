import { useCreateBooking } from './useCreateBooking';
import { useApplyVoucher } from '../../voucher/customer/hooks/useApplyVoucher';
import type { CreateOrderRequest } from '../types/booking';

export const useBookingCheckout = () => {
  const booking = useCreateBooking();
  const voucher = useApplyVoucher();

  const handleCreateBooking = async (data: CreateOrderRequest) => {
    await booking.handleCreateBooking({
      ...data,
      voucherCode: voucher.voucherCode?.trim() || undefined,
      finalAmount: voucher.appliedVoucher?.finalAmount ?? data.finalAmount,
    });
  };

  return {
    handleCreateBooking,
    isSubmitting: booking.isSubmitting,
    voucherCode: voucher.voucherCode,
    setVoucherCode: voucher.setVoucherCode,
    isApplyingVoucher: voucher.isApplying,
    appliedVoucher: voucher.appliedVoucher,
    handleApplyVoucher: (tourId: number, billAmount: number) => voucher.applyVoucher(tourId, billAmount),
    handleApplySavedVoucher: (code: string, tourId: number, billAmount: number) =>
      voucher.applySavedVoucher(code, tourId, billAmount),
    clearAppliedVoucher: voucher.clearAppliedVoucher,
  };
};
