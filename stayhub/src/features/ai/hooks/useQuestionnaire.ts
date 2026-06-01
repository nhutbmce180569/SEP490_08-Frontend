import { useQuery } from "@tanstack/react-query";
import { getQuestionnaire } from "../services/tourAssistant.service";

export const useQuestionnaire = () =>
  useQuery({
    queryKey: ["ai", "questionnaire"],
    queryFn: getQuestionnaire,
    staleTime: 5 * 60 * 1000,
  });
