import { FULL_API } from './api';

export const BOOKINGS_API = {
  // Bookings
  CREATE_BOOKING: `${FULL_API}/bookings`,
  CREATE_ORDER: `${FULL_API}/orders`,
  GET_ORDERS_BY_SCHEDULE: (id: string | number) => `${FULL_API}/orders/schedule/${id}`,
  GET_CUSTOMER_ORDERS: `${FULL_API}/customer/orders`,
  GET_CUSTOMER_ORDERS_BY_USER: (userId: string | number) => `${FULL_API}/orders/user/${userId}`,
  GET_ORDER_BY_ID: (id: string | number) => `${FULL_API}/orders/my/${id}`,
  CANCEL_ORDER: (id: string | number) => `${FULL_API}/orders/${id}/cancel`,
  GET_OPERATOR_ORDERS: `${FULL_API}/operator/orders`,
  
  // Check-in
  CHECK_IN: (sId: string | number) => `${FULL_API}/schedules/${sId}/check-in`,
  
  // Vouchers (Customer)
  SAVE_VOUCHER: `${FULL_API}/customer/vouchers`,
  GET_CUSTOMER_VOUCHERS: `${FULL_API}/customer/vouchers`,
  APPLY_VOUCHER: `${FULL_API}/customer/vouchers/apply`,
  REDEEM_VOUCHER: `${FULL_API}/customer/vouchers/redeem`,
  GET_OPERATOR_VOUCHERS: `${FULL_API}/operator/vouchers`,
  CREATE_OPERATOR_VOUCHER: `${FULL_API}/operator/vouchers`,
  OPERATOR_VOUCHER_TOUR_OPTIONS: `${FULL_API}/operator/vouchers/tour-options`,
  MANAGE_OPERATOR_VOUCHER: (id: string | number) => `${FULL_API}/operator/vouchers/${id}`,
  
  // Reviews
  CREATE_REVIEW: `${FULL_API}/reviews`,
  MANAGE_REVIEW: (id: string | number) => `${FULL_API}/reviews/${id}`,
  GET_OPERATOR_REVIEWS: `${FULL_API}/operator/reviews`,
  REPLY_REVIEW: (id: string | number) => `${FULL_API}/operator/reviews/${id}/reply`,
  UPDATE_REVIEW_VISIBILITY: (id: string | number) => `${FULL_API}/operator/reviews/${id}/visibility`,
};
