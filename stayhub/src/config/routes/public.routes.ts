export const PUBLIC_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  CHANGE_PASSWORD: '/change-password',
  TOURS: '/tours',
  TOUR_SEARCH: '/search',
  UNAUTHORIZED: '/unauthorized',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  // AI Tour Assistant (public — no login required)
  AI_ASSISTANT: '/ai-assistant',
  AI_RECOMMENDATIONS: '/ai/recommendations',
  // Dynamic Route
  TOUR_DETAIL: (id: string | number = ':id') => `/tours/${id}`,
} as const;