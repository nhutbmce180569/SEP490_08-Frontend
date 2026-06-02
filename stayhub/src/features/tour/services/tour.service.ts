import { TOURS_API } from "../../../config/api/tours.api";
import { type Tour} from "../types/tour";
import { apiClient } from "../../../utils/axiosClient";
import type { PaginatedResponse } from "../types/paginatedReponse";

const normalizeTourArray = (response: unknown): Tour[] => {
  if (Array.isArray(response)) return response as Tour[];

  if (response && typeof response === "object") {
    const data = response as {
      data?: unknown;
      items?: unknown;
      results?: unknown;
      rows?: unknown;
    };

    if (Array.isArray(data.data)) return data.data as Tour[];
    if (Array.isArray(data.items)) return data.items as Tour[];
    if (Array.isArray(data.results)) return data.results as Tour[];
    if (Array.isArray(data.rows)) return data.rows as Tour[];
  }

  return [];
};

export const getTours = async (
  page: number = 1,
  pageSize: number = 5,
  searchTerm?: string,
  categoryId?: number | null,
): Promise<PaginatedResponse<Tour>> => {
  return await apiClient.get<PaginatedResponse<Tour>>(TOURS_API.GET_ALL, {
    params: {
      page,
      pageSize,
      searchTerm: searchTerm?.trim() || undefined,
      categoryId: categoryId || undefined,
    },
  });
};

export const getTourById = async (id: string | number): Promise<Tour> => {
  return await apiClient.get<Tour>(TOURS_API.GET_DETAIL(id));
};

export const updateTour = async (id: string | number, data: FormData): Promise<Tour> => {
  return await apiClient.put<Tour>(TOURS_API.UPDATE(id), data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const createTour = async (data: FormData): Promise<Tour> => {
  return await apiClient.post<Tour>(TOURS_API.CREATE, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteTour = async (id: string | number): Promise<void> => {
  await apiClient.delete(TOURS_API.DELETE(id));
};

export const activeTour = async (id: string | number, isActive: boolean): Promise<void> => {
  await apiClient.put(`${TOURS_API.ACTIVE_TOUR(id)}?isActive=${isActive}`);
};

export const getAllToursForAdmin = async (
  page: number = 1, 
  pageSize: number = 10, 
  searchTerm?: string
): Promise<PaginatedResponse<Tour>> => {
  return await apiClient.get<PaginatedResponse<Tour>>(TOURS_API.GET_BY_ADMIN, {
    params: { 
      page, 
      pageSize,
      searchTerm: searchTerm || undefined 
    }
  });
};

export const updateTourStatusByAdmin = async (
  id: string | number, 
  status: string
): Promise<void> => {
  await apiClient.put(TOURS_API.UPDATE_STATUS(id), { status });
};

// Compatibility wrapper used by some components (CreateEditSchedule expects this)
export const tourService = {
  getAllTours: async (): Promise<Tour[]> => {
    const res = await apiClient.get<unknown>(TOURS_API.GET_ALL);
    return normalizeTourArray(res);
  },

  getTourById: async (id: string | number) => {
    return await getTourById(id);
  },
};

export default tourService;
