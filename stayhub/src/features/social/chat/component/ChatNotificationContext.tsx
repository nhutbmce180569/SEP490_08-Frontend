import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
// Strictly satisfy verbatimModuleSyntax configuration with import type
import type { ReactNode } from "react";
import * as signalR from "@microsoft/signalr";
import { AuthContext } from "../../../../contexts/AuthContext";
import { AnimatePresence } from "framer-motion";
import { ChatNotificationCard } from "./ChatNotificationCard";
import { useNavigate } from "react-router-dom";
import { SIGNALR_HUB_BASE } from "../../../../config/api/api";
import { useQueryClient } from "@tanstack/react-query";
import type { ChatMessage } from "../types/chat.type";

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
  const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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

  // Handler to "intercept" changes from the new Global event from Backend
  const handleGlobalNotification = useCallback((savedMessage: ChatMessage) => {
    const roomId = savedMessage.chatRoomId;
    if (!roomId) return;

    // Read the user's current room status directly from the URL
    const searchParams = new URLSearchParams(window.location.search);
    const isViewingThisRoom = searchParams.get("roomId") === String(roomId) && window.location.pathname.includes("/chat");

    // ✨ CACHE AGGREGATION ALGORITHM: Increase unreadCount directly on the Client UI layer
    queryClient.setQueryData(['chatRooms'], (oldRooms: any) => {
      if (!Array.isArray(oldRooms)) return oldRooms;
      
      const roomExists = oldRooms.some((r: any) => r.id === roomId);
      if (roomExists) {
        return oldRooms.map((r: any) => {
          if (r.id === roomId) {
            return {
              ...r,
              lastMessage: savedMessage.content,
              lastMessageCreatedAt: savedMessage.createdAt,
              updatedAt: savedMessage.createdAt,
              // Unread count rule: If viewing the room, keep it 0, otherwise increment by 1
              unreadCount: isViewingThisRoom ? 0 : (r.unreadCount || 0) + 1
            };
          }
          return r;
        });
      }
      return oldRooms;
    });

    // Signal to trigger dynamic sorting, sliding the conversation with new message to the top of the Sidebar
    queryClient.invalidateQueries({ queryKey: ['chatRooms'], refetchType: 'none' });

    // If the user is currently viewing this chat room, block the floating Toast to avoid disturbance
    if (isViewingThisRoom) return;

    // Push a floating Toast with iOS 26 frosted glass style
    const notifId = Math.random().toString(36).substring(2, 9);
    const latestRooms: any = queryClient.getQueryData(['chatRooms']);
    const targetRoom = Array.isArray(latestRooms) ? latestRooms.find((r: any) => r.id === roomId) : null;
    const nextUnreadCount = targetRoom ? (targetRoom.unreadCount || 1) : 1;

    const newNotif: NotificationItem = {
      id: notifId,
      roomName: targetRoom?.roomName || targetRoom?.name || savedMessage.senderName || "New conversation",
      senderName: savedMessage.senderName || "Member",
      message: savedMessage.content,
      avatarUrl: savedMessage.senderAvatarUrl || targetRoom?.avatarUrl,
      unreadCount: nextUnreadCount,
      roomId: roomId,
    };

    setNotifications(prev => [newNotif, ...prev.filter(n => n.roomId !== roomId)]);

    if (timeoutRefs.current.has(notifId)) {
      clearTimeout(timeoutRefs.current.get(notifId));
    }
    const timer = setTimeout(() => { dismissNotification(notifId); }, 4000);
    timeoutRefs.current.set(notifId, timer);
  }, [queryClient, dismissNotification]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("access_token");
    if (!user || !token) return;

    let isMounted = true;

    // 🚀 ISOLATED CONNECTION: Connect precisely to your global notification Hub port
    const globalConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${SIGNALR_HUB_BASE}/global-chat`, {
        accessTokenFactory: () => localStorage.getItem("accessToken") || localStorage.getItem("access_token") || "",
      })
      .withAutomaticReconnect()
      .build();

    const startGlobalHub = async () => {
      try {
        if (!isMounted) return;
        await globalConnection.start();
        if (!isMounted) {
          globalConnection.stop();
          return;
        }
        console.log("🟢 [FRONT-END] Global Hub Connected to /hubs/global-chat");

        // Intercept the exact global event sent from ChatHub.cs Backend
        globalConnection.on("ReceiveGlobalNotification", (savedMessage: ChatMessage) => {
          console.log("🔥 [SERVER SIGNAL] ReceiveGlobalNotification:", savedMessage);
          if (savedMessage) {
            handleGlobalNotification(savedMessage);
          }
        });
      } catch (err: any) {
        if (err.name === 'AbortError' || err.message?.includes('negotiation')) {
          console.warn('SignalR NotificationHub: Negotiation cancelled due to React Strict Mode.');
        } else {
          console.error("SignalR NotificationHub Connection Error: ", err);
        }
      }
    };

    // Use a short setTimeout to let React stabilize the Component before negotiating, to avoid AbortError
    const timerId = setTimeout(() => {
      if (isMounted) {
        startGlobalHub();
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timerId);
      globalConnection.stop();
      timeoutRefs.current.forEach(timer => clearTimeout(timer));
      timeoutRefs.current.clear();
    };
  }, [user, handleGlobalNotification]);

  // Mock function to force Test UI via Console window (Window Object Injection)
  useEffect(() => {
    (window as any).testGlobalNotification = (sender: string, msg: string) => {
      console.log("🛠️ TEST RUN: Activating mock notification...");
      const fakeMessage = {
        id: Math.random(),
        chatRoomId: 9999, // Mock ID
        senderId: 8888,
        senderName: sender,
        content: msg,
        createdAt: new Date().toISOString()
      };
      handleGlobalNotification(fakeMessage as any);
    };
    return () => { delete (window as any).testGlobalNotification; };
  }, [handleGlobalNotification]);

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
