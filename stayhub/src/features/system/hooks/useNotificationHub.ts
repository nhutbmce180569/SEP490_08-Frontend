import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { SIGNALR_HUB_BASE } from "../../../config/api/api";
import { friendQueryKeys } from "../../../features/social/friends/hooks/useFriends";
import type { Notification } from "../types/notification";

export const useNotificationHub = (
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
) => {
  const setNotificationsRef = useRef(setNotifications);
  const queryClient = useQueryClient();

  useEffect(() => {
    setNotificationsRef.current = setNotifications;
  }, [setNotifications]);

  // -- Connection 1: NotificationHub (global notifications) --
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    let isCancelled = false;
    let connection: signalR.HubConnection | null = null;

    const startConnection = async () => {
      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${SIGNALR_HUB_BASE}/global-chat`, {
          accessTokenFactory: () =>
            localStorage.getItem("accessToken") ?? token,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      connection.on("ReceiveNewNotification", (newNoti: Notification) => {
        setNotificationsRef.current((prev) => {
          if (prev.some((n) => n.id === newNoti.id)) return prev;
          return [newNoti, ...prev];
        });
      });

      try {
        await connection.start();
        if (isCancelled) { connection.stop(); return; }
        console.log("[SignalR] Notification hub connected");
      } catch (err) {
        if (!isCancelled) console.error("[SignalR] Notification hub error:", err);
      }
    };

    startConnection();

    return () => {
      isCancelled = true;
      if (connection && connection.state === signalR.HubConnectionState.Connected) {
        connection.stop();
      }
    };
  }, []);

  // -- Connection 2: FriendshipHub -- turn friend requests into bell notifications --
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    let isCancelled = false;
    let connection: signalR.HubConnection | null = null;

    const startConnection = async () => {
      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${SIGNALR_HUB_BASE}/friendship`, {
          accessTokenFactory: () =>
            localStorage.getItem("accessToken") ?? token,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      connection.on("ReceiveFriendRequest", () => {
        if (isCancelled) return;
        // Invalidate react-query cache để tự động tải lại danh sách lời mời kết bạn mới nhất
        queryClient.invalidateQueries({ queryKey: friendQueryKeys.pending() });
      });

      try {
        await connection.start();
        if (isCancelled) { connection.stop(); return; }
        console.log("[SignalR] Friendship hub connected (for bell notifications)");
      } catch (err) {
        if (!isCancelled) console.error("[SignalR] Friendship hub error:", err);
      }
    };

    startConnection();

    return () => {
      isCancelled = true;
      if (connection && connection.state === signalR.HubConnectionState.Connected) {
        connection.stop();
      }
    };
  }, [queryClient]);
};
