import type { Tour } from "../../tour/types/tour";
import type { TourSchedule } from "../../tour/types/tourSchedule";
import type { CreateTicketRequest, ReadTicketDTO } from "./ticket";

export interface CreateOrderDetailRequest {
  tourScheduleTicketId: number;
  ticketTypeId?: number | null;
  tickets: CreateTicketRequest[];
}

export interface CreateOrderRequest {
  scheduleId: number;
  totalQuantity?: number;
  ticketCount?: number;
  voucherCode?: string;
  note?: string;
  finalAmount?: number;
  orderDetails: CreateOrderDetailRequest[];
}

export interface UpdateTicketDTO {
  orderId?: number;
  userId?: number;
  ticketTypeId?: number | null;
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
  totalQuantity: number;
  ticketCount: number;
  totalAmount: number;
  discountValue?: number;
  finalAmount: number;
  note?: string;
  status?: string;
  orderedAt: string;
  inviteToken?: string;
  tour: Tour;
  schedule: TourSchedule;
  orderDetails: {
    id: number;
    orderId: number;
    ticketTypeId: number;
    tourScheduleTicketId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    tickets: ReadTicketDTO[];
  }[];
  tickets: ReadTicketDTO[];
  review?: {
    id: number;
    rating: number;
    comment?: string | null;
  } | null;
}
