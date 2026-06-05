import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Activity,
  Bot,
  Brain,
  ClipboardList,
  Database,
  FlaskConical,
  MessageCircle,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useToast } from "../../../contexts/ToastContext";
import { getApiErrorMessage } from "../../content/utils/apiError";
import { AdminAiChatPanel } from "../components/admin/AdminAiChatPanel";
import { AdminJsonPanel } from "../components/admin/AdminJsonPanel";
import { AiModelsNotReadyBanner } from "../components/AiModelsNotReadyBanner";
import { AiTourRecommendationCard } from "../components/AiTourRecommendationCard";
import { CulturalFactsSidebar } from "../components/CulturalFactsSidebar";
import { QuestionnaireWizard } from "../components/QuestionnaireWizard";
import { RecommenderMetaPanel } from "../components/RecommenderMetaPanel";
import { RelatedInsightsCarousel } from "../components/RelatedInsightsCarousel";
import { TipsTabsPanel } from "../components/TipsTabsPanel";
import { WeatherAdviceCard } from "../components/WeatherAdviceCard";
import { useQuestionnaire } from "../hooks/useQuestionnaire";
import { useRecommendFromProfile } from "../hooks/useRecommendFromProfile";
import * as aiAdmin from "../services/aiAdmin.service";
import type { EvaluationRunRequest } from "../types/aiAdmin";
import type { TourPreferenceQuestionnaire } from "../types/tourAssistant";

type AdminAiTab =
  | "overview"
  | "guide"
  | "chatbot"
  | "search"
  | "knowledge"
  | "training"
  | "evaluation";

const inputClass = "input-field w-full py-2.5 text-sm";
const labelClass = "mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500";

export const AdminAiConsolePage: React.FC = () => {
  const { t } = useTranslation();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<AdminAiTab>("overview");

  const tabs = useMemo(
    () =>
      [
        { id: "overview" as const, label: t("ai.adminAi.tabs.overview"), icon: <Activity className="h-4 w-4" /> },
        { id: "guide" as const, label: t("ai.adminAi.tabs.guide"), icon: <ClipboardList className="h-4 w-4" /> },
        { id: "chatbot" as const, label: t("ai.adminAi.tabs.chatbot"), icon: <MessageCircle className="h-4 w-4" /> },
        { id: "search" as const, label: t("ai.adminAi.tabs.search"), icon: <Search className="h-4 w-4" /> },
        { id: "knowledge" as const, label: t("ai.adminAi.tabs.knowledge"), icon: <Database className="h-4 w-4" /> },
        { id: "training" as const, label: t("ai.adminAi.tabs.training"), icon: <Brain className="h-4 w-4" /> },
        { id: "evaluation" as const, label: t("ai.adminAi.tabs.evaluation"), icon: <FlaskConical className="h-4 w-4" /> },
      ] as const,
    [t],
  );

  const healthQuery = useQuery({
    queryKey: ["admin-ai", "health"],
    queryFn: aiAdmin.getAiHealth,
    refetchInterval: activeTab === "overview" ? 30_000 : false,
  });

  const trainingQuery = useQuery({
    queryKey: ["admin-ai", "training-status"],
    queryFn: aiAdmin.getTrainingStatus,
    refetchInterval: activeTab === "overview" || activeTab === "training" ? 15_000 : false,
  });

  const scoringQuery = useQuery({
    queryKey: ["admin-ai", "scoring-model"],
    queryFn: aiAdmin.getScoringModel,
    enabled: activeTab === "overview" || activeTab === "knowledge",
  });

  const retrainMutation = useMutation({
    mutationFn: aiAdmin.retrainModels,
    onSuccess: (data) => {
      success(t("ai.adminAi.retrainSuccess"));
      trainingQuery.refetch();
      return data;
    },
    onError: (err) => showError(getApiErrorMessage(err, t("ai.adminAi.retrainFailed"))),
  });

  return (
    <div className="page-container py-8">
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="travel-eyebrow">{t("ai.adminAi.section")}</p>
          <h1 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">{t("ai.adminAi.title")}</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
            {t("ai.adminAi.subtitle")}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand">
          <Bot size={14} />
          {t("ai.adminAi.badge")}
        </span>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors",
              activeTab === tab.id
                ? "bg-brand text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-brand",
            ].join(" ")}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <OverviewTab
          health={healthQuery.data}
          healthLoading={healthQuery.isLoading}
          training={trainingQuery.data}
          trainingLoading={trainingQuery.isLoading}
          scoring={scoringQuery.data}
          onRefresh={() => {
            healthQuery.refetch();
            trainingQuery.refetch();
            scoringQuery.refetch();
          }}
        />
      )}

      {activeTab === "guide" && <GuideTab />}
      {activeTab === "chatbot" && <AdminAiChatPanel />}
      {activeTab === "search" && <SearchTab />}
      {activeTab === "knowledge" && <KnowledgeTab />}
      {activeTab === "training" && (
        <TrainingTab
          status={trainingQuery.data}
          loading={trainingQuery.isLoading}
          retraining={retrainMutation.isPending}
          onRetrain={() => retrainMutation.mutate()}
          onRefresh={() => trainingQuery.refetch()}
        />
      )}
      {activeTab === "evaluation" && <EvaluationTab />}
    </div>
  );
};

const OverviewTab: React.FC<{
  health: Awaited<ReturnType<typeof aiAdmin.getAiHealth>> | undefined;
  healthLoading: boolean;
  training: Awaited<ReturnType<typeof aiAdmin.getTrainingStatus>> | undefined;
  trainingLoading: boolean;
  scoring: Awaited<ReturnType<typeof aiAdmin.getScoringModel>> | undefined;
  onRefresh: () => void;
}> = ({ health, healthLoading, training, trainingLoading, scoring, onRefresh }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ActionButton variant="outline" onClick={onRefresh} className="!px-4 flex items-center gap-2 text-xs">
          <RefreshCw size={14} />
          {t("common.refresh")}
        </ActionButton>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t("ai.adminAi.healthStatus")}
          value={healthLoading ? "…" : health?.status ?? "—"}
          loading={healthLoading}
        />
        <MetricCard
          label={t("ai.adminAi.modelReady")}
          value={trainingLoading ? "…" : training?.isReady ? t("common.yes") : t("common.no")}
          loading={trainingLoading}
        />
        <MetricCard
          label={t("ai.adminAi.tourCatalog")}
          value={trainingLoading ? "…" : String(training?.tourCatalogCount ?? 0)}
          loading={trainingLoading}
        />
        <MetricCard
          label={t("ai.adminAi.intentAccuracy")}
          value={
            trainingLoading
              ? "…"
              : training?.intentModelAccuracy != null
                ? `${(training.intentModelAccuracy * 100).toFixed(1)}%`
                : "—"
          }
          loading={trainingLoading}
        />
      </div>

      <AdminJsonPanel title={t("ai.adminAi.healthApi")} data={health ?? null} defaultOpen />
      <AdminJsonPanel title={t("ai.adminAi.trainingApi")} data={training ?? null} />
      <AdminJsonPanel title={t("ai.adminAi.scoringApi")} data={scoring ?? null} />
    </div>
  );
};

const GuideTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: questionnaire, isLoading, error, refetch } = useQuestionnaire();
  const { submit, isLoading: isSubmitting, modelsNotReady, retryLast, data, reset } =
    useRecommendFromProfile();
  const [authRecResult, setAuthRecResult] = useState<unknown>(null);
  const [authRecLoading, setAuthRecLoading] = useState(false);

  const handleSubmit = async (payload: TourPreferenceQuestionnaire) => {
    try {
      await submit(payload);
    } catch {
      /* handled in hook */
    }
  };

  const runAuthRecommend = async () => {
    setAuthRecLoading(true);
    try {
      const result = await aiAdmin.getPersonalizedRecommendAuth(8);
      setAuthRecResult(result);
    } catch (err) {
      setAuthRecResult({ error: getApiErrorMessage(err, "Failed") });
    } finally {
      setAuthRecLoading(false);
    }
  };

  const questions = questionnaire?.questions ?? [];

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="travel-eyebrow">{t("ai.adminAi.guideSurvey")}</p>
            <h2 className="text-lg font-black text-slate-900">{t("ai.adminAi.guideSurveyDesc")}</h2>
          </div>
          {data && (
            <ActionButton variant="outline" onClick={reset} className="!px-4 text-xs">
              {t("ai.adminAi.resetGuide")}
            </ActionButton>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="mb-3 font-bold text-rose-600">{t("ai.failedLoadSurvey")}</p>
            <ActionButton variant="primary" onClick={() => refetch()}>
              {t("common.tryAgain")}
            </ActionButton>
          </div>
        ) : modelsNotReady ? (
          <AiModelsNotReadyBanner onRetry={retryLast} />
        ) : questions.length === 0 ? (
          <p className="text-sm text-slate-500">{t("ai.noQuestions")}</p>
        ) : (
          <QuestionnaireWizard
            questions={questions}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      <div className="glass-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="travel-eyebrow">GET /recommend</p>
            <h2 className="text-lg font-black text-slate-900">{t("ai.adminAi.authRecommend")}</h2>
          </div>
          <ActionButton variant="primary" onClick={runAuthRecommend} disabled={authRecLoading}>
            {authRecLoading ? t("common.loading") : t("ai.adminAi.runApi")}
          </ActionButton>
        </div>
        <AdminJsonPanel title={t("ai.adminAi.response")} data={authRecResult} defaultOpen />
      </div>

      {data && (
        <div className="space-y-6">
          <div className="glass-card overflow-hidden">
            <div
              className="flex items-start gap-4 p-6"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-navy) 0%, var(--color-brand-deep) 100%)",
              }}
            >
              <Sparkles size={22} className="mt-1 text-brand-light" />
              <p className="text-base font-medium leading-relaxed text-white">{data.summary}</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {data.weatherAdvice && <WeatherAdviceCard weather={data.weatherAdvice} />}
            <TipsTabsPanel
              generalTips={data.generalTips}
              foreignVisitorTips={data.foreignVisitorTips}
              elderlyCompanionTips={data.elderlyCompanionTips}
              childrenCompanionTips={data.childrenCompanionTips}
            />
          </div>

          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="min-w-0 flex-1 space-y-6">
              <h3 className="travel-heading text-xl text-navy">
                {t("ai.toursFoundPlural", { count: data.recommendedTours.length })}
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {data.recommendedTours.map((tour) => (
                  <AiTourRecommendationCard key={tour.tourId} tour={tour} showScoreBreakdown />
                ))}
              </div>
              <RelatedInsightsCarousel insights={data.relatedInsights} />
              <RecommenderMetaPanel meta={data.recommenderMeta} />
              <AdminJsonPanel title={t("ai.adminAi.fullResponse")} data={data} />
            </div>
            {data.culturalFacts.length > 0 && (
              <div className="w-full shrink-0 lg:w-80">
                <CulturalFactsSidebar facts={data.culturalFacts} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SearchTab: React.FC = () => {
  const { t } = useTranslation();
  const { error: showError } = useToast();
  const [searchQuery, setSearchQuery] = useState("tour văn hóa miền Trung 4 ngày");
  const [searchTop, setSearchTop] = useState(8);
  const [searchResult, setSearchResult] = useState<unknown>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [similarTourId, setSimilarTourId] = useState("1");
  const [similarTop, setSimilarTop] = useState(6);
  const [similarResult, setSimilarResult] = useState<unknown>(null);
  const [similarLoading, setSimilarLoading] = useState(false);

  const [consultCity, setConsultCity] = useState("Đà Lạt");
  const [consultTop, setConsultTop] = useState(8);
  const [consultResult, setConsultResult] = useState<unknown>(null);
  const [consultLoading, setConsultLoading] = useState(false);

  const [interactionTourId, setInteractionTourId] = useState("1");
  const [interactionType, setInteractionType] = useState<
    "view" | "click" | "wishlist" | "booking" | "chat_recommend"
  >("click");
  const [interactionResult, setInteractionResult] = useState<unknown>(null);

  const runSearch = async () => {
    setSearchLoading(true);
    try {
      const result = await aiAdmin.postSemanticSearch({ query: searchQuery, top: searchTop });
      setSearchResult(result);
    } catch (err) {
      showError(getApiErrorMessage(err, "Search failed"));
    } finally {
      setSearchLoading(false);
    }
  };

  const runSimilar = async () => {
    setSimilarLoading(true);
    try {
      const result = await aiAdmin.getSimilarTours(Number(similarTourId), similarTop);
      setSimilarResult(result);
    } catch (err) {
      showError(getApiErrorMessage(err, "Similar tours failed"));
    } finally {
      setSimilarLoading(false);
    }
  };

  const runConsult = async () => {
    setConsultLoading(true);
    try {
      const result = await aiAdmin.postConsult({ city: consultCity, top: consultTop });
      setConsultResult(result);
    } catch (err) {
      showError(getApiErrorMessage(err, "Consult failed"));
    } finally {
      setConsultLoading(false);
    }
  };

  const runInteraction = async () => {
    try {
      const result = await aiAdmin.logAiInteraction({
        tourId: Number(interactionTourId),
        interactionType,
      });
      setInteractionResult(result);
    } catch (err) {
      showError(getApiErrorMessage(err, "Log interaction failed"));
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ApiFormCard
        title="POST /search"
        description={t("ai.adminAi.semanticSearchDesc")}
        onRun={runSearch}
        loading={searchLoading}
      >
        <label className={labelClass}>{t("ai.adminAi.query")}</label>
        <input className={inputClass} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <label className={`${labelClass} mt-3`}>top</label>
        <input
          className={inputClass}
          type="number"
          value={searchTop}
          onChange={(e) => setSearchTop(Number(e.target.value))}
        />
        <AdminJsonPanel title={t("ai.adminAi.response")} data={searchResult} defaultOpen />
      </ApiFormCard>

      <ApiFormCard
        title="GET /recommend/similar/{tourId}"
        description={t("ai.adminAi.similarDesc")}
        onRun={runSimilar}
        loading={similarLoading}
      >
        <label className={labelClass}>tourId</label>
        <input className={inputClass} value={similarTourId} onChange={(e) => setSimilarTourId(e.target.value)} />
        <label className={`${labelClass} mt-3`}>top</label>
        <input
          className={inputClass}
          type="number"
          value={similarTop}
          onChange={(e) => setSimilarTop(Number(e.target.value))}
        />
        <AdminJsonPanel title={t("ai.adminAi.response")} data={similarResult} defaultOpen />
      </ApiFormCard>

      <ApiFormCard
        title="POST /consult"
        description={t("ai.adminAi.consultDesc")}
        onRun={runConsult}
        loading={consultLoading}
      >
        <label className={labelClass}>{t("ai.adminAi.city")}</label>
        <input className={inputClass} value={consultCity} onChange={(e) => setConsultCity(e.target.value)} />
        <label className={`${labelClass} mt-3`}>top</label>
        <input
          className={inputClass}
          type="number"
          value={consultTop}
          onChange={(e) => setConsultTop(Number(e.target.value))}
        />
        <AdminJsonPanel title={t("ai.adminAi.response")} data={consultResult} defaultOpen />
      </ApiFormCard>

      <ApiFormCard
        title="POST /interactions"
        description={t("ai.adminAi.interactionDesc")}
        onRun={runInteraction}
      >
        <label className={labelClass}>tourId</label>
        <input
          className={inputClass}
          value={interactionTourId}
          onChange={(e) => setInteractionTourId(e.target.value)}
        />
        <label className={`${labelClass} mt-3`}>interactionType</label>
        <select
          className={inputClass}
          value={interactionType}
          onChange={(e) => setInteractionType(e.target.value as typeof interactionType)}
        >
          <option value="view">view</option>
          <option value="click">click</option>
          <option value="wishlist">wishlist</option>
          <option value="booking">booking</option>
          <option value="chat_recommend">chat_recommend</option>
        </select>
        <AdminJsonPanel title={t("ai.adminAi.response")} data={interactionResult} defaultOpen />
      </ApiFormCard>
    </div>
  );
};

const KnowledgeTab: React.FC = () => {
  const { t } = useTranslation();
  const { error: showError } = useToast();
  const [tourismQuery, setTourismQuery] = useState("ẩm thực Đà Lạt");
  const [tourismCity, setTourismCity] = useState("Đà Lạt");
  const [tourismResult, setTourismResult] = useState<unknown>(null);

  const [ragQuery, setRagQuery] = useState("văn hóa miền Trung");
  const [ragCity, setRagCity] = useState("");
  const [ragResult, setRagResult] = useState<unknown>(null);

  const [factsCity, setFactsCity] = useState("Đà Lạt");
  const [factsForeign, setFactsForeign] = useState(false);
  const [factsResult, setFactsResult] = useState<unknown>(null);

  const [corpusResult, setCorpusResult] = useState<unknown>(null);
  const [scoringResult, setScoringResult] = useState<unknown>(null);

  const runTourism = async () => {
    try {
      setTourismResult(await aiAdmin.getTourismInsights({ query: tourismQuery, city: tourismCity, top: 8 }));
    } catch (err) {
      showError(getApiErrorMessage(err, "Tourism API failed"));
    }
  };

  const runRag = async () => {
    try {
      setRagResult(
        await aiAdmin.searchRag({
          query: ragQuery,
          city: ragCity || undefined,
          top: 8,
        }),
      );
    } catch (err) {
      showError(getApiErrorMessage(err, "RAG search failed"));
    }
  };

  const runFacts = async () => {
    try {
      setFactsResult(
        await aiAdmin.getKnowledgeFacts({
          city: factsCity,
          foreignVisitor: factsForeign,
        }),
      );
    } catch (err) {
      showError(getApiErrorMessage(err, "Facts API failed"));
    }
  };

  const runCorpus = async () => {
    try {
      setCorpusResult(await aiAdmin.getCorpusStats());
    } catch (err) {
      showError(getApiErrorMessage(err, "Corpus stats failed"));
    }
  };

  const runScoring = async () => {
    try {
      setScoringResult(await aiAdmin.getScoringModel());
    } catch (err) {
      showError(getApiErrorMessage(err, "Scoring model failed"));
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ApiFormCard title="GET /tourism" description={t("ai.adminAi.tourismDesc")} onRun={runTourism}>
        <label className={labelClass}>{t("ai.adminAi.query")}</label>
        <input className={inputClass} value={tourismQuery} onChange={(e) => setTourismQuery(e.target.value)} />
        <label className={`${labelClass} mt-3`}>{t("ai.adminAi.city")}</label>
        <input className={inputClass} value={tourismCity} onChange={(e) => setTourismCity(e.target.value)} />
        <AdminJsonPanel title={t("ai.adminAi.response")} data={tourismResult} defaultOpen />
      </ApiFormCard>

      <ApiFormCard title="GET /knowledge/rag/search" description={t("ai.adminAi.ragDesc")} onRun={runRag}>
        <label className={labelClass}>{t("ai.adminAi.query")}</label>
        <input className={inputClass} value={ragQuery} onChange={(e) => setRagQuery(e.target.value)} />
        <label className={`${labelClass} mt-3`}>{t("ai.adminAi.city")}</label>
        <input className={inputClass} value={ragCity} onChange={(e) => setRagCity(e.target.value)} />
        <AdminJsonPanel title={t("ai.adminAi.response")} data={ragResult} defaultOpen />
      </ApiFormCard>

      <ApiFormCard title="GET /knowledge/facts" description={t("ai.adminAi.factsDesc")} onRun={runFacts}>
        <label className={labelClass}>{t("ai.adminAi.city")}</label>
        <input className={inputClass} value={factsCity} onChange={(e) => setFactsCity(e.target.value)} />
        <label className={`${labelClass} mt-3 flex items-center gap-2 normal-case`}>
          <input type="checkbox" checked={factsForeign} onChange={(e) => setFactsForeign(e.target.checked)} />
          foreignVisitor
        </label>
        <AdminJsonPanel title={t("ai.adminAi.response")} data={factsResult} defaultOpen />
      </ApiFormCard>

      <ApiFormCard title="GET /knowledge/corpus-stats" description={t("ai.adminAi.corpusDesc")} onRun={runCorpus}>
        <AdminJsonPanel title={t("ai.adminAi.response")} data={corpusResult} defaultOpen />
      </ApiFormCard>

      <ApiFormCard
        title="GET /scoring-model"
        description={t("ai.adminAi.scoringDesc")}
        onRun={runScoring}
        className="xl:col-span-2"
      >
        <AdminJsonPanel title={t("ai.adminAi.response")} data={scoringResult} defaultOpen />
      </ApiFormCard>
    </div>
  );
};

const TrainingTab: React.FC<{
  status: Awaited<ReturnType<typeof aiAdmin.getTrainingStatus>> | undefined;
  loading: boolean;
  retraining: boolean;
  onRetrain: () => void;
  onRefresh: () => void;
}> = ({ status, loading, retraining, onRetrain, onRefresh }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <ActionButton variant="outline" onClick={onRefresh} className="!px-4 flex items-center gap-2 text-xs">
          <RefreshCw size={14} />
          {t("common.refresh")}
        </ActionButton>
        <ActionButton variant="primary" onClick={onRetrain} disabled={retraining}>
          {retraining ? t("ai.adminAi.retraining") : t("ai.adminAi.retrainModels")}
        </ActionButton>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label={t("ai.adminAi.modelReady")} value={status?.isReady ? t("common.yes") : t("common.no")} />
            <MetricCard label={t("ai.adminAi.tourCatalog")} value={String(status?.tourCatalogCount ?? 0)} />
            <MetricCard label={t("ai.adminAi.knowledgeItems")} value={String(status?.tourismKnowledgeCount ?? 0)} />
            <MetricCard label={t("ai.adminAi.interactions")} value={String(status?.interactionCount ?? 0)} />
          </div>
          <AdminJsonPanel title="GET /training/status" data={status ?? null} defaultOpen />
        </>
      )}
    </div>
  );
};

const EvaluationTab: React.FC = () => {
  const { t } = useTranslation();
  const { success, error: showError } = useToast();
  const [evalRequest, setEvalRequest] = useState<EvaluationRunRequest>({
    profileCount: 100,
    topK: 8,
    randomSeed: 42,
    includeAlphaSweep: true,
    labelingMode: "hybrid",
    includeSignificanceTests: true,
    profileSplit: "test",
  });
  const [evalResult, setEvalResult] = useState<unknown>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [genericResult, setGenericResult] = useState<Record<string, unknown>>({});

  const runEval = async () => {
    setEvalLoading(true);
    try {
      const result = await aiAdmin.runEvaluation(evalRequest);
      setEvalResult(result);
      success(t("ai.adminAi.evalDone"));
    } catch (err) {
      showError(getApiErrorMessage(err, "Evaluation failed"));
    } finally {
      setEvalLoading(false);
    }
  };

  const runAction = async (key: string, fn: () => Promise<unknown>) => {
    try {
      const result = await fn();
      setGenericResult((prev) => ({ ...prev, [key]: result }));
    } catch (err) {
      showError(getApiErrorMessage(err, `${key} failed`));
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="travel-eyebrow">POST /evaluation/run</p>
            <h2 className="text-lg font-black text-slate-900">{t("ai.adminAi.offlineEval")}</h2>
          </div>
          <ActionButton variant="primary" onClick={runEval} disabled={evalLoading}>
            {evalLoading ? t("ai.adminAi.running") : t("ai.adminAi.runApi")}
          </ActionButton>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FieldNumber
            label="profileCount"
            value={evalRequest.profileCount ?? 100}
            onChange={(v) => setEvalRequest((p) => ({ ...p, profileCount: v }))}
          />
          <FieldNumber
            label="topK"
            value={evalRequest.topK ?? 8}
            onChange={(v) => setEvalRequest((p) => ({ ...p, topK: v }))}
          />
          <FieldNumber
            label="randomSeed"
            value={evalRequest.randomSeed ?? 42}
            onChange={(v) => setEvalRequest((p) => ({ ...p, randomSeed: v }))}
          />
          <div>
            <label className={labelClass}>labelingMode</label>
            <select
              className={inputClass}
              value={evalRequest.labelingMode}
              onChange={(e) => setEvalRequest((p) => ({ ...p, labelingMode: e.target.value }))}
            >
              <option value="proxy">proxy</option>
              <option value="hybrid">hybrid</option>
              <option value="interaction_augmented">interaction_augmented</option>
              <option value="expert">expert</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>profileSplit</label>
            <select
              className={inputClass}
              value={evalRequest.profileSplit}
              onChange={(e) => setEvalRequest((p) => ({ ...p, profileSplit: e.target.value }))}
            >
              <option value="all">all</option>
              <option value="validation">validation</option>
              <option value="test">test</option>
            </select>
          </div>
        </div>

        <AdminJsonPanel title={t("ai.adminAi.response")} data={evalResult} defaultOpen />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { key: "baselines", label: "GET /baselines", fn: aiAdmin.getEvaluationBaselines },
          { key: "methodology", label: "GET /methodology", fn: aiAdmin.getEvaluationMethodology },
          { key: "judgments", label: "GET /judgments", fn: () => aiAdmin.getEvaluationJudgments() },
          { key: "interRater", label: "GET /inter-rater-agreement", fn: aiAdmin.getInterRaterAgreement },
          { key: "userStudySummary", label: "GET /user-study/summary", fn: aiAdmin.getUserStudySummary },
          { key: "paperBundle", label: "GET /paper-bundle", fn: aiAdmin.getPaperBundle },
          { key: "calibrateWeights", label: "POST /calibrate-weights", fn: aiAdmin.calibrateWeights },
          { key: "ragAblation", label: "GET /rag-corpus-ablation", fn: aiAdmin.runRagCorpusAblation },
          {
            key: "seedPilot",
            label: "POST /user-study/seed-pilot",
            fn: () => aiAdmin.seedPilotUserStudy({ participantCount: 5 }),
          },
        ].map((action) => (
          <div key={action.key} className="glass-card p-4">
            <p className="mb-3 text-sm font-bold text-slate-800">{action.label}</p>
            <ActionButton
              variant="outline"
              className="!px-4 w-full text-xs"
              onClick={() => runAction(action.key, action.fn)}
            >
              {t("ai.adminAi.runApi")}
            </ActionButton>
            <div className="mt-3">
              <AdminJsonPanel title={t("ai.adminAi.response")} data={genericResult[action.key] ?? null} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ApiFormCard: React.FC<{
  title: string;
  description: string;
  onRun: () => void;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ title, description, onRun, loading, className, children }) => {
  const { t } = useTranslation();
  return (
    <div className={`glass-card space-y-4 p-5 ${className ?? ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="travel-eyebrow">{title}</p>
          <p className="text-sm font-medium text-slate-600">{description}</p>
        </div>
        <ActionButton variant="primary" onClick={onRun} disabled={loading} className="!px-4 text-xs">
          {loading ? t("common.loading") : t("ai.adminAi.runApi")}
        </ActionButton>
      </div>
      {children}
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; loading?: boolean }> = ({
  label,
  value,
  loading,
}) => (
  <div className="glass-card p-4">
    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-black text-slate-900">{loading ? "…" : value}</p>
  </div>
);

const FieldNumber: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, value, onChange }) => (
  <div>
    <label className={labelClass}>{label}</label>
    <input
      className={inputClass}
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </div>
);

export default AdminAiConsolePage;
