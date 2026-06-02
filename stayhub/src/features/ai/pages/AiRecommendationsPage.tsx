import React, { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { PATH } from "../../../config/routes/route";
import { AiTourRecommendationCard } from "../components/AiTourRecommendationCard";
import { AiModelsNotReadyBanner } from "../components/AiModelsNotReadyBanner";
import { CulturalFactsSidebar } from "../components/CulturalFactsSidebar";
import { RelatedInsightsCarousel } from "../components/RelatedInsightsCarousel";
import { RecommenderMetaPanel } from "../components/RecommenderMetaPanel";
import { TipsTabsPanel } from "../components/TipsTabsPanel";
import { WeatherAdviceCard } from "../components/WeatherAdviceCard";
import { useRecommendFromProfile } from "../hooks/useRecommendFromProfile";
import { useLogAiInteraction } from "../hooks/useLogAiInteraction";
import type { PersonalizedRecommendationResponse } from "../types/tourAssistant";

export const AiRecommendationsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const stateData = location.state as PersonalizedRecommendationResponse | undefined;
  const { data: hookData, modelsNotReady, submit, retryLast, isLoading } =
    useRecommendFromProfile();
  const logInteraction = useLogAiInteraction();
  const retriedRef = useRef(false);

  const data = stateData ?? hookData;

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

  return (
    <div className="home-page min-h-screen pb-24">
      <div className="mx-auto max-w-7xl px-4 pt-10">
        <Link
          to={PATH.PUBLIC.AI_ASSISTANT}
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 !no-underline transition-colors hover:text-brand"
        >
          <ArrowLeft size={16} /> Redo survey
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
                Personalised recommendations
              </p>
              <p className="text-base font-medium leading-relaxed text-white md:text-lg">
                {data.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Weather + tips */}
        <div className="mb-8 grid gap-5 lg:grid-cols-2">
          {data.weatherAdvice && <WeatherAdviceCard weather={data.weatherAdvice} />}
          <TipsTabsPanel
            generalTips={data.generalTips}
            foreignVisitorTips={data.foreignVisitorTips}
            elderlyCompanionTips={data.elderlyCompanionTips}
            childrenCompanionTips={data.childrenCompanionTips}
          />
        </div>

        {/* Tours + cultural sidebar */}
        <div className="flex flex-col items-start gap-8 lg:flex-row">
          <div className="min-w-0 w-full flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="travel-heading text-xl text-navy">
                {data.recommendedTours.length} tour
                {data.recommendedTours.length !== 1 ? "s" : ""} found
              </h2>
              <ActionButton
                variant="outline"
                onClick={() => navigate(PATH.PUBLIC.AI_ASSISTANT)}
                disabled={isLoading}
                className="!px-4 flex items-center gap-1.5 text-xs"
              >
                <RefreshCw size={14} /> New search
              </ActionButton>
            </div>

            {data.recommendedTours.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <p className="font-medium text-slate-500">
                  No matching tours found. Try adjusting your budget or preferences.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {data.recommendedTours.map((tour) => (
                  <AiTourRecommendationCard
                    key={tour.tourId}
                    tour={tour}
                    onTourClick={(id) => logInteraction(id, "click")}
                  />
                ))}
              </div>
            )}

            <RelatedInsightsCarousel insights={data.relatedInsights} />
            <RecommenderMetaPanel meta={data.recommenderMeta} />
          </div>

          {data.culturalFacts.length > 0 && (
            <div className="w-full shrink-0 lg:sticky lg:top-24 lg:w-80">
              <CulturalFactsSidebar facts={data.culturalFacts} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiRecommendationsPage;
