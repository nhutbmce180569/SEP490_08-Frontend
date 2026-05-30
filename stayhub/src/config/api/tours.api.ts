import { FULL_API } from "./api";

export const TOURS_API = {
  // Tours
  SEARCH: `${FULL_API}/tours/search`,
  GET_TOURS_BY_OPERATOR: `${FULL_API}/Tours/operator`,
  GET_PUBLIC_TOURS: `${FULL_API}/Tours/public`,
  GET_PUBLIC_DETAIL: (id: string | number) => `${FULL_API}/Tours/public/${id}`,
  GET_ALL: `${FULL_API}/tours`,
  GET_BY_ADMIN: `${FULL_API}/Tours/admin`,
  GET_DETAIL: (id: string | number) => `${FULL_API}/tours/${id}`,
  CREATE: `${FULL_API}/tours`,
  UPDATE: (id: string | number) => `${FULL_API}/tours/${id}`,
  ACTIVE_TOUR: (id: string | number) => `${FULL_API}/Tours/active/${id}`,
  UPDATE_STATUS: (id: string | number) => `${FULL_API}/tours/${id}/status`,
  DELETE: (id: string | number) => `${FULL_API}/tours/${id}`,

  // Itineraries
  ITINERARIES: `${FULL_API}/TourItineraries`,
  CREATE_ITINERARY: (id: string | number) =>
    `${FULL_API}/tours/${id}/itineraries`,
  BATCH_ITINERARIES: `${FULL_API}/TourItineraries/batch`,
  TOUR_SCHEDULE_ITINERARIES: `${FULL_API}/TourScheduleItineraries`,
  BATCH_SCHEDULE_ITINERARIES: `${FULL_API}/TourScheduleItineraries/batch`,
  GET_SCHEDULE_ITINERARIES_BY_SCHEDULE: (scheduleId: string | number) =>
    `${FULL_API}/TourScheduleItineraries/schedule/${scheduleId}`,
  TOUR_SCHEDULE_STAFFS: `${FULL_API}/TourScheduleStaffs`,
  TOUR_SCHEDULE_TICKETS: `${FULL_API}/TourScheduleTickets`,
  GET_TICKETS_BY_SCHEDULE: (scheduleId: string | number) => `${FULL_API}/TourScheduleTickets/schedule/${scheduleId}`,
  GET_TOUR_SCHEDULE_TICKET: (id: string | number) => `${FULL_API}/TourScheduleTickets/${id}`,
  UPDATE_TOUR_SCHEDULE_TICKET: (id: string | number) => `${FULL_API}/TourScheduleTickets/${id}`,
  DELETE_TOUR_SCHEDULE_TICKET: (id: string | number) => `${FULL_API}/TourScheduleTickets/${id}`,
  SCHEDULES: `${FULL_API}/TourSchedules`,
  GET_SCHEDULE_BY_OPERATOR: `${FULL_API}/TourSchedules/operator`,
  // Schedules
  GET_ALL_SCHEDULES: `${FULL_API}/TourSchedules`,
  GET_SCHEDULE_DETAIL: (id: string | number) =>
    `${FULL_API}/TourSchedules/${id}`,
  CREATE_SCHEDULE: `${FULL_API}/TourSchedules`,
  UPDATE_SCHEDULE: (id: string | number) => `${FULL_API}/TourSchedules/${id}`,
  DELETE_SCHEDULE: (id: string | number) => `${FULL_API}/TourSchedules/${id}`,

  // Gọi từ Booking API / Luồng đặt vé qua Gateway
  RESERVE_SEATS: (id: string | number) =>
    `${FULL_API}/TourSchedules/${id}/reserve`,
  RELEASE_SEATS: (id: string | number) =>
    `${FULL_API}/TourSchedules/${id}/release`,
  // These are now handled by tourSchedules.api.ts
  // Staff
  MANAGE_STAFF: (sId: string | number) => `${FULL_API}/schedules/${sId}/staff`,

  /** Wishlists — GET list, POST `{ tourId, action: "add"|"rem" }` (via gateway `FULL_API`). */
  MANAGE_WISHLIST: `${FULL_API}/wishlists`,

  GET_REVIEWS_BY_TOUR: (tourId: string | number) =>
    `${FULL_API}/reviews/tour/${tourId}`,
  GET_MY_REVIEW_BY_TOUR: (tourId: string | number) =>
    `${FULL_API}/reviews/tour/${tourId}/mine`,
  GET_MY_REVIEWS: `${FULL_API}/reviews/mine`,
  CREATE_REVIEW: `${FULL_API}/reviews`,
  UPDATE_REVIEW: (id: string | number) => `${FULL_API}/reviews/${id}`,
};
