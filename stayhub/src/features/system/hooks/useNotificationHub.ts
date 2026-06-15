import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { SIGNALR_HUB_BASE } from "../../../config/api/api";
import type { Notification } from "../types/notification";

export const useNotificationHub = (
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
) => {
  // Dùng ref thay vì để setNotifications vào dependency
  const setNotificationsRef = useRef(setNotifications);
  useEffect(() => {
    setNotificationsRef.current = setNotifications;
  }, [setNotifications]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    let disposed = false;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${SIGNALR_HUB_BASE}/notifications?access_token=${token}`)
      // ← dùng query string thay vì accessTokenFactory cho nhất quán
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveNewNotification", (newNoti: Notification) => {
      setNotificationsRef.current((prev) => {
        if (prev.some((n) => n.id === newNoti.id)) return prev;
        return [newNoti, ...prev];
      });
    });

    connection.start().catch((err) => {
      if (!disposed) console.error("Notification SignalR error:", err);
    });

    return () => {
      disposed = true;
      connection.stop();
    };
  }, []); // ← dependency rỗng, chỉ chạy 1 lần
};