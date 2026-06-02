import { useQuery } from '@tanstack/react-query';
import { platformAnalyticsService } from '../services/platformAnalytics.service';
import type { CatalogQueryParams, DateRangeParams } from '../types/platformAnalytics.types';

export const platformAnalyticsKeys = {
  all: ['platform-analytics'] as const,
  overview: (params?: DateRangeParams) =>
    [...platformAnalyticsKeys.all, 'overview', params] as const,
  users: (params?: DateRangeParams) =>
    [...platformAnalyticsKeys.all, 'users', params] as const,
  catalog: (params?: CatalogQueryParams) =>
    [...platformAnalyticsKeys.all, 'catalog', params] as const,
  vouchers: () => [...platformAnalyticsKeys.all, 'vouchers'] as const,
  social: () => [...platformAnalyticsKeys.all, 'social'] as const,
  health: (params?: DateRangeParams) =>
    [...platformAnalyticsKeys.all, 'health', params] as const,
};

export const usePlatformOverview = (params?: DateRangeParams) =>
  useQuery({
    queryKey: platformAnalyticsKeys.overview(params),
    queryFn: () => platformAnalyticsService.getOverview(params),
  });

export const usePlatformUsers = (params?: DateRangeParams) =>
  useQuery({
    queryKey: platformAnalyticsKeys.users(params),
    queryFn: () => platformAnalyticsService.getUsers(params),
  });

export const usePlatformCatalog = (params?: CatalogQueryParams) =>
  useQuery({
    queryKey: platformAnalyticsKeys.catalog(params),
    queryFn: () => platformAnalyticsService.getCatalog(params),
  });

export const usePlatformVouchers = () =>
  useQuery({
    queryKey: platformAnalyticsKeys.vouchers(),
    queryFn: () => platformAnalyticsService.getVouchers(),
  });

export const usePlatformSocial = () =>
  useQuery({
    queryKey: platformAnalyticsKeys.social(),
    queryFn: () => platformAnalyticsService.getSocial(),
  });

export const usePlatformHealth = (params?: DateRangeParams) =>
  useQuery({
    queryKey: platformAnalyticsKeys.health(params),
    queryFn: () => platformAnalyticsService.getHealth(params),
  });
