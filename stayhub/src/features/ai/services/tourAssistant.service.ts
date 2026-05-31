import { AI_API } from "../../../config/api/ai.api";
import { apiClient } from "../../../utils/axiosClient";
import type {
  AiHealthResponse,
  ChatRequest,
  ChatResponse,
  LogInteractionRequest,
  NaturalLanguageSearchRequest,
  PersonalizedRecommendationResponse,
  StandardQuestionnaire,
  TourConsultationRequest,
  TourPreferenceQuestionnaire,
  TourRecommendationItem,
  TourSearchResultItem,
} from "../types/tourAssistant";

export const getAiHealth = () =>
  apiClient.get<AiHealthResponse>(AI_API.TOUR_ASSISTANT.HEALTH);

export const getQuestionnaire = () =>
  apiClient.get<StandardQuestionnaire>(AI_API.TOUR_ASSISTANT.QUESTIONNAIRE);

export const recommendFromProfile = (body: TourPreferenceQuestionnaire) =>
  apiClient.post<PersonalizedRecommendationResponse>(
    AI_API.TOUR_ASSISTANT.RECOMMEND_FROM_PROFILE,
    body,
  );

export const getPersonalizedRecommend = (top = 8) =>
  apiClient.get<PersonalizedRecommendationResponse>(AI_API.TOUR_ASSISTANT.RECOMMEND, {
    params: { top },
  });

export const postChat = (body: ChatRequest) =>
  apiClient.post<ChatResponse>(AI_API.TOUR_ASSISTANT.CHAT, body);

export const postSemanticSearch = (body: NaturalLanguageSearchRequest) =>
  apiClient.post<TourSearchResultItem[]>(AI_API.TOUR_ASSISTANT.SEARCH, body);

export const postConsult = (body: TourConsultationRequest) =>
  apiClient.post<TourSearchResultItem[]>(AI_API.TOUR_ASSISTANT.CONSULT, body);

export const getSimilarTours = (tourId: string | number, top = 5) =>
  apiClient.get<TourRecommendationItem[]>(AI_API.TOUR_ASSISTANT.SIMILAR(tourId), {
    params: { top },
  });

export const getTourismInsights = (params: {
  query?: string;
  city?: string;
  top?: number;
}) =>
  apiClient.get(AI_API.TOUR_ASSISTANT.TOURISM, { params });

export const logAiInteraction = (body: LogInteractionRequest) =>
  apiClient.post(AI_API.TOUR_ASSISTANT.INTERACTIONS, body);
