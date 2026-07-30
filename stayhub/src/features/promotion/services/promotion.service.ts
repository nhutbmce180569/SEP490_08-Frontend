import { PROMOTIONS_API } from "../../../config/api/promotions.api";
import { apiClient } from "../../../utils/axiosClient";
import type { PaginatedPromotions, Promotion, PromotionFormData } from "../types/promotion";

export const promotionService = {
  getAllPromotions: async (
    page: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    status?: string
  ): Promise<PaginatedPromotions> => {
    return await apiClient.get<PaginatedPromotions>(PROMOTIONS_API.GET_ALL, {
      params: {
        page,
        pageSize,
        searchTerm: searchTerm?.trim() || undefined,
        status: status || undefined,
      },
    });
  },

  getPromotionById: async (id: string | number): Promise<Promotion> => {
    return await apiClient.get<Promotion>(PROMOTIONS_API.GET_DETAIL(id));
  },

  createPromotion: async (data: PromotionFormData): Promise<Promotion> => {
    return await apiClient.post<Promotion>(PROMOTIONS_API.CREATE, data);
  },

  updatePromotion: async (id: string | number, data: PromotionFormData): Promise<Promotion> => {
    return await apiClient.put<Promotion>(PROMOTIONS_API.UPDATE(id), data);
  },

  changeStatus: async (id: string | number, status: string): Promise<Promotion> => {
    return await apiClient.patch<Promotion>(PROMOTIONS_API.CHANGE_STATUS(id), { status });
  },
};
