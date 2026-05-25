import { PUBLIC_ROUTES } from './public.routes';
import { CUSTOMER_ROUTES } from './customer.routes';
import { MANAGER_ROUTES } from './manager.routes';
import { ADMIN_ROUTES } from './admin.routes';

export const PATH = {
  PUBLIC: PUBLIC_ROUTES,
  CUSTOMER: CUSTOMER_ROUTES,
  MANAGER: MANAGER_ROUTES,
  ADMIN: ADMIN_ROUTES,
} as const;