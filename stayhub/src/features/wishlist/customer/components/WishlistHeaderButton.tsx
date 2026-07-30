import React from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PATH } from '../../../../config/routes/route';
import { useTranslation } from '../../../../contexts/LocaleContext';
import { useMyWishlist } from '../hooks/useMyWishlist';

export const WishlistHeaderButton: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { allItems, isLoading } = useMyWishlist();
  const count = allItems.length;

  return (
    <button
      id="tour-wishlist"
      type="button"
      onClick={() => navigate(PATH.CUSTOMER.WISHLIST)}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-slate-800 border-0 shadow-none"
      title={t('tour.myWishlistTitle')}
      aria-label={
        count > 0
          ? t('tour.myWishlistAria', { count })
          : t('tour.myWishlistTitle')
      }
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
