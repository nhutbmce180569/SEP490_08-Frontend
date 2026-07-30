export const STAFF_ROUTES = {
  DASHBOARD: '/staff',
  PROFILE: '/staff/profile',
  UPDATE_PROFILE: '/staff/profile/update',
  CHANGE_PASSWORD: '/staff/profile/change-password',
  SCHEDULES: '/staff/schedules',
  SCHEDULE_DETAIL: (id: string | number = ':id') => `/staff/schedules/${id}`,
  QR_CHECKIN: '/staff/qr-checkin',
  QR_CHECKIN_SCAN: (scheduleId: string | number = ':scheduleId') => `/staff/qr-checkin/${scheduleId}`,
  TICKETS: '/staff/tickets',
  TICKET_DETAIL: (id: string | number = ':id') => `/staff/tickets/${id}`,

  LOCATIONS: '/staff/locations',
  TRACK_SCHEDULE_LOCATIONS: (scheduleId: string | number = ':scheduleId') => `/staff/locations/${scheduleId}`,
  CUSTOMERS: '/staff/customers',
  SCHEDULE_CUSTOMERS: (scheduleId: string | number = ':scheduleId') => `/staff/customers/${scheduleId}`,
  CHAT: '/staff/chat',
} as const;