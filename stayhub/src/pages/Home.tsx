import React, { useState, useEffect } from "react";
import {
  Star,
  MapPin,
  Clock,
  ArrowRight,
  Search,
  Globe,
  Smile,
  ChevronLeft,
  ChevronRight,
  Compass,
  Shield,
  Zap,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ActionButton } from "../components/home/ActionButton";
import { TourCard, type TourCardProps } from "../components/home/TourCard";
import { usePublicTours } from "../hooks/usePublicTours";
import type { Tour } from "../features/tour/types/tour";
import { PATH } from "../config/routes/route";

const getFreeApiImage = (seed: string, width: number, height: number) =>
  `https://picsum.photos/seed/${seed}/${width}/${height}`;

// ─── SECTION HEADER ─────────────────────────────────────────────────────────

const SectionHeader: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  showSeeAll?: boolean;
  onSeeAll?: () => void;
  light?: boolean;
}> = ({ eyebrow, title, subtitle, showSeeAll, onSeeAll, light }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
    <div className="max-w-xl">
      {eyebrow && (
        <span
          className="inline-block mb-3 text-xs font-black uppercase tracking-[0.2em]"
          style={{ color: "#EB662B" }}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={`text-4xl md:text-5xl font-black leading-[1.1] tracking-tight ${
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
          className={`mt-4 text-base font-medium leading-relaxed ${light ? "text-white/70" : "text-slate-500"}`}
        >
          {subtitle}
        </p>
      )}
    </div>
    {showSeeAll && (
      <button
        onClick={onSeeAll}
        className="group inline-flex items-center gap-2.5 text-sm font-black uppercase tracking-widest shrink-0 transition-all duration-200"
        style={{ color: "#EB662B" }}
      >
        Explore All
        <span
          className="flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-200 group-hover:bg-[#EB662B] group-hover:border-[#EB662B] group-hover:text-white"
          style={{ borderColor: "#EB662B", color: "#EB662B" }}
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
    { seed: "hero-travel-bali", label: "Bali, Indonesia" },
    { seed: "hero-travel-alps", label: "Swiss Alps" },
    { seed: "hero-travel-kyoto", label: "Kyoto, Japan" },
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
    <div className="relative min-h-screen flex flex-col justify-end overflow-hidden">
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
      <div className="absolute top-8 right-8 flex gap-2 z-20">
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
                activeSlide === i ? "#EB662B" : "rgba(255,255,255,0.4)",
              border: "none",
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      {/* Location label */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
        <MapPin size={14} style={{ color: "#EB662B" }} />
        <span className="text-white text-xs font-bold tracking-wider">
          {slides[activeSlide].label}
        </span>
      </div>

      {/* Hero content */}
      <div className="relative z-10 pb-0">
        <div className="container mx-auto px-4 lg:px-8 pt-24 pb-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <span
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-[#EB662B]/20 border border-[#EB662B]/40 backdrop-blur-sm"
                style={{ color: "#EB662B" }}
              >
                <Compass size={12} />
                New adventures await
              </span>
            </div>

            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tighter mb-6"
              style={{
                fontFamily:
                  "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif",
              }}
            >
              Explore the
              <br />
              <span
                style={{
                  WebkitTextStroke: "2px #EB662B",
                  color: "transparent",
                }}
              >
                world
              </span>{" "}
              <span style={{ color: "#EB662B" }}>boldly.</span>
            </h1>

            <p className="text-white/70 text-lg md:text-xl font-medium leading-relaxed max-w-lg mb-10">
              Handcrafted tours. Epic destinations. Memories that outlast every
              photo.
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-8 mb-12">
              {[
                { value: "50K+", label: "Happy Travelers" },
                { value: "120+", label: "Destinations" },
                { value: "4.9★", label: "Avg Rating" },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    className="text-2xl font-black text-white"
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
            className="relative rounded-2xl md:rounded-3xl shadow-2xl p-2 max-w-5xl flex flex-col md:flex-row items-center gap-1"
            style={{
              background: "rgba(255,255,255,0.97)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Location */}
            <div className="flex-1 flex items-center gap-3 px-5 py-3.5 rounded-xl cursor-text hover:bg-orange-50/60 transition-colors group">
              <MapPin
                size={20}
                style={{ color: "#EB662B" }}
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
            <div className="flex-1 flex items-center gap-3 px-5 py-3.5 rounded-xl cursor-text hover:bg-orange-50/60 transition-colors">
              <Clock size={20} className="text-blue-400 shrink-0" />
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
            <div className="flex-1 flex items-center gap-3 px-5 py-3.5 rounded-xl hover:bg-orange-50/60 transition-colors cursor-pointer">
              <Smile size={20} className="text-emerald-400 shrink-0" />
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
              className="!h-14 !px-8 gap-2.5 shrink-0 !rounded-xl font-black !text-sm uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              style={{ boxShadow: "0 8px 32px rgba(235,102,43,0.35)" }}
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
            {["Bali", "Tokyo", "Paris", "Maldives", "Vietnam"].map((d) => (
              <button
                key={d}
                onClick={() =>
                  navigate(`${PATH.PUBLIC.TOUR_SEARCH}?searchTerm=${d}`)
                }
                className="px-3 py-1.5 rounded-full text-xs font-bold text-white/70 border border-white/20 hover:border-[#EB662B] hover:text-[#EB662B] transition-all backdrop-blur-sm"
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
    <div className="container mx-auto px-4 lg:px-8">
      <div className="flex items-center justify-between py-5 gap-6 overflow-x-auto">
        {[
          {
            icon: <Shield size={18} style={{ color: "#EB662B" }} />,
            text: "Best Price Guarantee",
          },
          {
            icon: <Zap size={18} style={{ color: "#EB662B" }} />,
            text: "Instant Confirmation",
          },
          {
            icon: <Users size={18} style={{ color: "#EB662B" }} />,
            text: "Expert Local Guides",
          },
          {
            icon: (
              <Star
                size={18}
                style={{ color: "#EB662B" }}
                className="fill-[#EB662B]"
              />
            ),
            text: "4.9★ Rated Service",
          },
          {
            icon: <Globe size={18} style={{ color: "#EB662B" }} />,
            text: "120+ Destinations",
          },
        ].map((item) => (
          <div key={item.text} className="flex items-center gap-2.5 shrink-0">
            {item.icon}
            <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!tours || tours.length === 0) return;
    const timer = setInterval(
      () => setCurrentIndex((p) => (p + 1) % tours.length),
      6000,
    );
    return () => clearInterval(timer);
  }, [tours]);

  if (isLoading)
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 flex justify-center">
          <div className="w-8 h-8 border-4 border-[#EB662B] border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );

  if (error || !tours || tours.length === 0) return null;

  const tour = tours[currentIndex];
  const prices = tour.tourSchedules?.map((s: any) => s.price) || [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const duration = tour.tourItineraries?.length
    ? `${tour.tourItineraries.length} day${tour.tourItineraries.length > 1 ? "s" : ""}`
    : "Flexible";
  const location =
    [tour.city, tour.country].filter(Boolean).join(", ") || "Various Locations";

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeader
          eyebrow="Top Picks"
          title="Featured Experiences"
          subtitle="Our most sought-after adventures, curated just for you."
          showSeeAll
          onSeeAll={() => navigate(PATH.PUBLIC.TOUR_SEARCH)}
        />

        <div
          className="relative rounded-[2.5rem] overflow-hidden bg-slate-900"
          style={{ minHeight: 540 }}
        >
          {/* Background */}
          {tour.imageUrl ? (
            <img
              key={tour.id}
              src={tour.imageUrl}
              alt={tour.name}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/20 font-black text-2xl md:text-3xl uppercase tracking-[0.2em] px-4 text-center">Adventure Awaits</span>
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(5,7,60,0.92) 0%, rgba(5,7,60,0.5) 55%, rgba(5,7,60,0.1) 100%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-end h-full min-h-[540px] p-8 md:p-14 lg:p-16 max-w-2xl">
            <div className="flex gap-2 mb-5 flex-wrap">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white"
                style={{ background: "#EB662B" }}
              >
                ✦ Featured
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-white/15 backdrop-blur-md flex items-center gap-1">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                {tour.averageStar ? tour.averageStar.toFixed(1) : "New"}
                <span className="text-white/60">
                  ({tour.reviews?.length || 0} reviews)
                </span>
              </span>
            </div>

            <h3
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-5"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {tour.name}
            </h3>

            <div className="flex flex-wrap gap-3 mb-8">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-white/80 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl">
                <MapPin size={15} style={{ color: "#EB662B" }} /> {location}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-white/80 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl">
                <Clock size={15} style={{ color: "#EB662B" }} /> {duration}
              </span>
            </div>

            <div className="flex items-center gap-5 flex-wrap">
              <div>
                <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">
                  From
                </div>
                <div
                  className="text-3xl font-black text-white"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {minPrice > 0
                    ? `${minPrice.toLocaleString("vi-VN")} ₫`
                    : "Contact us"}
                </div>
              </div>
              <ActionButton
                variant="primary"
                onClick={() => navigate(PATH.PUBLIC.TOUR_DETAIL(tour.id))}
                className="gap-2.5 !px-8 !h-14 !rounded-2xl font-black !text-sm hover:scale-105 active:scale-95"
                style={{ boxShadow: "0 12px 40px rgba(235,102,43,0.5)" }}
              >
                View Details <ArrowRight size={18} />
              </ActionButton>
            </div>
          </div>

          {/* Slide controls */}
          <div className="absolute bottom-8 right-8 flex items-center gap-2 z-20">
            <ActionButton
              variant="icon"
              onClick={() =>
                setCurrentIndex((p) => (p === 0 ? tours.length - 1 : p - 1))
              }
              className="!w-10 !h-10 !bg-white/10 border border-white/20 !text-white hover:!bg-white hover:!text-slate-900"
            >
              <ChevronLeft size={20} />
            </ActionButton>
            <div className="flex gap-1.5 px-3">
              {tours.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className="transition-all duration-300"
                  style={{
                    width: currentIndex === i ? 24 : 6,
                    height: 6,
                    borderRadius: 999,
                    background:
                      currentIndex === i ? "#EB662B" : "rgba(255,255,255,0.35)",
                    border: "none",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
            <ActionButton
              variant="icon"
              onClick={() => setCurrentIndex((p) => (p + 1) % tours.length)}
              className="!w-10 !h-10 !bg-white/10 border border-white/20 !text-white hover:!bg-white hover:!text-slate-900"
            >
              <ChevronRight size={20} />
            </ActionButton>
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
    const prices = tour.tourSchedules?.map((s: any) => s.price) || [];
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
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
      name: "Bali",
      country: "Indonesia",
      tours: "600+ Tours",
      seed: "bali-beach-temple",
      emoji: "🌴",
      col: "col-span-2 row-span-2",
    },
    {
      name: "Tokyo",
      country: "Japan",
      tours: "400+ Tours",
      seed: "tokyo-neon-night",
      emoji: "🗼",
      col: "col-span-1 row-span-1",
    },
    {
      name: "Paris",
      country: "France",
      tours: "300+ Tours",
      seed: "paris-eiffel-golden",
      emoji: "🗼",
      col: "col-span-1 row-span-1",
    },
    {
      name: "Swiss Alps",
      country: "Switzerland",
      tours: "150+ Tours",
      seed: "swiss-alpine-lake",
      emoji: "⛰️",
      col: "col-span-1 row-span-1",
    },
    {
      name: "Maldives",
      country: "Maldives",
      tours: "200+ Tours",
      seed: "maldives-overwater",
      emoji: "🏝️",
      col: "col-span-1 row-span-1",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeader
          eyebrow="Trending"
          title="Destinations on Fire"
          subtitle="The most-booked places this season — where will you go next?"
          showSeeAll
          onSeeAll={() => navigate(PATH.PUBLIC.TOUR_SEARCH)}
        />

        {/* Bento grid layout */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 grid-rows-2 gap-4"
          style={{ height: 560 }}
        >
          {destinations.map((dest, i) => (
            <div
              key={dest.name}
              onClick={() =>
                navigate(`${PATH.PUBLIC.TOUR_SEARCH}?searchTerm=${dest.name}`)
              }
              className={`group relative rounded-3xl overflow-hidden cursor-pointer ${dest.col}`}
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
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/0 border border-white/0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 group-hover:bg-[#EB662B] group-hover:border-[#EB662B] transition-all duration-300">
                <ArrowRight size={14} />
              </div>

              <div className="absolute bottom-0 left-0 p-5 transition-transform duration-300 group-hover:-translate-y-1">
                <p
                  className="text-[10px] font-black uppercase tracking-[0.2em] mb-1"
                  style={{ color: "#EB662B" }}
                >
                  {dest.country}
                </p>
                <h3
                  className={`font-black text-white leading-tight ${i === 0 ? "text-3xl md:text-4xl" : "text-xl"}`}
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
      color: "#EB662B",
      bg: "#FFF1EB",
      title: "Best Price Guarantee",
      description:
        "Find a lower price anywhere and we'll match it — no questions asked.",
    },
    {
      icon: Globe,
      color: "#3B82F6",
      bg: "#EFF6FF",
      title: "Global Destinations",
      description:
        "120+ handpicked destinations spanning every corner of the planet.",
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
    <section className="py-20" style={{ background: "#05073C" }}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
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
                className="rounded-2xl object-cover w-full h-44"
              />
              <div className="flex flex-col gap-3">
                <img
                  src={getFreeApiImage("adventure-mountain-view", 500, 200)}
                  alt=""
                  className="rounded-2xl object-cover w-full h-[84px]"
                />
                <div
                  className="rounded-2xl flex items-center justify-center h-[84px] font-black text-2xl"
                  style={{
                    background: "#EB662B",
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group p-6 rounded-2xl border border-white/8 hover:border-white/20 transition-all duration-300"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ background: f.bg }}
                  >
                    <Icon size={22} style={{ color: f.color }} />
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
      text: "StayHub made our Bali trip absolutely magical. Every detail was taken care of — best vacation of our lives!",
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
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        <SectionHeader
          eyebrow="Traveler Stories"
          title="They went. They loved it."
          subtitle="Real experiences from real adventurers who booked with us."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="p-8 rounded-3xl border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col gap-5"
              style={{ background: i === 1 ? "#EB662B" : "#FAFAFA" }}
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
                className={`text-base font-medium leading-relaxed flex-1 ${i === 1 ? "text-white" : "text-slate-700"}`}
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
    <section className="py-12 px-4 md:px-8">
      <div
        className="relative rounded-[2.5rem] overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #EB662B 0%, #C94E18 50%, #05073C 100%)",
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

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 px-10 py-14 md:px-16">
          <div>
            <div className="text-sm font-black uppercase tracking-widest text-white/60 mb-3">
              Limited Time
            </div>
            <h2
              className="text-4xl md:text-5xl font-black text-white leading-tight mb-3"
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
              className="!px-8 !h-14 !rounded-2xl font-black !text-sm uppercase tracking-widest !text-[#EB662B] shadow-2xl whitespace-nowrap hover:scale-105 active:scale-95"
            >
              Get Started Free
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => navigate(PATH.PUBLIC.TOUR_SEARCH)}
              className="!px-8 !h-14 !rounded-2xl font-black !text-sm uppercase tracking-widest !text-white border-2 border-white/30 hover:border-white hover:bg-white/10 whitespace-nowrap"
            >
              Browse Tours
            </ActionButton>
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

      {/* 4. Popular Tours Grid — 6 cards */}
      <PopularToursSection />

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
