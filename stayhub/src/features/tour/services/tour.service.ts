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

// Compatibility wrapper used by some components (CreateEditSchedule expects this)
export const tourService = {
  getAllTours: async (): Promise<any[]> => {
    try {
      const res = await apiClient.get<any>(TOURS_API.GET_ALL);
      // Normalize possible response shapes to an array
      if (Array.isArray(res)) return res;
      if (res?.data && Array.isArray(res.data)) return res.data;
      if (res?.items && Array.isArray(res.items)) return res.items;
      if (res?.results && Array.isArray(res.results)) return res.results;
      if (res?.rows && Array.isArray(res.rows)) return res.rows;
      return [];
    } catch (error) {
      throw error;
    }
  },

  getTourById: async (id: string | number) => {
    return await getTourById(id);
  },
};

export default tourService;