import { SYSTEM_API } from "../../../config/api/system.api";
import { apiClient } from "../../../utils/axiosClient";
import type { Notification } from "../types/notification";

export const notificationService = {
  getUserNotifications: async (): Promise<Notification[]> => {
    return apiClient.get<Notification[]>(
      SYSTEM_API.NOTIFICATIONS.GET_USER_NOTIFICATIONS,
    );
  },

  markAsRead: async (id: number | string): Promise<void> => {
    await apiClient.put(SYSTEM_API.NOTIFICATIONS.MARK_AS_READ(id), {});
  },

  deleteNotification: async (id: number | string): Promise<void> => {
    await apiClient.delete(SYSTEM_API.NOTIFICATIONS.DELETE(id));
  },
};
