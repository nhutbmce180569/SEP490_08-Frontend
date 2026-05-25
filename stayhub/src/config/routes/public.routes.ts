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
  // Dynamic Route
  TOUR_DETAIL: (id: string | number = ':id') => `/tours/${id}`,
} as const;