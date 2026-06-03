import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { PATH } from "../../../config/routes/route";
import { getImg } from "../../../config/api/api";
import type { TourRecommendationItem } from "../types/tourAssistant";
import { formatMatchPercent, formatVnd } from "../utils/formatters";
import { resolvePublicTourId } from "../utils/catalogTourId";
import { ScoreBreakdownPanel } from "./ScoreBreakdownPanel";

interface Props {
  tour: TourRecommendationItem;
  onTourClick?: (tourId: number) => void;
  compact?: boolean;
}

export const AiTourRecommendationCard: React.FC<Props> = ({
  tour,
  onTourClick,
  compact,
}) => {
  const [expanded, setExpanded] = useState(false);
  const publicTourId = resolvePublicTourId(tour.tourId);
  const location = [tour.city, tour.country].filter(Boolean).join(", ") || ("home.vietnam");
  const imageUrl = tour.imageUrl ? getImg(tour.imageUrl) : "";

  return (
    <div className="glass-card flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      <Link
        to={PATH.PUBLIC.TOUR_DETAIL(publicTourId)}
        onClick={() => onTourClick?.(publicTourId)}
        className="group block !no-underline"
      >
        <div
          className="relative overflow-hidden bg-slate-100"
          style={{ aspectRatio: compact ? "16/9" : "4/3" }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={tour.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
              <span className="text-slate-400 text-xs font-black uppercase">No image</span>
            </div>
          )}

          <div
            className="absolute left-3 top-3 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-black backdrop-blur-md"
            style={{ background: "rgba(255,255,255,0.96)", borderRadius: 999, color: "var(--color-brand)" }}
          >
            <Sparkles size={12} />
            {formatMatchPercent(tour.score)} match
          </div>

          {tour.averageStar != null && tour.averageStar > 0 && (
            <div
              className="absolute right-3 top-3 flex items-center gap-1 px-2.5 py-1.5 text-xs font-black text-slate-800 backdrop-blur-md"
              style={{ background: "rgba(255,255,255,0.96)", borderRadius: 999 }}
            >
              <Star size={12} className="text-amber-500 fill-amber-500" />
              {tour.averageStar.toFixed(1)}
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-1.5">
          <MapPin size={13} style={{ color: "var(--color-brand)" }} />
          <span className="truncate text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
            {location}
          </span>
        </div>

        <Link
          to={PATH.PUBLIC.TOUR_DETAIL(publicTourId)}
          onClick={() => onTourClick?.(publicTourId)}
          className="!no-underline"
        >
          <h3 className="mb-2 line-clamp-2 text-base font-black text-slate-900 hover:text-brand transition-colors">
            {tour.name}
          </h3>
        </Link>

        {tour.reason && (
          <p className="text-xs text-slate-500 font-medium mb-3 line-clamp-2">{tour.reason}</p>
        )}

        {tour.matchReasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tour.matchReasons.slice(0, 4).map((reason) => (
              <span
                key={reason}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                style={{
                  background: "var(--color-brand-light)",
                  color: "var(--color-brand)",
                  border: "1px solid rgba(235,102,43,0.15)",
                }}
              >
                {reason}
              </span>
            ))}
          </div>
        )}

        <div
          className="mt-auto flex items-center justify-between pt-4"
          style={{ borderTop: "1px solid rgba(5,7,60,0.07)" }}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            {tour.durationDays != null && (
              <span className="flex items-center gap-1">
                <Clock size={14} style={{ color: "var(--color-brand)" }} />
                {tour.durationDays} day{tour.durationDays !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="text-right">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              From
            </div>
            <div className="text-base font-black" style={{ color: "var(--color-brand)" }}>
              {formatVnd(tour.minPrice)}
            </div>
          </div>
        </div>

        {tour.scoreBreakdown && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-600 py-2 px-3 rounded-xl transition-colors hover:bg-slate-50"
              style={{ border: "1px solid rgba(5,7,60,0.08)" }}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} style={{ color: "var(--color-brand)" }} />
                AI explanation
              </span>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {expanded && (
              <div className="mt-3">
                <ScoreBreakdownPanel breakdown={tour.scoreBreakdown} />
              </div>
            )}
          </div>
        )}

        <Link
          to={PATH.PUBLIC.TOUR_DETAIL(publicTourId)}
          onClick={() => onTourClick?.(publicTourId)}
          className="mt-4 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white !no-underline transition-opacity hover:opacity-90"
          style={{ background: "var(--color-brand)" }}
        >
          View details <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};
