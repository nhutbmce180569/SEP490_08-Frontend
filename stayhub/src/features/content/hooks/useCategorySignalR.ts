import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { SIGNALR_HUB_BASE } from "../../../config/api/api";

export const useCategorySignalR = (onUpdate: () => void) => {
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    let isCancelled = false;
    let connection: signalR.HubConnection | null = null;

    const startConnection = async () => {
      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${SIGNALR_HUB_BASE}/categories`)
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      const triggerUpdate = () => {
        onUpdateRef.current();
      };

      connection.on("CategoryCreated", triggerUpdate);
      connection.on("CategoryUpdated", triggerUpdate);
      connection.on("CategoryDeleted", triggerUpdate);

      try {
        await connection.start();
        if (isCancelled) {
          connection.stop();
          return;
        }
        console.log("[SignalR] Category hub connected");
      } catch (err) {
        if (!isCancelled) {
          console.error("[SignalR] Category hub connection error:", err);
        }
      }
    };

    startConnection();

    return () => {
      isCancelled = true;
      if (
        connection &&
        connection.state === signalR.HubConnectionState.Connected
      ) {
        connection.stop();
      }
    };
  }, []);
};
