import { useQuery } from '@tanstack/react-query';
import { useContext } from 'react';
import { AuthContext } from '../../../../contexts/AuthContext';
import { customerWishlistService } from '../services/customerWishlist.service';
import type { WishlistTab } from '../types/customerWishlist';
import { filterWishlistByTab } from '../utils/wishlistHelpers';

export const WISHLIST_QUERY_KEY = ['myWishlist'] as const;

export const useMyWishlist = (activeTab: WishlistTab = 'all') => {
  const { user } = useContext(AuthContext);

  const query = useQuery({
    queryKey: WISHLIST_QUERY_KEY,
    queryFn: () => customerWishlistService.getMyWishlist(),
    enabled: !!user,
  });

  const allItems = query.data ?? [];
  const items = filterWishlistByTab(allItems, activeTab);

  return {
    allItems,
    items,
    wishlistIds: allItems.map((item) => item.tourId),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? 'Failed to load your wishlist.' : null,
    refetch: query.refetch,
  };
};
