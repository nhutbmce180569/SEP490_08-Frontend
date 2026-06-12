import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Map, { Marker, Source, Layer, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import * as signalR from "@microsoft/signalr";
import { MapPin, Navigation, Compass } from "lucide-react";
import { SIGNALR_HUB_BASE } from "../../../../config/api/api";
import { useGetScheduleLiveLocations, useGetTourRouteData } from "../hooks/useScheduleTracking";
import { useTranslation } from "../../../../contexts/LocaleContext";
import type { TourWaypoint } from "../services/scheduleTrackingService";

interface LiveLocation {
  userId: number;
  fullName: string;
  avatarUrl?: string | null;
  lat: number;
  lng: number;
  lastUpdated: string;
}


const defaultCenter = { lat: 16.047079, lng: 108.206230 };

export const ScheduleTrackingPage: React.FC = () => {
  const { t } = useTranslation();
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const scheduleIdNumber = Number(scheduleId);
  
  const { data, isLoading, isError } = useGetScheduleLiveLocations(scheduleIdNumber);
  const { data: routeData, isLoading: isRouteLoading } = useGetTourRouteData(scheduleIdNumber);

  const [locations, setLocations] = useState<LiveLocation[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const tourStops = useMemo(() => routeData?.waypoints || [], [routeData]);
  const routeCoordinates = useMemo(() => routeData?.geometryCoordinates || [], [routeData]);

  const mapRef = useRef<MapRef | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const apiKey = import.meta.env.VITE_MAPBOX_TOKEN as string;

  // 3. Quản lý đồng bộ dữ liệu Realtime của các thành viên qua SignalR
  useEffect(() => {
    if (data && isMountedRef.current) setLocations(data);
  }, [data]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (scheduleIdNumber <= 0) {
      if (isMountedRef.current) setErrorMessage(t("social.trackingScheduleInvalid"));
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      if (isMountedRef.current) setErrorMessage(t("social.trackingLoginRequired"));
      return;
    }

    if (connectionRef.current) connectionRef.current.stop().catch(() => {});

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${SIGNALR_HUB_BASE}/tracking`, { accessTokenFactory: () => token })
      .withAutomaticReconnect([0, 0, 1000, 3000, 5000, 10000])
      .build();

    connectionRef.current = connection;

    connection.on("ReceiveTourLocationUpdate", (update: LiveLocation) => {
      if (isMountedRef.current) {
        setLocations((prev) => {
          const index = prev.findIndex((item) => item.userId === update.userId);
          if (index >= 0) {
            const next = [...prev];
            next[index] = { ...next[index], ...update };
            return next;
          }
          return [...prev, update];
        });
      }
    });

    connection.start().then(async () => {
      if (!isMountedRef.current) return;
      try {
        await connection.invoke("JoinTourTrackingGroup", scheduleIdNumber);
      } catch (err) {
        if (isMountedRef.current) setErrorMessage(t("social.trackingJoinFailed"));
      }
    }).catch(() => {
      if (isMountedRef.current) setErrorMessage(t("social.trackingRealtimeFailed"));
    });

    return () => { if (connectionRef.current) connectionRef.current.stop().catch(() => {}); };
  }, [scheduleIdNumber, t]);

  // Tự động căn chỉnh màn hình (Fit Bounds) bao phủ toàn bộ các điểm dừng của Tour
  useEffect(() => {
    if (mapRef.current && tourStops.length > 0) {
      const lngs = tourStops.map((l) => l.lng);
      const lats = tourStops.map((l) => l.lat);
      mapRef.current.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 100, duration: 1200 }
      );
    }
  }, [tourStops]);

  // Hàm kích hoạt tính năng Dẫn đường (Navigation) thông qua Google Maps bên thứ ba
  const handleOpenNavigation = (stop: TourWaypoint) => {
    const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}&travelmode=driving`;
    window.open(navUrl, "_blank");
  };

  const routeGeoJSON = useMemo(() => {
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: routeCoordinates,
      },
    };
  }, [routeCoordinates]);

  if (isLoading || isRouteLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0068E0] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-slate-100">
      <Map
        ref={mapRef}
        initialViewState={{ latitude: 20.9525, longitude: 107.0315, zoom: 14 }}
        mapboxAccessToken={apiKey}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        {/* ✨ LAYER 1: Vẽ Lộ trình đường bộ thực tế (Nét liền màu xanh thương hiệu) */}
        {routeCoordinates.length > 0 && (
          <Source id="tour-route-source" type="geojson" data={routeGeoJSON}>
            <Layer
              id="tour-route-line"
              type="line"
              paint={{
                "line-color": "#0068E0",
                "line-width": 5,
              }}
              layout={{
                "line-join": "round",
                "line-cap": "round",
              }}
            />
          </Source>
        )}

        {/* ✨ LAYER 2: Đánh dấu danh sách các điểm Stop cố định của Tour */}
        {tourStops.map((stop, idx) => (
          <Marker key={`stop-${idx}`} longitude={stop.lng} latitude={stop.lat} anchor="bottom">
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="bg-white px-2 py-1 rounded-md shadow-md text-[10px] font-bold border border-slate-200 mb-1 whitespace-nowrap">
                {stop.sequence}. {stop.name}
              </div>
              <div className="w-8 h-8 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                <Compass className="w-4 h-4 text-white animate-spin-slow" />
              </div>
            </div>
          </Marker>
        ))}

        {/* ✨ LAYER 3: Vị trí trực tuyến (Realtime) của các thành viên */}
        {locations.map((location) => (
          <Marker key={location.userId} longitude={location.lng} latitude={location.lat} anchor="bottom">
            <div className="relative flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full border-4 border-brand overflow-hidden bg-white shadow-lg relative z-10 cursor-pointer">
                {location.avatarUrl ? (
                  <img src={location.avatarUrl} alt={location.fullName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200 text-brand font-bold text-base">
                    {location.fullName?.charAt(0) || "?"}
                  </div>
                )}
              </div>
              <span className="absolute top-full mt-1 px-2 py-0.5 bg-brand text-white text-[10px] font-bold rounded-md whitespace-nowrap shadow-sm">
                {location.fullName || t("social.trackingGuestLabel")}
              </span>
            </div>
          </Marker>
        ))}
      </Map>

      {/* DANH SÁCH ĐỊA ĐIỂM TOUR KÈM NÚT DẪN ĐƯỜNG (UI SIDEBAR) */}
      <div className="absolute right-4 top-24 z-10 w-80 rounded-3xl border border-white/20 bg-white/95 p-4 shadow-xl backdrop-blur-md">
        <h3 className="text-sm font-black uppercase tracking-[0.12em] text-slate-800 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#0068E0]" /> Lộ trình dừng chân
        </h3>
        <div className="space-y-3 max-h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar pr-1">
          {tourStops.map((stop, idx) => (
            <div key={`list-stop-${idx}`} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs font-bold text-[#0068E0]">Điểm dừng {stop.sequence}</p>
                <h4 className="text-sm font-semibold text-slate-800 truncate">{stop.name}</h4>
              </div>
              <button
                onClick={() => handleOpenNavigation(stop)}
                className="p-2 bg-[#0068E0] text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md active:scale-95 flex items-center gap-1 shrink-0 text-xs font-bold"
                title="Bật định vị dẫn đường qua Google Maps"
              >
                <Navigation className="w-3.5 h-3.5 fill-current" />
                Dẫn đường
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};