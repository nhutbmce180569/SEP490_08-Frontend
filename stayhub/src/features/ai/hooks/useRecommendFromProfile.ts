import { useTranslation } from "../../../contexts/LocaleContext";
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
  const { t } = useTranslation();
  const [data, setData] = useState<PersonalizedRecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modelsNotReady, setModelsNotReady] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<TourPreferenceQuestionnaire | null>(null);

  const submit = useCallback(
    async (payload: TourPreferenceQuestionnaire, maxRetries = 5) => {
      setIsLoading(true);
      setServerError(null);
      setModelsNotReady(false);

      const body = {
        ...payload,
        sessionId: payload.sessionId ?? getOrCreateAiSessionId(),
      };
      setLastPayload(body);

      let attempts = 0;
      while (attempts < maxRetries) {
        try {
          const result = await recommendFromProfile(body);
          setData(result);
          setIsLoading(false);
          return result;
        } catch (err: unknown) {
          const message = getApiErrorMessage(err, t('ai.recommendFailed', { defaultValue: "Unable to get tour recommendations." }));
          if (isAiModelsNotReadyMessage(message)) {
            attempts++;
            if (attempts >= maxRetries) {
              setModelsNotReady(true);
              setIsLoading(false);
              throw err;
            }
            // Wait 3 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }
          
          const validation = getApiValidationErrors(err);
          if (validation) {
            setServerError(message);
          } else {
            showError(message);
            setServerError(message);
          }
          setIsLoading(false);
          throw err;
        }
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
