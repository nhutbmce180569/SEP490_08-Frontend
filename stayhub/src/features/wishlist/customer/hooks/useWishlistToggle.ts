import { useCallback, useContext, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../../contexts/AuthContext';
import { PATH } from '../../../../config/routes/route';
import { useToast } from '../../../../contexts/ToastContext';
import { useTranslation } from '../../../../contexts/LocaleContext';
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
  const { t } = useTranslation();
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
            tourName: t('wishlist.savedTour', { defaultValue: 'Saved tour' }),
            tourStatus: 'Active',
          },
          ...current,
        ];
      });
      return { previous };
    },
    onSuccess: (saved) => {
      success(t('wishlist.addSuccess', { name: saved.tourName, defaultValue: `"${saved.tourName}" added to your wishlist.` }));
      queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
    },
    onError: (err: unknown, _tourId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(WISHLIST_QUERY_KEY, context.previous);
      }
      showError(getApiErrorMessage(err, t('wishlist.addFailed', { defaultValue: 'Failed to add tour to wishlist.' })));
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
      success(t('wishlist.removeSuccess', { defaultValue: 'Removed from your wishlist.' }));
      queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
    },
    onError: (err: unknown, _tourId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(WISHLIST_QUERY_KEY, context.previous);
      }
      showError(getApiErrorMessage(err, t('wishlist.removeFailed', { defaultValue: 'Failed to remove tour from wishlist.' })));
    },
    onSettled: () => setPendingTourId(null),
  });

  const requireAuth = () => {
    info(t('wishlist.loginRequired', { defaultValue: 'Please log in to save tours to your wishlist.' }));
    navigate(PATH.PUBLIC.LOGIN);
    return false;
  };

  const addToWishlist = (tourId: number, tourStatus?: string | null) => {
    if (!user) return requireAuth();
    const validationError = validateTourId(tourId);
    if (validationError) {
      showError(t(`wishlist.${validationError}`, { defaultValue: validationError }));
      return;
    }
    if (tourStatus && !isTourActive(tourStatus)) {
      showError(t('wishlist.onlyActiveTours', { defaultValue: 'Only active tours can be added to your wishlist.' }));
      return;
    }
    if (isInWishlist(tourId)) {
      info(t('wishlist.alreadyInWishlist', { defaultValue: 'This tour is already in your wishlist.' }));
      return;
    }
    addMutation.mutate(tourId);
  };

  const removeFromWishlist = (tourId: number) => {
    if (!user) return requireAuth();
    const validationError = validateTourId(tourId);
    if (validationError) {
      showError(t(`wishlist.${validationError}`, { defaultValue: validationError }));
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
