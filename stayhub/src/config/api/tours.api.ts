import { FULL_API } from './api';

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
  CREATE_ITINERARY: (id: string | number) => `${FULL_API}/tours/${id}/itineraries`,
  BATCH_ITINERARIES: `${FULL_API}/TourItineraries/batch`,
  TOUR_SCHEDULE_ITINERARIES: `${FULL_API}/TourScheduleItineraries`,
  BATCH_SCHEDULE_ITINERARIES: `${FULL_API}/TourScheduleItineraries/batch`,
  GET_SCHEDULE_ITINERARIES_BY_SCHEDULE: (scheduleId: string | number) => `${FULL_API}/TourScheduleItineraries/schedule/${scheduleId}`,
  TOUR_SCHEDULE_STAFFS: `${FULL_API}/TourScheduleStaffs`,
  SCHEDULES: `${FULL_API}/TourSchedules`,
  GET_SCHEDULE_BY_OPERATOR: `${FULL_API}/TourSchedules/operator`,
  // Schedules
  // These are now handled by tourSchedules.api.ts
  // Staff
  MANAGE_STAFF: (sId: string | number) => `${FULL_API}/schedules/${sId}/staff`,

  /** Wishlists — GET list, POST `{ tourId, action: "add"|"rem" }` (via gateway `FULL_API`). */
  MANAGE_WISHLIST: `${FULL_API}/wishlists`,

  CREATE_REVIEW: `${FULL_API}/reviews`,
  UPDATE_REVIEW: (id: string | number) => `${FULL_API}/reviews/${id}`,
  DELETE_REVIEW: (id: string | number) => `${FULL_API}/reviews/${id}`,
};