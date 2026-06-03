export type BookingStatisticsGroupBy = 'Day' | 'Month' | 'Year';

export interface BookingStatisticsRequest {
  startDate: string;
  endDate: string;
  groupBy: BookingStatisticsGroupBy;
}

export interface BookingStatisticsMetrics {
  totalRevenue: number;
  totalDiscount: number;
  totalRefundAmount: number;
  totalOrders: number;
  totalTicketsSold: number;
}

export interface RevenueTrendPoint {
  period: string;
  revenue: number;
  orderCount: number;
}

export interface TicketTypeSales {
  ticketTypeId: number;
  quantitySold: number;
  revenue: number;
}

export interface OrdersByHour {
  hour: number;
  orderCount: number;
}

export interface CheckInStatusRatio {
  status: string;
  ticketCount: number;
  percentage: number;
}

export interface CancellationReasonStats {
  reason: string;
  count: number;
}

export interface BookingStatisticsResponse {
  metrics: BookingStatisticsMetrics;
  revenueTrend: RevenueTrendPoint[];
  salesByTicketType: TicketTypeSales[];
  ordersByHour: OrdersByHour[];
  checkInRatio: CheckInStatusRatio[];
  topCancellationReasons: CancellationReasonStats[];
}
