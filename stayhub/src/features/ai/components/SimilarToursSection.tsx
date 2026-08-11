import React, { useRef, useState, useEffect } from "react";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  X,
} from "lucide-react";
import { AiTourRecommendationCard } from "./AiTourRecommendationCard";
import { useSimilarTours } from "../hooks/useSimilarTours";
import { useLogAiInteraction } from "../hooks/useLogAiInteraction";
import { useTranslation } from "../../../contexts/LocaleContext";
import { formatMatchPercent } from "../utils/formatters";
import type { TourRecommendationItem } from "../types/tourAssistant";

interface Props {
  tourId: string | number;
  top?: number;
  sourceCity?: string;
  sourceDurationDays?: number;
  sourceMinPrice?: number;
}

interface SimilarityTag {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
}

function getSimilarityTags(
  similar: TourRecommendationItem,
  sourceCity?: string,
  sourceDurationDays?: number,
  sourceMinPrice?: number,
  t?: (key: string, opts?: Record<string, unknown>) => string,
): SimilarityTag[] {
  const tags: SimilarityTag[] = [];

  if (
    sourceCity &&
    similar.city &&
    similar.city.trim().toLowerCase() === sourceCity.trim().toLowerCase()
  ) {
    tags.push({
      icon: <MapPin className="h-3.5 w-3.5" />,
      label: t?.("ai.sameCity", { defaultValue: "Cùng địa điểm" }) ?? "Cùng địa điểm",
      color: "text-emerald-700",
      bgColor: "bg-emerald-50 border-emerald-200",
    });
  }

  if (sourceDurationDays != null && similar.durationDays != null) {
    const diff = Math.abs(similar.durationDays - sourceDurationDays);
    if (diff === 0) {
      tags.push({
        icon: <Clock className="h-3.5 w-3.5" />,
        label: t?.("ai.sameDuration", { defaultValue: "Cùng thời lượng" }) ?? "Cùng thời lượng",
        color: "text-blue-700",
        bgColor: "bg-blue-50 border-blue-200",
      });
    } else if (diff <= 2) {
      tags.push({
        icon: <Clock className="h-3.5 w-3.5" />,
        label:
          t?.("ai.similarDuration", { defaultValue: "Thời lượng tương đương" }) ??
          "Thời lượng tương đương",
        color: "text-blue-600",
        bgColor: "bg-blue-50 border-blue-200",
      });
    }
  }

  if (
    sourceMinPrice != null &&
    sourceMinPrice > 0 &&
    similar.minPrice != null &&
    similar.minPrice > 0
  ) {
    const ratio = similar.minPrice / sourceMinPrice;
    if (ratio >= 0.65 && ratio <= 1.35) {
      tags.push({
        icon: <DollarSign className="h-3.5 w-3.5" />,
        label: t?.("ai.similarPrice", { defaultValue: "Giá tương đương" }) ?? "Giá tương đương",
        color: "text-amber-700",
        bgColor: "bg-amber-50 border-amber-200",
      });
    }
  }

  tags.push({
    icon: <FileText className="h-3.5 w-3.5" />,
    label:
      t?.("ai.contentSimilar", { defaultValue: "Nội dung & hành trình tương tự" }) ??
      "Nội dung & hành trình tương tự",
    color: "text-violet-700",
    bgColor: "bg-violet-50 border-violet-200",
  });

  return tags;
}

interface CardWithPopupProps {
  tour: TourRecommendationItem;
  sourceCity?: string;
  sourceDurationDays?: number;
  sourceMinPrice?: number;
  onTourClick: (id: number) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

const CardWithPopup: React.FC<CardWithPopupProps> = ({
  tour,
  sourceCity,
  sourceDurationDays,
  sourceMinPrice,
  onTourClick,
  t,
}) => {
  const [open, setOpen] = useState(false);
  const tags = getSimilarityTags(tour, sourceCity, sourceDurationDays, sourceMinPrice, t);

  return (
    <div className="relative flex flex-col h-full">
      <AiTourRecommendationCard
        tour={tour}
        showWhyFit={false}
        showCustomerBreakdown={false}
        onTourClick={onTourClick}
      />

      {/* "Why match?" trigger button — sits flush to the bottom edge of the card */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-[-1px] flex w-full items-center justify-center gap-1.5 rounded-b-2xl border border-t-0 border-slate-200 bg-slate-50 py-2 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-brand/5 hover:text-brand"
      >
        <Sparkles className="h-3 w-3" />
        {t("ai.whySimilar", { defaultValue: "Tại sao tương tự?" })}
        <span className="ml-auto mr-3 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-black text-brand">
          {formatMatchPercent(tour.score)}
        </span>
      </button>

      {/* Slide-up popup panel */}
      {open && (
        <div className="absolute inset-x-0 bottom-[36px] z-20 rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-brand/10 to-violet-500/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" />
              <span className="text-xs font-black text-slate-800">
                {t("ai.whySimilarTitle", { defaultValue: "Lý do tương đồng" })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-black text-white">
                {formatMatchPercent(tour.score)}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Tags list */}
          <div className="divide-y divide-slate-100">
            {tags.map((tag, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-2.5 ${tag.color}`}
              >
                <span className={`rounded-lg border p-1.5 ${tag.bgColor}`}>{tag.icon}</span>
                <span className="text-xs font-semibold text-slate-700">{tag.label}</span>
              </div>
            ))}
          </div>

          {/* Score bar */}
          <div className="border-t border-slate-100 px-4 py-3">
            <div className="mb-1 flex justify-between text-[10px] font-semibold text-slate-400">
              <span>{t("ai.similarity", { defaultValue: "Mức tương đồng" })}</span>
              <span className="text-brand font-black">{formatMatchPercent(tour.score)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-violet-500 transition-all duration-700"
                style={{ width: `${Math.round(tour.score * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const SimilarToursSection: React.FC<Props> = ({
  tourId,
  top = 5,
  sourceCity,
  sourceDurationDays,
  sourceMinPrice,
}) => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useSimilarTours(tourId, top);
  const logInteraction = useLogAiInteraction();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const tours = Array.isArray(data) ? data : [];

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [tours]);

  if (isError || (!isLoading && tours.length === 0)) return null;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 284;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="mt-16 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles size={20} style={{ color: "var(--color-brand)" }} />
          <h2
            className="text-2xl font-black text-slate-900"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {t("ai.similarTours")}
          </h2>
        </div>

        {!isLoading && tours.length > 0 && (canScrollLeft || canScrollRight) && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className={`p-2 rounded-full border transition-colors ${
                canScrollLeft
                  ? "border-slate-200 text-slate-600 hover:text-brand hover:border-brand hover:bg-brand/5"
                  : "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed opacity-50"
              }`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className={`p-2 rounded-full border transition-colors ${
                canScrollRight
                  ? "border-slate-200 text-slate-600 hover:text-brand hover:border-brand hover:bg-brand/5"
                  : "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed opacity-50"
              }`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-6 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[260px] rounded-3xl overflow-hidden animate-pulse">
              <div className="bg-slate-200 aspect-[4/3]" />
              <div className="p-5 space-y-3 bg-white">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-6 overflow-x-auto thin-scrollbar pb-4 snap-x snap-mandatory"
        >
          {tours.map((tour) => (
            <div key={tour.tourId} className="min-w-[260px] max-w-[260px] snap-start">
              <CardWithPopup
                tour={tour}
                sourceCity={sourceCity}
                sourceDurationDays={sourceDurationDays}
                sourceMinPrice={sourceMinPrice}
                onTourClick={(id) => logInteraction(id, "click")}
                t={t}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
