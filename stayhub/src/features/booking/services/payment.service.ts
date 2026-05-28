import { apiClient } from "../../../utils/axiosClient";
import { PAYMENTS_API } from "../../../config/api/payments.api";

export interface CreatePaymentRequest {
  orderId: number;
  amount: number;
}

export const createPayment = async (data: CreatePaymentRequest): Promise<string> => {
  const response: { paymentUrl?: string; PaymentUrl?: string } = await apiClient.post(
    PAYMENTS_API.CREATE_PAYMENT,
    {
      orderId: data.orderId,
      amount: data.amount,
    },
  );

  const url = response.paymentUrl ?? response.PaymentUrl;
  if (!url) {
    throw new Error("Payment URL was not returned from server.");
  }
  return url;
};

export const confirmPayment = async (orderId: string | number): Promise<void> => {
  await apiClient.post(PAYMENTS_API.CONFIRM_PAYMENT(orderId));
};

export const cancelPayment = async (orderId: string | number): Promise<void> => {
  await apiClient.post(PAYMENTS_API.CANCEL_PAYMENT(orderId));
};
