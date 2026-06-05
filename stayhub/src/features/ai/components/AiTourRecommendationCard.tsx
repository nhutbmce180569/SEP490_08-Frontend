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
  CalendarDays,
} from "lucide-react";
import { PATH } from "../../../config/routes/route";
import { getImg } from "../../../config/api/api";
import type { TourRecommendationItem } from "../types/tourAssistant";
import { formatMatchPercent, formatVnd } from "../utils/formatters";
import { resolvePublicTourId } from "../utils/catalogTourId";
import { ScoreBreakdownPanel } from "./ScoreBreakdownPanel";
import { TourWhyFitPanel } from "./TourWhyFitPanel";
import {
  formatMatchReasonTechnical,
  getCustomerMatchTags,
} from "../utils/customerMatchReasons";
import { useLocale, useTranslation } from "../../../contexts/LocaleContext";

interface Props {
  tour: TourRecommendationItem;
  onTourClick?: (tourId: number) => void;
  compact?: boolean;
  showScoreBreakdown?: boolean;
  showWhyFit?: boolean;
  customerMode?: boolean;
  variant?: "exact" | "nearby";
}

export const AiTourRecommendationCard: React.FC<Props> = ({
  tour,
  onTourClick,
  compact,
  showScoreBreakdown = false,
  showWhyFit = true,
  customerMode = true,
  variant = "exact",
}) => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const publicTourId = resolvePublicTourId(tour.tourId);
  const location = [tour.city, tour.country].filter(Boolean).join(", ") || t("home.vietnam");
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
              <span className="text-slate-400 text-xs font-black uppercase">{t("ai.noImage")}</span>
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-col gap-1">
            <span
              className="flex w-fit items-center gap-1.5 px-2.5 py-1.5 text-xs font-black backdrop-blur-md"
              style={{ background: "rgba(255,255,255,0.96)", borderRadius: 999, color: "var(--color-brand)" }}
              title={t("ai.matchScoreHelp")}
            >
              <Sparkles size={12} />
              {t("ai.matchLabel", { percent: formatMatchPercent(tour.score) })}
            </span>
            {variant === "nearby" && (
              <span className="w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                {t("ai.nearbyDateBadge")}
              </span>
            )}
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

        {tour.matchReasons.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(customerMode
              ? getCustomerMatchTags(tour.matchReasons, locale, 3)
              : tour.matchReasons.slice(0, 3).map((r) => formatMatchReasonTechnical(r, locale))
            ).map((label) => (
              <span
                key={label}
                className="rounded-lg px-2.5 py-1 text-[10px] font-bold"
                style={{
                  background: "var(--color-brand-light)",
                  color: "var(--color-brand)",
                  border: "1px solid rgba(235,102,43,0.15)",
                }}
              >
                {label.length > 48 ? `${label.slice(0, 48)}…` : label}
              </span>
            ))}
          </div>
        )}

        {(tour.scheduleNote || tour.nextDeparture) && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            <CalendarDays size={14} className="mt-0.5 shrink-0 text-brand" />
            <span>{tour.scheduleNote ?? formatDeparture(tour.nextDeparture, locale)}</span>
          </div>
        )}

        {showWhyFit && (
          <TourWhyFitPanel
            reason={tour.reason}
            matchReasons={tour.matchReasons}
            customerMode={customerMode}
          />
        )}

        <div
          className={`flex items-center justify-between pt-4 ${showWhyFit ? "mt-3" : "mt-auto"}`}
          style={{ borderTop: "1px solid rgba(5,7,60,0.07)" }}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            {tour.durationDays != null && (
              <span className="flex items-center gap-1">
                <Clock size={14} style={{ color: "var(--color-brand)" }} />
                {tour.durationDays !== 1
                  ? t("home.durationDaysPlural", { count: tour.durationDays })
                  : t("home.durationDays", { count: tour.durationDays })}
              </span>
            )}
          </div>
          <div className="text-right">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              {t("home.priceFrom")}
            </div>
            <div className="text-base font-black" style={{ color: "var(--color-brand)" }}>
              {formatVnd(tour.minPrice, locale)}
            </div>
          </div>
        </div>

        {showScoreBreakdown && tour.scoreBreakdown && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-600 py-2 px-3 rounded-xl transition-colors hover:bg-slate-50"
              style={{ border: "1px solid rgba(5,7,60,0.08)" }}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} style={{ color: "var(--color-brand)" }} />
                {t("ai.aiExplanationAdmin")}
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
          {t("ai.viewDetails")} <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};

function formatDeparture(iso: string | undefined, locale: "en" | "vi") {
  if (!iso) return "";
  const d = new Date(iso);
  const formatted = d.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return locale === "vi" ? `Khởi hành ${formatted}` : `Departs ${formatted}`;
}
