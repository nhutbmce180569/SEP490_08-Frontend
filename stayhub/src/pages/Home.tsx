import React, { useState, useEffect } from "react";
import {
  Star,
  MapPin,
  Clock,
  ArrowRight,
  Search,
  Globe,
  Smile,
  Compass,
  Shield,
  Zap,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ActionButton } from "../components/home/ActionButton";
import { usePublicTours } from "../hooks/usePublicTours";
import type { Tour } from "../features/tour/types/tour";
import { getNumberValue } from "../features/tour/utils/tourScheduleTicket";
import { PATH } from "../config/routes/route";

const getFreeApiImage = (seed: string, width: number, height: number) =>
  `https://picsum.photos/seed/${seed}/${width}/${height}`;

const HOME_CONTAINER_CLASS =
  "mx-auto w-full max-w-[1320px] px-[15px]";

const getTourLowestTicketPrice = (tour: Tour) => {
  const prices =
    tour.tourSchedules
      ?.flatMap((schedule) => schedule.tourScheduleTickets ?? [])
      .map((ticket) => getNumberValue(ticket.price))
      .filter((price): price is number => price !== null) ?? [];

  return prices.length > 0 ? Math.min(...prices) : null;
};

const SectionHeader: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  showSeeAll?: boolean;
  onSeeAll?: () => void;
  light?: boolean;
}> = ({ eyebrow, title, subtitle, showSeeAll, onSeeAll, light }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
    <div className="max-w-lg">
      {eyebrow && (
        <span
          className="inline-block mb-2 text-[11px] font-black uppercase tracking-[0.16em]"
          style={{ color: "#0068E0" }}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={`text-3xl md:text-4xl font-black leading-[1.12] tracking-tight ${
          light ? "text-white" : "text-slate-900"
        }`}
        style={{
          fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-3 text-sm font-medium leading-relaxed ${light ? "text-white/70" : "text-slate-500"}`}
        >
          {subtitle}
        </p>
      )}
    </div>
    {showSeeAll && (
      <button
        onClick={onSeeAll}
        className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest shrink-0 transition-all duration-200"
        style={{ color: "#0068E0" }}
      >
        Explore All
        <span
          className="flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 group-hover:bg-[#0068E0] group-hover:border-[#0068E0] group-hover:text-white"
          style={{ borderColor: "#0068E0", color: "#0068E0" }}
        >
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </button>
    )}
  </div>
);

// ─── HERO SECTION ───────────────────────────────────────────────────────────

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchType, setSearchType] = useState("All tours");
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    { seed: "vietnam-ha-long-bay-cruise", label: "Ha Long, Vietnam" },
    { seed: "vietnam-da-nang-beach", label: "Da Nang, Vietnam" },
    { seed: "vietnam-hoi-an-lanterns", label: "Hoi An, Vietnam" },
  ];

  useEffect(() => {
    const t = setInterval(
      () => setActiveSlide((s) => (s + 1) % slides.length),
      5000,
    );
    return () => clearInterval(t);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation.trim())
      params.append("searchTerm", searchLocation.trim());
    if (searchDate) params.append("startDate", searchDate);
    navigate(`${PATH.PUBLIC.TOUR_SEARCH}?${params.toString()}`);
  };

  return (
    <div className="relative min-h-[680px] md:min-h-[720px] flex flex-col justify-end overflow-hidden">
      {/* Slideshow background */}
      {slides.map((slide, i) => (
        <img
          key={slide.seed}
          src={getFreeApiImage(slide.seed, 1920, 1080)}
          alt={slide.label}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: activeSlide === i ? 1 : 0 }}
        />
      ))}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 to-slate-900/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 to-transparent" />

      {/* Slide dots */}
      <div className="absolute top-6 right-6 flex gap-2 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveSlide(i)}
            className="transition-all duration-300"
            style={{
              width: activeSlide === i ? 28 : 8,
              height: 8,
              borderRadius: 999,
              background:
                activeSlide === i ? "#0068E0" : "rgba(255,255,255,0.4)",
              border: "none",
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      {/* Location label */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
        <MapPin size={14} style={{ color: "#0068E0" }} />
        <span className="text-white text-xs font-bold tracking-wider">
          {slides[activeSlide].label}
        </span>
      </div>

      {/* Hero content */}
      <div className="relative z-10 pb-0">
        <div className={`${HOME_CONTAINER_CLASS} pt-24 pb-12`}>
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <span
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#0068E0]/20 border border-[#0068E0]/40 backdrop-blur-sm"
                style={{ color: "#0068E0" }}
              >
                <Compass size={12} />
                New adventures await
              </span>
            </div>

            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[0.98] tracking-tight mb-5"
              style={{
                fontFamily:
                  "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif",
              }}
            >
              Explore
              <br />
              <span
                style={{
                  WebkitTextStroke: "2px #0068E0",
                  color: "transparent",
                }}
              >
                Vietnam
              </span>{" "}
              <span style={{ color: "#0068E0" }}>boldly.</span>
            </h1>

            <p className="text-white/70 text-base md:text-lg font-medium leading-relaxed max-w-lg mb-8">
              Handcrafted local tours across Vietnam. Coastal cities, highland
              air, old towns, and routes worth remembering.
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-6 mb-9">
              {[
                { value: "50K+", label: "Happy Travelers" },
                { value: "20+", label: "VN Destinations" },
                { value: "4.9★", label: "Avg Rating" },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    className="text-xl font-black text-white"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    {s.value}
                  </div>
                  <div className="text-xs text-white/50 font-semibold uppercase tracking-wider">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div
            className="relative rounded-2xl shadow-xl p-1.5 max-w-4xl flex flex-col md:flex-row items-center gap-1"
            style={{
              background: "rgba(255,255,255,0.97)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Location */}
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl cursor-text hover:bg-blue-50/60 transition-colors group">
              <MapPin
                size={18}
                style={{ color: "#0068E0" }}
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                  Where to?
                </div>
                <input
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="Destination or activity"
                  className="w-full bg-transparent outline-none font-bold text-slate-800 placeholder:text-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="hidden md:block w-px bg-slate-100 my-2" />

            {/* Date */}
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl cursor-text hover:bg-blue-50/60 transition-colors">
              <Clock size={18} className="text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                  When?
                </div>
                <input
                  type="text"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  placeholder="Pick a date"
                  className="w-full bg-transparent outline-none font-bold text-slate-800 placeholder:text-slate-300 text-sm"
                  onFocus={(e) => (e.target.type = "date")}
                  onBlur={(e) => (e.target.type = "text")}
                />
              </div>
            </div>

            <div className="hidden md:block w-px bg-slate-100 my-2" />

            {/* Type */}
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50/60 transition-colors cursor-pointer">
              <Smile size={18} className="text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                  Tour Type
                </div>
                <select
                  className="w-full outline-none bg-transparent font-bold text-slate-800 cursor-pointer text-sm appearance-none"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                >
                  <option>All tours</option>
                  <option>City Tour</option>
                  <option>Nature</option>
                  <option>Adventure</option>
                  <option>Cultural</option>
                </select>
              </div>
            </div>

            {/* CTA */}
            <ActionButton
              variant="primary"
              onClick={handleSearch}
              className="!h-12 !px-6 gap-2 shrink-0 !rounded-xl font-black !text-xs uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              style={{ boxShadow: "0 8px 32px rgba(0,104,224,0.28)" }}
            >
              <Search size={18} strokeWidth={2.5} />
              Search
            </ActionButton>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-2 mt-5 flex-wrap">
            <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
              Popular:
            </span>
            {["Da Nang", "Hoi An", "Da Lat", "Ha Long", "Phu Quoc"].map((d) => (
              <button
                key={d}
                onClick={() =>
                  navigate(`${PATH.PUBLIC.TOUR_SEARCH}?searchTerm=${d}`)
                }
                className="px-3 py-1.5 rounded-full text-xs font-bold text-white/70 border border-white/20 hover:border-[#0068E0] hover:text-[#0068E0] transition-all backdrop-blur-sm"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── TRUST BAR ───────────────────────────────────────────────────────────────

const TrustBar = () => (
  <div className="bg-white border-b border-slate-100">
    <div className={HOME_CONTAINER_CLASS}>
      <div className="flex items-center justify-between py-4 gap-5 overflow-x-auto">
        {[
          {
            icon: <Shield size={18} style={{ color: "#0068E0" }} />,
            text: "Best Price Guarantee",
          },
          {
            icon: <Zap size={18} style={{ color: "#0068E0" }} />,
            text: "Instant Confirmation",
          },
          {
            icon: <Users size={18} style={{ color: "#0068E0" }} />,
            text: "Expert Local Guides",
          },
          {
            icon: (
              <Star
                size={18}
                style={{ color: "#0068E0" }}
                className="fill-[#0068E0]"
              />
            ),
            text: "4.9★ Rated Service",
          },
          {
            icon: <Globe size={18} style={{ color: "#0068E0" }} />,
            text: "120+ Destinations",
          },
        ].map((item) => (
          <div key={item.text} className="flex items-center gap-2.5 shrink-0">
            {item.icon}
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── FEATURED TOUR SPOTLIGHT ─────────────────────────────────────────────────

const FeaturedTourSection = () => {
  const { tours, isLoading, error } = usePublicTours(1, 5);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className={`${HOME_CONTAINER_CLASS} flex justify-center`}>
          <div className="w-8 h-8 border-4 border-[#0068E0] border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  if (error || !tours || tours.length === 0) return null;

  const topTours = tours.slice(0, 5);
  const featuredTour = topTours[0];
  const sideTours = topTours.slice(1);

  const getTourMeta = (tour: Tour) => {
    const minPrice = getTourLowestTicketPrice(tour);
    const duration = tour.tourItineraries?.length
      ? `${tour.tourItineraries.length} day${tour.tourItineraries.length > 1 ? "s" : ""}`
      : "Flexible";
    const location =
      [tour.city, tour.country].filter(Boolean).join(", ") || "Vietnam";

    return { minPrice, duration, location };
  };

  const featuredMeta = getTourMeta(featuredTour);

  return (
    <section className="relative overflow-hidden py-16">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(0,136,255,0.20), transparent 34%), linear-gradient(135deg, #F8FBFF 0%, #EAF4FF 45%, #FFFFFF 100%)",
        }}
      />
      <div className={`${HOME_CONTAINER_CLASS} relative z-10`}>
        <SectionHeader
          eyebrow="Top 5 Tours"
          title="Vietnam trips worth booking first"
          subtitle="A brighter look at the most interesting tours available right now."
          showSeeAll
          onSeeAll={() => navigate(PATH.PUBLIC.TOUR_SEARCH)}
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
          <button
            type="button"
            onClick={() => navigate(PATH.PUBLIC.TOUR_DETAIL(featuredTour.id))}
            className="group relative min-h-[460px] overflow-hidden rounded-3xl text-left shadow-2xl shadow-blue-900/15"
          >
            {featuredTour.imageUrl ? (
              <img
                src={featuredTour.imageUrl}
                alt={featuredTour.name}
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            ) : (
              <img
                src={getFreeApiImage(`top-tour-${featuredTour.id}`, 900, 650)}
                alt={featuredTour.name}
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0068E0]/45 to-transparent" />

            <div className="relative z-10 flex h-full min-h-[460px] flex-col justify-between p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-widest text-[#0068E0] shadow-sm">
                  #1 Pick
                </span>
                <span className="rounded-full bg-[#0068E0] px-3 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-sm">
                  Featured
                </span>
              </div>

              <div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-sm font-bold text-white backdrop-blur-md">
                    <MapPin size={15} className="text-sky-200" />
                    {featuredMeta.location}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-sm font-bold text-white backdrop-blur-md">
                    <Clock size={15} className="text-sky-200" />
                    {featuredMeta.duration}
                  </span>
                </div>
                <h3
                  className="max-w-2xl text-3xl font-black leading-tight text-white sm:text-5xl"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {featuredTour.name}
                </h3>
                <div className="mt-6 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/50">
                      From
                    </div>
                    <div className="text-2xl font-black text-white">
                      {featuredMeta.minPrice !== null
                        ? `${featuredMeta.minPrice.toLocaleString("vi-VN")} d`
                        : "Contact us"}
                    </div>
                  </div>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0068E0] transition group-hover:translate-x-1">
                    <ArrowRight size={20} />
                  </span>
                </div>
              </div>
            </div>
          </button>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {sideTours.map((tour, index) => {
              const meta = getTourMeta(tour);

              return (
                <button
                  type="button"
                  key={tour.id}
                  onClick={() => navigate(PATH.PUBLIC.TOUR_DETAIL(tour.id))}
                  className="group grid min-h-[136px] grid-cols-[130px_1fr] overflow-hidden rounded-2xl border border-white bg-white text-left shadow-lg shadow-blue-900/5 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                >
                  <div className="relative h-full overflow-hidden bg-slate-100">
                    <img
                      src={tour.imageUrl || getFreeApiImage(`top-tour-small-${tour.id}`, 360, 300)}
                      alt={tour.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    />
                    <div className="absolute left-2 top-2 rounded-full bg-[#0068E0] px-2 py-1 text-[10px] font-black text-white">
                      #{index + 2}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col justify-between p-4">
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#0068E0]">
                        <MapPin size={12} />
                        <span className="truncate">{meta.location}</span>
                      </div>
                      <h3 className="line-clamp-2 text-sm font-black leading-snug text-slate-900 group-hover:text-[#0068E0]">
                        {tour.name}
                      </h3>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-slate-500">
                        {meta.duration}
                      </span>
                      <span className="whitespace-nowrap text-sm font-black text-[#0068E0]">
                        {meta.minPrice !== null
                          ? `${meta.minPrice.toLocaleString("vi-VN")} d`
                          : "Contact"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── POPULAR TOURS GRID ──────────────────────────────────────────────────────

const PopularToursSection = () => {
  const { tours, isLoading, error } = usePublicTours(1, 6);
  const navigate = useNavigate();

  const toTourCardProps = (tour: Tour): TourCardProps => {
    const minPrice = getTourLowestTicketPrice(tour);
    return {
      id: tour.id,
      title: tour.name,
      location:
        [tour.city, tour.country].filter(Boolean).join(", ") || "Various",
      rating: tour.averageStar || 0,
      reviews: tour.reviews?.length || 0,
      duration: tour.tourItineraries?.length
        ? `${tour.tourItineraries.length} day${tour.tourItineraries.length > 1 ? "s" : ""}`
        : "Flexible",
      price: minPrice,
      imageUrl: tour.imageUrl || "",
    };
  };

  return (
    <section className="py-20" style={{ background: "#FFF8F5" }}>
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeader
          eyebrow="Popular Now"
          title="Tours Travelers Love"
          subtitle="Real reviews, real adventures — rated by people who've been there."
          showSeeAll
          onSeeAll={() => navigate(PATH.PUBLIC.TOUR_SEARCH)}
        />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#EB662B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-rose-500 bg-rose-50 rounded-3xl">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.slice(0, 6).map((tour: Tour) => (
              <TourCard key={tour.id} tour={toTourCardProps(tour)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// ─── TRENDING DESTINATIONS ───────────────────────────────────────────────────

const TrendingDestinationsSection = () => {
  const navigate = useNavigate();
  const destinations = [
    {
      name: "Da Nang",
      country: "Central Vietnam",
      tours: "120+ Tours",
      seed: "da-nang-vietnam-beach-bridge",
      col: "col-span-2 row-span-2",
    },
    {
      name: "Hoi An",
      country: "Quang Nam",
      tours: "90+ Tours",
      seed: "hoi-an-vietnam-lantern-town",
      col: "col-span-1 row-span-1",
    },
    {
      name: "Da Lat",
      country: "Lam Dong",
      tours: "75+ Tours",
      seed: "da-lat-vietnam-pine-hills",
      col: "col-span-1 row-span-1",
    },
    {
      name: "Ha Long",
      country: "Quang Ninh",
      tours: "80+ Tours",
      seed: "ha-long-bay-vietnam-limestone",
      col: "col-span-1 row-span-1",
    },
    {
      name: "Phu Quoc",
      country: "Kien Giang",
      tours: "65+ Tours",
      seed: "phu-quoc-vietnam-island",
      col: "col-span-1 row-span-1",
    },
  ];

  return (
    <section className="py-14 bg-white">
      <div className={HOME_CONTAINER_CLASS}>
        <SectionHeader
          eyebrow="Trending"
          title="Vietnam destinations on fire"
          subtitle="The most-booked local places this season."
          showSeeAll
          onSeeAll={() => navigate(PATH.PUBLIC.TOUR_SEARCH)}
        />

        {/* Bento grid layout */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 grid-rows-2 gap-3"
          style={{ height: 460 }}
        >
          {destinations.map((dest, i) => (
            <div
              key={dest.name}
              onClick={() =>
                navigate(`${PATH.PUBLIC.TOUR_SEARCH}?searchTerm=${dest.name}`)
              }
              className={`group relative rounded-2xl overflow-hidden cursor-pointer ${dest.col}`}
              style={{ minHeight: i === 0 ? "auto" : 120 }}
            >
              <img
                src={getFreeApiImage(
                  dest.seed,
                  i === 0 ? 800 : 500,
                  i === 0 ? 800 : 400,
                )}
                alt={dest.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

              {/* Hover reveal arrow */}
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/0 border border-white/0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 group-hover:bg-[#0068E0] group-hover:border-[#0068E0] transition-all duration-300">
                <ArrowRight size={14} />
              </div>

              <div className="absolute bottom-0 left-0 p-4 transition-transform duration-300 group-hover:-translate-y-1">
                <p
                  className="text-[10px] font-black uppercase tracking-[0.2em] mb-1"
                  style={{ color: "#0068E0" }}
                >
                  {dest.country}
                </p>
                <h3
                  className={`font-black text-white leading-tight ${i === 0 ? "text-2xl md:text-3xl" : "text-lg"}`}
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {dest.name}
                </h3>
                <p className="text-xs font-semibold text-white/60 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
                  {dest.tours}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── WHY CHOOSE US ───────────────────────────────────────────────────────────

const WhyChooseUsSection = () => {
  const features = [
    {
      icon: Shield,
      color: "#0068E0",
      bg: "#EAF4FF",
      title: "Best Price Guarantee",
      description:
        "Find a lower price anywhere and we'll match it — no questions asked.",
    },
    {
      icon: Globe,
      color: "#3B82F6",
      bg: "#EFF6FF",
      title: "Vietnam Destinations",
      description:
        "Handpicked city, island, mountain, and heritage routes across Vietnam.",
    },
    {
      icon: Users,
      color: "#10B981",
      bg: "#ECFDF5",
      title: "Expert Local Guides",
      description:
        "Certified guides who know every hidden gem, story, and shortcut.",
    },
    {
      icon: Zap,
      color: "#F59E0B",
      bg: "#FFFBEB",
      title: "Instant Booking",
      description:
        "Reserve your spot in seconds with real-time availability and confirmation.",
    },
  ];

  return (
    <section className="py-14" style={{ background: "#05073C" }}>
      <div className={HOME_CONTAINER_CLASS}>
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left: text + image collage */}
          <div>
            <SectionHeader
              eyebrow="Why StayHub"
              title={"Travel smarter,\nnot harder."}
              subtitle="We sweat the details so you can focus on the moments that matter."
              light
            />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <img
                src={getFreeApiImage("travel-guide-happy", 500, 360)}
                alt=""
                className="rounded-xl object-cover w-full h-36"
              />
              <div className="flex flex-col gap-3">
                <img
                  src={getFreeApiImage("adventure-mountain-view", 500, 200)}
                  alt=""
                  className="rounded-xl object-cover w-full h-[66px]"
                />
                <div
                  className="rounded-xl flex items-center justify-center h-[66px] font-black text-xl"
                  style={{
                    background: "#0068E0",
                    color: "#fff",
                    fontFamily: "'Sora', sans-serif",
                  }}
                >
                  50K+
                  <br />
                  <span className="text-sm font-bold opacity-80">
                    Travelers
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group p-5 rounded-xl border border-white/8 hover:border-white/20 transition-all duration-300"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                    style={{ background: f.bg }}
                  >
                    <Icon size={20} style={{ color: f.color }} />
                  </div>
                  <h3
                    className="text-base font-bold text-white mb-2"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed font-medium">
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── TESTIMONIALS ────────────────────────────────────────────────────────────

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah M.",
      location: "New York, USA",
      avatar: "avatar-sarah",
      rating: 5,
      text: "StayHub made our Da Nang trip absolutely smooth. Every detail was taken care of — best vacation of our lives!",
    },
    {
      name: "Kenji T.",
      location: "Osaka, Japan",
      avatar: "avatar-kenji",
      rating: 5,
      text: "The local guides were incredible. They showed us places no tourist ever finds. I'll be booking again next month.",
    },
    {
      name: "Amara L.",
      location: "London, UK",
      avatar: "avatar-amara",
      rating: 5,
      text: "From booking to the last day, everything was seamless. The customer support is genuinely 24/7 — they saved our trip!",
    },
  ];

  return (
    <section className="py-14 bg-white">
      <div className={HOME_CONTAINER_CLASS}>
        <SectionHeader
          eyebrow="Traveler Stories"
          title="They went. They loved it."
          subtitle="Real experiences from real adventurers who booked with us."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="p-6 rounded-2xl border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4"
              style={{ background: i === 1 ? "#0068E0" : "#FAFAFA" }}
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star
                    key={j}
                    size={16}
                    className={
                      i === 1
                        ? "text-white fill-white"
                        : "text-amber-400 fill-amber-400"
                    }
                  />
                ))}
              </div>

              <p
                className={`text-sm font-medium leading-relaxed flex-1 ${i === 1 ? "text-white" : "text-slate-700"}`}
              >
                "{t.text}"
              </p>

              <div className="flex items-center gap-3">
                <img
                  src={getFreeApiImage(t.avatar, 80, 80)}
                  alt={t.name}
                  className="w-11 h-11 rounded-full object-cover"
                />
                <div>
                  <div
                    className={`text-sm font-black ${i === 1 ? "text-white" : "text-slate-900"}`}
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    {t.name}
                  </div>
                  <div
                    className={`text-xs font-semibold ${i === 1 ? "text-white/70" : "text-slate-400"}`}
                  >
                    {t.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── CTA BANNER ──────────────────────────────────────────────────────────────

const CTASection = () => {
  const navigate = useNavigate();
  return (
    <section className="py-10">
      <div className={HOME_CONTAINER_CLASS}>
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0068E0 0%, #0048B0 50%, #05073C 100%)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20"
          style={{ background: "rgba(255,255,255,0.15)" }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-10"
          style={{ background: "rgba(255,255,255,0.2)" }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 px-6 py-10 md:px-10">
          <div>
            <div className="text-sm font-black uppercase tracking-widest text-white/60 mb-3">
              Limited Time
            </div>
            <h2
              className="text-3xl md:text-4xl font-black text-white leading-tight mb-3"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Your next adventure
              <br />
              starts today.
            </h2>
            <p className="text-white/70 font-medium max-w-md">
              Sign up now and get 15% off your first booking. No promo code
              needed — just pure wanderlust.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <ActionButton
              variant="outline"
              onClick={() => navigate(PATH.PUBLIC.REGISTER)}
              className="!w-auto !px-6 !h-12 !rounded-xl font-black !text-xs uppercase tracking-widest !text-[#0068E0] shadow-xl whitespace-nowrap hover:scale-105 active:scale-95"
            >
              Get Started Free
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => navigate(PATH.PUBLIC.TOUR_SEARCH)}
              className="!w-auto !px-6 !h-12 !rounded-xl font-black !text-xs uppercase tracking-widest !text-white border-2 border-white/30 hover:border-white hover:bg-white/10 whitespace-nowrap"
            >
              Browse Tours
            </ActionButton>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
};

// ─── PAGE ROOT ───────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div
      className="-mt-[88px]"
      style={{
        fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* 1. Hero — Search + slideshow bg */}
      <HeroSection />

      {/* 2. Trust signals — thin bar */}
      <TrustBar />


      {/* 3. Featured / Spotlight — full-bleed carousel card */}
      <FeaturedTourSection />


      {/* 5. Trending Destinations — bento grid */}
      <TrendingDestinationsSection />

      {/* 6. Why Choose Us — dark section with image collage */}
      <WhyChooseUsSection />

      {/* 7. Testimonials — 3 cards */}
      <TestimonialsSection />

      {/* 8. CTA — promo banner */}
      <CTASection />
    </div>
  );
}
