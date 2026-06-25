import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { PATH } from "../../../config/routes/route";
import { useAiPlanner } from "../../../contexts/AiPlannerContext";
import { AiTourRecommendationCard } from "../components/AiTourRecommendationCard";
import { AiModelsNotReadyBanner } from "../components/AiModelsNotReadyBanner";
import { AiResultsViewTabs, type ResultsViewTab } from "../components/AiResultsViewTabs";
import { DestinationTipsPanel } from "../components/DestinationTipsPanel";
import { ScheduleNoticeBanner } from "../components/ScheduleNoticeBanner";
import { TripContextPanel } from "../components/TripContextPanel";
import { TripSummaryChips } from "../components/TripSummaryChips";
import { TourMatchModal } from "../components/TourMatchModal";
import { RelatedInsightsCarousel } from "../components/RelatedInsightsCarousel";
import { RecommenderMetaPanel } from "../components/RecommenderMetaPanel";
import { TipsTabsPanel } from "../components/TipsTabsPanel";
import { WeatherAdviceCard } from "../components/WeatherAdviceCard";
import { useRecommendFromProfile } from "../hooks/useRecommendFromProfile";
import { useLogAiInteraction } from "../hooks/useLogAiInteraction";
import type {
  PersonalizedRecommendationResponse,
  TourRecommendationItem,
} from "../types/tourAssistant";
import { useLocale, useTranslation } from "../../../contexts/LocaleContext";
import { AuthContext } from "../../../contexts/AuthContext";
import { normalizeRoles } from "../../../utils/jwt";

type TourFilter = "all" | "exact" | "nearby";

export const AiRecommendationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { open: openAiPlanner } = useAiPlanner();
  const stateData = location.state as PersonalizedRecommendationResponse | undefined;
  const { data: hookData, modelsNotReady, submit, retryLast, isLoading } =
    useRecommendFromProfile();
  const logInteraction = useLogAiInteraction();
  const retriedRef = useRef(false);
  const isAdminView = normalizeRoles(user?.roles).includes("ADMIN");
  const [data, setData] = useState<PersonalizedRecommendationResponse | undefined>(
    stateData ?? hookData ?? undefined,
  );
  const [viewTab, setViewTab] = useState<ResultsViewTab>("tours");
  const [tourFilter, setTourFilter] = useState<TourFilter>("all");
  const [explainTour, setExplainTour] = useState<TourRecommendationItem | null>(null);
  const prevLocaleRef = useRef(locale);

  useEffect(() => {
    setData(stateData ?? hookData ?? undefined);
  }, [stateData, hookData]);

  useEffect(() => {
    if (prevLocaleRef.current === locale) return;
    prevLocaleRef.current = locale;
    const profile = data?.appliedProfile;
    if (!profile) return;
    submit(profile)
      .then((result) => {
        if (result) {
          setData(result);
          navigate(PATH.PUBLIC.AI_RECOMMENDATIONS, { state: result, replace: true });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  useEffect(() => {
    if (!data && !retriedRef.current) {
      retriedRef.current = true;
      openAiPlanner(location.pathname);
      navigate(PATH.PUBLIC.HOME, { replace: true });
    }
  }, [data, navigate, openAiPlanner, location.pathname]);

  const handleRetryModels = async () => {
    const profile = stateData?.appliedProfile ?? hookData?.appliedProfile;
    try {
      const result = profile ? await submit(profile) : await retryLast();
      if (result)
        navigate(PATH.PUBLIC.AI_RECOMMENDATIONS, { state: result, replace: true });
    } catch { /* noop */ }
  };

  const exactTours = data?.recommendedTours ?? [];
  const nearbyTours = data?.nearbyScheduleTours ?? [];
  const schedule = data?.scheduleAvailability;
  const showExactSection = exactTours.length > 0;
  const showNearbySection = nearbyTours.length > 0;
  const totalTours = exactTours.length + nearbyTours.length;

  const displayedTours = useMemo(() => {
    if (tourFilter === "exact") return exactTours;
    if (tourFilter === "nearby") return nearbyTours;
    return [...exactTours, ...nearbyTours];
  }, [tourFilter, exactTours, nearbyTours]);

  useEffect(() => {
    if (!showExactSection && showNearbySection) setTourFilter("nearby");
    else if (showExactSection) setTourFilter("all");
  }, [showExactSection, showNearbySection]);

  if (!data && !modelsNotReady) {
    return (
      <div className="home-page flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (modelsNotReady) {
    return (
      <div className="home-page min-h-screen px-4 pb-16 pt-8">
        <div className="mx-auto max-w-3xl">
          <AiModelsNotReadyBanner onRetry={handleRetryModels} />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const preferredCity = data.appliedProfile?.preferredCity?.trim();
  const tourCities = preferredCity
    ? [preferredCity]
    : [
        ...new Set(
          [...exactTours, ...nearbyTours]
            .map((tour) => tour.city?.trim())
            .filter((c): c is string => Boolean(c)),
        ),
      ];

  const tourFilters = ([
    {
      id: "all" as const,
      label: t("ai.tourTabAll", { count: totalTours }),
      show: showExactSection && showNearbySection,
    },
    {
      id: "exact" as const,
      label: t("ai.tourTabExact", { count: exactTours.length }),
      show: showExactSection,
    },
    {
      id: "nearby" as const,
      label: t("ai.tourTabNearby", { count: nearbyTours.length }),
      show: showNearbySection,
    },
  ] as { id: TourFilter; label: string; show: boolean }[]).filter((f) => f.show);

  return (
    <div className="home-page min-h-screen pb-20">
      <div className="mx-auto max-w-5xl px-4 pt-6">
        {/* Page intro */}
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-light text-brand">
              <Sparkles size={20} />
            </span>
            <div>
              <h1 className="text-xl font-black text-navy md:text-2xl">
                {t("ai.resultsPageTitle")}
              </h1>
              <p className="text-sm text-slate-500">
                {totalTours > 0
                  ? t("ai.resultsPageSubtitle", { count: totalTours })
                  : t("ai.resultsPageSubtitleEmpty")}
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">{data.summary}</p>
        </div>

        <div className="mb-5">
          <TripSummaryChips
            profile={data.appliedProfile}
            onEdit={() => openAiPlanner(location.pathname)}
          />
        </div>

        {schedule && (
          <div className="mb-5">
            <ScheduleNoticeBanner schedule={schedule} hasNearbyTours={nearbyTours.length > 0} />
          </div>
        )}

        <AiResultsViewTabs
          active={viewTab}
          onChange={setViewTab}
          tourCount={totalTours}
        />

        {viewTab === "tours" ? (
          <div>
            {tourFilters.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {tourFilters.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTourFilter(f.id)}
                    className={[
                      "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all",
                      tourFilter === f.id
                        ? "bg-brand text-white shadow-sm"
                        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-brand/30",
                    ].join(" ")}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {!showExactSection && showNearbySection && tourFilter !== "nearby" && (
              <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {t("ai.noExactToursButNearby")}
              </p>
            )}

            {displayedTours.length === 0 ? (
              <div className="glass-card rounded-2xl px-6 py-12 text-center">
                <p className="mb-4 text-sm font-medium text-slate-600">{t("ai.noMatchingTours")}</p>
                <button
                  type="button"
                  onClick={() => openAiPlanner(location.pathname)}
                  disabled={isLoading}
                  className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {t("ai.editTrip")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {displayedTours.map((tour) => (
                  <AiTourRecommendationCard
                    key={`${tourFilter}-${tour.tourId}`}
                    tour={tour}
                    friendly
                    variant={
                      nearbyTours.some((n) => n.tourId === tour.tourId) &&
                      !exactTours.some((e) => e.tourId === tour.tourId)
                        ? "nearby"
                        : "exact"
                    }
                    showWhyFit={false}
                    showCustomerBreakdown={false}
                    customerMode
                    showScoreBreakdown={isAdminView}
                    onExplainClick={setExplainTour}
                    onTourClick={(id) => logInteraction(id, "click")}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <section className="glass-card rounded-2xl p-5">
              <h2 className="mb-1 text-base font-black text-navy">{t("ai.yourTripPlan")}</h2>
              <p className="mb-4 text-sm text-slate-500">{t("ai.yourTripPlanDesc")}</p>
              <TripContextPanel profile={data.appliedProfile} compact />
            </section>

            {(data.generalTips.length > 0 ||
              data.foreignVisitorTips.length > 0 ||
              data.elderlyCompanionTips.length > 0 ||
              data.childrenCompanionTips.length > 0) && (
              <section className="glass-card rounded-2xl p-5">
                <TipsTabsPanel
                  generalTips={data.generalTips}
                  foreignVisitorTips={data.foreignVisitorTips}
                  elderlyCompanionTips={data.elderlyCompanionTips}
                  childrenCompanionTips={data.childrenCompanionTips}
                />
              </section>
            )}

            {tourCities.length > 0 && data.culturalFacts.length > 0 && (
              <section className="glass-card rounded-2xl p-5">
                <h2 className="mb-1 text-base font-black text-navy">
                  {t("ai.destinationTipsTitle")}
                </h2>
                <p className="mb-4 text-sm text-slate-500">{t("ai.destinationTipsDesc")}</p>
                <DestinationTipsPanel facts={data.culturalFacts} allowedCities={tourCities} />
              </section>
            )}
          </div>
        )}

        {viewTab === "tours" && (
          <div className="mt-8 space-y-4">
            {isAdminView && <RelatedInsightsCarousel insights={data.relatedInsights} />}
            <RecommenderMetaPanel meta={data.recommenderMeta} />
          </div>
        )}
      </div>

      {/* Mobile FAB — tìm lại */}
      <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 sm:hidden">
        <button
          type="button"
          onClick={() => openAiPlanner(location.pathname)}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-bold text-white shadow-lg"
        >
          <Sparkles size={16} />
          {t("ai.editTrip")}
        </button>
      </div>

      <TourMatchModal tour={explainTour} onClose={() => setExplainTour(null)} />
    </div>
  );
};

export default AiRecommendationsPage;
