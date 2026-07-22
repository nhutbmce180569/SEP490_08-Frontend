import { useQuery } from '@tanstack/react-query';
import { useContext } from 'react';
import { AuthContext } from '../../../../contexts/AuthContext';
import { customerWishlistService } from '../services/customerWishlist.service';
import { isTourActive } from '../utils/wishlistHelpers';

import { useTranslation } from '../../../../contexts/LocaleContext';

export const WISHLIST_QUERY_KEY = ['myWishlist'] as const;

export const useMyWishlist = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: WISHLIST_QUERY_KEY,
    queryFn: () => customerWishlistService.getMyWishlist(),
    enabled: !!user,
  });

  const allItems = (query.data ?? []).filter((item) => isTourActive(item.tourStatus));
  const items = allItems;

  return {
    allItems,
    items,
    wishlistIds: allItems.map((item) => item.tourId),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? t('wishlist.loadError', { defaultValue: 'Failed to load your wishlist.' }) : null,
    refetch: query.refetch,
  };
};
