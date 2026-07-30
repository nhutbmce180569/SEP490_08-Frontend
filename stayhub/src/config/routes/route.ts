import { PUBLIC_ROUTES } from './public.routes';
import { CUSTOMER_ROUTES } from './customer.routes';
import { MANAGER_ROUTES } from './manager.routes';
import { ADMIN_ROUTES } from './admin.routes';
import { STAFF_ROUTES } from './staff.routes'; 

export const PATH = {
  PUBLIC: PUBLIC_ROUTES,
  CUSTOMER: CUSTOMER_ROUTES,
  MANAGER: MANAGER_ROUTES,
  ADMIN: ADMIN_ROUTES,
  STAFF: STAFF_ROUTES, 
} as const;