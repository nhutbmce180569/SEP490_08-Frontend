import { useCallback, useContext } from "react";
import { AuthContext } from "../../../contexts/AuthContext";
import { logAiInteraction } from "../services/tourAssistant.service";
import { getOrCreateAiSessionId } from "../utils/sessionId";

export const useLogAiInteraction = () => {
  const { user } = useContext(AuthContext);

  return useCallback(
    async (
      tourId: number,
      interactionType: "view" | "click" | "wishlist" | "booking" | "chat_recommend",
    ) => {
      if (!user) return;
      try {
        await logAiInteraction({
          tourId,
          interactionType,
          sessionId: getOrCreateAiSessionId(),
        });
      } catch {
        // optional analytics
      }
    },
    [user],
  );
};
