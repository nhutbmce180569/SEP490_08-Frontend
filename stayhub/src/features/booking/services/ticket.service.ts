import { apiClient } from "../../../utils/axiosClient";
import { TICKETS_API } from "../../../config/api/tickets.api";
import type { UpdateTicketDTO } from "../types/booking";

export const checkInTicket = async (data: UpdateTicketDTO) => {
  const response: any = await apiClient.put(TICKETS_API.CHECK_IN, data);
  return response.data !== undefined ? response.data : response;
};