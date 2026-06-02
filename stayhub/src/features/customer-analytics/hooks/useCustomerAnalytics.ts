import { useQuery } from '@tanstack/react-query';
import { customerAnalyticsService } from '../services/customerAnalytics.service';
import type {
  CustomerListQuery,
  DateRangeParams,
  Granularity,
  TopCustomersQuery,
} from '../types/customerAnalytics.types';

export const analyticsKeys = {
  all: ['customer-analytics'] as const,
  overview: (params?: DateRangeParams) => [...analyticsKeys.all, 'overview', params] as const,
  demographics: (params?: DateRangeParams) => [...analyticsKeys.all, 'demographics', params] as const,
  segments: (params?: DateRangeParams) => [...analyticsKeys.all, 'segments', params] as const,
  trends: (params?: DateRangeParams & { granularity?: Granularity }) =>
    [...analyticsKeys.all, 'trends', params] as const,
  topCustomers: (params?: TopCustomersQuery) => [...analyticsKeys.all, 'top-customers', params] as const,
  engagement: () => [...analyticsKeys.all, 'engagement'] as const,
  customers: (params?: CustomerListQuery) => [...analyticsKeys.all, 'customers', params] as const,
  customerDetail: (id: number, params?: DateRangeParams) =>
    [...analyticsKeys.all, 'customer-detail', id, params] as const,
};

export const useAnalyticsOverview = (params?: DateRangeParams) =>
  useQuery({
    queryKey: analyticsKeys.overview(params),
    queryFn: () => customerAnalyticsService.getOverview(params),
  });

export const useAnalyticsDemographics = (params?: DateRangeParams) =>
  useQuery({
    queryKey: analyticsKeys.demographics(params),
    queryFn: () => customerAnalyticsService.getDemographics(params),
  });

export const useAnalyticsSegments = (params?: DateRangeParams) =>
  useQuery({
    queryKey: analyticsKeys.segments(params),
    queryFn: () => customerAnalyticsService.getSegments(params),
  });

export const useAnalyticsTrends = (
  params?: DateRangeParams & { granularity?: Granularity },
) =>
  useQuery({
    queryKey: analyticsKeys.trends(params),
    queryFn: () => customerAnalyticsService.getTrends(params),
  });

export const useTopCustomers = (params?: TopCustomersQuery) =>
  useQuery({
    queryKey: analyticsKeys.topCustomers(params),
    queryFn: () => customerAnalyticsService.getTopCustomers(params),
  });

export const useAnalyticsEngagement = () =>
  useQuery({
    queryKey: analyticsKeys.engagement(),
    queryFn: () => customerAnalyticsService.getEngagement(),
  });

export const useCustomerList = (params?: CustomerListQuery) =>
  useQuery({
    queryKey: analyticsKeys.customers(params),
    queryFn: () => customerAnalyticsService.getCustomers(params),
  });

export const useCustomerDetail = (
  customerId: number | null,
  params?: DateRangeParams,
) =>
  useQuery({
    queryKey: analyticsKeys.customerDetail(customerId ?? 0, params),
    queryFn: () => customerAnalyticsService.getCustomerDetail(customerId!, params),
    enabled: customerId !== null && customerId > 0,
  });
