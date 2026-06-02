import { FULL_API } from './api';

const BASE = `${FULL_API}/platform-analytics`;

export const PLATFORM_ANALYTICS_API = {
  OVERVIEW: `${BASE}/overview`,
  USERS: `${BASE}/users`,
  CATALOG: `${BASE}/catalog`,
  VOUCHERS: `${BASE}/vouchers`,
  SOCIAL: `${BASE}/social`,
  HEALTH: `${BASE}/health`,
} as const;
