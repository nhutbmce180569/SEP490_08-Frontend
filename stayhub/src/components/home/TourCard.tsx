import React from "react";
import { MapPin, Clock, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PATH } from "../../config/routes/route";

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

  return (
    <Link
      to={PATH.PUBLIC.TOUR_DETAIL(tour.id)}
      className="group block h-full w-full !no-underline"
    >
      <div
        className="flex h-full flex-col overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
        style={{
          borderRadius: 24,
          border: "1px solid rgba(5,7,60,0.07)",
          boxShadow: "0 2px 16px rgba(5,7,60,0.05)",
        }}
      >
        {/* Image */}
        <div
          className="relative overflow-hidden bg-slate-100"
          style={{ aspectRatio: "4/3", borderRadius: "24px 24px 0 0" }}
        >
          {tour.imageUrl ? (
            <img
              src={tour.imageUrl}
              alt={tour.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
              <span className="text-slate-400 text-xs font-black uppercase tracking-widest text-center px-2">Image Coming Soon</span>
            </div>
          )}

          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Rating badge */}
          <div
            className="absolute left-3 top-3 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-black text-slate-800 backdrop-blur-md shadow-sm"
            style={{ background: "rgba(255,255,255,0.96)", borderRadius: 999 }}
          >
            <Star size={13} className="text-amber-500 fill-amber-500" />
            {tour.rating > 0 ? tour.rating.toFixed(1) : "New"}
            {tour.reviews > 0 && (
              <span className="font-semibold text-slate-400">
                ({tour.reviews})
              </span>
            )}
          </div>

         

          {/* Hover CTA */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <span
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest text-white"
              style={{ background: "#EB662B", borderRadius: 999 }}
            >
              View Tour <ArrowRight size={13} />
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          {/* Location */}
          <div className="mb-2 flex items-center gap-1.5">
            <MapPin
              size={13}
              style={{ color: "#EB662B" }}
              className="shrink-0"
            />
            <span className="truncate text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
              {tour.location}
            </span>
          </div>

          {/* Title */}
          <h3
            className="mb-4 line-clamp-2 text-base font-black leading-snug text-slate-900 transition-colors duration-200 group-hover:text-[#EB662B]"
            style={{
              fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif",
            }}
          >
            {tour.title}
          </h3>

          {/* Footer */}
          <div
            className="mt-auto flex items-center justify-between pt-4"
            style={{ borderTop: "1px solid rgba(5,7,60,0.07)" }}
          >
            {/* Duration */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span
                className="flex h-7 w-7 items-center justify-center"
                style={{
                  background: "#FFF1EB",
                  borderRadius: 8,
                  color: "#EB662B",
                }}
              >
                <Clock size={14} />
              </span>
              {tour.duration}
            </div>

            {/* Price */}
            <div className="text-right">
              <div className="mb-0.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                From
              </div>
              <div
                className="text-base font-black"
                style={{ color: "#EB662B", fontFamily: "'Sora', sans-serif" }}
              >
                {tour.price !== null
                  ? `${tour.price.toLocaleString("vi-VN")} đ`
                  : "Contact us"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
