import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import * as signalR from "@microsoft/signalr";
import { MapPin, ArrowLeft, Users, User, Clock, Activity } from "lucide-react";
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

const defaultCenter = { lat: 16.047079, lng: 108.206230 };

export const ScheduleTrackingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const scheduleIdNumber = Number(scheduleId);
  
  const { data, isLoading, isError } = useGetScheduleLiveLocations(scheduleIdNumber);
  const [locations, setLocations] = useState<LiveLocation[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
  });

  useEffect(() => {
    if (data && isMountedRef.current) {
      setLocations(data);
    }
  }, [data]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
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

    if (connectionRef.current) {
      connectionRef.current.stop().catch(() => {});
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${SIGNALR_HUB_BASE}/tracking`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 0, 1000, 3000, 5000, 10000])
      .build();

    connectionRef.current = connection;

    connection.onclose(async () => {
      if (isMountedRef.current) setErrorMessage(t("social.trackingReconnecting"));
    });

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

    connection
      .start()
      .then(async () => {
        if (!isMountedRef.current) return;
        try {
          await connection.invoke("JoinTourTrackingGroup", scheduleIdNumber);
          if (isMountedRef.current) setErrorMessage(null);
        } catch (err) {
          console.error("Failed to join tour tracking group:", err);
          if (isMountedRef.current) setErrorMessage(t("social.trackingJoinFailed"));
        }
      })
      .catch((err) => {
        console.error("SignalR connection failed:", err);
        if (isMountedRef.current) setErrorMessage(t("social.trackingRealtimeFailed"));
      });

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {});
      }
    };
  }, [scheduleIdNumber, t]);

  useEffect(() => {
    if (mapRef.current && locations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      locations.forEach((loc) => bounds.extend({ lat: loc.lat, lng: loc.lng }));
      mapRef.current.fitBounds(bounds);
    }
  }, [locations]);

  const activeMarker = useMemo(() => {
    if (!locations.length) return null;
    return locations[0];
  }, [locations]);

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] min-h-[600px] rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
      
      {/* HEADER MỚI VỚI NÚT BACK GIỐNG TRONG ẢNH */}
      <div className="shrink-0 flex flex-col gap-4 border-b border-slate-100 px-6 py-4 bg-white z-10">
        
        {/* Nút Back trơn, không viền, mũi tên trượt nhẹ khi hover */}
        <button
          onClick={() => navigate(-1)}
          className="group flex w-fit items-center gap-2 text-[15px] font-medium text-slate-500 hover:text-[#0068E0] transition-colors outline-none"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {t("common.back") || "Back"}
        </button>
        
        {/* Row chứa Tiêu đề và Nút đếm người dùng */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-bold leading-tight text-slate-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#0068E0]" />
              {t("social.trackingScheduleMapTitle", { id: scheduleIdNumber })}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("social.trackingScheduleMapDesc")}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 w-fit">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {locations.length} Customer (LIVE)
          </div>
        </div>
      </div>

      {/* BODY CHÍNH BẢN ĐỒ */}
      <div className="relative flex-1 w-full bg-slate-100">
        
        {/* Loading State */}
        {isLoading || !isLoaded ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 gap-4 z-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0068E0] border-t-transparent"></div>
            <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading map data...</p>
          </div>
        ) : 
        
        /* Error State */
        isError || errorMessage ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 p-4 text-center z-20">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-rose-100 shadow-sm">
              <MapPin className="h-12 w-12 text-rose-500" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-800">{t("social.trackingMapErrorTitle")}</h2>
            <p className="text-sm text-slate-500 max-w-md">{errorMessage || t("social.trackingMapErrorDefault")}</p>
          </div>
        ) : 
        
        /* Bản đồ */
        (
          <>
            <GoogleMap
              mapContainerClassName="h-full w-full"
              center={activeMarker ? { lat: activeMarker.lat, lng: activeMarker.lng } : defaultCenter}
              zoom={15}
              onLoad={(map) => { mapRef.current = map; }}
              options={{ 
                disableDefaultUI: true, 
                zoomControl: true,      
                clickableIcons: false 
              }}
            >
              {locations.map((location) => (
                <Marker
                  key={location.userId}
                  position={{ lat: location.lat, lng: location.lng }}
                  label={{ 
                    text: location.fullName || t("social.trackingGuestLabel"), 
                    color: "#ffffff", 
                    fontSize: "11px", 
                    fontWeight: "700",
                    className: "bg-slate-900/80 px-2 py-1 rounded-md mt-8 shadow-sm backdrop-blur-sm"
                  }}
                />
              ))}
            </GoogleMap>

            {/* DANH SÁCH THÀNH VIÊN TRÊN BẢN ĐỒ */}
            <div className="absolute right-4 top-4 bottom-4 w-72 flex flex-col rounded-2xl border border-slate-200/60 bg-white/95 shadow-xl backdrop-blur-md overflow-hidden z-10">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3">
                <h3 className="flex items-center gap-2 text-[13px] font-bold text-slate-800">
                  <Users className="h-4 w-4 text-[#0068E0]" />
                  {t("social.trackingCustomersWatching")}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200">
                {locations.length > 0 ? (
                  locations.map((location) => (
                    <div 
                      key={location.userId} 
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm transition-colors hover:border-[#0068E0]/30 hover:bg-blue-50/30"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        {location.avatarUrl ? (
                          <img src={location.avatarUrl} alt="avatar" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-slate-900">
                          {location.fullName || `User ${location.userId}`}
                        </p>
                        <p className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(location.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <Activity className="h-3.5 w-3.5 text-emerald-500 opacity-60 mr-1" />
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <MapPin className="mb-2 h-6 w-6 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-500">{t("social.trackingNoLocationsYet")}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};