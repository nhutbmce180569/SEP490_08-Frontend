import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Loader2, MapPin, Ticket, Eye } from 'lucide-react';
import { PATH } from '../../../../config/routes/route';
import { getImg } from '../../../../config/api/api';
import { useTranslation } from '../../../../contexts/LocaleContext';
import type { ReadWishlistItemDTO } from '../types/customerWishlist';
import { isTourActive } from '../utils/wishlistHelpers';
import { DynamicText } from '../../../../components/DynamicText';

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Inactive: 'bg-slate-200 text-slate-600',
  Pending: 'bg-amber-100 text-amber-700',
  Rejected: 'bg-rose-100 text-rose-700',
};

const STATUS_LOCALE: Record<string, string> = {
  Active: 'tour.statusActive',
  Inactive: 'tour.statusInactive',
  Pending: 'tour.statusPending',
  Rejected: 'tour.statusRejected',
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
  const { t } = useTranslation();
  const isActive = isTourActive(item.tourStatus);
  const statusLabel = item.tourStatus || '';
  const displayStatus = STATUS_LOCALE[statusLabel] ? t(STATUS_LOCALE[statusLabel]) : (statusLabel || t('tour.unknownStatus'));

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
            src={getImg(item.tourImageUrl)}
            alt={item.tourName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-200 text-xs font-bold uppercase tracking-widest text-slate-400">
            {t('tour.noImage')}
          </div>
        )}

        <div className="absolute left-3 top-3">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
              STATUS_STYLES[statusLabel] ?? 'bg-slate-100 text-slate-600'
            }`}
          >
            {displayStatus}
          </span>
        </div>

        <button
          type="button"
          aria-label={t('tour.removeFromWishlistAria')}
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
        <h3 className="mb-2 line-clamp-2 text-base font-black text-slate-900"><DynamicText text={item.tourName} /></h3>

        {item.tourDescription && (
          <p className="mb-3 line-clamp-2 text-xs text-slate-500"><DynamicText text={item.tourDescription} /></p>
        )}

        <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>{t('tour.savedToWishlist')}</span>
        </div>

        <div className="mt-auto flex flex-wrap gap-3 border-t border-slate-100 pt-4">
          <Link
            to={PATH.PUBLIC.TOUR_DETAIL(item.tourId)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/20 transition-all hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/30 !no-underline"
          >
            <Ticket className="h-4 w-4" />
            {t('tour.viewTour')} & {t('booking.createBooking')}
          </Link>
        </div>
      </div>
    </div>
  );
};
