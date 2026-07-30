import { FULL_API } from './api';

export const ADMIN_API = {
  // AI & AR
  GET_AI_RECOMMENDATIONS: `${FULL_API}/ai/recommendations`,
  CHAT_AI: `${FULL_API}/ai/chat`,
  GET_AR_MAP: `${FULL_API}/ar/map`,
  
  // Users & Operators
  GET_USERS: `${FULL_API}/admin/users`,
  UPDATE_USER_STATUS: (id: string | number) => `${FULL_API}/admin/users/${id}/status`,
  MANAGE_REPORT: (id: string | number) => `${FULL_API}/admin/reports/${id}`,
  MANAGE_OPERATOR: (id: string | number) => `${FULL_API}/admin/operators/${id}`,
  
  // Tours
  GET_TOURS: `${FULL_API}/admin/tours`,
  UPDATE_TOUR_STATUS: (id: string | number) => `${FULL_API}/admin/tours/${id}/status`,
  
  // Vouchers
  GET_VOUCHERS: `${FULL_API}/admin/vouchers`,
  CREATE_VOUCHER: `${FULL_API}/admin/vouchers`,
  MANAGE_VOUCHER: (id: string | number) => `${FULL_API}/admin/vouchers/${id}`,
  
  // Categories
  CREATE_CATEGORY: `${FULL_API}/admin/categories`,
  GET_CATEGORIES: `${FULL_API}/admin/categories`,
  MANAGE_CATEGORY: (id: string | number) => `${FULL_API}/admin/categories/${id}`,
  
  // Settings & Stats
  UPDATE_SETTINGS: `${FULL_API}/admin/settings`,
  GET_STATS: `${FULL_API}/admin/stats`,
  
  // Withdrawals
  MANAGE_WITHDRAWAL: (id: string | number) => `${FULL_API}/admin/withdrawals/${id}`,
  GET_WITHDRAWALS: `${FULL_API}/admin/withdrawals`,
  
  // Reports Export
  EXPORT_REPORTS: `${FULL_API}/admin/reports/export`,
  
  // Banners
  UPLOAD_BANNER: `${FULL_API}/admin/banners`,
  GET_BANNERS: `${FULL_API}/admin/banners`,
  MANAGE_BANNER: (id: string | number) => `${FULL_API}/admin/banners/${id}`,
};