import { useState, useEffect, useCallback } from "react";
import { notificationService } from "../services/notification.service";
import type { Notification } from "../types/notification";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Hàm gọi API lấy danh sách
const fetchNotifications = useCallback(async () => {
    // Đổi thành "accessToken" ở đây nữa
    const token = localStorage.getItem("accessToken"); 
    
    // Nếu chưa đăng nhập (không có token) thì ngưng luôn, không gọi API
    if (!token) {
      setIsLoading(false);
      return; 
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await notificationService.getUserNotifications();
      setNotifications(data);
    } catch (err: any) {
      console.error("Lỗi khi lấy thông báo:", err);
      if (err?.response?.status !== 401) {
        setError(err?.response?.data?.message || "Không thể tải thông báo.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Tự động gọi API khi khởi tạo hook
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Hàm đánh dấu đã đọc (cập nhật UI ngay lập tức, gọi API ngầm)
  const markAsRead = async (noti: Notification) => {
    if (noti.isRead) return;

    // 1. Cập nhật UI ngay lập tức (Optimistic UI Update) cho cảm giác mượt mà
    setNotifications((prev) =>
      prev.map((n) => (n.id === noti.id ? { ...n, isRead: true } : n))
    );

    // 2. Gọi API để lưu xuống DB
    try {
      await notificationService.markAsRead(noti.id);
    } catch (err) {
      console.error("Lỗi khi đánh dấu đã đọc:", err);
      // Nếu API lỗi, có thể roll-back state ở đây nếu muốn hệ thống cực kỳ chặt chẽ
    }
  };

  const deleteNoti = async (id: number) => {
    // 1. Cập nhật UI ngay lập tức: Lọc bỏ thông báo bị xóa
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    // 2. Gọi API để xóa thật dưới Database
    try {
      await notificationService.deleteNotification(id);
    } catch (err) {
      console.error("Lỗi khi xóa thông báo:", err);
      // Bổ sung: Nếu xóa thất bại, bạn có thể gọi lại fetchNotifications() để khôi phục UI
    }
  };

  // Tính sẵn số lượng chưa đọc trả về cho Component
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    setNotifications, // Xuất ra để sau này nhét data SignalR vào
    isLoading,
    error,
    unreadCount,
    deleteNoti,
    markAsRead,
    refresh: fetchNotifications, // Dành cho nút "Tải lại" nếu cần
  };
};