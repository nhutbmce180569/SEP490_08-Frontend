import { FULL_API } from "./api";

const AI_BASE = `${FULL_API}/ai`;

export const AI_API = {
  TOUR_ASSISTANT: {
    HEALTH: `${AI_BASE}/tour-assistant/health`,
    QUESTIONNAIRE: `${AI_BASE}/tour-assistant/questionnaire`,
    RECOMMEND_FROM_PROFILE: `${AI_BASE}/tour-assistant/recommend-from-profile`,
    RECOMMEND: `${AI_BASE}/tour-assistant/recommend`,
    CHAT: `${AI_BASE}/tour-assistant/chat`,
    INTELLIGENT_CHAT: `${AI_BASE}/intelligent-chat/chat`,
    SEARCH: `${AI_BASE}/tour-assistant/search`,
    CONSULT: `${AI_BASE}/tour-assistant/consult`,
    SIMILAR: (tourId: string | number) =>
      `${AI_BASE}/tour-assistant/recommend/similar/${tourId}`,
    TOURISM: `${AI_BASE}/tour-assistant/tourism`,
    SCORING_MODEL: `${AI_BASE}/tour-assistant/scoring-model`,
    INTERACTIONS: `${AI_BASE}/tour-assistant/interactions`,
  },
  KNOWLEDGE: {
    RAG_SEARCH: `${AI_BASE}/knowledge/rag/search`,
    FACTS: `${AI_BASE}/knowledge/facts`,
    CORPUS_STATS: `${AI_BASE}/knowledge/corpus-stats`,
  },
  TRAINING: {
    STATUS: `${AI_BASE}/training/status`,
    RETRAIN: `${AI_BASE}/training/retrain`,
  },
  REVIEW_ANALYSIS: {
    ANALYZE: `${AI_BASE}/review-analysis/analyze`,
  },
  EVALUATION: {
    BASELINES: `${AI_BASE}/evaluation/baselines`,
    RUN: `${AI_BASE}/evaluation/run`,
    JUDGMENTS: `${AI_BASE}/evaluation/judgments`,
    CALIBRATE_WEIGHTS: `${AI_BASE}/evaluation/calibrate-weights`,
    RAG_CORPUS_ABLATION: `${AI_BASE}/evaluation/rag-corpus-ablation`,
    METHODOLOGY: `${AI_BASE}/evaluation/methodology`,
    INTER_RATER: `${AI_BASE}/evaluation/inter-rater-agreement`,
    PAPER_BUNDLE: `${AI_BASE}/evaluation/paper-bundle`,
    USER_STUDY: {
      PROTOCOL: `${AI_BASE}/evaluation/user-study/protocol`,
      SCENARIOS: `${AI_BASE}/evaluation/user-study/scenarios`,
      COMPARISON: (id: string | number) =>
        `${AI_BASE}/evaluation/user-study/scenarios/${id}/comparison`,
      RESPONSES: `${AI_BASE}/evaluation/user-study/responses`,
      SUMMARY: `${AI_BASE}/evaluation/user-study/summary`,
      SEED_PILOT: `${AI_BASE}/evaluation/user-study/seed-pilot`,
    },
  },
} as const;
