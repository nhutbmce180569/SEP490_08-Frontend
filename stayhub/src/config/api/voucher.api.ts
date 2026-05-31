import { FULL_API } from './api';

export const VOUCHER_API = {
  GET_ALL: `${FULL_API}/vouchers`,
  GET_BY_ID: (id: string | number) => `${FULL_API}/vouchers/${id}`,
  CREATE: `${FULL_API}/vouchers`,
  UPDATE: (id: string | number) => `${FULL_API}/vouchers/${id}`,
  ACTIVATE: (id: string | number) => `${FULL_API}/vouchers/${id}/activate`,
  DEACTIVATE: (id: string | number) => `${FULL_API}/vouchers/${id}/deactivate`,
};
