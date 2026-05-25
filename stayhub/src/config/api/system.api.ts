import { FULL_API } from './api';

// src/config/api/system.api.ts
export const SYSTEM_API = {
  NOTIFICATIONS: {
    GET_USER_NOTIFICATIONS: (userId: number) => `${FULL_API}/Notifications/user/${userId}`,
    MARK_AS_READ: (id: number) => `${FULL_API}/Notifications/${id}/read`,
    DELETE: (id: number) => `${FULL_API}/Notifications/${id}`,
  },
};
