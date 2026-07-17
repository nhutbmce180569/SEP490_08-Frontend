import { Promotion } from "../../promotion/types/promotion";

export interface TourScheduleTicketType {
  id?: number;
  name?: string | null;
  description?: string | null;
  isActive?: boolean | null;
}

export interface TourScheduleTicket {
  id: number;
  tourScheduleId?: number;
  scheduleId?: number;
  ticketTypeId?: number;
  ticketTypeName?: string | null;
  name?: string | null;
  ticketType?: TourScheduleTicketType | null;
  price?: number | string | null;
  quantity?: number | null;
  soldQuantity?: number | null;
  totalQuantity?: number | null;
  availableQuantity?: number | null;
  availableSeats?: number | null;
  maxCapacity?: number | null;
  isActive?: boolean | null;
  isActive?: boolean | null;
  note?: string | null;
  promotion?: Promotion | null;
}

export interface CreateTourScheduleTicketRequest {
  scheduleId: number;
  tourScheduleId?: number;
  ticketTypeId: number;
  price: number;
  quantity: number;
  isActive?: boolean | null;
  isActive?: boolean | null;
  note?: string | null;
  promotionId?: number | null;
}

export type UpdateTourScheduleTicketRequest = CreateTourScheduleTicketRequest;
