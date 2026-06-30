import React from "react";
import { useNavigate } from "react-router-dom";
import type { Tour } from "../../../features/tour/types/tour";
import { PATH } from "../../../config/routes/route";
import { TourCard, type TourCardProps } from "../TourCard";
import { SectionHeader } from "./SectionHeader";
import { HomeSection } from "./HomeSection";
import { HOME_GLASS } from "./shared";
import { useTranslation } from "../../../contexts/LocaleContext";
import { getTourPriceInfo } from "../../../features/tour/utils/tourPrice";

type HomePopularToursProps = {
  tours: Tour[];
  isLoading: boolean;
  error: string | null;
};

export const HomePopularTours: React.FC<HomePopularToursProps> = ({
  tours,
  isLoading,
  error,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const toCard = (tour: Tour): TourCardProps => {
    const dayCount = tour.tourItineraries?.length ?? 0;
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

  return (
    <HomeSection>
      <SectionHeader
        eyebrow={t("home.popularNow")}
        title={t("home.lovedByTravelers")}
        subtitle={t("home.popularToursSubtitle")}
        showSeeAll
        onSeeAll={() => navigate(PATH.PUBLIC.TOUR_SEARCH)}
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {tours.slice(0, 6).map((tour) => (
            <TourCard key={tour.id} tour={toCard(tour)} />
          ))}
        </div>
      )}
    </HomeSection>
  );
};
