import { TOURS_API } from "../../../config/api/tours.api";
import { apiClient } from "../../../utils/axiosClient";
import type {
  TourScheduleItinerary,
  CreateTourScheduleItineraryRequest,
  UpdateTourScheduleItineraryRequest,
  CreateTourScheduleItineraryBatchRequest,
} from "../types/tourScheduleItinerary";

const TOUR_SCHEDULE_ITINERARIES_API = TOURS_API.TOUR_SCHEDULE_ITINERARIES;

export const getScheduleItinerariesBySchedule = async (
  scheduleId: string | number,
): Promise<TourScheduleItinerary[]> => {
  return await apiClient.get<TourScheduleItinerary[]>(
    `${TOUR_SCHEDULE_ITINERARIES_API}/schedule/${scheduleId}`,
  );
};

export const getScheduleItineraryById = async (
  id: string | number,
): Promise<TourScheduleItinerary> => {
  return await apiClient.get<TourScheduleItinerary>(`${TOUR_SCHEDULE_ITINERARIES_API}/${id}`);
};

export const createScheduleItinerary = async (
  data: CreateTourScheduleItineraryRequest,
): Promise<TourScheduleItinerary> => {
  return await apiClient.post<TourScheduleItinerary>(TOUR_SCHEDULE_ITINERARIES_API, data);
};

export const createScheduleItineraryBatch = async (
  data: CreateTourScheduleItineraryBatchRequest,
): Promise<void> => {
  return await apiClient.post<void>(TOURS_API.BATCH_SCHEDULE_ITINERARIES, data);
};

export const downloadScheduleItineraryImportTemplate = async (): Promise<Blob> => {
  return await apiClient.get(TOURS_API.SCHEDULE_ITINERARY_IMPORT_TEMPLATE, {
    responseType: "blob",
  });
};

export const updateScheduleItinerary = async (
  id: string | number,
  data: UpdateTourScheduleItineraryRequest,
): Promise<void> => {
  return await apiClient.put<void>(`${TOUR_SCHEDULE_ITINERARIES_API}/${id}`, data);
};

export const deleteScheduleItinerary = async (id: string | number): Promise<void> => {
  return await apiClient.delete(`${TOUR_SCHEDULE_ITINERARIES_API}/${id}`);
};
