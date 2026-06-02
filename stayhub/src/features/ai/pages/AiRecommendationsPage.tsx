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
  const { data: hookData, modelsNotReady, submit, retryLast, isLoading } = useRecommendFromProfile();
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
    if (profile) {
      try {
        const result = await submit(profile);
        navigate(PATH.PUBLIC.AI_RECOMMENDATIONS, { state: result, replace: true });
      } catch {
        await retryLast();
      }
    } else {
      await retryLast();
    }
  };

  if (!data && !modelsNotReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F9F7F5" }}>
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--color-brand)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (modelsNotReady) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-10" style={{ background: "#F9F7F5" }}>
        <div className="container mx-auto max-w-4xl">
          <AiModelsNotReadyBanner onRetry={handleRetryModels} />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      className="min-h-screen pb-24"
      style={{
        background: "#F9F7F5",
        fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div className="container mx-auto max-w-7xl px-4 pt-10">
        <Link
          to={PATH.PUBLIC.AI_ASSISTANT}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-brand mb-6 !no-underline"
        >
          <ArrowLeft size={16} /> Làm lại khảo sát
        </Link>

        {/* Summary hero */}
        <div
          className="rounded-3xl p-6 md:p-8 mb-8"
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            boxShadow: "0 8px 32px rgba(15,23,42,0.2)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(235,102,43,0.2)" }}
            >
              <Sparkles size={24} style={{ color: "var(--color-brand)" }} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-light mb-2">
                Gợi ý cá nhân hóa
              </p>
              <p className="text-white text-lg md:text-xl font-medium leading-relaxed">
                {data.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Weather + Tips */}
        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          {data.weatherAdvice && <WeatherAdviceCard weather={data.weatherAdvice} />}
          <TipsTabsPanel
            generalTips={data.generalTips}
            foreignVisitorTips={data.foreignVisitorTips}
            elderlyCompanionTips={data.elderlyCompanionTips}
            childrenCompanionTips={data.childrenCompanionTips}
          />
        </div>

        {/* Main grid: tours + cultural sidebar */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">
                {data.recommendedTours.length} tour được gợi ý
              </h2>
              <ActionButton
                variant="outline"
                onClick={() => navigate(PATH.PUBLIC.AI_ASSISTANT)}
                className="!px-4 text-xs flex items-center gap-1"
                disabled={isLoading}
              >
                <RefreshCw size={14} /> Tìm lại
              </ActionButton>
            </div>

            {data.recommendedTours.length === 0 ? (
              <div
                className="rounded-2xl p-12 text-center"
                style={{ background: "#fff", border: "1px dashed rgba(5,7,60,0.12)" }}
              >
                <p className="text-slate-500 font-medium">
                  Chưa có tour phù hợp. Thử điều chỉnh ngân sách hoặc sở thích.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6">
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
            <div className="w-full lg:w-80 lg:shrink-0 lg:sticky lg:top-24">
              <CulturalFactsSidebar facts={data.culturalFacts} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiRecommendationsPage;
