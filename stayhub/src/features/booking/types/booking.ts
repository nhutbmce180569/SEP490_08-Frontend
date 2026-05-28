import type { Tour } from "../../tour/types/tour";
import type { TourSchedule } from "../../tour/types/tourSchedule";
import type { CreateTicketRequest, ReadTicketDTO } from "./ticket";

export interface CreateOrderRequest {
  scheduleId: number;
  ticketCount: number;
  note?: string;
  finalAmount: number;
  tickets: CreateTicketRequest[];
}

export interface UpdateTicketDTO {
  orderId?: number;
  userId?: number;
  attendeeName: string;
  idCard: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  qrCode?: string | null;
  checkInStatus?: string | null;
}


export interface ReadOrderDTO {
  id: number;
  customerId: number;
  scheduleId: number;
  ticketCount: number;
  discountValue?: number;
  finalAmount: number;
  note?: string;
  status?: string;
  orderedAt: string;
  inviteToken?: string;
  tour: Tour;
  schedule: TourSchedule;
  tickets: ReadTicketDTO[];
  review?: {
    id: number;
    rating: number;
    comment: string;
  } | null;
}