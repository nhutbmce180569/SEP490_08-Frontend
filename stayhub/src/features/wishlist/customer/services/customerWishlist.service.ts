import { apiClient } from '../../../../utils/axiosClient';
import { TOURS_API } from '../../../../config/api/tours.api';
import type { ReadWishlistItemDTO } from '../types/customerWishlist';

const unwrap = <T>(response: unknown): T => {
  const data = response as Record<string, unknown>;
  if (Array.isArray(response)) return response as T;
  if (data?.wishlistId !== undefined || data?.tourId !== undefined) return response as T;
  return (data?.data ?? response) as T;
};

export const customerWishlistService = {
  getMyWishlist: async (): Promise<ReadWishlistItemDTO[]> => {
    const response = await apiClient.get<ReadWishlistItemDTO[]>(TOURS_API.GET_WISHLIST);
    return unwrap<ReadWishlistItemDTO[]>(response);
  },

  addToWishlist: async (tourId: number): Promise<ReadWishlistItemDTO> => {
    const response = await apiClient.post<ReadWishlistItemDTO>(
      TOURS_API.ADD_TO_WISHLIST(tourId),
    );
    return unwrap<ReadWishlistItemDTO>(response);
  },

  removeFromWishlist: async (tourId: number): Promise<void> => {
    await apiClient.delete(TOURS_API.REMOVE_FROM_WISHLIST(tourId));
  },
};
