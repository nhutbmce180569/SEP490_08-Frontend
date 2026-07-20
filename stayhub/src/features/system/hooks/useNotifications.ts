import { useCallback, useState } from "react";
import { notificationService } from "../services/notification.service";
import type { Notification } from "../types/notification";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object") {
    const apiError = err as {
      response?: { status?: number; data?: { message?: string } };
      message?: string;
    };

    if (apiError.response?.status === 401) return null;
    return apiError.response?.data?.message || apiError.message || fallback;
  }

  return fallback;
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (isLoadMore = false) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const fetchPage = isLoadMore ? page + 1 : 1;

    try {
      const response = await notificationService.getUserNotifications(fetchPage, 10);
      const newNotifications = response.data;
      
      setNotifications(prev => {
        if (isLoadMore) {
           const existingIds = new Set(prev.map(n => n.id));
           const filteredNew = newNotifications.filter(n => !existingIds.has(n.id));
           return [...prev, ...filteredNew];
        }
        return newNotifications;
      });
      
      setPage(fetchPage);
      setHasMore(fetchPage < response.totalPages);
      setHasLoaded(true);
    } catch (err: unknown) {
      console.error("Failed to load notifications:", err);
      const message = getErrorMessage(err, "Could not load notifications.");
      if (message) setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchNotifications(true);
    }
  }, [isLoading, hasMore, fetchNotifications]);

  const markAsRead = async (noti: Notification) => {
    if (noti.isRead) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === noti.id ? { ...n, isRead: true } : n)),
    );

    try {
      await notificationService.markAsRead(noti.id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const deleteNoti = async (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await notificationService.deleteNotification(id);
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    setNotifications,
    isLoading,
    hasLoaded,
    error,
    unreadCount,
    deleteNoti,
    markAsRead,
    refresh: () => fetchNotifications(false),
    loadMore,
    hasMore
  };
};
