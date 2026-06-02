import { apiClient } from "../../../utils/axiosClient";
import { PAYMENTS_API } from "../../../config/api/payments.api";

export type PaymentProvider = "vnpay" | "momo";

export interface CreatePaymentRequest {
  orderId: number;
  amount: number;
}

const PAYMENT_PROVIDER_STORAGE_PREFIX = "stayhub:payment-provider:";
const LATEST_PAYMENT_PROVIDER_STORAGE_KEY = `${PAYMENT_PROVIDER_STORAGE_PREFIX}latest`;

const getPaymentEndpoints = (provider: PaymentProvider) => {
  return provider === "momo" ? PAYMENTS_API.MOMO : PAYMENTS_API.VNPAY;
};

export const rememberPaymentProvider = (
  orderId: string | number,
  provider: PaymentProvider,
) => {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    `${PAYMENT_PROVIDER_STORAGE_PREFIX}${orderId}`,
    provider,
  );
  window.sessionStorage.setItem(LATEST_PAYMENT_PROVIDER_STORAGE_KEY, provider);
};

export const getRememberedPaymentProvider = (
  orderId?: string | number | null,
): PaymentProvider | null => {
  if (typeof window === "undefined") return null;

  const storedProvider = orderId
    ? window.sessionStorage.getItem(`${PAYMENT_PROVIDER_STORAGE_PREFIX}${orderId}`)
    : window.sessionStorage.getItem(LATEST_PAYMENT_PROVIDER_STORAGE_KEY);

  return storedProvider === "momo" || storedProvider === "vnpay"
    ? storedProvider
    : null;
};

export const createPayment = async (
  data: CreatePaymentRequest,
  provider: PaymentProvider = "vnpay",
): Promise<string> => {
  const endpoints = getPaymentEndpoints(provider);
  const response: { paymentUrl?: string; PaymentUrl?: string } = await apiClient.post(
    endpoints.CREATE_PAYMENT,
    {
      orderId: data.orderId,
      amount: data.amount,
      provider: provider === "momo" ? "MoMo" : "VNPay",
    },
  );

  const url = response.paymentUrl ?? response.PaymentUrl;
  if (!url) {
    throw new Error("Payment URL was not returned from server.");
  }
  return url;
};

export const confirmPayment = async (
  orderId: string | number,
  provider: PaymentProvider = "vnpay",
): Promise<void> => {
  await apiClient.post(getPaymentEndpoints(provider).CONFIRM_PAYMENT(orderId));
};

export const cancelPayment = async (
  orderId: string | number,
  provider: PaymentProvider = "vnpay",
): Promise<void> => {
  await apiClient.post(getPaymentEndpoints(provider).CANCEL_PAYMENT(orderId));
};
