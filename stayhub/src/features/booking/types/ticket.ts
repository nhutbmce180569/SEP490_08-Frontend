export interface ReadTicketDTO {
  id: number;
  orderId: number;
  userId?: number;
  attendeeName: string;
  idCard: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  qrCode?: string;
  checkInStatus?: string;
}

export interface CreateTicketRequest {
  attendeeName: string;
  idCard: string;
  dateOfBirth?: string; // Format: YYYY-MM-DD
  gender?: string;
  nationality?: string;
  tourScheduleTicketId?: number;
  scheduleTicketId?: number;
  ticketTypeId?: number | null;
  ticketTypeName?: string;
  price?: number;
}
