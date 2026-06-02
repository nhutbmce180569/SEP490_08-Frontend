import React from "react";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Tour } from "../../../features/tour/types/tour";
import { getNumberValue } from "../../../features/tour/utils/tourScheduleTicket";
import { PATH } from "../../../config/routes/route";
import { SectionHeader } from "./SectionHeader";
import { HomeSection } from "./HomeSection";
import { getFreeApiImage, HOME_GLASS, HOME_GLASS_MEDIA } from "./shared";

const getTourLowestTicketPrice = (tour: Tour) => {
  const prices =
    tour.tourSchedules
      ?.flatMap((s) => s.tourScheduleTickets ?? [])
      .map((t) => getNumberValue(t.price))
      .filter((p): p is number => p !== null) ?? [];
  return prices.length > 0 ? Math.min(...prices) : null;
};

const getTourMeta = (tour: Tour) => ({
  minPrice: getTourLowestTicketPrice(tour),
  duration: tour.tourItineraries?.length
    ? `${tour.tourItineraries.length} day${tour.tourItineraries.length > 1 ? "s" : ""}`
    : "Flexible",
  location: [tour.city, tour.country].filter(Boolean).join(", ") || "Vietnam",
});

type HomeFeaturedToursProps = {
  tours: Tour[];
  isLoading: boolean;
  error: string | null;
};

export const HomeFeaturedTours: React.FC<HomeFeaturedToursProps> = ({
  tours,
  isLoading,
  error,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <HomeSection tightTop>
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      </HomeSection>
    );
  }

  if (error || !tours?.length) return null;

  const featured = tours[0];
  const sideTours = tours.slice(1, 5);
  const featuredMeta = getTourMeta(featured);

  return (
    <HomeSection tightTop>
      <SectionHeader
        eyebrow="Editor's picks"
        title="Trips travelers book first"
        subtitle="Handpicked tours with great reviews and flexible schedules."
        showSeeAll
        onSeeAll={() => navigate(PATH.PUBLIC.TOUR_SEARCH)}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <button
          type="button"
          onClick={() => navigate(PATH.PUBLIC.TOUR_DETAIL(featured.id))}
          className={`${HOME_GLASS_MEDIA} group relative min-h-[420px] overflow-hidden rounded-[1.75rem] text-left md:min-h-[480px]`}
        >
          <img
            src={
              featured.imageUrl ||
              getFreeApiImage(`featured-${featured.id}`, 1000, 700)
            }
            alt={featured.name}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-900/10" />

          <div className="relative z-10 flex h-full min-h-[420px] flex-col justify-between p-6 sm:p-8 md:min-h-[480px]">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/30 bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand backdrop-blur-sm">
                Top pick
              </span>
              <span className="rounded-full bg-brand/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
                Featured
              </span>
            </div>

            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="home-glass-chip flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white">
                  <MapPin size={14} />
                  {featuredMeta.location}
                </span>
                <span className="home-glass-chip flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white">
                  <Clock size={14} />
                  {featuredMeta.duration}
                </span>
              </div>
              <h3 className="travel-heading max-w-2xl text-2xl text-white sm:text-4xl">
                {featured.name}
              </h3>
              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                    From
                  </p>
                  <p className="text-2xl font-extrabold text-white">
                    {featuredMeta.minPrice !== null
                      ? `${featuredMeta.minPrice.toLocaleString("vi-VN")}đ`
                      : "Contact us"}
                  </p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand shadow-lg transition group-hover:translate-x-1">
                  <ArrowRight size={20} />
                </span>
              </div>
            </div>
          </div>
        </button>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {sideTours.map((tour, index) => {
            const meta = getTourMeta(tour);
            return (
              <button
                type="button"
                key={tour.id}
                onClick={() => navigate(PATH.PUBLIC.TOUR_DETAIL(tour.id))}
                className={`${HOME_GLASS} group grid min-h-[120px] grid-cols-[120px_1fr] overflow-hidden text-left transition hover:-translate-y-0.5`}
              >
                <div className="relative overflow-hidden bg-slate-100">
                  <img
                    src={
                      tour.imageUrl ||
                      getFreeApiImage(`side-${tour.id}`, 280, 240)
                    }
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    #{index + 2}
                  </span>
                </div>
                <div className="flex flex-col justify-between p-3.5">
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand">
                      <MapPin size={11} />
                      <span className="truncate">{meta.location}</span>
                    </p>
                    <h4 className="line-clamp-2 text-sm font-bold leading-snug text-navy group-hover:text-brand">
                      {tour.name}
                    </h4>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">{meta.duration}</span>
                    <span className="text-brand">
                      {meta.minPrice !== null
                        ? `${meta.minPrice.toLocaleString("vi-VN")}đ`
                        : "Contact"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </HomeSection>
  );
};
