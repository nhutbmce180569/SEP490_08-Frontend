import React from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PATH } from '../../../../config/routes/route';
import { useMyWishlist } from '../hooks/useMyWishlist';

export const WishlistHeaderButton: React.FC = () => {
  const navigate = useNavigate();
  const { allItems, isLoading } = useMyWishlist();
  const count = allItems.length;

  return (
    <button
      type="button"
      onClick={() => navigate(PATH.CUSTOMER.WISHLIST)}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-500"
      title="My wishlist"
      aria-label={count > 0 ? `My wishlist, ${count} saved tours` : 'My wishlist'}
    >
      <Heart className={`h-5 w-5 ${count > 0 ? 'fill-rose-200 text-rose-500' : ''}`} />
      {!isLoading && count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white border-2 border-white shadow-sm">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};
