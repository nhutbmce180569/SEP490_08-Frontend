import type { AcademicReference, RecommenderTransparency } from "./tourAssistant";

export interface ModelTrainingRun {
  id: number;
  modelName: string;
  status: string;
  tourCount: number;
  tourismCount: number;
  interactionCount: number;
  intentAccuracy?: number;
  message?: string;
  trainedAt?: string;
}

export interface ModelTrainingStatus {
  isReady: boolean;
  lastTrainedAt?: string;
  tourCatalogCount: number;
  tourismKnowledgeCount: number;
  interactionCount: number;
  matrixFactorizationReady?: boolean;
  matrixFactorizationInteractionCount?: number;
  intentModelAccuracy?: number;
  recentRuns: ModelTrainingRun[];
}

export interface RagCorpusStats {
  totalDocuments: number;
  tourismItems: number;
  culturalFacts: number;
  authorityBreakdown?: Record<string, number>;
}

export interface RagRetrievalResult {
  documentId: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  sourceName?: string;
  sourceUrl?: string;
  city?: string;
}

export interface ScoringModelDocumentation {
  specification: RecommenderTransparency;
  methodologySummary: string;
  paperTitleSuggestion: string;
  formalDefinitions: Record<string, string>;
  academicReferences?: AcademicReference[];
  baselines: { name: string; description: string }[];
}

export interface EvaluationRunRequest {
  profileCount?: number;
  topK?: number;
  randomSeed?: number;
  includeAlphaSweep?: boolean;
  alphaValues?: number[];
  labelingMode?: string;
  includeSignificanceTests?: boolean;
  exportFormat?: string | null;
  profileSplit?: string;
  calibrateWeightsOnValidationFirst?: boolean;
}

export interface ImportJudgment {
  profileSignature: string;
  tourId: number;
  relevanceScore: number;
  expertId?: string;
  notes?: string;
}
