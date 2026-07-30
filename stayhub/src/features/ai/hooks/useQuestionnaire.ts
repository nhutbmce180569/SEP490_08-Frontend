import { useQuery } from "@tanstack/react-query";
import { useLocale } from "../../../contexts/LocaleContext";
import { getQuestionnaire } from "../services/tourAssistant.service";

export const useQuestionnaire = () => {
  const { locale } = useLocale();
  return useQuery({
    queryKey: ["ai", "questionnaire", locale],
    queryFn: getQuestionnaire,
    staleTime: 5 * 60 * 1000,
  });
};
