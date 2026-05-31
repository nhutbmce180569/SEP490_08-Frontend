import { useCallback, useContext, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../../contexts/AuthContext';
import { PATH } from '../../../../config/routes/route';
import { useToast } from '../../../../contexts/ToastContext';
import { getApiErrorMessage } from '../../../content/utils/apiError';
import { customerWishlistService } from '../services/customerWishlist.service';
import type { ReadWishlistItemDTO } from '../types/customerWishlist';
import { isTourActive, validateTourId } from '../utils/wishlistHelpers';
import { WISHLIST_QUERY_KEY, useMyWishlist } from './useMyWishlist';

export const useWishlistToggle = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: showError, info } = useToast();
  const { wishlistIds } = useMyWishlist();
  const [pendingTourId, setPendingTourId] = useState<number | null>(null);

  const isInWishlist = useCallback(
    (tourId: number) => wishlistIds.includes(tourId),
    [wishlistIds],
  );

  const addMutation = useMutation({
    mutationFn: (tourId: number) => customerWishlistService.addToWishlist(tourId),
    onMutate: async (tourId) => {
      setPendingTourId(tourId);
      await queryClient.cancelQueries({ queryKey: WISHLIST_QUERY_KEY });
      const previous = queryClient.getQueryData<ReadWishlistItemDTO[]>(WISHLIST_QUERY_KEY);
      queryClient.setQueryData<ReadWishlistItemDTO[]>(WISHLIST_QUERY_KEY, (current = []) => {
        if (current.some((item) => item.tourId === tourId)) return current;
        return [
          {
            wishlistId: -tourId,
            tourId,
            tourName: 'Saved tour',
            tourStatus: 'Active',
          },
          ...current,
        ];
      });
      return { previous };
    },
    onSuccess: (saved) => {
      success(`"${saved.tourName}" added to your wishlist.`);
      queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
    },
    onError: (err: unknown, _tourId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(WISHLIST_QUERY_KEY, context.previous);
      }
      showError(getApiErrorMessage(err, 'Failed to add tour to wishlist.'));
    },
    onSettled: () => setPendingTourId(null),
  });

  const removeMutation = useMutation({
    mutationFn: (tourId: number) => customerWishlistService.removeFromWishlist(tourId),
    onMutate: async (tourId) => {
      setPendingTourId(tourId);
      await queryClient.cancelQueries({ queryKey: WISHLIST_QUERY_KEY });
      const previous = queryClient.getQueryData<ReadWishlistItemDTO[]>(WISHLIST_QUERY_KEY);
      queryClient.setQueryData<ReadWishlistItemDTO[]>(
        WISHLIST_QUERY_KEY,
        (current = []) => current.filter((item) => item.tourId !== tourId),
      );
      return { previous };
    },
    onSuccess: () => {
      success('Removed from your wishlist.');
      queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
    },
    onError: (err: unknown, _tourId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(WISHLIST_QUERY_KEY, context.previous);
      }
      showError(getApiErrorMessage(err, 'Failed to remove tour from wishlist.'));
    },
    onSettled: () => setPendingTourId(null),
  });

  const requireAuth = () => {
    info('Please log in to save tours to your wishlist.');
    navigate(PATH.PUBLIC.LOGIN);
    return false;
  };

  const addToWishlist = (tourId: number, tourStatus?: string | null) => {
    if (!user) return requireAuth();
    const validationError = validateTourId(tourId);
    if (validationError) {
      showError(validationError);
      return;
    }
    if (tourStatus && !isTourActive(tourStatus)) {
      showError('Only active tours can be added to your wishlist.');
      return;
    }
    if (isInWishlist(tourId)) {
      info('This tour is already in your wishlist.');
      return;
    }
    addMutation.mutate(tourId);
  };

  const removeFromWishlist = (tourId: number) => {
    if (!user) return requireAuth();
    const validationError = validateTourId(tourId);
    if (validationError) {
      showError(validationError);
      return;
    }
    removeMutation.mutate(tourId);
  };

  const toggleWishlist = (tourId: number, tourStatus?: string | null) => {
    if (isInWishlist(tourId)) {
      removeFromWishlist(tourId);
    } else {
      addToWishlist(tourId, tourStatus);
    }
  };

  return {
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isSubmitting: addMutation.isPending || removeMutation.isPending,
    isSubmittingTourId: pendingTourId,
    isLoggedIn: !!user,
  };
};
