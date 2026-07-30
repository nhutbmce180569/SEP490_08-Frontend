import { FULL_API } from './api';

export const PAYMENTS_API = {
  CREATE_PAYMENT: `${FULL_API}/vnpay/create-payment`,
  CONFIRM_PAYMENT: (orderId: string | number) => `${FULL_API}/vnpay/confirm/${orderId}`,
  CANCEL_PAYMENT: (orderId: string | number) => `${FULL_API}/vnpay/cancel/${orderId}`,
  VNPAY: {
    CREATE_PAYMENT: `${FULL_API}/vnpay/create-payment`,
    CONFIRM_PAYMENT: (orderId: string | number) => `${FULL_API}/vnpay/confirm/${orderId}`,
    CANCEL_PAYMENT: (orderId: string | number) => `${FULL_API}/vnpay/cancel/${orderId}`,
  },
  MOMO: {
    CREATE_PAYMENT: `${FULL_API}/momo/create-payment`,
    CONFIRM_PAYMENT: (orderId: string | number) => `${FULL_API}/momo/confirm/${orderId}`,
    CANCEL_PAYMENT: (orderId: string | number) => `${FULL_API}/momo/cancel/${orderId}`,
  },
};
