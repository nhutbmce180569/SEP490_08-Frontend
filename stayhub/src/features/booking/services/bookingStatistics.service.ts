import { BOOKINGS_API } from '../../../config/api/bookings.api';
import { apiClient } from '../../../utils/axiosClient';
import type {
  BookingStatisticsRequest,
  BookingStatisticsResponse,
} from '../types/bookingStatistics.types';

const unwrap = <T>(response: unknown): T => {
  const data = response as Record<string, unknown>;
  return (data?.data ?? response) as T;
};

export const bookingStatisticsService = {
  getStatistics: async (
    request: BookingStatisticsRequest,
  ): Promise<BookingStatisticsResponse> => {
    const response = await apiClient.post(
      BOOKINGS_API.GET_BOOKING_STATISTICS,
      request,
    );
    return unwrap<BookingStatisticsResponse>(response);
  },
};
