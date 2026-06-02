import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import * as signalR from "@microsoft/signalr";
import { MapPin } from "lucide-react";
import { SIGNALR_HUB_BASE } from "../../../../config/api/api";
import { useGetScheduleLiveLocations } from "../hooks/useScheduleTracking";

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
      if (isMountedRef.current) {
        setErrorMessage("Schedule ID is invalid.");
      }
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      if (isMountedRef.current) {
        setErrorMessage("Bạn cần đăng nhập để theo dõi tour.");
      }
      return;
    }

    // Stop existing connection if any
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

    // Set up error handler before starting
    connection.onclose(async () => {
      if (isMountedRef.current) {
        setErrorMessage("Kết nối bị ngắt. Đang kết nối lại...");
      }
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
          if (isMountedRef.current) {
            setErrorMessage(null);
          }
        } catch (err) {
          console.error("Failed to join tour tracking group:", err);
          if (isMountedRef.current) {
            setErrorMessage("Không thể tham gia nhóm theo dõi. Vui lòng thử lại sau.");
          }
        }
      })
      .catch((err) => {
        console.error("SignalR connection failed:", err);
        if (isMountedRef.current) {
          setErrorMessage("Không thể kết nối Real-time. Vui lòng thử lại sau.");
        }
      });

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {});
      }
    };
  }, [scheduleIdNumber]);

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

  if (isLoading || !isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0068E0] border-t-transparent"></div>
      </div>
    );
  }

  if (isError || errorMessage) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-rose-100">
          <MapPin className="h-12 w-12 text-rose-500" />
        </div>
        <h2 className="mb-2 text-2xl font-black text-slate-800">Không thể mở bản đồ</h2>
        <p className="max-w-md text-slate-500">{errorMessage || "Không thể tải danh sách vị trí hiện tại. Vui lòng thử lại sau."}</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-slate-100">
      <div className="absolute left-1/2 top-6 z-10 w-max max-w-[90%] -translate-x-1/2 rounded-full border border-white/20 bg-black/60 px-6 py-3 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col gap-2 text-center text-white sm:flex-row sm:items-center sm:gap-4">
          <div>
            <p className="text-sm font-medium">Bản đồ theo dõi Tour #{scheduleIdNumber}</p>
            <p className="text-xs text-slate-300">Hiển thị vị trí khách hàng đang tham gia tour.</p>
          </div>
          <div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
            Real-time
          </div>
        </div>
      </div>

      <GoogleMap
        mapContainerClassName="h-full w-full"
        center={activeMarker ? { lat: activeMarker.lat, lng: activeMarker.lng } : defaultCenter}
        zoom={15}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        options={{ disableDefaultUI: true, zoomControl: true, clickableIcons: false }}
      >
        {locations.map((location) => (
          <Marker
            key={location.userId}
            position={{ lat: location.lat, lng: location.lng }}
            label={{ text: location.fullName || "Khách", color: "#ffffff", fontSize: "10px", fontWeight: "700" }}
          />
        ))}
      </GoogleMap>

      <div className="absolute right-4 top-28 z-10 rounded-3xl border border-white/20 bg-white/95 p-4 shadow-xl backdrop-blur-md">
        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-600">Khách hàng đang theo dõi</h3>
        <div className="mt-3 space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {locations.length > 0 ? (
            locations.map((location) => (
              <div key={location.userId} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <div className="font-semibold text-slate-900">{location.fullName || `User ${location.userId}`}</div>
                <div className="text-xs text-slate-500">{new Date(location.lastUpdated).toLocaleString()}</div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">Chưa có vị trí nào được gửi.</div>
          )}
        </div>
      </div>
    </div>
  );
};
