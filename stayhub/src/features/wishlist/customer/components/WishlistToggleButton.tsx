import React from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useWishlistToggle } from '../hooks/useWishlistToggle';

type WishlistToggleVariant = 'hero' | 'card';

interface WishlistToggleButtonProps {
  tourId: number;
  tourStatus?: string | null;
  variant?: WishlistToggleVariant;
  className?: string;
}

const variantStyles: Record<WishlistToggleVariant, { button: string; icon: number }> = {
  hero: {
    button: 'flex h-12 w-12 items-center justify-center backdrop-blur-md shadow-sm transition-all duration-200 disabled:opacity-60',
    icon: 22,
  },
  card: {
    button: 'flex h-9 w-9 items-center justify-center backdrop-blur-md shadow-sm transition-all duration-200 disabled:opacity-60',
    icon: 18,
  },
};

export const WishlistToggleButton: React.FC<WishlistToggleButtonProps> = ({
  tourId,
  tourStatus,
  variant = 'card',
  className = '',
}) => {
  const { isInWishlist, toggleWishlist, isSubmittingTourId } = useWishlistToggle();
  const isWished = isInWishlist(tourId);
  const isBusy = isSubmittingTourId === tourId;
  const styles = variantStyles[variant];

  return (
    <button
      type="button"
      aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
      title={isWished ? 'Remove from wishlist' : 'Save to wishlist'}
      disabled={isBusy}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(tourId, tourStatus);
      }}
      className={`${styles.button} ${className}`}
      style={{
        borderRadius: 999,
        background: isWished ? '#FFF1F2' : 'rgba(255,255,255,0.96)',
        color: isWished ? '#F43F5E' : '#94A3B8',
      }}
      onMouseEnter={(e) => {
        if (!isWished) (e.currentTarget as HTMLElement).style.color = '#F43F5E';
      }}
      onMouseLeave={(e) => {
        if (!isWished) (e.currentTarget as HTMLElement).style.color = '#94A3B8';
      }}
    >
      {isBusy ? (
        <Loader2 size={styles.icon} className="animate-spin" />
      ) : (
        <Heart size={styles.icon} className={isWished ? 'fill-current' : ''} />
      )}
    </button>
  );
};
