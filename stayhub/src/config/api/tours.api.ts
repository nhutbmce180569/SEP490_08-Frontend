import { FULL_API } from "./api";

export const TOURS_API = {
  // Tours
  SEARCH: `${FULL_API}/tours/search`,
  GET_TOURS_BY_OPERATOR: `${FULL_API}/Tours/operator`,
  GET_PUBLIC_TOURS: `${FULL_API}/Tours/public`,
  GET_SALE_TOURS: `${FULL_API}/Tours/sale`,
  GET_HOT_TOURS: `${FULL_API}/Tours/hot`,
  GET_UPCOMING_TOURS: `${FULL_API}/Tours/upcoming`,
  GET_TOURS_BY_REGION: (region: string) => `${FULL_API}/Tours/public/region/${region}`,
  GET_PUBLIC_DETAIL: (id: string | number) => `${FULL_API}/Tours/public/${id}`,
  GET_ALL: `${FULL_API}/tours`,
  GET_BY_ADMIN: `${FULL_API}/Tours/admin`,
  GET_BY_MANAGER: `${FULL_API}/Tours/manager`,
  GET_DETAIL: (id: string | number) => `${FULL_API}/tours/${id}`,
  CREATE: `${FULL_API}/tours`,
  UPDATE: (id: string | number) => `${FULL_API}/tours/${id}`,
  ACTIVE_TOUR: (id: string | number) => `${FULL_API}/Tours/active/${id}`,
  UPDATE_STATUS: (id: string | number) => `${FULL_API}/tours/${id}/status`,
  CHANGE_MANAGER: (id: string | number) => `${FULL_API}/tours/${id}/manager`,
  DELETE: (id: string | number) => `${FULL_API}/tours/${id}`,

  // Itineraries
  ITINERARIES: `${FULL_API}/TourItineraries`,
  CREATE_ITINERARY: (id: string | number) =>
    `${FULL_API}/tours/${id}/itineraries`,
  BATCH_ITINERARIES: `${FULL_API}/TourItineraries/batch`,
  ITINERARY_IMPORT_TEMPLATE: `${FULL_API}/TourItineraries/import-template`,
  TOUR_SCHEDULE_ITINERARIES: `${FULL_API}/TourScheduleItineraries`,
  BATCH_SCHEDULE_ITINERARIES: `${FULL_API}/TourScheduleItineraries/batch`,
  SCHEDULE_ITINERARY_IMPORT_TEMPLATE: `${FULL_API}/TourScheduleItineraries/import-template`,
  GET_SCHEDULE_ITINERARIES_BY_SCHEDULE: (scheduleId: string | number) =>
    `${FULL_API}/TourScheduleItineraries/schedule/${scheduleId}`,
  TOUR_SCHEDULE_STAFFS: `${FULL_API}/TourScheduleStaffs`,
  TOUR_SCHEDULE_TICKETS: `${FULL_API}/TourScheduleTickets`,
  GET_TICKETS_BY_SCHEDULE: (scheduleId: string | number) =>
    `${FULL_API}/TourScheduleTickets/schedule/${scheduleId}`,
  GET_TOUR_SCHEDULE_TICKET: (id: string | number) =>
    `${FULL_API}/TourScheduleTickets/${id}`,
  UPDATE_TOUR_SCHEDULE_TICKET: (id: string | number) =>
    `${FULL_API}/TourScheduleTickets/${id}`,
  CHANGE_TOUR_SCHEDULE_TICKET_STATUS: (id: string | number) =>
    `${FULL_API}/TourScheduleTickets/${id}/change-status`,
  SCHEDULES: `${FULL_API}/TourSchedules`,
  GET_SCHEDULE_BY_OPERATOR: `${FULL_API}/TourSchedules/operator`,

  // Schedules
  GET_ALL_SCHEDULES: `${FULL_API}/TourSchedules`,
  GET_MY_SCHEDULES: `${FULL_API}/TourSchedules/my`,
  GET_SCHEDULE_DETAIL: (id: string | number) =>
    `${FULL_API}/TourSchedules/${id}`,
  CREATE_SCHEDULE: `${FULL_API}/TourSchedules`,
  UPDATE_SCHEDULE: (id: string | number) => `${FULL_API}/TourSchedules/${id}`,
  DELETE_SCHEDULE: (id: string | number) => `${FULL_API}/TourSchedules/${id}`,
  GET_ASSIGNED_SCHEDULES: `${FULL_API}/TourScheduleStaffs/assigned`,

  // Gọi từ Booking API / Luồng đặt vé qua Gateway
  RESERVE_SEATS: (id: string | number) =>
    `${FULL_API}/TourSchedules/${id}/reserve`,
  RELEASE_SEATS: (id: string | number) =>
    `${FULL_API}/TourSchedules/${id}/release`,
  // These are now handled by tourSchedules.api.ts
  // Staff
  MANAGE_STAFF: (sId: string | number) => `${FULL_API}/schedules/${sId}/staff`,

  /** Wishlists — GET list, POST/DELETE by tour id (via gateway `FULL_API`). */
  GET_WISHLIST: `${FULL_API}/wishlists`,
  ADD_TO_WISHLIST: (tourId: string | number) =>
    `${FULL_API}/wishlists/tours/${tourId}`,
  REMOVE_FROM_WISHLIST: (tourId: string | number) =>
    `${FULL_API}/wishlists/tours/${tourId}`,
  MANAGE_WISHLIST: `${FULL_API}/wishlists`,

  GET_REVIEWS_BY_TOUR: (tourId: string | number) =>
    `${FULL_API}/reviews/tour/${tourId}`,
  // Cập nhật vào danh sách API
  GET_REVIEWS_BY_TOUR_ADMIN: (tourId: string | number) =>
    `${FULL_API}/reviews/tour/${tourId}/admin`,
  GET_REVIEWS_BY_TOUR_MANAGER: (tourId: string | number) =>
    `${FULL_API}/reviews/manager/tour/${tourId}`,
  GET_MY_REVIEW_BY_TOUR: (tourId: string | number) =>
    `${FULL_API}/reviews/tour/${tourId}/mine`,
  GET_MY_REVIEWS: `${FULL_API}/reviews/mine`,
  CREATE_REVIEW: `${FULL_API}/reviews`,
  UPDATE_REVIEW: (id: string | number) => `${FULL_API}/reviews/${id}`,

  CREATE_REVIEW_REPLY: (reviewId: string | number) =>
    `${FULL_API}/reviews/${reviewId}/replies`,
  UPDATE_REVIEW_REPLY: (replyId: string | number) =>
    `${FULL_API}/reviews/replies/${replyId}`,
  DELETE_REVIEW_REPLY: (replyId: string | number) =>
    `${FULL_API}/reviews/replies/${replyId}`,
  HIDE_REVIEW: (reviewId: string | number, hidden: boolean) =>
    `${FULL_API}/reviews/${reviewId}/hide?hidden=${hidden}`,

  // Staff Assignment
  GET_STAFF_BY_SCHEDULE: (scheduleId: string | number) =>
    `${FULL_API}/TourScheduleStaffs/schedule/${scheduleId}`,

  ASSIGN_STAFF: `${FULL_API}/TourScheduleStaffs`,

  REMOVE_STAFF: (scheduleId: string | number, staffId: string | number) =>
    `${FULL_API}/TourScheduleStaffs/schedule/${scheduleId}/staff/${staffId}`,
};
