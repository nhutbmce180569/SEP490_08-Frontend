import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Loader2, MapPin, Ticket } from 'lucide-react';
import { PATH } from '../../../../config/routes/route';
import type { ReadWishlistItemDTO } from '../types/customerWishlist';
import { isTourActive } from '../utils/wishlistHelpers';

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Inactive: 'bg-slate-200 text-slate-600',
  Pending: 'bg-amber-100 text-amber-700',
  Rejected: 'bg-rose-100 text-rose-700',
};

interface WishlistTourCardProps {
  item: ReadWishlistItemDTO;
  onRemove: (tourId: number) => void;
  isRemoving?: boolean;
}

export const WishlistTourCard: React.FC<WishlistTourCardProps> = ({
  item,
  onRemove,
  isRemoving = false,
}) => {
  const isActive = isTourActive(item.tourStatus);
  const statusLabel = item.tourStatus ?? 'Unknown';

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
        isActive
          ? 'border-slate-200 hover:border-brand/40 hover:shadow-md'
          : 'border-slate-100 opacity-80'
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {item.tourImageUrl ? (
          <img
            src={item.tourImageUrl}
            alt={item.tourName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-200 text-xs font-bold uppercase tracking-widest text-slate-400">
            No image
          </div>
        )}

        <div className="absolute left-3 top-3">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
              STATUS_STYLES[statusLabel] ?? 'bg-slate-100 text-slate-600'
            }`}
          >
            {statusLabel}
          </span>
        </div>

        <button
          type="button"
          aria-label="Remove from wishlist"
          disabled={isRemoving}
          onClick={() => onRemove(item.tourId)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-rose-500 shadow-sm transition-colors hover:bg-rose-50 disabled:opacity-60"
        >
          {isRemoving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Heart size={16} className="fill-current" />
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-2 line-clamp-2 text-base font-black text-slate-900">{item.tourName}</h3>

        {item.tourDescription && (
          <p className="mb-3 line-clamp-2 text-xs text-slate-500">{item.tourDescription}</p>
        )}

        <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>Saved to your wishlist</span>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          <Link
            to={PATH.PUBLIC.TOUR_DETAIL(item.tourId)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 !no-underline"
          >
            View tour
          </Link>

          {isActive ? (
            <Link
              to={PATH.CUSTOMER.CHECKOUT(item.tourId)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white hover:bg-brand-hover !no-underline"
            >
              <Ticket className="h-3.5 w-3.5" />
              Book now
            </Link>
          ) : (
            <span className="inline-flex flex-1 items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400">
              Unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
