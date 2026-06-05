import { AI_API } from "../../../config/api/ai.api";
import { apiClient } from "../../../utils/axiosClient";
import type {
  ChatRequest,
  ChatResponse,
  CulturalFact,
  LogInteractionRequest,
  NaturalLanguageSearchRequest,
  PersonalizedRecommendationResponse,
  TourConsultationRequest,
  TourPreferenceQuestionnaire,
  TourRecommendationItem,
  TourSearchResultItem,
  TourismInsight,
} from "../types/tourAssistant";
import type {
  EvaluationRunRequest,
  ImportJudgment,
  ModelTrainingStatus,
  RagCorpusStats,
  RagRetrievalResult,
  ScoringModelDocumentation,
} from "../types/aiAdmin";

export const getScoringModel = () =>
  apiClient.get<ScoringModelDocumentation>(AI_API.TOUR_ASSISTANT.SCORING_MODEL);

export const getPersonalizedRecommendAuth = (top = 8) =>
  apiClient.get<TourRecommendationItem[] | PersonalizedRecommendationResponse>(
    AI_API.TOUR_ASSISTANT.RECOMMEND,
    { params: { top } },
  );

export const postConsult = (body: TourConsultationRequest) =>
  apiClient.post<TourRecommendationItem[]>(AI_API.TOUR_ASSISTANT.CONSULT, body);

export const getTourismInsights = (params: {
  query: string;
  city?: string;
  top?: number;
}) => apiClient.get<TourismInsight[]>(AI_API.TOUR_ASSISTANT.TOURISM, { params });

export const getCorpusStats = () =>
  apiClient.get<RagCorpusStats>(AI_API.KNOWLEDGE.CORPUS_STATS);

export const searchRag = (params: {
  query: string;
  city?: string;
  interests?: string;
  foreignVisitor?: boolean;
  elderly?: boolean;
  children?: boolean;
  top?: number;
}) => apiClient.get<RagRetrievalResult[]>(AI_API.KNOWLEDGE.RAG_SEARCH, { params });

export const getKnowledgeFacts = (params: {
  city?: string;
  foreignVisitor?: boolean;
  elderly?: boolean;
  children?: boolean;
  interests?: string;
}) => apiClient.get<CulturalFact[]>(AI_API.KNOWLEDGE.FACTS, { params });

export const getTrainingStatus = () =>
  apiClient.get<ModelTrainingStatus>(AI_API.TRAINING.STATUS);

export const retrainModels = () => apiClient.post(AI_API.TRAINING.RETRAIN);

export const getEvaluationBaselines = () =>
  apiClient.get(AI_API.EVALUATION.BASELINES);

export const runEvaluation = (body: EvaluationRunRequest) =>
  apiClient.post(AI_API.EVALUATION.RUN, body);

export const getEvaluationJudgments = (profileSignature?: string) =>
  apiClient.get(AI_API.EVALUATION.JUDGMENTS, {
    params: profileSignature ? { profileSignature } : undefined,
  });

export const importEvaluationJudgments = (judgments: ImportJudgment[]) =>
  apiClient.post(AI_API.EVALUATION.JUDGMENTS, { judgments });

export const calibrateWeights = () =>
  apiClient.post(AI_API.EVALUATION.CALIBRATE_WEIGHTS);

export const runRagCorpusAblation = () =>
  apiClient.get(AI_API.EVALUATION.RAG_CORPUS_ABLATION);

export const getEvaluationMethodology = () =>
  apiClient.get(AI_API.EVALUATION.METHODOLOGY);

export const getPaperBundle = () => apiClient.get(AI_API.EVALUATION.PAPER_BUNDLE);

export const getInterRaterAgreement = () =>
  apiClient.get(AI_API.EVALUATION.INTER_RATER);

export const getUserStudySummary = () =>
  apiClient.get(AI_API.EVALUATION.USER_STUDY.SUMMARY);

export const seedPilotUserStudy = (body: { participantCount?: number }) =>
  apiClient.post(AI_API.EVALUATION.USER_STUDY.SEED_PILOT, body);

export {
  getAiHealth,
  getQuestionnaire,
  recommendFromProfile,
  postChat,
  postSemanticSearch,
  getSimilarTours,
  logAiInteraction,
} from "./tourAssistant.service";

export type {
  ChatRequest,
  ChatResponse,
  NaturalLanguageSearchRequest,
  TourConsultationRequest,
  TourPreferenceQuestionnaire,
  LogInteractionRequest,
};
