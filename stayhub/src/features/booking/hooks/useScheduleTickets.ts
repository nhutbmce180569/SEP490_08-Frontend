import { useQuery } from "@tanstack/react-query";
import { ticketService } from "../services/ticket.service";

export const useScheduleTickets = (scheduleId?: number | null) => {
  return useQuery({
    queryKey: ["scheduleTickets", scheduleId],
    queryFn: async () => {
      if (scheduleId == null) return [];
      return await ticketService.getByScheduleId(scheduleId);
    },
    enabled: scheduleId != null,
    staleTime: 1000 * 60,
  });
};
