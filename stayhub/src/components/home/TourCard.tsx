import React from "react";
import { MapPin, Clock, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PATH } from "../../config/routes/route";
import { useTranslation } from "../../contexts/LocaleContext";
import { MoneyDisplay } from "../../features/currency/MoneyDisplay";
import { WishlistToggleButton } from "../../features/wishlist/customer/components/WishlistToggleButton";

export interface TourCardProps {
  id: string | number;
  title: string;
  location: string;
  rating: number;
  reviews: number;
  duration: string;
  price: number | null;
  imageUrl: string;
}

export const TourCard: React.FC<{ tour: TourCardProps }> = ({ tour }) => {
  const { t } = useTranslation();
  return (
    <Link
      to={PATH.PUBLIC.TOUR_DETAIL(tour.id)}
      className="group block h-full w-full !no-underline"
    >
      <div className="glass-card flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {tour.imageUrl ? (
            <img
              src={tour.imageUrl}
              alt={tour.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
              <span className="px-2 text-center text-xs font-black uppercase tracking-widest text-slate-400">
                {t("common.imageComingSoon")}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 text-xs font-black text-slate-800 shadow-sm backdrop-blur-md">
            <Star size={13} className="fill-amber-500 text-amber-500" />
            {tour.rating > 0 ? tour.rating.toFixed(1) : t("common.newLabel")}
            {tour.reviews > 0 && (
              <span className="font-semibold text-slate-400">({tour.reviews})</span>
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
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <MapPin size={13} className="shrink-0 text-brand" />
            <span className="truncate">{tour.location || t("home.vietnam")}</span>
          </div>

          <h3 className="travel-heading mb-3 line-clamp-2 text-base leading-snug text-navy transition-colors group-hover:text-brand md:text-lg">
            {tour.title}
          </h3>

          <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100/80 pt-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Clock size={13} />
              {tour.duration || t("home.flexibleDuration")}
            </div>
            <div className="text-right">
              {tour.price != null ? (
                <>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t("home.priceFrom")}
                  </div>
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
