import axios from "axios";
import { SYSTEM_API } from "../../../config/api/system.api"; // Điều chỉnh đường dẫn import cho đúng dự án của bạn
import type { Notification } from "../types/notification";

// Hàm helper tự động lấy token từ localStorage
const getAuthConfig = () => {
  // Đổi thành "accessToken" cho khớp với ảnh của bạn
  const token = localStorage.getItem("accessToken"); 
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const notificationService = {
  // Lấy danh sách thông báo của user đang đăng nhập
  getUserNotifications: async (): Promise<Notification[]> => {
    const response = await axios.get(
      SYSTEM_API.NOTIFICATIONS.GET_USER_NOTIFICATIONS,
      getAuthConfig()
    );
    return response.data;
  },

  // Đánh dấu 1 thông báo là đã đọc
  markAsRead: async (id: number | string): Promise<void> => {
    // Để body là {} vì method PUT cần data object dù là rỗng
    await axios.put(
      SYSTEM_API.NOTIFICATIONS.MARK_AS_READ(id),
      {}, 
      getAuthConfig()
    );
  },

  // Xóa thông báo (Nếu cần thiết)
  deleteNotification: async (id: number | string): Promise<void> => {
    await axios.delete(
      SYSTEM_API.NOTIFICATIONS.DELETE(id),
      getAuthConfig()
    );
  },
};