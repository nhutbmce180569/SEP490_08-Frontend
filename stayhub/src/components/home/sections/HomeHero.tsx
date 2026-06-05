import React, { useState } from "react";
import { MapPin, Search, Sparkles, Calendar } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { ActionButton } from "../ActionButton";
import { PATH } from "../../../config/routes/route";
import { useAiPlanner } from "../../../contexts/AiPlannerContext";
import { HOME_CONTAINER, getFreeApiImage } from "./shared";
import { useTranslation } from "../../../contexts/LocaleContext";

const HERO_IMAGE = getFreeApiImage("vietnam-ha-long-bay-cruise", 1920, 1080);

const QUICK_DEST = ["Da Nang", "Hoi An", "Da Lat", "Ha Long", "Phu Quoc"];

export const HomeHero: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { open: openAiPlanner } = useAiPlanner();
  const [searchLocation, setSearchLocation] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation.trim()) params.append("searchTerm", searchLocation.trim());
    if (searchDate) params.append("startDate", searchDate);
    navigate(`${PATH.PUBLIC.TOUR_SEARCH}?${params.toString()}`);
  };

  return (
    <section className="relative isolate overflow-hidden bg-[#f0f4fa]">
      <div className="relative min-h-[460px] md:min-h-[500px]">
        <img
          src={HERO_IMAGE}
          alt={t("home.heroImageAlt")}
          className="absolute inset-0 h-full w-full object-cover object-center"
          fetchPriority="high"
        />

        <div
          className="absolute inset-0"
          style={{
            background: [
              "linear-gradient(105deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.45) 50%, rgba(15,23,42,0.12) 100%)",
              "linear-gradient(to top, #f0f4fa 0%, rgba(240,244,250,0.97) 12%, transparent 32%)",
            ].join(", "),
          }}
        />

        <div
          className={`${HOME_CONTAINER} relative z-10 flex min-h-[460px] items-center py-[96px] md:min-h-[500px] md:py-[104px]`}
        >
          <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12 xl:grid-cols-[minmax(0,1.05fr)_360px]">
            <div className="max-w-[540px]">
              <h1 className="travel-heading mb-4 text-[1.85rem] leading-[1.1] text-white sm:text-[2.35rem] md:text-[2.75rem]">
                {t("home.titleLine1")}
                <span className="block text-brand-light">{t("home.titleLine2")}</span>
              </h1>
              <p className="mb-6 max-w-[420px] text-[15px] leading-relaxed text-white/78 md:text-base">
                {t("home.subtitle")}
              </p>

              <p className="mb-6 text-sm text-white/70">
                <span className="font-semibold text-white">{t("home.happyTravelersCount")}</span>{" "}
                {t("home.happyTravelersStat")} ·{" "}
                <span className="font-semibold text-white">{t("home.ratingValue")}</span>{" "}
                {t("home.averageRating")}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <ActionButton
                  variant="primary"
                  onClick={() => navigate(PATH.PUBLIC.TOUR_SEARCH)}
                  className="!h-11 !rounded-xl !px-5 !text-sm !font-bold"
                >
                  {t("home.exploreTours")}
                </ActionButton>
                <ActionButton
                  variant="outline"
                  onClick={() => openAiPlanner(pathname)}
                  className="home-glass-chip !h-11 gap-1.5 !rounded-xl !border-white/30 !bg-white/10 !px-4 !text-white hover:!bg-white/18"
                >
                  <Sparkles size={16} />
                  {t("home.aiPlanner")}
                </ActionButton>
              </div>
            </div>

            <div className="w-full lg:justify-self-end">
              <div className="home-glass-tahoe rounded-[1.35rem] p-3.5 md:p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/55">
                  {t("home.planYourTrip")}
                </p>

                <div className="flex flex-col gap-2">
                  <label className="home-glass-field flex items-center gap-3 rounded-xl px-3.5 py-2.5">
                    <MapPin size={17} className="shrink-0 text-white/90" />
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/50">
                        {t("home.whereTo")}
                      </span>
                      <input
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder={t("home.cityOrTour")}
                        className="w-full bg-transparent text-sm font-semibold outline-none"
                      />
                    </div>
                  </label>

                  <label className="home-glass-field flex items-center gap-3 rounded-xl px-3.5 py-2.5">
                    <Calendar size={17} className="shrink-0 text-white/90" />
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-white/50">
                        {t("home.when")}
                      </span>
                      <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="w-full bg-transparent text-sm font-semibold outline-none"
                      />
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={handleSearch}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-hover"
                  >
                    <Search size={17} strokeWidth={2.5} />
                    {t("home.searchTours")}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/15 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    {t("home.popular")}
                  </span>
                  {QUICK_DEST.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        navigate(`${PATH.PUBLIC.TOUR_SEARCH}?searchTerm=${d}`)
                      }
                      className="home-glass-chip rounded-full px-2.5 py-1 text-[11px] font-semibold text-white/90"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
