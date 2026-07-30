import React from "react";
import { MapPin, Clock, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PATH } from "../../config/routes/route";
import { useTranslation } from "../../contexts/LocaleContext";
import { MoneyDisplay } from "../../features/currency/MoneyDisplay";
import { WishlistToggleButton } from "../../features/wishlist/customer/components/WishlistToggleButton";

import { useDynamicTranslation } from "../../hooks/useDynamicTranslation";
import { DynamicText } from "../DynamicText";

export interface TourCardProps {
  id: string | number;
  title: string;
  location: string;
  rating: number;
  reviews: number;
  duration: string;
  price: number | null;
  originalPrice?: number | null;
  imageUrl: string;
  discountType?: string;
  discountValue?: number;
}

export const TourCard: React.FC<{ tour: TourCardProps }> = ({ tour }) => {
  const { t } = useTranslation();
  const { translatedText: translatedTitle, isLoading: isTitleLoading } = useDynamicTranslation(tour.title);
  
  return (
    <Link
      to={PATH.PUBLIC.TOUR_DETAIL(tour.id)}
      state={{ initialImageUrl: tour.imageUrl, initialTitle: tour.title }}
      className="group block h-full w-full !no-underline"
      viewTransition
    >
      <div className="glass-card flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
          {tour.imageUrl ? (
            <img
              src={tour.imageUrl}
              alt={tour.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              style={{ viewTransitionName: `tour-image-${tour.id}` }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-200 dark:bg-slate-800">
              <span className="px-2 text-center text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {t("common.imageComingSoon")}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 text-xs font-black text-slate-800 shadow-sm backdrop-blur-md dark:bg-slate-900/95 dark:text-white">
            <Star size={13} className="fill-amber-500 text-amber-500" />
            {tour.rating > 0 ? tour.rating.toFixed(1) : t("common.newLabel")}
            {tour.reviews > 0 && (
              <span className="font-semibold text-slate-400 dark:text-slate-400">({tour.reviews})</span>
            )}
          </div>

          <div className="absolute right-3 top-3">
             <WishlistToggleButton tourId={Number(tour.id)} variant="card" />
          </div>

          <div className="absolute bottom-3 left-0 right-0 flex translate-y-2 justify-center opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-brand/30">
              {t("common.viewTour")} <ArrowRight size={13} />
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <MapPin size={13} className="shrink-0 text-brand" />
            <span className="truncate">
              {tour.location ? <DynamicText text={tour.location} /> : t("home.vietnam")}
            </span>
          </div>

          <h3 className="travel-heading mb-3 line-clamp-2 text-base leading-snug text-navy transition-colors group-hover:text-brand md:text-lg dark:text-white" title={tour.title}>
            {isTitleLoading ? <span className="animate-pulse bg-slate-200 dark:bg-slate-700 text-transparent rounded">Loading title...</span> : translatedTitle}
          </h3>

          <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100/80 pt-4 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Clock size={13} />
              {tour.duration || t("home.flexibleDuration")}
            </div>
            <div className="text-right">
              {tour.price != null ? (
                <>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t("home.priceFrom")}
                  </div>
                  {tour.originalPrice != null && (
                    <div className="flex items-center justify-end gap-1.5 mb-0.5">
                      <div className="text-xs font-medium text-slate-400 line-through dark:text-slate-500">
                        <MoneyDisplay amountVnd={tour.originalPrice} compact />
                      </div>
                      {tour.discountType?.toLowerCase() === "percentage" && tour.discountValue && (
                        <span className="rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          -{tour.discountValue}%
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-lg font-black text-brand">
                    <MoneyDisplay amountVnd={tour.price} compact />
                  </div>
                </>
              ) : (
                <span className="text-sm font-bold text-brand">{t("home.contactUs")}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
