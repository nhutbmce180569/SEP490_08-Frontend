import { FULL_API } from './api';

const BASE = `${FULL_API}/customer-analytics`;

export const CUSTOMER_ANALYTICS_API = {
  OVERVIEW: `${BASE}/overview`,
  DEMOGRAPHICS: `${BASE}/demographics`,
  SEGMENTS: `${BASE}/segments`,
  TRENDS: `${BASE}/trends`,
  TOP_CUSTOMERS: `${BASE}/top-customers`,
  ENGAGEMENT: `${BASE}/engagement`,
  CUSTOMERS: `${BASE}/customers`,
  CUSTOMER_DETAIL: (id: number | string) => `${BASE}/customers/${id}`,
} as const;
