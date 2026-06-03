import React, { useMemo } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../config/routes/route";
import { SectionHeader } from "./SectionHeader";
import { HomeSection } from "./HomeSection";
import { getFreeApiImage, HOME_GLASS_MEDIA } from "./shared";
import { useTranslation } from "../../../contexts/LocaleContext";

export const HomeDestinations: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const DESTINATIONS = useMemo(
    () => [
      {
        name: "Da Nang",
        country: t("home.centralVietnam"),
        tours: t("home.toursPlus", { count: 120 }),
        seed: "da-nang-vietnam-beach-bridge",
        hero: true,
      },
      {
        name: "Hoi An",
        country: t("home.quangNam"),
        tours: t("home.toursPlus", { count: 90 }),
        seed: "hoi-an-vietnam-lantern-town",
        hero: false,
      },
      {
        name: "Da Lat",
        country: t("home.lamDong"),
        tours: t("home.toursPlus", { count: 75 }),
        seed: "da-lat-vietnam-pine-hills",
        hero: false,
      },
      {
        name: "Ha Long",
        country: t("home.quangNinh"),
        tours: t("home.toursPlus", { count: 80 }),
        seed: "ha-long-bay-vietnam-limestone",
        hero: false,
      },
      {
        name: "Phu Quoc",
        country: t("home.kienGiang"),
        tours: t("home.toursPlus", { count: 65 }),
        seed: "phu-quoc-vietnam-island",
        hero: false,
      },
    ],
    [t],
  );

  return (
    <HomeSection>
      <SectionHeader
        eyebrow={t("home.destinationsEyebrow")}
        title={t("home.whereGoNext")}
        subtitle={t("home.destinationsExploreSubtitle")}
        showSeeAll
        onSeeAll={() => navigate(PATH.PUBLIC.TOUR_SEARCH)}
      />

      <div className="grid auto-rows-[minmax(140px,1fr)] grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 lg:grid-rows-2 lg:min-h-[440px]">
        {DESTINATIONS.map((dest) => (
          <button
            key={dest.name}
            type="button"
            onClick={() =>
              navigate(`${PATH.PUBLIC.TOUR_SEARCH}?searchTerm=${dest.name}`)
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
                {dest.tours}
              </p>
            </div>
          </button>
        ))}
      </div>
    </HomeSection>
  );
};
