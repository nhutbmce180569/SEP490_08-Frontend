import type { Tour } from "../../tour/types/tour";
import type { TourSchedule } from "../../tour/types/tourSchedule";
import type { CreateTicketRequest, ReadTicketDTO } from "./ticket";

export interface CreateOrderDetailRequest {
  tourScheduleTicketId: number;
  ticketTypeId?: number | null;
  unitPrice?: number | null;
  tickets: CreateTicketRequest[];
}

export interface CreateOrderRequest {
  scheduleId: number;
  totalQuantity?: number;
  ticketCount?: number;
  voucherCode?: string | null;
  note?: string | null;
  finalAmount: number;
  orderDetails: CreateOrderDetailRequest[];
}

export interface UpdateTicketDTO {
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
  discountValue?: number | null;
  voucherCode?: string | null;
  finalAmount: number;
  note?: string | null;
  status?: string | null;
  orderedAt?: string | null;
  inviteToken?: string | null;
  tour?: Tour | null;
  schedule?: TourSchedule | null;
  orderDetails: {
    id: number;
    orderId: number;
    ticketTypeId: number;
    tourScheduleTicketId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    tickets?: ReadTicketDTO[] | null;
  }[];
  tickets?: ReadTicketDTO[] | null;
  review?: {
    id: number;
    rating: number;
    comment?: string | null;
    createdAt?: string | null; // 💥 THÊM DÒNG NÀY (Để dùng cho hàm isReviewEditable)
    canEdit?: boolean;         // 💥 THÊM DÒNG NÀY (Nếu Backend trả về sẵn thuộc tính này)
  } | null;
}

export interface ReadScheduleCustomerDTO {
  ticketId: number;
  orderId: number;
  userId?: number;
  attendeeName: string;
  idCard: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;
}
