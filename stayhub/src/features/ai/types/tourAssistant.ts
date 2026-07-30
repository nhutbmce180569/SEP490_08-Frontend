export type CompanionType = "solo" | "family" | "couple" | "group";
export type NationalityType = "vietnamese" | "foreigner";

export interface QuestionnaireOption {
  value: string;
  label: string;
}

export type QuestionnaireInputType =
  | "single_select"
  | "multi_select"
  | "date"
  | "number"
  | "boolean"
  | "text"
  | "counter";

export interface QuestionnaireField {
  fieldKey: string;
  label: string;
  inputType: QuestionnaireInputType | string;
  required: boolean;
  hint?: string;
  options?: QuestionnaireOption[];
}

export interface StandardQuestionnaire {
  version: string;
  questions: QuestionnaireField[];
}

export interface TourPreferenceQuestionnaire {
  companionType: CompanionType;
  preferredStartDate: string;
  preferredEndDate?: string;
  maxBudgetPerPerson?: number;
  adultCount: number;
  elderlyCount: number;
  childrenCount: number;
  travelPace: string;
  travelInterests: string[];
  nationalityType: NationalityType;
  preferredCity?: string;
  preferredCountry?: string;
  top?: number;
  sessionId?: string;
}

export interface WeatherAdvice {
  city: string;
  dataSource: string;
  periodStart: string;
  periodEnd: string;
  avgMaxTempC?: number;
  avgMinTempC?: number;
  totalRainMm?: number;
  summary: string;
  impactOnTours: string;
}

export interface ScoreDimensionExplanation {
  dimensionKey: string;
  label: string;
  score: number;
  weight: number;
  explanation: string;
}

export interface TourScoreBreakdown {
  fairnessScore: number;
  minPersonaScore: number;
  meanPersonaScore: number;
  envyGap: number;
  dissatisfactionVariance: number;
  personaScores: Record<string, number>;
  dimensionScores: Record<string, number>;
  dimensionExplanations?: ScoreDimensionExplanation[];
  aggregationFormula: string;
  overallExplanation?: string;
}

export interface TourRecommendationItem {
  tourId: number;
  name: string;
  city?: string;
  country?: string;
  imageUrl?: string;
  averageStar?: number;
  minPrice?: number;
  durationDays?: number;
  score: number;
  reason: string;
  matchReasons: string[];
  scoreBreakdown?: TourScoreBreakdown;
  nextDeparture?: string;
  matchesPreferredDates?: boolean;
  scheduleNote?: string;
  destinationWeather?: WeatherAdvice;
}

export interface ScheduleAvailability {
  hasToursInPreferredWindow: boolean;
  preferredStartDate: string;
  preferredEndDate: string;
  customerMessage: string;
}

export interface TourismInsight {
  id: number;
  name: string;
  type: string;
  description?: string;
  city?: string;
  sourceName?: string;
  sourceUrl?: string;
  relevanceScore: number;
  authorityLevel?: string;
  knowledgeProvider?: string;
}

export interface CulturalFact {
  fact: string;
  sourceName: string;
  sourceUrl: string;
  authorityLevel: string;
  provider: string;
  city?: string;
}

export interface KnowledgeSource {
  name: string;
  url: string;
  authority: string;
}

export interface AcademicReference {
  key: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
  url: string;
  doi?: string;
  usedFor: string;
}

export interface RecommenderTransparency {
  modelVersion: string;
  modelFamily: string;
  methodologySummary?: string;
  aggregationFormula: string;
  fairnessAlpha: number;
  personaTypesUsed: string[];
  knowledgeSources: KnowledgeSource[];
  academicReferences?: AcademicReference[];
  dimensionWeights: Record<string, number>;
}

export interface PersonalizedRecommendationResponse {
  sessionId: string;
  summary: string;
  appliedProfile: TourPreferenceQuestionnaire;
  scheduleAvailability?: ScheduleAvailability;
  weatherAdvice?: WeatherAdvice;
  generalTips: string[];
  foreignVisitorTips: string[];
  elderlyCompanionTips: string[];
  childrenCompanionTips: string[];
  recommendedTours: TourRecommendationItem[];
  nearbyScheduleTours?: TourRecommendationItem[];
  relatedInsights: TourismInsight[];
  culturalFacts: CulturalFact[];
  recommenderMeta: RecommenderTransparency;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ParsedQuery {
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  groupSize?: number;
  categoryId?: number;
}

export interface TourSearchResultItem extends TourRecommendationItem {
  semanticScore?: number;
  snippet?: string;
}

export interface ChatResponse {
  sessionId: string;
  intent: string;
  intentConfidence: number;
  reply: string;
  parsedQuery: ParsedQuery;
  recommendedTours: TourSearchResultItem[];
  tourismInsights: TourismInsight[];
  suggestedQuestions: string[];
  usedPersonalization: boolean;
}

export interface NaturalLanguageSearchRequest {
  query: string;
  top?: number;
  categoryId?: number;
  country?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  groupSize?: number;
}

export interface TourConsultationRequest {
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  preferredStartDate?: string;
  preferredEndDate?: string;
  durationDays?: number;
  groupSize?: number;
  categoryId?: number;
  travelStyle?: string;
  top?: number;
}

export interface LogInteractionRequest {
  tourId: number;
  interactionType: "view" | "click" | "wishlist" | "booking" | "chat_recommend";
  sessionId?: string;
}

export interface AiHealthResponse {
  status: string;
  service: string;
}

export type QuestionnaireFormValues = Record<string, unknown>;

export interface IntelligentChatMessage {
  role: "user" | "model" | "function";
  content: string;
}

export interface IntelligentChatRequest {
  message: string;
  sessionId?: string;
  history?: IntelligentChatMessage[];
}

export interface IntelligentChatResponse {
  sessionId: string;
  reply: string;
  recommendedTours: TourRecommendationItem[];
  weatherAdvice?: WeatherAdvice;
  culturalFacts: CulturalFact[];
  tourismInsights: TourismInsight[];
  suggestedQuestions: string[];
}

