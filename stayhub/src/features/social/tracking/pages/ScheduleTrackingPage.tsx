import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Map, { Marker, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import * as signalR from "@microsoft/signalr";
import { Users } from "lucide-react";
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
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const scheduleIdNumber = Number(scheduleId);

  const { data, isLoading } = useGetScheduleLiveLocations(scheduleIdNumber);

  const [locations, setLocations] = useState<LiveLocation[]>([]);
  const mapRef = useRef<MapRef | null>(null);
  const hasFlyRef = useRef(false); // Chỉ fly đến vị trí đầu tiên 1 lần

  const apiKey = import.meta.env.VITE_MAPBOX_TOKEN as string;

  // Merge dữ liệu poll REST API vào state
  useEffect(() => {
    if (!data || data.length === 0) return;

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
      return merged;
    });

    // Fly đến vị trí người đầu tiên trong danh sách, chỉ 1 lần duy nhất
    if (!hasFlyRef.current && mapRef.current && data[0]) {
      mapRef.current.flyTo({
        center: [data[0].lng, data[0].lat],
        zoom: 14,
        duration: 1200,
      });
      hasFlyRef.current = true;
    }
  }, [data]);

  // Reset fly khi đổi schedule
  useEffect(() => {
    hasFlyRef.current = false;
    setLocations([]);
  }, [scheduleIdNumber]);

  // SignalR realtime — truyền token qua query string
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

    connection
      .start()
      .then(async () => {
        await connection.invoke("JoinTourTrackingGroup", scheduleIdNumber);

        connection.on("ReceiveTourLocationUpdate", (update: LiveLocation) => {
          setLocations((prev) => {
            const index = prev.findIndex((item) => item.userId === update.userId);
            if (index >= 0) {
              const next = [...prev];
              next[index] = { ...next[index], ...update };
              return next;
            }
            return [...prev, update];
          });
        });
      })
      .catch((err) => console.error("SignalR error:", err));

    return () => {
      connection.stop();
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
          // Dùng tọa độ trung tâm Việt Nam làm mặc định
          // flyTo sẽ tự bay đến vị trí thực khi data về
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
              {/* Shadow dưới chân marker */}
              <div className="absolute -bottom-1 h-3 w-8 rounded-[100%] bg-black/30 blur-[3px]" />

              {/* Avatar hoặc chữ cái đầu */}
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
                {/* Ping animation viền ngoài */}
                <div className="absolute inset-0 animate-ping rounded-full border-[3px] border-[#0068E0] opacity-40" />
              </div>

              {/* Mũi tên nhọn dưới bubble */}
              <div className="absolute -bottom-2 z-0 h-4 w-4 rotate-45 border-b-[4px] border-r-[4px] border-white bg-[#0068E0]" />

              {/* Tên hiển thị phía dưới */}
              <span className="mt-3 px-2 py-0.5 bg-[#0068E0] text-white text-[10px] font-bold rounded-md whitespace-nowrap shadow-sm">
                {location.fullName || t("social.trackingGuestLabel")}
              </span>
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
};