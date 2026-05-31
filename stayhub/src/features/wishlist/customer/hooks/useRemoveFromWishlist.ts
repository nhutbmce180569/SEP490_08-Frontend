import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '../../../content/utils/apiError';
import { useToast } from '../../../../contexts/ToastContext';
import { customerWishlistService } from '../services/customerWishlist.service';
import type { ReadWishlistItemDTO } from '../types/customerWishlist';
import { validateTourId } from '../utils/wishlistHelpers';
import { WISHLIST_QUERY_KEY } from './useMyWishlist';

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const mutation = useMutation({
    mutationFn: (tourId: number) => customerWishlistService.removeFromWishlist(tourId),
    onMutate: async (tourId) => {
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
  });

  const handleRemove = (tourId: number) => {
    const validationError = validateTourId(tourId);
    if (validationError) {
      showError(validationError);
      return;
    }
    mutation.mutate(tourId);
  };

  return {
    removeFromWishlist: handleRemove,
    isRemoving: mutation.isPending,
    removingTourId: mutation.isPending ? mutation.variables : null,
  };
};
