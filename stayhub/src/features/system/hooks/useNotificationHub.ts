// Sửa lại file: src/hooks/useNotificationHub.ts
import { useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import type { Notification } from "../types/notification";

// 💥 Cho phép truyền hàm setNotifications vào
export const useNotificationHub = (setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>) => {
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7010/hubs/notifications", {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection.start().then(() => console.log("🟢 [SignalR] Connected!"));

    // 💥 Khi có thông báo mới, nhét nó vào ĐẦU danh sách cũ
    connection.on("ReceiveNewNotification", (newNoti: Notification) => {
      console.log("📬 [SignalR] THÔNG BÁO MỚI:", newNoti);
      setNotifications((prev) => [newNoti, ...prev]);
    });

    return () => {
      connection.stop();
    };
  }, [setNotifications]);
};