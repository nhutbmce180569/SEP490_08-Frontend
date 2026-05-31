import { useQuery } from "@tanstack/react-query";
import { getTourItineraries, getScheduleItineraries } from "../services/tourItineraryService";

export const useGetTourItineraries = (tourId: number | undefined) => {
  return useQuery({
    queryKey: ["tourItineraries", tourId],
    queryFn: () => getTourItineraries(tourId!),
    enabled: !!tourId,
  });
};

export const useGetScheduleItineraries = (scheduleId: number | undefined) => {
  return useQuery({
    queryKey: ["scheduleItineraries", scheduleId],
    queryFn: () => getScheduleItineraries(scheduleId!),
    enabled: !!scheduleId,
  });
};