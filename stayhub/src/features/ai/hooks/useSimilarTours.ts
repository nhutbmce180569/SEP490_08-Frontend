import { useQuery } from "@tanstack/react-query";
import { getSimilarTours } from "../services/tourAssistant.service";

export const useSimilarTours = (tourId?: string | number, top = 5) =>
  useQuery({
    queryKey: ["ai", "similar-tours", tourId, top],
    queryFn: () => getSimilarTours(tourId!, top),
    enabled: tourId != null && tourId !== "",
    staleTime: 60 * 1000,
  });
