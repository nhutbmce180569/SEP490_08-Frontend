import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../contexts/LocaleContext";
import { PATH } from "../../../config/routes/route";
import { SectionHeader } from "./SectionHeader";
import { HomeSection } from "./HomeSection";
import { TourCard, type TourCardProps } from "../TourCard";
import { getTourPriceInfo } from "../../../features/tour/utils/tourPrice";
import { getTourDurationDays } from "../../../features/tour/utils/tourDuration";
import { useRegionTours } from "../../../hooks/useRegionTours";
import { ChevronLeft, ChevronRight, MapPin, ArrowRight } from "lucide-react";
import type { Tour } from "../../../features/tour/types/tour";

type Region = "north" | "central" | "south";

const REGIONS: { id: Region; labelVi: string; labelEn: string }[] = [
  { id: "north", labelVi: "Miền Bắc", labelEn: "North Vietnam" },
  { id: "central", labelVi: "Miền Trung", labelEn: "Central Vietnam" },
  { id: "south", labelVi: "Miền Nam", labelEn: "South Vietnam" },
];

export const HomeRegions = () => {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const [activeRegion, setActiveRegion] = useState<Region>("north");
  const { tours, isLoading, error } = useRegionTours(activeRegion);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toCard = (tour: Tour): TourCardProps => {
    const dayCount = getTourDurationDays(tour);
    return {
      id: tour.id,
      title: tour.name,
      location: [tour.city, tour.country].filter(Boolean).join(", ") || t("home.vietnam"),
      rating: tour.averageStar || 0,
      reviews: tour.reviews?.length || 0,
      duration:
        dayCount > 0
          ? dayCount > 1
            ? t("home.durationDaysPlural", { count: dayCount })
            : t("home.durationDays", { count: dayCount })
          : t("home.flexibleDuration"),
      ...getTourPriceInfo(tour),
      imageUrl: tour.imageUrl || "",
    };
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const card = scrollRef.current.firstElementChild as HTMLElement;
      const scrollAmount = card ? card.offsetWidth + 24 : 324;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <HomeSection>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-brand font-bold tracking-wider text-sm mb-3">
            <span className="w-8 h-[2px] bg-brand rounded-full" />
            {locale === "vi" ? "ĐIỂM ĐẾN NỔI BẬT" : "TOP DESTINATIONS"}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight mb-4">
            {locale === "vi" ? "Khám phá 3 miền" : "Explore 3 Regions"}
          </h2>
          <p className="text-slate-500 text-lg sm:text-xl font-medium leading-relaxed">
            {locale === "vi" ? "Chọn miền bạn muốn đến" : "Choose your desired region"}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto [scrollbar-width:none]">
          {REGIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRegion(r.id)}
              className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                activeRegion === r.id
                  ? "bg-white text-brand shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <MapPin size={16} className={activeRegion === r.id ? "animate-bounce" : ""} />
              {locale === "vi" ? r.labelVi : r.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-end gap-4 shrink-0 mt-4 md:mt-0">
        {!isLoading && !error && tours.length > 4 && (
          <div className="hidden lg:flex items-center gap-2 shrink-0 mr-2">
            <button
              onClick={() => scroll("left")}
              className="h-9 w-9 flex items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-600 hover:border-brand hover:bg-brand-light/50 hover:text-brand transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="h-9 w-9 flex items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-600 hover:border-brand hover:bg-brand-light/50 hover:text-brand transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
        <button
          onClick={() => navigate(`${PATH.PUBLIC.REGION_TOURS}?region=${activeRegion}`)}
          className="group inline-flex shrink-0 items-center gap-2.5 text-xs font-bold uppercase tracking-widest text-brand transition-colors hover:text-brand-hover"
        >
          {t("common.viewAll")}
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand/30 bg-brand-light/50 text-brand transition-all group-hover:border-brand group-hover:bg-brand group-hover:text-white">
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      ) : error ? (
        <div className="py-16 text-center text-rose-600 bg-white/50 rounded-3xl">
          {error}
        </div>
      ) : tours.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white/50 rounded-3xl font-medium">
          {locale === "vi" ? "Chưa có tour nào trong khu vực này." : "No tours found in this region."}
        </div>
      ) : (
        <div className="relative group/nav">
          {tours.length > 4 && (
            <>
              <button
                onClick={() => scroll("left")}
                className="lg:hidden absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 h-10 w-10 flex items-center justify-center rounded-full border border-slate-200 bg-white/90 backdrop-blur text-slate-800 shadow-md opacity-0 group-hover/nav:opacity-100 transition-opacity"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => scroll("right")}
                className="lg:hidden absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 h-10 w-10 flex items-center justify-center rounded-full border border-slate-200 bg-white/90 backdrop-blur text-slate-800 shadow-md opacity-0 group-hover/nav:opacity-100 transition-opacity"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          <div
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-5 lg:gap-6 pt-4 pb-8 -mt-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {tours.map((tour) => (
              <div
                key={tour.id}
                className="w-[85vw] sm:w-[calc(50%-10px)] lg:w-[calc(25%-18px)] shrink-0 snap-start"
              >
                <TourCard tour={toCard(tour)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </HomeSection>
  );
};
