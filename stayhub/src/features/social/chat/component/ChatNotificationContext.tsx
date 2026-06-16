import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import * as signalR from "@microsoft/signalr";
import { AuthContext } from "../../../../contexts/AuthContext";
import { AnimatePresence } from "framer-motion";
import { ChatNotificationCard } from "../component/ChatNotificationCard";
import { useNavigate } from "react-router-dom";
import { SIGNALR_HUB_BASE } from "../../../../config/api/api";
import { useQueryClient } from "@tanstack/react-query";

interface NotificationItem {
  id: string;
  roomName: string;
  senderName?: string;
  message: string;
  avatarUrl?: string;
  unreadCount?: number;
  roomId: number;
}

interface ChatNotificationContextType {
  notifications: NotificationItem[];
  dismissNotification: (id: string) => void;
  handleNotificationClick: (roomId: number, notifId: string) => void;
}

export const ChatNotificationContext = createContext<ChatNotificationContextType>({
  notifications: [],
  dismissNotification: () => {},
  handleNotificationClick: () => {},
});

export const useChatNotification = () => useContext(ChatNotificationContext);

export const ChatNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (timeoutRefs.current.has(id)) {
      clearTimeout(timeoutRefs.current.get(id));
      timeoutRefs.current.delete(id);
    }
  }, []);

  const handleNotificationClick = useCallback((roomId: number, notifId: string) => {
    dismissNotification(notifId);
    navigate(`/chat?roomId=${roomId}`);
  }, [dismissNotification, navigate]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("access_token");
    if (!user || !token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${SIGNALR_HUB_BASE}/chat`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .catch(err => console.error("Global Notification Hub Error:", err));

    connection.on("ReceiveMessage", (roomId: number, senderId: number, content: string, createdAt: string, senderName?: string, roomName?: string, avatarUrl?: string) => {
      
      const searchParams = new URLSearchParams(window.location.search);
      const isViewingThisRoom = searchParams.get("roomId") === String(roomId) && window.location.pathname.includes("/chat");

      // ✨ GIẢI PHÁP TỐI THƯỢNG: Can thiệp trực tiếp tăng số lượng unreadCount thủ công trong bộ nhớ cache của React Query
      queryClient.setQueryData(['chatRooms'], (oldRooms: any) => {
        if (!Array.isArray(oldRooms)) return oldRooms;
        return oldRooms.map((r: any) => {
          if (r.id === roomId) {
            return {
              ...r,
              lastMessage: content,
              lastMessageCreatedAt: createdAt,
              updatedAt: createdAt,
              // Nếu đang mở xem phòng đó thì giữ nguyên 0, ngược lại tự động cộng dồn 1 tin nhắn chưa đọc
              unreadCount: isViewingThisRoom ? 0 : (r.unreadCount || 0) + 1
            };
          }
          return r;
        });
      });

      // Kích hoạt đồng bộ hóa nhẹ nhàng luồng API ngầm mà không làm mất trạng thái unread vừa cộng dồn
      queryClient.invalidateQueries({ queryKey: ['chatRooms'], refetchType: 'none' });

      // Nếu đang mở xem phòng chat này thì chặn, không hiển thị Toast đẩy nổi lên màn hình
      if (isViewingThisRoom) {
        return;
      }

      const notifId = Math.random().toString(36).substring(2, 9);
      
      // Lấy unreadCount vừa cập nhật để nạp vào Toast đẩy iOS 26
      const latestRooms: any = queryClient.getQueryData(['chatRooms']);
      const targetRoom = Array.isArray(latestRooms) ? latestRooms.find((r: any) => r.id === roomId) : null;
      const nextUnreadCount = targetRoom ? (targetRoom.unreadCount || 1) : 1;

      const newNotif: NotificationItem = {
        id: notifId,
        roomName: roomName || targetRoom?.roomName || targetRoom?.name || "Cuộc trò chuyện mới",
        senderName: senderName || "Thành viên",
        message: content,
        avatarUrl: avatarUrl || targetRoom?.avatarUrl,
        unreadCount: nextUnreadCount,
        roomId: roomId,
      };

      setNotifications(prev => {
        const filtered = prev.filter(n => n.roomId !== roomId);
        return [newNotif, ...filtered];
      });

      if (timeoutRefs.current.has(notifId)) {
        clearTimeout(timeoutRefs.current.get(notifId));
      }
      const timer = setTimeout(() => {
        dismissNotification(notifId);
      }, 4000);
      timeoutRefs.current.set(notifId, timer);
    });

    return () => {
      connection.stop();
      timeoutRefs.current.forEach(timer => clearTimeout(timer));
      timeoutRefs.current.clear();
    };
  }, [user, dismissNotification, queryClient]);

  return (
    <ChatNotificationContext.Provider value={{ notifications, dismissNotification, handleNotificationClick }}>
      {children}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-3 pointer-events-none px-4 w-full max-w-sm">
        <AnimatePresence>
          {notifications.map(notif => (
            <div key={notif.id} className="pointer-events-auto w-full">
              <ChatNotificationCard
                roomName={notif.roomName}
                senderName={notif.senderName}
                message={notif.message}
                avatarUrl={notif.avatarUrl}
                unreadCount={notif.unreadCount}
                onClose={() => dismissNotification(notif.id)}
                onClick={() => handleNotificationClick(notif.roomId, notif.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ChatNotificationContext.Provider>
  );
};