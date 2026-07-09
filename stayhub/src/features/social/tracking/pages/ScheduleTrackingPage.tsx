import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Map, { Marker, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import * as signalR from "@microsoft/signalr";
import { Users, ArrowLeft, Navigation } from "lucide-react";
import { SIGNALR_HUB_BASE } from "../../../../config/api/api";
import { useGetScheduleLiveLocations } from "../hooks/useScheduleTracking";
import { useTranslation } from "../../../../contexts/LocaleContext";

interface LiveLocation {
  userId: number;
  fullName: string;
  avatarUrl?: string | null;
  lat: number;
  lng: number;
  lastUpdated: string;
}

export const ScheduleTrackingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const scheduleIdNumber = Number(scheduleId);

  const { data, isLoading, isError, error } =
    useGetScheduleLiveLocations(scheduleIdNumber);

  const [locations, setLocations] = useState<LiveLocation[]>([]);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<MapRef | null>(null);
  const hasFlyRef = useRef(false);
  const token = localStorage.getItem("accessToken");
  console.log("[DEBUG] Token tồn tại:", !!token, token?.substring(0, 20));
  const apiKey = import.meta.env.VITE_MAPBOX_TOKEN as string;

  // 🔍 DEBUG: log mọi response từ REST API để biết data có về không
  useEffect(() => {
    console.log("[DEBUG] scheduleIdNumber:", scheduleIdNumber);
    console.log("[DEBUG] isLoading:", isLoading);
    console.log("[DEBUG] isError:", isError, error);
    console.log("[DEBUG] raw data from useGetScheduleLiveLocations:", data);
  }, [data, isLoading, isError, error, scheduleIdNumber]);

  // Merge dữ liệu poll REST API vào state
  useEffect(() => {
    if (!data || data.length === 0) {
      console.log("[DEBUG] data rỗng hoặc null — không có ai để hiện marker");
      return;
    }

    console.log("[DEBUG] Merge", data.length, "vị trí vào state");

    setLocations((prev) => {
      const merged = [...prev];
      data.forEach((incoming) => {
        const idx = merged.findIndex((p) => p.userId === incoming.userId);
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], ...incoming };
        } else {
          merged.push(incoming);
        }
      });
      console.log("[DEBUG] locations sau merge:", merged);
      return merged;
    });

    if (!hasFlyRef.current && mapRef.current && data[0]) {
      console.log("[DEBUG] flyTo vị trí đầu tiên:", data[0].lat, data[0].lng);
      mapRef.current.flyTo({
        center: [data[0].lng, data[0].lat],
        zoom: 14,
        duration: 1200,
      });
      hasFlyRef.current = true;
    }
  }, [data]);

  // Reset khi đổi schedule
  useEffect(() => {
    hasFlyRef.current = false;
    setLocations([]);
  }, [scheduleIdNumber]);

  // SignalR — KHÔNG để lỗi ở đây ảnh hưởng tới REST API phía trên
  useEffect(() => {
    if (scheduleIdNumber <= 0) return;

    const token = localStorage.getItem("accessToken");
    const hubUrl = token
      ? `${SIGNALR_HUB_BASE}/tracking?access_token=${token}`
      : `${SIGNALR_HUB_BASE}/tracking`;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    let isCancelled = false;

    connection
      .start()
      .then(async () => {
        if (isCancelled) return; // tránh invoke sau khi component unmount
        await connection.invoke("JoinTourTrackingGroup", scheduleIdNumber);

        connection.on("ReceiveTourLocationUpdate", (update: LiveLocation) => {
          console.log("[DEBUG] SignalR push:", update);
          setLocations((prev) => {
            const index = prev.findIndex(
              (item) => item.userId === update.userId,
            );
            if (index >= 0) {
              const next = [...prev];
              next[index] = { ...next[index], ...update };
              return next;
            }
            return [...prev, update];
          });
        });
      })
      .catch((err) => {
        // Lỗi SignalR không chặn REST API — chỉ log để biết
        console.warn(
          "[SignalR] Realtime không khả dụng, vẫn dùng polling REST:",
          err,
        );
      });

    return () => {
      isCancelled = true;
      connection.stop().catch(() => {});
    };
  }, [scheduleIdNumber]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0068E0] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative h-[85vh] w-full overflow-hidden rounded-2xl bg-slate-100">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-md transition-colors hover:bg-white"
        aria-label={t("common.back") || "Back"}
      >
        <ArrowLeft className="h-5 w-5 text-slate-700" />
      </button>

      {/* Badge số người online */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/60">
          <div className="relative flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <div className="absolute w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-60" />
          </div>
          <Users className="w-4 h-4 text-[#0068E0]" />
          <span className="text-sm font-bold text-slate-800">
            {locations.length > 0
              ? `${locations.length} ${t("social.trackingOnlineCount") || "người đang online"}`
              : t("social.trackingNoOneOnline") || "Chưa có ai online"}
          </span>
        </div>
      </div>

      <Map
        ref={mapRef}
        initialViewState={{
          latitude: 16.047079,
          longitude: 108.20623,
          zoom: 5,
        }}
        mapboxAccessToken={apiKey}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        {locations.map((location) => (
          <Marker
            key={location.userId}
            longitude={location.lng}
            latitude={location.lat}
            anchor="bottom"
          >
            <div className="pointer-events-none relative flex origin-bottom flex-col items-center justify-center">
              <div className="absolute -bottom-1 h-3 w-8 rounded-[100%] bg-black/30 blur-[3px]" />

              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-white shadow-xl overflow-hidden">
                {location.avatarUrl ? (
                  <img
                    src={location.avatarUrl}
                    alt={location.fullName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#0068E0] text-white font-bold text-xl">
                    {location.fullName?.charAt(0) || "?"}
                  </div>
                )}
                <div className="absolute inset-0 animate-ping rounded-full border-[3px] border-[#0068E0] opacity-40" />
              </div>

              <div className="absolute -bottom-2 z-0 h-4 w-4 rotate-45 border-b-[4px] border-r-[4px] border-white bg-[#0068E0]" />

              <span className="mt-3 px-2 py-0.5 bg-[#0068E0] text-white text-[10px] font-bold rounded-md whitespace-nowrap shadow-sm">
                {location.fullName || t("social.trackingGuestLabel")}
              </span>
            </div>
          </Marker>
        ))}
        {myLocation && (
          <Marker longitude={myLocation.lng} latitude={myLocation.lat} anchor="center">
            <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-md ring-4 ring-blue-500/30"></div>
          </Marker>
        )}
      </Map>

      {/* Floating Buttons */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-3">
        {typeof navigator !== 'undefined' && 'geolocation' in navigator && (
          <button
            onClick={() => {
              if (myLocation) {
                mapRef.current?.flyTo({ center: [myLocation.lng, myLocation.lat], zoom: 16, duration: 1000 });
              } else {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setMyLocation({ lat: latitude, lng: longitude });
                    mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 16, duration: 1000 });
                  },
                  (err) => {
                    console.warn("Lỗi định vị:", err);
                  }
                );
              }
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-700 shadow-lg transition-all hover:scale-105 hover:text-brand focus:outline-none"
            title="Vị trí của bạn"
          >
            <Navigation className={`h-5 w-5 ${myLocation ? 'text-brand fill-current' : 'text-slate-600'}`} />
          </button>
        )}
      </div>
    </div>
  );
};
