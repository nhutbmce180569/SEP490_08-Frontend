import React, { useState, useEffect, useRef } from "react";
import { MapPin, Search, Sparkles, Calendar } from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ActionButton } from "../ActionButton";
import { PATH } from "../../../config/routes/route";
import { useAiPlanner } from "../../../contexts/AiPlannerContext";
import { HOME_CONTAINER, getFreeApiImage } from "./shared";
import { useTranslation } from "../../../contexts/LocaleContext";
import { getSearchSuggestions } from "../../../hooks/useSearchTours";
import { getTrendPrediction } from "../../../features/ai/services/trend.service";

const HERO_IMAGE = getFreeApiImage("vietnam-ha-long-bay-cruise", 1920, 1080);

const FALLBACK_QUICK_DEST = ["Đà Nẵng", "Hội An", "Đà Lạt", "Hạ Long", "Phú Quốc"];

const removeVietnameseTones = (str: string) => {
  if (!str) return str;
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

export const HomeHero: React.FC = () => {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { open: openAiPlanner } = useAiPlanner();
  const [searchLocation, setSearchLocation] = useState("");
  const [searchDate, setSearchDate] = useState("");
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const searchLocationRef = useRef<HTMLDivElement>(null);
  
  const [quickDestinations, setQuickDestinations] = useState<string[]>([]);

  useEffect(() => {
    // Fetch dynamic hot destinations from AI trend prediction
    const fetchHotDestinations = async () => {
      try {
        const res = await getTrendPrediction();
        if (res.provinceForecasts && res.provinceForecasts.length > 0) {
          // Get top 5 hot provinces
          const topDest = res.provinceForecasts.slice(0, 5).map(p => p.province);
          setQuickDestinations(topDest);
        } else {
          setQuickDestinations(FALLBACK_QUICK_DEST);
        }
      } catch (error) {
        console.error("Failed to fetch hot destinations:", error);
        setQuickDestinations(FALLBACK_QUICK_DEST);
      }
    };
    fetchHotDestinations();
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (searchLocationRef.current && !searchLocationRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!searchLocation.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setIsSuggestionsLoading(true);
        const results = await getSearchSuggestions(searchLocation, controller.signal);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error: any) {
        if (error.name !== 'CanceledError') {
          console.error("Failed to fetch search suggestions:", error);
          setSuggestions([]);
        }
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchLocation]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation.trim()) params.append("searchTerm", searchLocation.trim());
    if (searchDate) params.append("startDate", searchDate);
    navigate(`${PATH.PUBLIC.TOUR_SEARCH}?${params.toString()}`);
    setShowSuggestions(false);
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
                  <div className="relative" ref={searchLocationRef}>
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
                          onFocus={() => searchLocation.trim() && setShowSuggestions(true)}
                          placeholder={t("home.cityOrTour")}
                          className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/40"
                        />
                      </div>
                    </label>
                    {showSuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden text-slate-800">
                        {isSuggestionsLoading ? (
                          <div className="p-4 text-center text-sm text-slate-500">{t("common.loading", { defaultValue: "Loading..." })}</div>
                        ) : suggestions.length > 0 ? (
                          <ul className="py-1 max-h-60 overflow-y-auto custom-scrollbar">
                            {suggestions.map((suggestion, index) => (
                              <li key={index}>
                                <button
                                  type="button"
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-brand-light/50 outline-none text-left"
                                  onClick={() => {
                                    setSearchLocation(suggestion);
                                    setShowSuggestions(false);
                                    // Trigger search immediately after selection
                                    navigate(`${PATH.PUBLIC.TOUR_SEARCH}?searchTerm=${encodeURIComponent(suggestion)}${searchDate ? `&startDate=${searchDate}` : ''}`);
                                  }}
                                >
                                  <Search className="h-4 w-4 text-slate-400 shrink-0" />
                                  <span
                                    className="truncate"
                                    dangerouslySetInnerHTML={{
                                      __html: suggestion.replace(
                                        new RegExp(`(${searchLocation})`, 'gi'),
                                        '<strong class="font-bold text-brand">$1</strong>'
                                      ),
                                    }}
                                  />
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="p-4 text-center text-sm text-slate-500">{t("tour.noToursFound")}</div>
                        )}
                      </div>
                    )}
                  </div>

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
                  {quickDestinations.length === 0 ? (
                    // Loading skeleton or fallback
                    FALLBACK_QUICK_DEST.map((d) => (
                      <span key={d} className="home-glass-chip rounded-full px-2.5 py-1 text-[11px] font-semibold text-white/40 animate-pulse">
                        {locale === "en" ? removeVietnameseTones(d) : d}
                      </span>
                    ))
                  ) : (
                    quickDestinations.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          navigate(`${PATH.PUBLIC.TOUR_SEARCH}?searchTerm=${locale === "en" ? removeVietnameseTones(d) : d}`)
                        }
                        className="home-glass-chip rounded-full px-2.5 py-1 text-[11px] font-semibold text-white/90 hover:bg-white/20 transition-colors"
                      >
                        {locale === "en" ? removeVietnameseTones(d) : d}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
