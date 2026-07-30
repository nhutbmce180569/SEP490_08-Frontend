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

export const filterWishlistBySearch = (
  items: ReadWishlistItemDTO[],
  query: string,
): ReadWishlistItemDTO[] => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return items;
  return items.filter((item) => {
    const name = item.tourName?.toLowerCase() ?? '';
    const desc = item.tourDescription?.toLowerCase() ?? '';
    return name.includes(trimmed) || desc.includes(trimmed);
  });
};

export const getWishlistTabCounts = (items: ReadWishlistItemDTO[]) => ({
  all: items.length,
  active: items.filter((item) => isTourActive(item.tourStatus)).length,
  unavailable: items.filter((item) => !isTourActive(item.tourStatus)).length,
});
