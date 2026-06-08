export interface ReadTicketDTO {
  id: number;
  orderId?: number | null;
  orderDetailId: number;
  userId?: number;
  ticketTypeId: number;
  ticketTypeName?: string;
  attendeeName: string;
  idCard: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  qrCode?: string;
  checkInStatus?: string;
}

export interface CreateTicketRequest {
  userId?: number | null;
  ticketTypeId?: number | null;
  attendeeName: string;
  idCard: string;
  dateOfBirth?: string; // Format: YYYY-MM-DD
  gender?: string;
  nationality?: string;
  qrCode?: string | null;
  checkInStatus?: string | null;
}
