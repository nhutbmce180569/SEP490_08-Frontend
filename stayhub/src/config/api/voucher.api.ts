import { FULL_API } from './api';

export const VOUCHER_API = {
  // Manager
  GET_ALL: `${FULL_API}/vouchers`,
  GET_BY_ID: (id: string | number) => `${FULL_API}/vouchers/${id}`,
  CREATE: `${FULL_API}/vouchers`,
  UPDATE: (id: string | number) => `${FULL_API}/vouchers/${id}`,
  ACTIVATE: (id: string | number) => `${FULL_API}/vouchers/${id}/activate`,
  DEACTIVATE: (id: string | number) => `${FULL_API}/vouchers/${id}/deactivate`,
  DISTRIBUTE_BIRTHDAY: `${FULL_API}/vouchers/birthday-distribute`,
  DISTRIBUTE_BIRTHDAY_STATUS: `${FULL_API}/vouchers/birthday-distribute/status`,
  DISTRIBUTE_BIRTHDAY_PREVIEW: `${FULL_API}/vouchers/birthday-distribute/preview`,

  // Customer
  SAVE_VOUCHER: `${FULL_API}/customer/vouchers`,
  GET_MY_VOUCHERS: `${FULL_API}/customer/vouchers`,
  APPLY_VOUCHER: `${FULL_API}/customer/vouchers/apply`,
  REDEEM_VOUCHER: `${FULL_API}/customer/vouchers/redeem`,
};
