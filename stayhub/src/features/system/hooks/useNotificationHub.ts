import { useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import { SIGNALR_HUB_BASE } from "../../../config/api/api";
import type { Notification } from "../types/notification";

const buildNotificationConnection = (
  token: string,
  useWebSocketsOnly: boolean,
) => {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${SIGNALR_HUB_BASE}/notifications`, {
      accessTokenFactory: () => token,
      ...(useWebSocketsOnly
        ? {
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets,
          }
        : {}),
    })
    .withAutomaticReconnect()
    .build();
};

export const useNotificationHub = (
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
) => {
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    let disposed = false;
    let connection: signalR.HubConnection | null = null;

    const attachHandlers = (hubConnection: signalR.HubConnection) => {
      hubConnection.on("ReceiveNewNotification", (newNoti: Notification) => {
        setNotifications((prev) => {
          if (prev.some((noti) => noti.id === newNoti.id)) return prev;
          return [newNoti, ...prev];
        });
      });
    };

    const startConnection = async () => {
      try {
        connection = buildNotificationConnection(token, true);
        attachHandlers(connection);
        await connection.start();
      } catch (webSocketError) {
        if (disposed) return;

        console.warn(
          "Notification SignalR WebSocket failed; falling back to default transport.",
          webSocketError,
        );

        connection = buildNotificationConnection(token, false);
        attachHandlers(connection);
        await connection.start();
      }
    };

    void startConnection();

    return () => {
      disposed = true;
      if (connection) {
        void connection.stop();
      }
    };
  }, [setNotifications]);
};
