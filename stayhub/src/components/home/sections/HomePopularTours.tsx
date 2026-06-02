import React from "react";
import { useNavigate } from "react-router-dom";
import type { Tour } from "../../../features/tour/types/tour";
import { getNumberValue } from "../../../features/tour/utils/tourScheduleTicket";
import { PATH } from "../../../config/routes/route";
import { TourCard, type TourCardProps } from "../TourCard";
import { SectionHeader } from "./SectionHeader";
import { HomeSection } from "./HomeSection";
import { HOME_GLASS } from "./shared";

const getTourLowestTicketPrice = (tour: Tour) => {
  const prices =
    tour.tourSchedules
      ?.flatMap((s) => s.tourScheduleTickets ?? [])
      .map((t) => getNumberValue(t.price))
      .filter((p): p is number => p !== null) ?? [];
  return prices.length > 0 ? Math.min(...prices) : null;
};

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
  const navigate = useNavigate();

  const toCard = (tour: Tour): TourCardProps => ({
    id: tour.id,
    title: tour.name,
    location: [tour.city, tour.country].filter(Boolean).join(", ") || "Vietnam",
    rating: tour.averageStar || 0,
    reviews: tour.reviews?.length || 0,
    duration: tour.tourItineraries?.length
      ? `${tour.tourItineraries.length} day${tour.tourItineraries.length > 1 ? "s" : ""}`
      : "Flexible",
    price: getTourLowestTicketPrice(tour),
    imageUrl: tour.imageUrl || "",
  });

  return (
    <HomeSection>
      <SectionHeader
        eyebrow="Popular now"
        title="Loved by travelers"
        subtitle="Real reviews from guests who explored with StayHub."
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
