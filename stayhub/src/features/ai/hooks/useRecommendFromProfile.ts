import { useCallback, useState } from "react";
import { useToast } from "../../../contexts/ToastContext";
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from "../../content/utils/apiError";
import { recommendFromProfile } from "../services/tourAssistant.service";
import type {
  PersonalizedRecommendationResponse,
  TourPreferenceQuestionnaire,
} from "../types/tourAssistant";
import { isAiModelsNotReadyMessage } from "../utils/questionnaireValidation";
import { getOrCreateAiSessionId } from "../utils/sessionId";

export const useRecommendFromProfile = () => {
  const { error: showError } = useToast();
  const [data, setData] = useState<PersonalizedRecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modelsNotReady, setModelsNotReady] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<TourPreferenceQuestionnaire | null>(null);

  const submit = useCallback(
    async (payload: TourPreferenceQuestionnaire) => {
      setIsLoading(true);
      setServerError(null);
      setModelsNotReady(false);

      const body = {
        ...payload,
        sessionId: payload.sessionId ?? getOrCreateAiSessionId(),
      };
      setLastPayload(body);

      try {
        const result = await recommendFromProfile(body);
        setData(result);
        return result;
      } catch (err: unknown) {
        const message = getApiErrorMessage(err, "Unable to get tour recommendations.");
        const validation = getApiValidationErrors(err);

        if (isAiModelsNotReadyMessage(message)) {
          setModelsNotReady(true);
        } else if (validation) {
          setServerError(message);
        } else {
          showError(message);
          setServerError(message);
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [showError],
  );

  const reset = useCallback(() => {
    setData(null);
    setServerError(null);
    setModelsNotReady(false);
    setLastPayload(null);
  }, []);

  const retryLast = useCallback(async () => {
    if (!lastPayload) return null;
    return submit(lastPayload);
  }, [lastPayload, submit]);

  return {
    data,
    isLoading,
    modelsNotReady,
    serverError,
    lastPayload,
    submit,
    retryLast,
    reset,
  };
};
