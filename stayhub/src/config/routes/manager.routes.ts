export const MANAGER_ROUTES = {
  DASHBOARD: '/manager',
  APPROVAL_STATUS: '/manager/status',
  MY_TOURS: '/manager/tours',
  CREATE_TOUR: '/manager/tours/create', // Cho phép Optional Params trên Component
  UPDATE_TOUR: '/manager/tours/update', // Cho phép Optional Params trên Component
  SCHEDULE_MANAGEMENT: '/manager/schedules',
  STAFF_ASSIGN: '/manager/staff-assign',
  BOOKING_MANAGEMENT: '/manager/bookings',
  CHECK_IN: '/manager/check-in',
  VOUCHERS: '/manager/vouchers',
  CREATE_OPERATOR_VOUCHER: '/manager/vouchers/create',
  OPERATOR_VOUCHER_DETAIL: (id: string | number = ':id') => `/manager/vouchers/${id}`,
  EDIT_OPERATOR_VOUCHER: (id: string | number = ':id') => `/manager/vouchers/${id}/edit`,
  REVIEWS: '/manager/reviews',
  PAYOUT: '/manager/payout',

  // Dynamic Routes & Delete Confirms
  TOUR_DETAIL: (id: string | number = ':id') => `/manager/tours/${id}`,
  EDIT_TOUR: (id: string | number = ':id') => `/manager/tours/edit/${id}`,
  DELETE_TOUR: (id: string | number = ':id') => `/manager/tours/${id}/delete`,
  DELETE_VOUCHER: (id: string | number = ':id') => `/manager/vouchers/${id}/delete`,

  // Itinerary Routes
  CREATE_ITINERARY: (tourId: string | number = ':tourId') => `/manager/tours/${tourId}/itineraries/create`,
  EDIT_ITINERARY: (tourId: string | number = ':tourId', itineraryId: string | number = ':itineraryId') => `/manager/tours/${tourId}/itineraries/edit/${itineraryId}`,
  DELETE_ITINERARY: (tourId: string | number = ':tourId', itineraryId: string | number = ':itineraryId') => `/manager/tours/${tourId}/itineraries/${itineraryId}/delete`,
  CREATE_SCHEDULE_ITINERARY: (scheduleId: string | number = ':scheduleId') => `/manager/schedules/${scheduleId}/itineraries/create`,
  EDIT_SCHEDULE_ITINERARY: (scheduleId: string | number = ':scheduleId', itineraryId: string | number = ':itineraryId') => `/manager/schedules/${scheduleId}/itineraries/edit/${itineraryId}`,
  DELETE_SCHEDULE_ITINERARY: (scheduleId: string | number = ':scheduleId', itineraryId: string | number = ':itineraryId') => `/manager/schedules/${scheduleId}/itineraries/${itineraryId}/delete`,
  CREATE_SCHEDULE_TICKET: (scheduleId: string | number = ':scheduleId') => `/manager/schedules/${scheduleId}/tickets/create`,
  EDIT_SCHEDULE_TICKET: (scheduleId: string | number = ':scheduleId', ticketId: string | number = ':ticketId') => `/manager/schedules/${scheduleId}/tickets/edit/${ticketId}`,
  DELETE_SCHEDULE_TICKET: (scheduleId: string | number = ':scheduleId', ticketId: string | number = ':ticketId') => `/manager/schedules/${scheduleId}/tickets/${ticketId}/delete`,

  SCHEDULE_DETAIL: (id: string | number = ':id') => `/manager/schedules/${id}`,
  SCHEDULE_ORDERS: (id: string | number = ':id') => `/manager/schedules/${id}/orders`,
  SCHEDULE_CHECKIN: (id: string | number = ':id') => `/manager/schedules/${id}/checkin`,
  DELETE_SCHEDULE: (id: string | number = ':id') => `/manager/schedules/${id}/delete`,
  EDIT_SCHEDULE: (id: string | number = ':id') => `/manager/schedules/edit/${id}`,
  CREATE_SCHEDULE: () => `/manager/schedules/create`,
  
} as const;
