import { useCallback, useContext, useState } from "react";
import { AuthContext } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { getApiErrorMessage } from "../../content/utils/apiError";
import { logAiInteraction, postChat } from "../services/tourAssistant.service";
import type { ChatResponse } from "../types/tourAssistant";
import { getOrCreateAiSessionId } from "../utils/sessionId";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  response?: ChatResponse;
}

export const useTourAssistantChat = () => {
  const { error: showError } = useToast();
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState(() => getOrCreateAiSessionId());

  const sendMessage = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (trimmed.length < 2) {
        showError("Message must be at least 2 characters.");
        return null;
      }
      if (trimmed.length > 2000) {
        showError("Message must be 2000 characters or fewer.");
        return null;
      }

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        text: trimmed,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsSending(true);

      try {
        const response = await postChat({ message: trimmed, sessionId });
        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: response.reply,
          response,
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
    [sessionId, showError],
  );

  const logInteraction = useCallback(
    async (
      tourId: number,
      interactionType: "view" | "click" | "wishlist" | "booking" | "chat_recommend",
    ) => {
      if (!user) return;
      try {
        await logAiInteraction({ tourId, interactionType, sessionId });
      } catch {
        // silent — analytics optional
      }
    },
    [sessionId, user],
  );

  return {
    messages,
    isSending,
    sessionId,
    sendMessage,
    logInteraction,
    clearMessages: () => setMessages([]),
  };
};
