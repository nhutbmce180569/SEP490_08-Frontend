import type { ReadTicketTypeDTO } from "../../content/types/ticketType";
import type { TourScheduleTicket } from "../types/tourScheduleTicket";

export const getNumberValue = (value?: number | string | null) => {
  if (value === undefined || value === null || value === "") return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

export const formatTicketCurrency = (value?: number | string | null) => {
  const numberValue = getNumberValue(value);
  return numberValue === null ? "No price" : `${numberValue.toLocaleString("vi-VN")} đ`;
};

export const getScheduleTicketTypeId = (ticket: TourScheduleTicket) =>
  ticket.ticketTypeId ?? ticket.ticketType?.id ?? null;

export const getScheduleTicketCapacity = (ticket: TourScheduleTicket) =>
  getNumberValue(ticket.quantity ?? ticket.totalQuantity ?? ticket.maxCapacity);

export const getScheduleTicketAvailable = (ticket: TourScheduleTicket) =>
  getNumberValue(
    ticket.availableQuantity ??
      ticket.availableSeats ??
      ticket.quantity ??
      ticket.totalQuantity ??
      ticket.maxCapacity,
  );

export const getScheduleTicketName = (
  ticket: TourScheduleTicket,
  ticketType?: ReadTicketTypeDTO | null,
) => {
  const ticketTypeId = getScheduleTicketTypeId(ticket);

  return (
    ticketType?.name ||
    ticket.ticketType?.name ||
    ticket.ticketTypeName ||
    ticket.name ||
    (ticketTypeId ? `Ticket type #${ticketTypeId}` : `Ticket #${ticket.id}`)
  );
};

export const buildScheduleTicketPayload = (
  scheduleId: number,
  ticketTypeId: number,
  price: number,
  quantity: number,
) => ({
  scheduleId,
  tourScheduleId: scheduleId,
  ticketTypeId,
  price,
  quantity,
});
