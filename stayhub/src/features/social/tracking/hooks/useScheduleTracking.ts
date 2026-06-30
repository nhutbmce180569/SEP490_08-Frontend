import { useQuery } from "@tanstack/react-query";
import { scheduleTrackingService } from "../services/scheduleTrackingService";

export const useGetScheduleLiveLocations = (scheduleId: number) => {
  return useQuery({
    queryKey: ["scheduleLiveLocations", scheduleId],
    queryFn: () => scheduleTrackingService.getScheduleLiveLocations(scheduleId),
    enabled: scheduleId > 0,
    refetchInterval: 10000, 
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export const useGetTourRouteData = (scheduleId: number) => {
  return useQuery({
    queryKey: ["tourRoute", scheduleId],
    queryFn: () => scheduleTrackingService.getTourRoute(scheduleId),
    enabled: scheduleId > 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
};