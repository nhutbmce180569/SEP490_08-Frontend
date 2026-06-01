import { useCallback, useState } from "react";

export const useWishlist = () => {
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);

  const isInWishlist = useCallback(
    (tourId: number) => wishlistIds.includes(tourId),
    [wishlistIds],
  );

  const toggleWishlist = useCallback((tourId: number) => {
    setWishlistIds((current) =>
      current.includes(tourId)
        ? current.filter((id) => id !== tourId)
        : [...current, tourId],
    );
  }, []);

  return {
    isInWishlist,
    toggleWishlist,
    isSubmitting: false,
  };
};
