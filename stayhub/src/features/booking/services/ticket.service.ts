import { apiClient } from "../../../utils/axiosClient";
import { TICKETS_API } from "../../../config/api/tickets.api";
import type { ReadTicketDTO } from "../types/ticket";
import type { UpdateTicketDTO } from "../types/booking";

export const checkInTicket = async (data: UpdateTicketDTO) => {
  const response: any = await apiClient.put(TICKETS_API.CHECK_IN, data);
  return response.data !== undefined ? response.data : response;
};

export const ticketService = {
  checkInTicket,

  checkInByQR: async (qrCode: string) => {
    const response: any = await apiClient.put(TICKETS_API.CHECK_IN, { qrCode });
      console.log("RAW checkInByQR response:", response); 
    return response;
  },

  getMyTickets: async (): Promise<ReadTicketDTO[]> => {
    return await apiClient.get<ReadTicketDTO[]>(TICKETS_API.MY_TICKETS);
  },

  getByScheduleId: async (
    scheduleId: number,
    attendeeName?: string,
    checkInStatus?: string,
  ): Promise<ReadTicketDTO[]> => {
    const response: any = await apiClient.get<ReadTicketDTO[]>(
      TICKETS_API.GET_BY_SCHEDULE(scheduleId),
      {
        params: {
          ...(attendeeName?.trim() ? { attendeeName: attendeeName.trim() } : {}),
          ...(checkInStatus && checkInStatus !== "all" ? { checkInStatus } : {}),
        },
      },
    );
    
    return response.data !== undefined ? response.data : (Array.isArray(response) ? response : []);
  },
};
