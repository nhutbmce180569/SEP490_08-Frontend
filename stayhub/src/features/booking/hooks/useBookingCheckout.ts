import { useCreateBooking } from './useCreateBooking';
import { useApplyVoucher } from '../../voucher/customer/hooks/useApplyVoucher';
import type { CreateOrderRequest } from '../types/booking';
import type { PaymentProvider } from '../services/payment.service';

export const useBookingCheckout = () => {
  const booking = useCreateBooking();
  const voucher = useApplyVoucher();

  const handleCreateBooking = async (
    data: CreateOrderRequest,
    paymentProvider: PaymentProvider = "vnpay",
  ) => {
    await booking.handleCreateBooking(
      {
        ...data,
        voucherCode: voucher.voucherCode?.trim() || undefined,
        finalAmount: voucher.appliedVoucher?.finalAmount ?? data.finalAmount,
      },
      paymentProvider,
    );
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
