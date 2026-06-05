import { TOURS_API } from "../../../config/api/tours.api";
import { apiClient } from "../../../utils/axiosClient";
import type {
  TourSchedule,
  CreateTourScheduleRequest,
  UpdateTourScheduleRequest,
  AssignedTourSchedule,
  PaginationResponse,
} from "../types/tourSchedule";

export const tourScheduleService = {
  
  getAllSchedules: async (page: number = 1, pageSize: number = 10): Promise<PaginationResponse<TourSchedule>> => {
    return await apiClient.get<PaginationResponse<TourSchedule>>(TOURS_API.GET_ALL_SCHEDULES, {
      params: { page, pageSize } 
    });
  },

  getScheduleById: async (id: string | number): Promise<TourSchedule> => {
    return await apiClient.get<TourSchedule>(TOURS_API.GET_SCHEDULE_DETAIL(id));
  },

  createSchedule: async (data: CreateTourScheduleRequest): Promise<TourSchedule> => {
    return await apiClient.post<TourSchedule>(TOURS_API.CREATE_SCHEDULE, data);
  },

  updateSchedule: async (id: string | number, data: UpdateTourScheduleRequest): Promise<TourSchedule> => {
    return await apiClient.put<TourSchedule>(TOURS_API.UPDATE_SCHEDULE(id), data);
  },

  deleteSchedule: async (id: string | number): Promise<void> => {
    return await apiClient.delete<void>(TOURS_API.DELETE_SCHEDULE(id));
  },

  getAssignedSchedules: async (): Promise<AssignedTourSchedule[]> => {
    return await apiClient.get<AssignedTourSchedule[]>(TOURS_API.GET_ASSIGNED_SCHEDULES);
  },

  reserveSeats: async (id: string | number, quantity: number): Promise<{ message: string }> => {
    return await apiClient.post<{ message: string }>(TOURS_API.RESERVE_SEATS(id), { quantity });
  },

  releaseSeats: async (id: string | number, quantity: number): Promise<{ message: string }> => {
    return await apiClient.post<{ message: string }>(TOURS_API.RELEASE_SEATS(id), { quantity });
  },
};