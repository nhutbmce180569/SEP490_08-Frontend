import { TOURS_API } from "../../../config/api/tours.api";
import { type CreateItineraryBatchRequest, type CreateItineraryRequest, type UpdateItineraryRequest, type TourItinerary } from "../types/tourItinerary";
import { apiClient } from "../../../utils/axiosClient";

const ITINERARY_API = TOURS_API.ITINERARIES;

// GET: api/TourItineraries/{id}
export const getItineraryById = async (id: string | number) => {
  return await apiClient.get<TourItinerary>(`${ITINERARY_API}/${id}`);
};

// POST: api/TourItineraries
export const createItinerary = async (data: CreateItineraryRequest) => {
  const response = await apiClient.post(ITINERARY_API, data);
  return response;
};

// POST: api/TourItineraries/batch
export const createItineraryBatch = async (data: CreateItineraryBatchRequest) => {
  const response = await apiClient.post(TOURS_API.BATCH_ITINERARIES, data);
  return response;
};

// PUT: api/TourItineraries/{id}
export const updateItinerary = async (id: string | number, data: UpdateItineraryRequest) => {
  const response = await apiClient.put(`${ITINERARY_API}/${id}`, data);
  return response;
};

// DELETE: api/TourItineraries/{id}
export const deleteItinerary = async (id: string | number) => {
  const response = await apiClient.delete(`${ITINERARY_API}/${id}`);
  return response;
};

export const downloadItineraryImportTemplate = async (): Promise<Blob> => {
  return await apiClient.get(TOURS_API.ITINERARY_IMPORT_TEMPLATE, {
    responseType: "blob",
  });
};
