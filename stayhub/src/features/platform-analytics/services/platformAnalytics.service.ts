import { apiClient } from '../../../utils/axiosClient';
import { PLATFORM_ANALYTICS_API } from '../../../config/api/platform-analytics.api';
import type {
  CatalogQueryParams,
  DateRangeParams,
  PlatformAnalyticsOverview,
  PlatformCatalogAnalytics,
  PlatformHealthAnalytics,
  PlatformSocialAnalytics,
  PlatformUserAnalytics,
  PlatformVoucherAnalytics,
} from '../types/platformAnalytics.types';

const unwrap = <T>(response: unknown): T => {
  const data = response as Record<string, unknown>;
  if (Array.isArray(data)) return response as T;
  return (data?.data ?? response) as T;
};

const buildDateParams = (params?: DateRangeParams) => {
  const result: Record<string, string> = {};
  if (params?.from) result.from = params.from;
  if (params?.to) result.to = params.to;
  return result;
};

export const platformAnalyticsService = {
  getOverview: async (params?: DateRangeParams): Promise<PlatformAnalyticsOverview> => {
    const response = await apiClient.get(PLATFORM_ANALYTICS_API.OVERVIEW, {
      params: buildDateParams(params),
    });
    return unwrap<PlatformAnalyticsOverview>(response);
  },

  getUsers: async (params?: DateRangeParams): Promise<PlatformUserAnalytics> => {
    const response = await apiClient.get(PLATFORM_ANALYTICS_API.USERS, {
      params: buildDateParams(params),
    });
    return unwrap<PlatformUserAnalytics>(response);
  },

  getCatalog: async (params?: CatalogQueryParams): Promise<PlatformCatalogAnalytics> => {
    const query: Record<string, string | number> = buildDateParams(params);
    if (params?.top) query.top = params.top;
    const response = await apiClient.get(PLATFORM_ANALYTICS_API.CATALOG, { params: query });
    return unwrap<PlatformCatalogAnalytics>(response);
  },

  getVouchers: async (): Promise<PlatformVoucherAnalytics> => {
    const response = await apiClient.get(PLATFORM_ANALYTICS_API.VOUCHERS);
    return unwrap<PlatformVoucherAnalytics>(response);
  },

  getSocial: async (): Promise<PlatformSocialAnalytics> => {
    const response = await apiClient.get(PLATFORM_ANALYTICS_API.SOCIAL);
    return unwrap<PlatformSocialAnalytics>(response);
  },

  getHealth: async (params?: DateRangeParams): Promise<PlatformHealthAnalytics> => {
    const response = await apiClient.get(PLATFORM_ANALYTICS_API.HEALTH, {
      params: buildDateParams(params),
    });
    return unwrap<PlatformHealthAnalytics>(response);
  },
};
