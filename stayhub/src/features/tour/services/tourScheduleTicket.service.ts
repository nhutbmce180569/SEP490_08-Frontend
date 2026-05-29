import { TOURS_API } from "../../../config/api/tours.api";
import { apiClient } from "../../../utils/axiosClient";
import type {
  CreateTourScheduleTicketRequest,
  TourScheduleTicket,
  UpdateTourScheduleTicketRequest,
} from "../types/tourScheduleTicket";

const unwrapData = <T>(response: T | { data?: T }): T => {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    (response as { data?: T }).data
  ) {
    return (response as { data: T }).data;
  }

  return response as T;
};

export const tourScheduleTicketService = {
  getBySchedule: async (scheduleId: number | string): Promise<TourScheduleTicket[]> => {
    const response = await apiClient.get<TourScheduleTicket[] | { data: TourScheduleTicket[] }>(
      TOURS_API.GET_TICKETS_BY_SCHEDULE(scheduleId),
    );
    const data = unwrapData(response);

    return Array.isArray(data) ? data : [];
  },

  getById: async (id: number | string): Promise<TourScheduleTicket> => {
    const response = await apiClient.get<TourScheduleTicket | { data: TourScheduleTicket }>(
      TOURS_API.GET_TOUR_SCHEDULE_TICKET(id),
    );

    return unwrapData(response);
  },

  create: async (data: CreateTourScheduleTicketRequest): Promise<TourScheduleTicket> => {
    const response = await apiClient.post<TourScheduleTicket | { data: TourScheduleTicket }>(
      TOURS_API.TOUR_SCHEDULE_TICKETS,
      data,
    );

    return unwrapData(response);
  },

  update: async (
    id: number | string,
    data: UpdateTourScheduleTicketRequest,
  ): Promise<TourScheduleTicket> => {
    const response = await apiClient.put<TourScheduleTicket | { data: TourScheduleTicket }>(
      TOURS_API.UPDATE_TOUR_SCHEDULE_TICKET(id),
      data,
    );

    return unwrapData(response);
  },

  delete: async (id: number | string): Promise<void> => {
    await apiClient.delete(TOURS_API.DELETE_TOUR_SCHEDULE_TICKET(id));
  },
};
