import type { ReadWishlistItemDTO, WishlistTab } from '../types/customerWishlist';

export const validateTourId = (tourId: number): string | null => {
  if (!Number.isFinite(tourId) || tourId <= 0) {
    return 'Invalid tour. Please refresh and try again.';
  }
  return null;
};

export const isTourActive = (status?: string | null): boolean =>
  String(status ?? '').toLowerCase() === 'active';

export const filterWishlistByTab = (
  items: ReadWishlistItemDTO[],
  tab: WishlistTab,
): ReadWishlistItemDTO[] => {
  switch (tab) {
    case 'active':
      return items.filter((item) => isTourActive(item.tourStatus));
    case 'unavailable':
      return items.filter((item) => !isTourActive(item.tourStatus));
    default:
      return items;
  }
};
