import { useQuery } from '@tanstack/react-query';
import { bookingStatisticsService } from '../services/bookingStatistics.service';
import type { BookingStatisticsRequest } from '../types/bookingStatistics.types';

export const useBookingStatistics = (request: BookingStatisticsRequest) =>
  useQuery({
    queryKey: ['booking-statistics', request],
    queryFn: () => bookingStatisticsService.getStatistics(request),
    enabled: Boolean(request.startDate && request.endDate && request.groupBy),
  });
