import { useCallback, useState } from "react";
import { useToast } from "../../../contexts/ToastContext";
import { getApiErrorMessage } from "../../content/utils/apiError";
import { postIntelligentChat } from "../services/tourAssistant.service";
import type {
  IntelligentChatMessage,
  TourRecommendationItem,
  WeatherAdvice,
  CulturalFact,
  TourismInsight,
} from "../types/tourAssistant";
import { getOrCreateAiSessionId } from "../utils/sessionId";

export interface IntelligentChatMessageListItem {
  id: string;
  role: "user" | "assistant";
  text: string;
  recommendedTours?: TourRecommendationItem[];
  weatherAdvice?: WeatherAdvice;
  culturalFacts?: CulturalFact[];
  tourismInsights?: TourismInsight[];
  suggestedQuestions?: string[];
}

export const useIntelligentChat = () => {
  const { error: showError } = useToast();
  const [messages, setMessages] = useState<IntelligentChatMessageListItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState(() => getOrCreateAiSessionId());

  const sendMessage = useCallback(
    async (messageText: string) => {
      const trimmed = messageText.trim();
      if (trimmed.length < 1) {
        showError("Message cannot be empty.");
        return null;
      }
      if (trimmed.length > 2000) {
        showError("Message must be 2000 characters or fewer.");
        return null;
      }

      // Add user message to UI state immediately
      const userMsg: IntelligentChatMessageListItem = {
        id: `u-${Date.now()}`,
        role: "user",
        text: trimmed,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsSending(true);

      // Build history payload for backend (Gemini format)
      // We only take the last 15 messages to prevent payload bloat
      const historyPayload: IntelligentChatMessage[] = messages
        .slice(-15)
        .map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          content: msg.text,
        }));

      try {
        const response = await postIntelligentChat({
          message: trimmed,
          sessionId,
          history: historyPayload,
        });

        // Add assistant response to UI state
        const assistantMsg: IntelligentChatMessageListItem = {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: response.reply,
          recommendedTours: response.recommendedTours,
          weatherAdvice: response.weatherAdvice,
          culturalFacts: response.culturalFacts,
          tourismInsights: response.tourismInsights,
          suggestedQuestions: response.suggestedQuestions,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        return response;
      } catch (err: unknown) {
        showError(getApiErrorMessage(err, "Unable to send message."));
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [messages, sessionId, showError],
  );

  return {
    messages,
    isSending,
    sessionId,
    sendMessage,
    clearMessages: () => setMessages([]),
  };
};
