import axios from "axios";
import { TOURS_API } from "../../../config/api/tours.api"; // Điều chỉnh đường dẫn import TOURS_API của bạn
import type {
  TourSchedule,
  CreateTourScheduleRequest,
  UpdateTourScheduleRequest,
} from "../types/tourSchedule"; // Điều chỉnh đường dẫn import types của bạn

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const tourScheduleService = {
  getAllSchedules: async (): Promise<TourSchedule[]> => {
    const response = await axios.get(TOURS_API.GET_ALL_SCHEDULES);
    return response.data;
  },

  getScheduleById: async (id: string | number): Promise<TourSchedule> => {
    const response = await axios.get(TOURS_API.GET_SCHEDULE_DETAIL(id));
    return response.data;
  },

  createSchedule: async (data: CreateTourScheduleRequest): Promise<TourSchedule> => {
    const response = await axios.post(TOURS_API.CREATE_SCHEDULE, data, getAuthConfig());
    return response.data;
  },

  updateSchedule: async (id: string | number, data: UpdateTourScheduleRequest): Promise<TourSchedule> => {
    const response = await axios.put(TOURS_API.UPDATE_SCHEDULE(id), data, getAuthConfig());
    return response.data;
  },

  deleteSchedule: async (id: string | number): Promise<void> => {
    await axios.delete(TOURS_API.DELETE_SCHEDULE(id), getAuthConfig());
  },

  reserveSeats: async (id: string | number, quantity: number): Promise<{ message: string }> => {
    const response = await axios.post(TOURS_API.RESERVE_SEATS(id), { quantity }, getAuthConfig());
    return response.data;
  },

  releaseSeats: async (id: string | number, quantity: number): Promise<{ message: string }> => {
    const response = await axios.post(TOURS_API.RELEASE_SEATS(id), { quantity }, getAuthConfig());
    return response.data;
  },
};