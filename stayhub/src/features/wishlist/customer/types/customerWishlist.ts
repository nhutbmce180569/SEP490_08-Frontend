export interface ReadWishlistItemDTO {
  wishlistId: number;
  tourId: number;
  tourName: string;
  tourImageUrl?: string | null;
  tourStatus?: string | null;
  tourDescription?: string | null;
}

export type WishlistTab = 'all' | 'active' | 'unavailable';
