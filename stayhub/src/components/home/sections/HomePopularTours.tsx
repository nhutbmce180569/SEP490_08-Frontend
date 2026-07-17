import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Tour } from "../../../features/tour/types/tour";
import { PATH } from "../../../config/routes/route";
import { TourCard, type TourCardProps } from "../TourCard";
import { SectionHeader } from "./SectionHeader";
import { HomeSection } from "./HomeSection";
import { HOME_GLASS } from "./shared";
import { useTranslation } from "../../../contexts/LocaleContext";
import { getTourPriceInfo } from "../../../features/tour/utils/tourPrice";
import { getTourDurationDays } from "../../../features/tour/utils/tourDuration";
import { ChevronLeft, ChevronRight } from "lucide-react";

type HomePopularToursProps = {
  tours: Tour[];
  isLoading: boolean;
  error: string | null;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
};

export const HomePopularTours: React.FC<HomePopularToursProps> = ({
  tours,
  isLoading,
  error,
  title,
  subtitle,
  eyebrow,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
      const scrollAmount = card ? card.offsetWidth + 24 : 324; // 24 is max gap
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <HomeSection>
      <SectionHeader
        eyebrow={eyebrow || t("home.popularNow")}
        title={title || t("home.lovedByTravelers")}
        subtitle={subtitle || t("home.popularToursSubtitle")}
        showSeeAll
        onSeeAll={() => navigate(PATH.PUBLIC.TOUR_SEARCH)}
        actionSlot={
          !isLoading && !error && tours.length > 4 ? (
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
          ) : null
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      ) : error ? (
        <div className={`${HOME_GLASS} py-16 text-center text-rose-600`}>
          {error}
        </div>
      ) : (
        <div className="relative group/nav">
          {/* Mobile/Tablet scroll buttons inside the container */}
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
