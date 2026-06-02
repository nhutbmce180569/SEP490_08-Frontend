import type { AnalyticsLabelCount } from '../../customer-analytics/types/customerAnalytics.types';

export type PlatformAnalyticsTab =
  | 'overview'
  | 'users'
  | 'catalog'
  | 'vouchers'
  | 'social'
  | 'health';

export interface DateRangeParams {
  from?: string;
  to?: string;
}

export interface CatalogQueryParams extends DateRangeParams {
  top?: number;
}

export interface PlatformAnalyticsOverview {
  periodFrom: string;
  periodTo: string;
  totalUsers: number;
  activeUsers: number;
  newUsersInPeriod: number;
  totalManagers: number;
  totalStaff: number;
  totalTours: number;
  activeTours: number;
  totalSchedules: number;
  upcomingSchedules: number;
  scheduleOccupancyRate: number;
  activeVouchers: number;
  totalTourMoments: number;
  totalChatRooms: number;
  checkInRate: number;
  pendingCancellationRequests: number;
}

export interface PlatformUserAnalytics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersInPeriod: number;
  onlineRecently: number;
  totalCustomers: number;
  totalManagers: number;
  totalStaff: number;
  totalAdmins: number;
  byRole: AnalyticsLabelCount[];
}

export interface TopBookedTour {
  tourId: number;
  tourName: string | null;
  count: number;
  averageRating?: number | null;
}

export interface PlatformCatalogAnalytics {
  totalTours: number;
  activeTours: number;
  inactiveTours: number;
  totalSchedules: number;
  upcomingSchedules: number;
  ongoingSchedules: number;
  completedSchedules: number;
  totalTicketCapacity: number;
  totalTicketsSold: number;
  totalTicketsAvailable: number;
  scheduleOccupancyRate: number;
  toursByCategory: AnalyticsLabelCount[];
  toursByCity: AnalyticsLabelCount[];
  toursByStatus: AnalyticsLabelCount[];
  topBookedTours: TopBookedTour[];
}

export interface PlatformVoucherAnalytics {
  totalVouchers: number;
  activeVouchers: number;
  expiredVouchers: number;
  totalRedemptions: number;
  redemptionRate: number;
  byDiscountType: AnalyticsLabelCount[];
  byUserVoucherStatus: AnalyticsLabelCount[];
}

export interface PlatformSocialAnalytics {
  totalFriendships: number;
  acceptedFriendships: number;
  pendingFriendRequests: number;
  totalChatRooms: number;
  groupChatRooms: number;
  totalChatMessages: number;
  unreadChatMessages: number;
  totalTourMoments: number;
  totalMomentReactions: number;
  totalMomentComments: number;
  momentsByPrivacy: AnalyticsLabelCount[];
  friendshipStatusDistribution: AnalyticsLabelCount[];
}

export type HealthStatus = 'Good' | 'Warning' | 'Fair' | 'Critical';
export type OverallHealthStatus = 'Healthy' | 'Fair' | 'NeedsAttention' | 'Critical';

export interface PlatformHealthIndicator {
  name: string;
  value: number;
  unit: string;
  status: HealthStatus;
  description?: string | null;
}

export interface PlatformHealthAnalytics {
  scheduleOccupancyRate: number;
  checkInRate: number;
  reviewResponseRate: number;
  voucherRedemptionRate: number;
  pendingCancellationRequests: number;
  overallStatus: OverallHealthStatus;
  indicators: PlatformHealthIndicator[];
}
