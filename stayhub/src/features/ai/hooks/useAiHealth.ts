import { useQuery } from "@tanstack/react-query";
import { getAiHealth } from "../services/tourAssistant.service";

export const useAiHealth = (refetchInterval?: number) =>
  useQuery({
    queryKey: ["ai", "health"],
    queryFn: getAiHealth,
    refetchInterval,
    retry: 2,
  });
