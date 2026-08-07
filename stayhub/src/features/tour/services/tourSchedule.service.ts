import { TOURS_API } from "../../../config/api/tours.api";
import { apiClient } from "../../../utils/axiosClient";
import type {
  TourSchedule,
  CreateTourScheduleRequest,
  UpdateTourScheduleRequest,
  PaginationResponse,
} from "../types/tourSchedule";

export const tourScheduleService = {
  getAllSchedules: async (
    page: number = 1,
    pageSize: number = 10,
    tourName?: string,
  ): Promise<PaginationResponse<TourSchedule>> => {
    return await apiClient.get<PaginationResponse<TourSchedule>>(
      TOURS_API.GET_ALL_SCHEDULES,
      {
        params: {
          page,
          pageSize,
          ...(tourName?.trim() ? { tourName: tourName.trim() } : {}),
        },
      },
    );
  },

  getMySchedules: async (
    page: number = 1,
    pageSize: number = 10,
    tourId?: number | null,
    startDate?: string,
    endDate?: string,
    search?: string,
  ): Promise<PaginationResponse<TourSchedule>> => {
    const params: any = { page, pageSize };
    if (tourId) params.tourId = tourId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (search?.trim()) params.search = search.trim();

    return await apiClient.get<PaginationResponse<TourSchedule>>(
      TOURS_API.GET_MY_SCHEDULES,
      { params },
    );
  },

  getScheduleById: async (id: string | number): Promise<TourSchedule> => {
    return await apiClient.get<TourSchedule>(TOURS_API.GET_SCHEDULE_DETAIL(id));
  },

  createSchedule: async (
    data: CreateTourScheduleRequest,
  ): Promise<TourSchedule> => {
    return await apiClient.post<TourSchedule>(TOURS_API.CREATE_SCHEDULE, data);
  },

  updateSchedule: async (
    id: string | number,
    data: UpdateTourScheduleRequest,
  ): Promise<TourSchedule> => {
    return await apiClient.put<TourSchedule>(
      TOURS_API.UPDATE_SCHEDULE(id),
      data,
    );
  },

  deleteSchedule: async (id: string | number): Promise<void> => {
    return await apiClient.delete<void>(TOURS_API.DELETE_SCHEDULE(id));
  },

  reserveSeats: async (
    id: string | number,
    quantity: number,
  ): Promise<{ message: string }> => {
    return await apiClient.post<{ message: string }>(
      TOURS_API.RESERVE_SEATS(id),
      { quantity },
    );
  },

  releaseSeats: async (
    id: string | number,
    quantity: number,
  ): Promise<{ message: string }> => {
    return await apiClient.post<{ message: string }>(
      TOURS_API.RELEASE_SEATS(id),
      { quantity },
    );
  },

  checkScheduleHasOrders: async (
    id: string | number,
  ): Promise<{ hasOrders: boolean, scheduleId: number }> => {
    return await apiClient.get<{ hasOrders: boolean, scheduleId: number }>(
      TOURS_API.CHECK_HAS_ORDERS(id)
    );
  },
};
