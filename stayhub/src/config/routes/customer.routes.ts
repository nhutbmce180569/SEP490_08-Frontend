export const CUSTOMER_ROUTES = {
  PROFILE: '/profile',
  SETTINGS: '/settings',
  UPGRADE_ACCOUNT: '/profile/upgrade',
  NOTIFICATIONS: '/notifications',
  MY_BOOKINGS: '/my-bookings',
  WISHLIST: '/wishlist',
  VOUCHERS: '/vouchers',
  MY_REVIEWS: '/my-reviews',

  AI_ASSISTANT: '/ai-assistant',
  SOCIAL_FRIENDS: '/social/friends',
  SOCIAL_CHAT: '/social/chat',
  SOCIAL_MOMENTS: '/social/moments',
  SAFETY_SOS: '/safety/sos',

  // Dynamic Routes & Delete Confirms
  CHECKOUT: (id: string | number = ':id') => `/tours/${id}/book`,
  BOOKING_DETAIL: (id: string | number = ':id') => `/my-bookings/${id}`,
  CANCEL_BOOKING: (id: string | number = ':id') => `/my-bookings/${id}/cancel`,
  REQUEST_CANCELLATION: (id: string | number = ':id') => `/my-bookings/${id}/request-refund`,
  REMOVE_WISHLIST: (id: string | number = ':id') => `/wishlist/${id}/remove`,
  DELETE_REVIEW: (id: string | number = ':id') => `/my-reviews/${id}/delete`,
  TOUR_MAP: (id: string | number = ':id') => `/tours/${id}/map`,
  UNFRIEND: (id: string | number = ':id') => `/social/friends/${id}/unfriend`,
  DELETE_MOMENT: (id: string | number = ':id') => `/social/moments/${id}/delete`,
  NOTIFICATION_DETAIL: (id: string | number = ':id') => `/notifications/${id}`,
} as const;