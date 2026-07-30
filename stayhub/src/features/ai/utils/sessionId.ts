const AI_SESSION_KEY = "stayhub_ai_session_id";

export const getOrCreateAiSessionId = (): string => {
  if (typeof window === "undefined") return "server-session";

  const existing = sessionStorage.getItem(AI_SESSION_KEY);
  if (existing) return existing;

  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `fe-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  sessionStorage.setItem(AI_SESSION_KEY, id);
  return id;
};

export const resetAiSessionId = (): string => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(AI_SESSION_KEY);
  }
  return getOrCreateAiSessionId();
};
