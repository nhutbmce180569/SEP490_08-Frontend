import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { PATH } from "../../../config/routes/route";
import { AiTourRecommendationCard } from "../components/AiTourRecommendationCard";
import { AiModelsNotReadyBanner } from "../components/AiModelsNotReadyBanner";
import { DestinationTipsPanel } from "../components/DestinationTipsPanel";
import { ScheduleNoticeBanner } from "../components/ScheduleNoticeBanner";
import { TripContextPanel } from "../components/TripContextPanel";
import { RelatedInsightsCarousel } from "../components/RelatedInsightsCarousel";
import { RecommenderMetaPanel } from "../components/RecommenderMetaPanel";
import { TipsTabsPanel } from "../components/TipsTabsPanel";
import { WeatherAdviceCard } from "../components/WeatherAdviceCard";
import { useRecommendFromProfile } from "../hooks/useRecommendFromProfile";
import { useLogAiInteraction } from "../hooks/useLogAiInteraction";
import type { PersonalizedRecommendationResponse } from "../types/tourAssistant";
import { useLocale, useTranslation } from "../../../contexts/LocaleContext";
import { AuthContext } from "../../../contexts/AuthContext";
import { normalizeRoles } from "../../../utils/jwt";

export const AiRecommendationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const stateData = location.state as PersonalizedRecommendationResponse | undefined;
  const { data: hookData, modelsNotReady, submit, retryLast, isLoading } =
    useRecommendFromProfile();
  const logInteraction = useLogAiInteraction();
  const retriedRef = useRef(false);
  const isAdminView = normalizeRoles(user?.roles).includes("ADMIN");
  const [data, setData] = useState<PersonalizedRecommendationResponse | undefined>(
    stateData ?? hookData ?? undefined,
  );
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
      .catch(() => { /* keep previous results on failure */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when user switches language
  }, [locale]);

  useEffect(() => {
    if (!data && !retriedRef.current) {
      retriedRef.current = true;
      navigate(PATH.PUBLIC.AI_ASSISTANT, { replace: true });
    }
  }, [data, navigate]);

  const handleRetryModels = async () => {
    const profile = stateData?.appliedProfile ?? hookData?.appliedProfile;
    try {
      const result = profile ? await submit(profile) : await retryLast();
      if (result)
        navigate(PATH.PUBLIC.AI_RECOMMENDATIONS, { state: result, replace: true });
    } catch { /* noop */ }
  };

  if (!data && !modelsNotReady) {
    return (
      <div className="home-page flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (modelsNotReady) {
    return (
      <div className="home-page min-h-screen px-4 pb-20 pt-10">
        <div className="mx-auto max-w-4xl">
          <AiModelsNotReadyBanner onRetry={handleRetryModels} />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const exactTours = data.recommendedTours ?? [];
  const nearbyTours = data.nearbyScheduleTours ?? [];
  const schedule = data.scheduleAvailability;
  const showExactSection = exactTours.length > 0;
  const showNearbySection = nearbyTours.length > 0;
  const totalTours = exactTours.length + nearbyTours.length;
  const requestedTop = data.appliedProfile?.top ?? 8;
  const preferredCity = data.appliedProfile?.preferredCity?.trim();
  const tourCities = preferredCity
    ? [preferredCity]
    : [
        ...new Set(
          [...exactTours, ...nearbyTours]
            .map((t) => t.city?.trim())
            .filter((c): c is string => Boolean(c)),
        ),
      ];

  return (
    <div className="home-page min-h-screen pb-24">
      <div className="mx-auto max-w-7xl px-4 pt-10">
        <Link
          to={PATH.PUBLIC.AI_ASSISTANT}
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 !no-underline transition-colors hover:text-brand"
        >
          <ArrowLeft size={16} /> {t("ai.redoSurvey")}
        </Link>

        {/* Summary hero */}
        <div className="glass-card mb-8 overflow-hidden">
          <div
            className="flex items-start gap-4 p-6 md:p-8"
            style={{
              background:
                "linear-gradient(135deg, var(--color-navy) 0%, var(--color-brand-deep) 100%)",
            }}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/30">
              <Sparkles size={22} className="text-brand-light" />
            </span>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-light">
                {t("ai.personalisedRecs")}
              </p>
              <p className="text-base font-medium leading-relaxed text-white md:text-lg">
                {data.summary}
              </p>
            </div>
          </div>
        </div>

        <TripContextPanel profile={data.appliedProfile} />

        {schedule && (
          <ScheduleNoticeBanner
            schedule={schedule}
            hasNearbyTours={nearbyTours.length > 0}
          />
        )}

        {/* Weather + tips */}
        <div className="mb-8 grid gap-5 lg:grid-cols-2">
          {data.weatherAdvice ? (
            <WeatherAdviceCard weather={data.weatherAdvice} />
          ) : (
            <div className="glass-card flex h-full items-center justify-center p-8 text-center text-sm text-slate-500">
              {t("ai.weatherUnavailable")}
            </div>
          )}
          <TipsTabsPanel
            generalTips={data.generalTips}
            foreignVisitorTips={data.foreignVisitorTips}
            elderlyCompanionTips={data.elderlyCompanionTips}
            childrenCompanionTips={data.childrenCompanionTips}
          />
        </div>

        {/* Tours */}
        <div className="flex flex-col items-start gap-8 lg:flex-row">
          <div className="min-w-0 w-full flex-1">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <h2 className="travel-heading text-xl text-navy">
                {totalTours === 0
                  ? t("ai.toursFoundPlural", { count: 0 })
                  : totalTours === 1
                    ? t("ai.toursRecommendedTitle", { count: totalTours, requested: requestedTop })
                    : t("ai.toursRecommendedTitlePlural", { count: totalTours, requested: requestedTop })}
              </h2>
              <ActionButton
                variant="outline"
                onClick={() => navigate(PATH.PUBLIC.AI_ASSISTANT)}
                disabled={isLoading}
                className="!px-4 flex items-center gap-1.5 text-xs"
              >
                <RefreshCw size={14} /> {t("ai.newSearch")}
              </ActionButton>
            </div>
            <p className="mb-6 text-sm text-slate-500">{t("ai.matchScoreHelp")}</p>

            {totalTours === 0 ? (
              <div className="glass-card mb-8 rounded-2xl p-12 text-center">
                <p className="font-medium text-slate-500">{t("ai.noMatchingTours")}</p>
              </div>
            ) : (
              <>
                {!showExactSection && showNearbySection && (
                  <div className="glass-card mb-6 rounded-2xl p-6 text-center">
                    <p className="font-medium text-slate-600">{t("ai.noExactToursButNearby")}</p>
                  </div>
                )}

                {showExactSection && (
                  <section className="mb-10">
                    <h3 className="travel-heading mb-1 text-lg text-navy">
                      {exactTours.length === 1
                        ? t("ai.toursExactMatchTitle", { count: exactTours.length })
                        : t("ai.toursExactMatchTitlePlural", { count: exactTours.length })}
                    </h3>
                    <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                      {exactTours.map((tour) => (
                        <AiTourRecommendationCard
                          key={tour.tourId}
                          tour={tour}
                          variant="exact"
                          showWhyFit
                          customerMode={true}
                          showScoreBreakdown={isAdminView}
                          onTourClick={(id) => logInteraction(id, "click")}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {showNearbySection && (
                  <section className="mb-10">
                    <h3 className="travel-heading mb-1 text-lg text-navy">{t("ai.toursNearbyTitle")}</h3>
                    <p className="mb-5 text-sm text-slate-500">{t("ai.toursNearbyDesc")}</p>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      {nearbyTours.map((tour) => (
                        <AiTourRecommendationCard
                          key={`nearby-${tour.tourId}`}
                          tour={tour}
                          variant="nearby"
                          showWhyFit
                          customerMode={true}
                          showScoreBreakdown={isAdminView}
                          onTourClick={(id) => logInteraction(id, "click")}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {tourCities.length > 0 && (
              <DestinationTipsPanel facts={data.culturalFacts} allowedCities={tourCities} />
            )}

            {isAdminView && (
              <>
                <RelatedInsightsCarousel insights={data.relatedInsights} />
                <RecommenderMetaPanel meta={data.recommenderMeta} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiRecommendationsPage;
