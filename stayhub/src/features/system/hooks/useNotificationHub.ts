import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { SIGNALR_HUB_BASE } from "../../../config/api/api";
import type { Notification } from "../types/notification";

export const useNotificationHub = (
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
) => {
  const setNotificationsRef = useRef(setNotifications);
  useEffect(() => {
    setNotificationsRef.current = setNotifications;
  }, [setNotifications]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // ✅ Flag để biết effect này đã bị cleanup chưa
    let isCancelled = false;
    let connection: signalR.HubConnection | null = null;

    const startConnection = async () => {
      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${SIGNALR_HUB_BASE}/notifications`, {
          // ✅ Dùng accessTokenFactory thay vì query string
          // → token được đọc lại mỗi lần reconnect, tránh token cũ
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

        // ✅ Kiểm tra sau await: nếu cleanup đã chạy thì stop ngay
        if (isCancelled) {
          connection.stop();
          return;
        }

        console.log("[SignalR] Notification hub connected");
      } catch (err) {
        if (!isCancelled) {
          console.error("[SignalR] Connection error:", err);
        }
      }
    };

    startConnection();

    return () => {
      isCancelled = true;
      // ✅ Chỉ stop khi connection đã Connected, tránh stop lúc đang negotiate
      if (
        connection &&
        connection.state === signalR.HubConnectionState.Connected
      ) {
        connection.stop();
      }
    };
  }, []);
};