import React, { useMemo } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../config/routes/route";
import { SectionHeader } from "./SectionHeader";
import { HomeSection } from "./HomeSection";
import { getFreeApiImage, HOME_GLASS_MEDIA } from "./shared";
import { useTranslation } from "../../../contexts/LocaleContext";
import { usePublicTours } from "../../../hooks/usePublicTours";

export const HomeDestinations: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Load active tours from backend (up to 100) to dynamically extract locations
  const { tours, isLoading } = usePublicTours(1, 100);

  const dynamicDestinations = useMemo(() => {
    // If no tours have been loaded or list is empty, return static high-quality fallbacks
    if (!tours || tours.length === 0) {
      return [
        {
          name: "Da Nang",
          country: t("home.centralVietnam") || "Vietnam",
          toursCount: 12,
          seed: "da-nang-vietnam-beach-bridge",
          hero: true,
        },
        {
          name: "Hoi An",
          country: t("home.quangNam") || "Vietnam",
          toursCount: 9,
          seed: "hoi-an-vietnam-lantern-town",
          hero: false,
        },
        {
          name: "Da Lat",
          country: t("home.lamDong") || "Vietnam",
          toursCount: 7,
          seed: "da-lat-vietnam-pine-hills",
          hero: false,
        },
        {
          name: "Ha Long",
          country: t("home.quangNinh") || "Vietnam",
          toursCount: 8,
          seed: "ha-long-bay-vietnam-limestone",
          hero: false,
        },
        {
          name: "Phu Quoc",
          country: t("home.kienGiang") || "Vietnam",
          toursCount: 6,
          seed: "phu-quoc-vietnam-island",
          hero: false,
        },
      ];
    }

    // Extract unique cities from active tours
    const cityMap: Record<string, { country: string; count: number }> = {};
    tours.forEach((tour) => {
      const city = tour.city?.trim();
      const country = tour.country?.trim() || "Vietnam";
      if (city) {
        // Capitalize city name nicely
        const formattedCity = city
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");

        if (!cityMap[formattedCity]) {
          cityMap[formattedCity] = { country, count: 0 };
        }
        cityMap[formattedCity].count += 1;
      }
    });

    // Convert map to array and sort by tour count descending
    const sortedCities = Object.entries(cityMap)
      .map(([name, info]) => ({
        name,
        country: info.country,
        toursCount: info.count,
        seed: `${name.toLowerCase().replace(/\s+/g, "-")}-vietnam-travel`,
        hero: false,
      }))
      .sort((a, b) => b.toursCount - a.toursCount);

    // Default list of major destinations to back-fill if fewer than 5 cities are found
    const defaults = [
      { name: "Da Nang", country: "Vietnam", seed: "da-nang-vietnam-beach-bridge" },
      { name: "Hoi An", country: "Vietnam", seed: "hoi-an-vietnam-lantern-town" },
      { name: "Da Lat", country: "Vietnam", seed: "da-lat-vietnam-pine-hills" },
      { name: "Ha Long", country: "Vietnam", seed: "ha-long-bay-vietnam-limestone" },
      { name: "Phu Quoc", country: "Vietnam", seed: "phu-quoc-vietnam-island" },
    ];

    const finalDestinations = [...sortedCities];
    defaults.forEach((def) => {
      if (
        finalDestinations.length < 5 &&
        !finalDestinations.some((d) => d.name.toLowerCase() === def.name.toLowerCase())
      ) {
        finalDestinations.push({
          name: def.name,
          country: def.country,
          toursCount: 0,
          seed: def.seed,
          hero: false,
        });
      }
    });

    // Limit to 5 and set the first one as hero
    const result = finalDestinations.slice(0, 5);
    if (result.length > 0) {
      result[0].hero = true;
    }

    return result;
  }, [tours, t]);

  return (
    <HomeSection>
      <SectionHeader
        eyebrow={t("home.destinationsEyebrow")}
        title={t("home.whereGoNext")}
        subtitle={t("home.destinationsExploreSubtitle")}
        showSeeAll
        onSeeAll={() => navigate(PATH.PUBLIC.TOUR_SEARCH)}
      />

      {isLoading && (!tours || tours.length === 0) ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      ) : (
        <div className="grid auto-rows-[minmax(140px,1fr)] grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 lg:grid-rows-2 lg:min-h-[440px]">
          {dynamicDestinations.map((dest) => (
            <button
              key={dest.name}
              type="button"
              onClick={() =>
                navigate(`${PATH.PUBLIC.TOUR_SEARCH}?searchTerm=${encodeURIComponent(dest.name)}`)
              }
              className={`home-dest-tile ${HOME_GLASS_MEDIA} group relative cursor-pointer rounded-2xl text-left ${
                dest.hero
                  ? "home-dest-tile--hero col-span-2 row-span-2 min-h-[280px] lg:min-h-0"
                  : "min-h-[140px]"
              }`}
            >
              <img
                src={getFreeApiImage(
                  dest.seed,
                  dest.hero ? 900 : 500,
                  dest.hero ? 900 : 400,
                )}
                alt={dest.name}
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />

              <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white opacity-0 backdrop-blur-md transition-all group-hover:opacity-100">
                <ArrowRight size={16} />
              </span>

              <div className="absolute bottom-0 left-0 p-4 md:p-5">
                <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-brand-light">
                  <MapPin size={11} />
                  {dest.country}
                </p>
                <h3
                  className={`travel-heading text-white ${
                    dest.hero ? "text-2xl md:text-4xl" : "text-lg md:text-xl"
                  }`}
                >
                  {dest.name}
                </h3>
                <p className="mt-1 text-xs font-medium text-white/70 opacity-0 transition-opacity group-hover:opacity-100">
                  {dest.toursCount > 0
                    ? t("home.toursPlus", { count: dest.toursCount })
                    : t("home.exploreTours")}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </HomeSection>
  );
};
