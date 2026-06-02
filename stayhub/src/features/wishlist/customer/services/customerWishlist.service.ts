import { apiClient } from '../../../../utils/axiosClient';
import { TOURS_API } from '../../../../config/api/tours.api';
import type { ReadWishlistItemDTO } from '../types/customerWishlist';

const normalizeWishlistItem = (item: Record<string, unknown>): ReadWishlistItemDTO => ({
  wishlistId: Number(item.wishlistId ?? item.WishlistId ?? 0),
  tourId: Number(item.tourId ?? item.TourId ?? 0),
  tourName: String(item.tourName ?? item.TourName ?? ''),
  tourImageUrl: (item.tourImageUrl ?? item.TourImageUrl ?? null) as string | null,
  tourStatus: (item.tourStatus ?? item.TourStatus ?? null) as string | null,
  tourDescription: (item.tourDescription ?? item.TourDescription ?? null) as string | null,
});

const unwrapList = (response: unknown): ReadWishlistItemDTO[] => {
  if (Array.isArray(response)) {
    return response.map((item) => normalizeWishlistItem(item as Record<string, unknown>));
  }

  const data = response as Record<string, unknown>;
  const payload = data?.data ?? response;

  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeWishlistItem(item as Record<string, unknown>));
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (record.wishlistId !== undefined || record.WishlistId !== undefined) {
      return [normalizeWishlistItem(record)];
    }
  }

  return [];
};

const unwrapItem = (response: unknown): ReadWishlistItemDTO => {
  const items = unwrapList(response);
  if (items.length > 0) return items[0];

  const data = response as Record<string, unknown>;
  const payload = (data?.data ?? response) as Record<string, unknown>;
  return normalizeWishlistItem(payload ?? {});
};

export const customerWishlistService = {
  getMyWishlist: async (): Promise<ReadWishlistItemDTO[]> => {
    const response = await apiClient.get<ReadWishlistItemDTO[]>(TOURS_API.GET_WISHLIST);
    return unwrapList(response);
  },

  addToWishlist: async (tourId: number): Promise<ReadWishlistItemDTO> => {
    const response = await apiClient.post<ReadWishlistItemDTO>(
      TOURS_API.ADD_TO_WISHLIST(tourId),
    );
    return unwrapItem(response);
  },

  removeFromWishlist: async (tourId: number): Promise<void> => {
    await apiClient.delete(TOURS_API.REMOVE_FROM_WISHLIST(tourId));
  },
};
