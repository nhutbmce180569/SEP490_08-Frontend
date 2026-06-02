export interface AnalyticsLabelCount {
  label: string;
  count: number;
  percentage: number;
}

export interface CustomerTrendPoint {
  period: string;
  count: number;
  amount?: number | null;
  uniqueCustomers?: number | null;
}

export type Granularity = 'day' | 'week' | 'month';
export type SortBy =
  | 'totalSpend'
  | 'orderCount'
  | 'reviewCount'
  | 'wishlistCount'
  | 'createdAt'
  | 'lastOrderAt';
export type SortOrder = 'asc' | 'desc';
export type CustomerSegment = 'NeverPurchased' | 'OneTimeBuyer' | 'RepeatBuyer';

export interface DateRangeParams {
  from?: string;
  to?: string;
}

export interface CustomerAnalyticsOverview {
  periodFrom: string;
  periodTo: string;
  totalCustomers: number;
  activeCustomers: number;
  newCustomersInPeriod: number;
  totalOrders: number;
  paidOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  uniqueBuyers: number;
  repeatCustomers: number;
  repeatCustomerRate: number;
  buyerConversionRate: number;
  cancellationRate: number;
  totalRefundAmount: number;
  totalReviews: number;
  uniqueReviewers: number;
  averageReviewRating: number;
  totalWishlists: number;
  uniqueWishlistCustomers: number;
  reviewParticipationRate: number;
  wishlistToBuyerRate: number;
}

export interface CustomerDemographicsAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  newCustomersInPeriod: number;
  byGender: AnalyticsLabelCount[];
  byProvider: AnalyticsLabelCount[];
  byStatus: AnalyticsLabelCount[];
  byAgeGroup: AnalyticsLabelCount[];
}

export interface CustomerSegmentAnalytics {
  neverPurchased: number;
  oneTimeBuyers: number;
  repeatBuyers: number;
  newBuyersInPeriod: number;
  atRiskCustomers: number;
  highValueCustomers: number;
  buyerConversionRate: number;
  orderStatusDistribution: AnalyticsLabelCount[];
  ratingDistribution: AnalyticsLabelCount[];
}

export interface CustomerTrendAnalytics {
  periodFrom: string;
  periodTo: string;
  granularity: Granularity;
  registrationTrend: CustomerTrendPoint[];
  orderTrend: CustomerTrendPoint[];
  revenueTrend: CustomerTrendPoint[];
}

export interface TopCustomerAnalytics {
  customerId: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  totalSpend: number;
  orderCount: number;
  totalTickets: number;
  lastOrderAt: string | null;
  reviewCount: number;
  wishlistCount: number;
  averageRatingGiven: number | null;
}

export interface TopTourEngagement {
  tourId: number;
  tourName: string | null;
  count: number;
  averageRating?: number | null;
}

export interface CustomerEngagementAnalytics {
  totalReviews: number;
  visibleReviews: number;
  hiddenReviews: number;
  uniqueReviewers: number;
  averageRating: number;
  ratingDistribution: AnalyticsLabelCount[];
  totalWishlists: number;
  uniqueWishlistCustomers: number;
  averageWishlistsPerCustomer: number;
  topWishlistedTours: TopTourEngagement[];
  topReviewedTours: TopTourEngagement[];
  reviewParticipationRate: number;
}

export interface CustomerListItemAnalytics {
  customerId: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  status: string | null;
  provider: string | null;
  createdAt: string | null;
  lastOnline: string | null;
  totalOrders: number;
  totalSpend: number;
  reviewCount: number;
  wishlistCount: number;
  lastOrderAt: string | null;
  customerSegment: CustomerSegment | string;
}

export interface PaginatedCustomers {
  data: CustomerListItemAnalytics[] | null;
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface CustomerDetailAnalytics {
  customerId: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  provider: string | null;
  status: string | null;
  createdAt: string | null;
  lastOnline: string | null;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalSpend: number;
  averageOrderValue: number;
  totalTickets: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  reviewCount: number;
  averageRatingGiven: number | null;
  wishlistCount: number;
  customerSegment: CustomerSegment | string;
  isAtRisk: boolean;
  isHighValue: boolean;
}

export interface CustomerListQuery extends DateRangeParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
}

export interface TrendsQuery extends DateRangeParams {
  granularity?: Granularity;
}

export interface TopCustomersQuery extends DateRangeParams {
  top?: number;
}

export type AnalyticsTab =
  | 'overview'
  | 'demographics'
  | 'segments'
  | 'engagement'
  | 'customers';
