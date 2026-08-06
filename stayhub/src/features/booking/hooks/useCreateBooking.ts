import { useState, useRef } from "react";
import { createOrder } from "../services/booking.service";
import {
  cancelPayment,
  createPayment,
  type PaymentProvider,
} from "../services/payment.service";
// import { customerVoucherService } from "../../customer-voucher/services/customerVoucher.service";
import { useToast } from "../../../contexts/ToastContext";
import type { CreateOrderRequest } from "../types/booking";

type ApiError = {
  response?: {
    status?: number;
    data?: {
      errors?: unknown;
      message?: string;
    };
  };
  message?: string;
};

export const useCreateBooking = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [isApplyingVoucher] = useState(false);
  const [appliedVoucher] = useState<{ code: string; discountAmount: number; finalAmount: number } | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  const { error: showError } = useToast();

  const handleCreateBooking = async (
    data: CreateOrderRequest,
    paymentProvider: PaymentProvider = "vnpay",
  ) => {
    const hasFutureDOB = data.orderDetails?.some((detail) =>
      detail.tickets.some(
        (ticket) =>
          ticket.dateOfBirth &&
          new Date(ticket.dateOfBirth).getTime() > Date.now(),
      ),
    );
    if (hasFutureDOB) {
      showError("One or more passengers have a Date of Birth in the future.");
      return;
    }

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }

    let createdOrderId: number | null = null;
    try {
      setIsSubmitting(true);
      
      let order: any = null;
      let attempt = 0;
      const maxAttempts = 3;

      while (attempt < maxAttempts) {
        attempt++;
        try {
          order = await createOrder(data, idempotencyKeyRef.current);
          break;
        } catch (error: unknown) {
          const apiError = error as ApiError;
          if (apiError.response?.status === 409) {
            if (attempt >= maxAttempts) {
              showError("Your booking is still processing. Please try again in a moment.");
              return; // finally block will reset isSubmitting
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }
          throw error;
        }
      }

      if (!order) return;

      createdOrderId = order.id;
      const paymentUrl = await createPayment(
        {
          orderId: order.id,
          amount: Math.round(Number(order.finalAmount)),
        },
        paymentProvider,
      );
      window.location.href = paymentUrl;
    } catch (error: unknown) {
      if (createdOrderId !== null) {
        try {
          await cancelPayment(createdOrderId, paymentProvider);
        } catch {
          // The provider callback or unpaid-order job may already have cancelled it.
        }
      }
      
      const apiError = error as ApiError;
      const isDefinitiveFailure = 
        apiError.response?.status === 400 || 
        apiError.response?.status === 422;

      if (isDefinitiveFailure) {
        idempotencyKeyRef.current = null;
      }

      if (apiError.response?.status === 400 && apiError.response.data?.errors) {
        // Ném lỗi chứa thông tin validation để component cha có thể xử lý
        const validationError = new Error("Validation failed");
        (validationError as any).validationErrors = apiError.response.data.errors;
        throw validationError;
      } else {
        showError(
          apiError.response?.data?.message ||
            apiError.message ||
            "Failed to create order.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleApplyVoucher = async (tourId: number, originalAmount: number) => {
  //   const code = voucherCode.trim();
  //   if (!code) {
  //     showError("Please enter a voucher code.");
  //     return;
  //   }

  //   try {
  //     setIsApplyingVoucher(true);
  //     let wallet = await customerVoucherService.getWallet();
  //     let walletVoucher = wallet.find((v) => v.code.toUpperCase() === code.toUpperCase());
      
  //     if (!walletVoucher) {
  //       await customerVoucherService.saveVoucher({ voucherCode: code });
  //       wallet = await customerVoucherService.getWallet();
  //       walletVoucher = wallet.find((v) => v.code.toUpperCase() === code.toUpperCase());
  //     }
      
  //     if (!walletVoucher) {
  //       throw new Error("Voucher was not found in wallet after saving.");
  //     }
      
  //     const applyRes = await customerVoucherService.applyVoucher({
  //       voucherId: walletVoucher.voucherId,
  //       tourId,
  //       originalAmount,
  //     });
      
  //     setAppliedVoucher({
  //       code: applyRes.voucherCode,
  //       discountAmount: applyRes.discountAmount,
  //       finalAmount: applyRes.finalAmount,
  //     });
      
  //     success(`Voucher ${applyRes.voucherCode} applied successfully.`);
  //   } catch (err: unknown) {
  //     const e = err as any;
  //     // Tương tự, nếu Axios Interceptor đã show toast thì mình bỏ qua
  //     if (!e.response) {
  //       showError(e.message || "Failed to apply voucher.");
  //     }
  //   } finally {
  //     setIsApplyingVoucher(false);
  //   }
  // };

  return { 
    handleCreateBooking, 
    isSubmitting,
    voucherCode,
    setVoucherCode,
    isApplyingVoucher,
    appliedVoucher,
    // handleApplyVoucher
  };
};
