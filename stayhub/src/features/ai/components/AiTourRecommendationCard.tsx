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
import { formatMatchPercent } from "../utils/formatters";
import { resolvePublicTourId } from "../utils/catalogTourId";
import { ScoreBreakdownPanel } from "./ScoreBreakdownPanel";
import { CustomerScoreBreakdownPanel } from "./CustomerScoreBreakdownPanel";
import { TourWhyFitPanel } from "./TourWhyFitPanel";
import { WeatherAdviceCard } from "./WeatherAdviceCard";
import { MoneyDisplay } from "../../currency/MoneyDisplay";
import {
  buildWhyFitSummary,
  formatMatchReasonTechnical,
  getDisplayMatchTags,
} from "../utils/customerMatchReasons";
import { useLocale, useTranslation } from "../../../contexts/LocaleContext";

interface Props {
  tour: TourRecommendationItem;
  onTourClick?: (tourId: number) => void;
  compact?: boolean;
  friendly?: boolean;
  showScoreBreakdown?: boolean;
  showCustomerBreakdown?: boolean;
  showWhyFit?: boolean;
  customerMode?: boolean;
  variant?: "exact" | "nearby";
  onExplainClick?: (tour: TourRecommendationItem) => void;
}

const getContactPriceText = (locale: "en" | "vi") =>
  locale === "vi" ? "Liên hệ" : "Contact us";

export const AiTourRecommendationCard: React.FC<Props> = ({
  tour,
  onTourClick,
  compact,
  friendly,
  showScoreBreakdown = false,
  showCustomerBreakdown = true,
  showWhyFit = true,
  customerMode = true,
  variant = "exact",
  onExplainClick,
}) => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [customerExpanded, setCustomerExpanded] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);
  const publicTourId = resolvePublicTourId(tour.tourId);
  const location = [tour.city, tour.country].filter(Boolean).join(", ") || t("home.vietnam");
  const imageUrl = tour.imageUrl ? getImg(tour.imageUrl) : "";
  const compactTags = customerMode
    ? getDisplayMatchTags(tour.matchReasons, locale, 2, tour.matchesPreferredDates)
    : tour.matchReasons.slice(0, 2).map((r) => formatMatchReasonTechnical(r, locale));
  const fullTags = customerMode
    ? getDisplayMatchTags(tour.matchReasons, locale, 3, tour.matchesPreferredDates)
    : tour.matchReasons.slice(0, 3).map((r) => formatMatchReasonTechnical(r, locale));

  const whySummary = buildWhyFitSummary(tour.matchReasons, locale);

  if (friendly) {
    return (
      <article className="glass-card flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <Link
            to={PATH.PUBLIC.TOUR_DETAIL(publicTourId)}
            onClick={() => onTourClick?.(publicTourId)}
            className="block h-full !no-underline"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={tour.name}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-bold text-slate-400">
                {t("ai.noImage")}
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => onExplainClick?.(tour)}
            className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black text-brand shadow-sm transition-transform hover:scale-105"
            style={{ background: "rgba(255,255,255,0.96)" }}
            title={t("ai.matchScoreHelp")}
          >
            <Sparkles size={11} />
            {formatMatchPercent(tour.score)}
          </button>

          {variant === "nearby" && (
            <span className="absolute bottom-2.5 left-2.5 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {t("ai.nearbyDateBadge")}
            </span>
          )}

          {tour.averageStar != null && tour.averageStar > 0 && (
            <span
              className="absolute right-2.5 top-2.5 flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-black text-slate-800"
              style={{ background: "rgba(255,255,255,0.96)" }}
            >
              <Star size={11} className="fill-amber-400 text-amber-400" />
              {tour.averageStar.toFixed(1)}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3.5">
          <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <MapPin size={12} className="text-brand" />
            <span className="truncate">{location}</span>
          </p>

          <Link
            to={PATH.PUBLIC.TOUR_DETAIL(publicTourId)}
            onClick={() => onTourClick?.(publicTourId)}
            className="!no-underline"
          >
            <h3 className="line-clamp-2 text-sm font-black leading-snug text-slate-900 hover:text-brand">
              {tour.name}
            </h3>
          </Link>

          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">{whySummary}</p>

          {compactTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {compactTags.map((label) => (
                <span
                  key={label}
                  className="rounded-md bg-brand-light px-2 py-0.5 text-[10px] font-bold text-brand"
                >
                  {label.length > 28 ? `${label.slice(0, 28)}…` : label}
                </span>
              ))}
            </div>
          )}

          {(tour.scheduleNote || tour.nextDeparture) && (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
              <CalendarDays size={12} className="shrink-0 text-brand" />
              <span className="line-clamp-1">
                {tour.scheduleNote ?? formatDeparture(tour.nextDeparture, locale)}
              </span>
            </p>
          )}

          {tour.destinationWeather && (
            <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/50 p-2.5">
              <WeatherAdviceCard weather={tour.destinationWeather} compact />
            </div>
          )}

          <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
            <div>
              {tour.durationDays != null && (
                <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <Clock size={12} className="text-brand" />
                  {tour.durationDays} {locale === "vi" ? "ngày" : "days"}
                </p>
              )}
              <p className="text-base font-black text-brand">
                {tour.minPrice == null ? getContactPriceText(locale) : <MoneyDisplay amountVnd={tour.minPrice} compact />}
              </p>
            </div>
            <Link
              to={PATH.PUBLIC.TOUR_DETAIL(publicTourId)}
              onClick={() => onTourClick?.(publicTourId)}
              className="inline-flex items-center gap-1 rounded-xl bg-brand px-3.5 py-2 text-xs font-bold text-white !no-underline hover:opacity-90"
            >
              {t("ai.viewDetails")}
              <ArrowRight size={13} />
            </Link>
          </div>

          {onExplainClick && tour.scoreBreakdown && (
            <button
              type="button"
              onClick={() => onExplainClick(tour)}
              className="mt-2 w-full text-center text-[11px] font-bold text-brand hover:underline"
            >
              {t("ai.whyMatchPercent", { percent: formatMatchPercent(tour.score) })}
            </button>
          )}
        </div>
      </article>
    );
  }

  if (compact) {
    return (
      <div className="glass-card flex overflow-hidden transition-shadow hover:shadow-md">
        <Link
          to={PATH.PUBLIC.TOUR_DETAIL(publicTourId)}
          onClick={() => onTourClick?.(publicTourId)}
          className="relative w-28 shrink-0 overflow-hidden bg-slate-100 sm:w-32 !no-underline"
        >
          {imageUrl ? (
            <img src={imageUrl} alt={tour.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[96px] items-center justify-center text-[9px] font-bold uppercase text-slate-400">
              {t("ai.noImage")}
            </div>
          )}
          <span
            className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-black text-brand"
            style={{ background: "rgba(255,255,255,0.95)" }}
          >
            <Sparkles size={9} />
            {formatMatchPercent(tour.score)}
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 flex-col p-3">
          <div className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <MapPin size={10} className="text-brand" />
            <span className="truncate">{location}</span>
            {variant === "nearby" && (
              <span className="rounded bg-amber-100 px-1 py-0.5 text-[8px] text-amber-800">
                {t("ai.nearbyDateBadge")}
              </span>
            )}
          </div>

          <Link
            to={PATH.PUBLIC.TOUR_DETAIL(publicTourId)}
            onClick={() => onTourClick?.(publicTourId)}
            className="!no-underline"
          >
            <h3 className="line-clamp-2 text-sm font-black leading-snug text-slate-900 hover:text-brand">
              {tour.name}
            </h3>
          </Link>

          {compactTags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {compactTags.map((label) => (
                <span
                  key={label}
                  className="rounded px-1.5 py-0.5 text-[9px] font-bold text-brand"
                  style={{ background: "var(--color-brand-light)" }}
                >
                  {label.length > 32 ? `${label.slice(0, 32)}…` : label}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <div className="min-w-0 text-[10px] text-slate-500">
              {tour.durationDays != null && (
                <span className="flex items-center gap-0.5">
                  <Clock size={11} className="text-brand" />
                  {tour.durationDays}d
                </span>
              )}
              {(tour.scheduleNote || tour.nextDeparture) && (
                <p className="mt-0.5 line-clamp-1 text-[9px]">
                  {tour.scheduleNote ?? formatDeparture(tour.nextDeparture, locale)}
                </p>
              )}
              {tour.destinationWeather && (
                <div className="mt-1 flex gap-1 items-center font-semibold text-sky-600">
                  <span className="text-[10px]">⛅ {tour.destinationWeather.avgMaxTempC?.toFixed(0)}°C</span>
                  {tour.destinationWeather.totalRainMm != null && tour.destinationWeather.totalRainMm > 20 && (
                     <span className="text-[10px]">☔</span>
                  )}
                </div>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[8px] font-bold uppercase text-slate-400">{t("home.priceFrom")}</p>
              <p className="text-sm font-black text-brand">
                {tour.minPrice == null ? getContactPriceText(locale) : <MoneyDisplay amountVnd={tour.minPrice} compact />}
              </p>
            </div>
          </div>

          {showCustomerBreakdown && customerMode && tour.scoreBreakdown && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setCustomerExpanded((e) => !e)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-100 px-2 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
              >
                <span>{customerExpanded ? t("ai.collapseBreakdown") : t("ai.expandBreakdown")}</span>
                {customerExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {customerExpanded && (
                <div className="mt-2">
                  <CustomerScoreBreakdownPanel breakdown={tour.scoreBreakdown} />
                </div>
              )}
            </div>
          )}

          <Link
            to={PATH.PUBLIC.TOUR_DETAIL(publicTourId)}
            onClick={() => onTourClick?.(publicTourId)}
            className="mt-2 inline-flex items-center gap-1 self-end text-[10px] font-bold text-brand !no-underline hover:underline"
          >
            {t("ai.viewDetails")} <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      <Link
        to={PATH.PUBLIC.TOUR_DETAIL(publicTourId)}
        onClick={() => onTourClick?.(publicTourId)}
        className="group block !no-underline"
      >
        <div
          className="relative overflow-hidden bg-slate-100"
          style={{ aspectRatio: "4/3" }}
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

        {fullTags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {fullTags.map((label) => (
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

        {tour.destinationWeather && (
          <div className="mb-3 rounded-xl border border-sky-100 bg-sky-50/50 p-3">
            <WeatherAdviceCard weather={tour.destinationWeather} compact />
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
              {tour.minPrice == null ? getContactPriceText(locale) : <MoneyDisplay amountVnd={tour.minPrice} compact />}
            </div>
          </div>
        </div>

        {showCustomerBreakdown && customerMode && tour.scoreBreakdown && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setCustomerExpanded((e) => !e)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-600 py-2 px-3 rounded-xl transition-colors hover:bg-slate-50"
              style={{ border: "1px solid rgba(5,7,60,0.08)" }}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} style={{ color: "var(--color-brand)" }} />
                {customerExpanded ? t("ai.collapseBreakdown") : t("ai.expandBreakdown")}
              </span>
              {customerExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {customerExpanded && (
              <div className="mt-3">
                <CustomerScoreBreakdownPanel breakdown={tour.scoreBreakdown} />
              </div>
            )}
          </div>
        )}

        {showScoreBreakdown && tour.scoreBreakdown && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setAdminExpanded((e) => !e)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-600 py-2 px-3 rounded-xl transition-colors hover:bg-slate-50"
              style={{ border: "1px solid rgba(5,7,60,0.08)" }}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} style={{ color: "var(--color-brand)" }} />
                {t("ai.aiExplanationAdmin")}
              </span>
              {adminExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {adminExpanded && (
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
