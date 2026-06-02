import { apiClient } from '../../../utils/axiosClient';
import { CUSTOMER_ANALYTICS_API } from '../../../config/api/customer-analytics.api';
import type {
  CustomerAnalyticsOverview,
  CustomerDemographicsAnalytics,
  CustomerDetailAnalytics,
  CustomerEngagementAnalytics,
  CustomerListQuery,
  CustomerSegmentAnalytics,
  CustomerTrendAnalytics,
  PaginatedCustomers,
  TopCustomerAnalytics,
  TopCustomersQuery,
  TrendsQuery,
  DateRangeParams,
} from '../types/customerAnalytics.types';

const unwrap = <T>(response: unknown): T => {
  const data = response as Record<string, unknown>;
  if (data?.totalPages !== undefined) return response as T;
  if (data?.customerId !== undefined && data?.fullName !== undefined) return response as T;
  if (Array.isArray(data)) return response as T;
  return (data?.data ?? response) as T;
};

const buildDateParams = (params?: DateRangeParams) => {
  const result: Record<string, string> = {};
  if (params?.from) result.from = params.from;
  if (params?.to) result.to = params.to;
  return result;
};

export const customerAnalyticsService = {
  getOverview: async (params?: DateRangeParams): Promise<CustomerAnalyticsOverview> => {
    const response = await apiClient.get(CUSTOMER_ANALYTICS_API.OVERVIEW, {
      params: buildDateParams(params),
    });
    return unwrap<CustomerAnalyticsOverview>(response);
  },

  getDemographics: async (params?: DateRangeParams): Promise<CustomerDemographicsAnalytics> => {
    const response = await apiClient.get(CUSTOMER_ANALYTICS_API.DEMOGRAPHICS, {
      params: buildDateParams(params),
    });
    return unwrap<CustomerDemographicsAnalytics>(response);
  },

  getSegments: async (params?: DateRangeParams): Promise<CustomerSegmentAnalytics> => {
    const response = await apiClient.get(CUSTOMER_ANALYTICS_API.SEGMENTS, {
      params: buildDateParams(params),
    });
    return unwrap<CustomerSegmentAnalytics>(response);
  },

  getTrends: async (params?: TrendsQuery): Promise<CustomerTrendAnalytics> => {
    const query: Record<string, string> = buildDateParams(params);
    if (params?.granularity) query.granularity = params.granularity;
    const response = await apiClient.get(CUSTOMER_ANALYTICS_API.TRENDS, { params: query });
    return unwrap<CustomerTrendAnalytics>(response);
  },

  getTopCustomers: async (params?: TopCustomersQuery): Promise<TopCustomerAnalytics[]> => {
    const query: Record<string, string | number> = buildDateParams(params);
    if (params?.top) query.top = params.top;
    const response = await apiClient.get(CUSTOMER_ANALYTICS_API.TOP_CUSTOMERS, { params: query });
    return unwrap<TopCustomerAnalytics[]>(response);
  },

  getEngagement: async (): Promise<CustomerEngagementAnalytics> => {
    const response = await apiClient.get(CUSTOMER_ANALYTICS_API.ENGAGEMENT);
    return unwrap<CustomerEngagementAnalytics>(response);
  },

  getCustomers: async (params?: CustomerListQuery): Promise<PaginatedCustomers> => {
    const query: Record<string, string | number> = {
      ...buildDateParams(params),
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    };
    if (params?.search?.trim()) query.search = params.search.trim();
    if (params?.sortBy) query.sortBy = params.sortBy;
    if (params?.sortOrder) query.sortOrder = params.sortOrder;

    const response = await apiClient.get(CUSTOMER_ANALYTICS_API.CUSTOMERS, { params: query });
    return unwrap<PaginatedCustomers>(response);
  },

  getCustomerDetail: async (
    customerId: number,
    params?: DateRangeParams,
  ): Promise<CustomerDetailAnalytics> => {
    const response = await apiClient.get(CUSTOMER_ANALYTICS_API.CUSTOMER_DETAIL(customerId), {
      params: buildDateParams(params),
    });
    return unwrap<CustomerDetailAnalytics>(response);
  },
};
