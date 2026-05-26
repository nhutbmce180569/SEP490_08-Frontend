import { TOURS_API } from "../../../config/api/tours.api";
import { type Tour} from "../types/tour";
import { apiClient } from "../../../utils/axiosClient";
import type { PaginatedResponse } from "../types/paginatedReponse";

export const getTours = async (page: number = 1, pageSize: number = 5): Promise<PaginatedResponse<Tour>> => {
  try {
    return await apiClient.get<PaginatedResponse<Tour>>(TOURS_API.GET_ALL, {
      params: { page, pageSize }
    });
  } catch (error) {
    throw error;
  }
};

export const getTourById = async (id: string | number): Promise<Tour> => {
  try {
    return await apiClient.get<Tour>(TOURS_API.GET_DETAIL(id));
  } catch (error) {
    throw error;
  }
};

export const updateTour = async (id: string | number, data: FormData): Promise<Tour> => {
  try {
    return await apiClient.put<Tour>(TOURS_API.UPDATE(id), data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  } catch (error) {
    throw error;
  }
};

export const createTour = async (data: FormData): Promise<Tour> => {
  try {
    return await apiClient.post<Tour>(TOURS_API.CREATE, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  } catch (error) {
    throw error;
  }
};

export const deleteTour = async (id: string | number): Promise<void> => {
  try {
    await apiClient.delete(TOURS_API.DELETE(id));
  } catch (error) {
    throw error;
  }
};

export const activeTour = async (id: string | number, isActive: boolean): Promise<void> => {
  try {
    await apiClient.put(`${TOURS_API.ACTIVE_TOUR(id)}?isActive=${isActive}`);
  } catch (error) {
    throw error;
  }
};

export const getAllToursForAdmin = async (
  page: number = 1, 
  pageSize: number = 10, 
  searchTerm?: string
): Promise<PaginatedResponse<Tour>> => {
  try {
    return await apiClient.get<PaginatedResponse<Tour>>(TOURS_API.GET_BY_ADMIN, {
      params: { 
        page, 
        pageSize,
        searchTerm: searchTerm || undefined 
      }
    });
  } catch (error) {
    throw error;
  }
};

export const updateTourStatusByAdmin = async (
  id: string | number, 
  status: string
): Promise<void> => {
  try {
    await apiClient.put(TOURS_API.UPDATE_STATUS(id), { status });
  } catch (error) {
    throw error;
  }
};