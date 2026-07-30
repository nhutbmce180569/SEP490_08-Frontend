import { SYSTEM_API } from "../../../config/api/system.api";
import { apiClient } from "../../../utils/axiosClient";
import type { Notification } from "../types/notification";

export const notificationService = {
  getUserNotifications: async (page = 1, pageSize = 10): Promise<{ data: Notification[], total: number, totalPages: number, currentPage: number, pageSize: number }> => {
    return apiClient.get(
      SYSTEM_API.NOTIFICATIONS.GET_USER_NOTIFICATIONS,
      { params: { page, pageSize } }
    );
  },

  markAsRead: async (id: number | string): Promise<void> => {
    await apiClient.put(SYSTEM_API.NOTIFICATIONS.MARK_AS_READ(id), {});
  },

  deleteNotification: async (id: number | string): Promise<void> => {
    await apiClient.delete(SYSTEM_API.NOTIFICATIONS.DELETE(id));
  },
};
