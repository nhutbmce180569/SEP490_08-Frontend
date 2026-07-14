import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Map, { Marker, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import * as signalR from "@microsoft/signalr";
import { Users, Navigation, ArrowLeft, ChevronDown } from "lucide-react";
import { SIGNALR_HUB_BASE } from "../../../../config/api/api";
import { useGetScheduleLiveLocations } from "../hooks/useScheduleTracking";
import { useTranslation } from "../../../../contexts/LocaleContext";
import { tourScheduleService } from "../../../tour/services/tourSchedule.service";
import { tourScheduleStaffService } from "../../../tour/services/tourScheduleStaffService.service";

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

  const { data, isLoading, isError, error } =
    useGetScheduleLiveLocations(scheduleIdNumber);

  const [locations, setLocations] = useState<LiveLocation[]>([]);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<MapRef | null>(null);
  const hasFlyRef = useRef(false);
  const token = localStorage.getItem("accessToken");
  console.log("[DEBUG] Token tồn tại:", !!token, token?.substring(0, 20));

  const [scheduleOptions, setScheduleOptions] = useState<{ id: number; name: string }[]>([]);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const navigate = useNavigate();
  const isManager = window.location.pathname.startsWith("/manager");

  const [viewState, setViewState] = useState({
    latitude: 16.047079,
    longitude: 108.20623,
    zoom: 5,
  });

  const visualLocations = useMemo(() => {
    const zoom = Math.round(viewState.zoom);
    const threshold = 0.0003 * Math.pow(2, 15 - zoom);
    const radius = 0.0004 * Math.pow(2, 15 - zoom);

    const placed: { lat: number, lng: number }[] = [];
    const result: any[] = [];

    if (myLocation) {
      placed.push({ lat: myLocation.lat, lng: myLocation.lng });
    }

    const savedUser = localStorage.getItem("user");
    let currentUserId: string | null = null;
    if (savedUser) {
      try {
        currentUserId = JSON.parse(savedUser)?.id || null;
      } catch {}
    }

    locations.forEach(loc => {
      // Exclude current user (already drawn as blue dot)
      if (currentUserId && String(loc.userId) === String(currentUserId)) {
        return;
      }

      const fLat = Number(loc.lat);
      const fLng = Number(loc.lng);
      if (isNaN(fLat) || isNaN(fLng)) return;

      const overlaps = placed.filter(p => 
        Math.abs(p.lat - fLat) < threshold && Math.abs(p.lng - fLng) < threshold
      );

      if (overlaps.length > 0) {
        const count = overlaps.length;
        const angle = (count * 137.5) * (Math.PI / 180);
        const pushRadius = radius + (Math.floor(count / 4) * radius * 0.3);

        const offsetLat = fLat + pushRadius * Math.cos(angle);
        const offsetLng = fLng + pushRadius * Math.sin(angle);
        
        placed.push({ lat: offsetLat, lng: offsetLng });
        result.push({ ...loc, visualLat: offsetLat, visualLng: offsetLng });
      } else {
        placed.push({ lat: fLat, lng: fLng });
        result.push({ ...loc, visualLat: fLat, visualLng: fLng });
      }
    });

    return result;
  }, [locations, myLocation, viewState.zoom]);

  useEffect(() => {
    const fetchOptions = async () => {
      setIsOptionsLoading(true);
      try {
        if (isManager) {
          const res = await tourScheduleService.getMySchedules(1, 100);
          const mapped = (res?.data || []).map((item) => {
            const dateStr = item.departureDate ? new Date(item.departureDate).toLocaleDateString("vi-VN") : "";
            const name = item.tour?.name || `Schedule #${item.id}`;
            return {
              id: item.id,
              name: dateStr ? `${name} - ${dateStr}` : name,
            };
          });
          setScheduleOptions(mapped);
        } else {
          const res = await tourScheduleStaffService.getAssignedSchedules(1, 100, false);
          const mapped = (res?.data || []).map((item) => {
            const dateStr = item.departureDate ? new Date(item.departureDate).toLocaleDateString("vi-VN") : "";
            const name = item.tourName || `Schedule #${item.scheduleId}`;
            return {
              id: item.scheduleId,
              name: dateStr ? `${name} - ${dateStr}` : name,
            };
          });
          setScheduleOptions(mapped);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách chuyến đi:", err);
      } finally {
        setIsOptionsLoading(false);
      }
    };

    fetchOptions();
  }, [isManager]);
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
      connection.stop().catch(() => { });
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
      {/* Selector chuyến đi & Nút Quay lại */}
      <div className="absolute top-4 left-4 z-10 w-72 sm:w-80 flex items-center gap-2">
        <button
          onClick={() => navigate(isManager ? "/manager/locations" : "/staff/locations")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/95 text-slate-600 shadow-lg border border-slate-200/80 backdrop-blur-md transition-all hover:scale-105 hover:text-brand focus:outline-none"
          title="Quay lại danh sách"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 flex flex-col gap-1 rounded-2xl bg-white/95 p-3 shadow-lg border border-slate-200/80 backdrop-blur-md">
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {t("social.trackingSelectTour") || "Chọn chuyến đi để theo dõi"}
          </label>
          <div className="relative">
            <select
              value={scheduleIdNumber || ""}
              onChange={(e) => {
                const targetId = e.target.value;
                if (targetId) {
                  navigate(
                    isManager
                      ? `/manager/locations/${targetId}`
                      : `/staff/locations/${targetId}`
                  );
                }
              }}
              disabled={isOptionsLoading}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-slate-400 focus:bg-white cursor-pointer disabled:opacity-50"
            >
              {isOptionsLoading ? (
                <option value="">{t("common.loading") || "Đang tải..."}</option>
              ) : scheduleOptions.length === 0 ? (
                <option value="">{t("social.trackingNoSchedulesShort") || "Không tìm thấy chuyến đi nào"}</option>
              ) : (
                scheduleOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

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
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={apiKey}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        {visualLocations.map((location) => {
          const isStaff = location.role === "Staff";
          const themeColor = isStaff ? "#10b981" : "#0068E0"; // Emerald green for Staff, Brand blue for Customer
          
          return (
            <Marker
              key={location.userId}
              longitude={location.visualLng}
              latitude={location.visualLat}
              anchor="bottom"
            >
              <div className="pointer-events-none relative flex origin-bottom flex-col items-center justify-center">
                <div className="absolute -bottom-1 h-3 w-8 rounded-[100%] bg-black/30 blur-[3px]" />

                <div 
                  className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 bg-white shadow-xl overflow-hidden"
                  style={{ borderColor: isStaff ? themeColor : "#ffffff" }}
                >
                  {location.avatarUrl ? (
                    <img
                      src={location.avatarUrl}
                      alt={location.fullName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: themeColor }}
                    >
                      {location.fullName?.charAt(0) || "?"}
                    </div>
                  )}
                  <div 
                    className="absolute inset-0 animate-ping rounded-full border-[3px] opacity-40" 
                    style={{ borderColor: themeColor }}
                  />
                  {isStaff && (
                    <span 
                      className="absolute -top-2 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow z-30 uppercase tracking-wide border border-white"
                      style={{ backgroundColor: themeColor }}
                    >
                      STAFF
                    </span>
                  )}
                </div>

                <div 
                  className="absolute -bottom-2 z-0 h-4 w-4 rotate-45 border-b-[4px] border-r-[4px] border-white" 
                  style={{ backgroundColor: themeColor }}
                />

                <span 
                  className="mt-3 px-2 py-0.5 text-white text-[10px] font-bold rounded-md whitespace-nowrap shadow-sm"
                  style={{ backgroundColor: themeColor }}
                >
                  {location.fullName || t("social.trackingGuestLabel")}
                </span>
              </div>
            </Marker>
          );
        })}
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
