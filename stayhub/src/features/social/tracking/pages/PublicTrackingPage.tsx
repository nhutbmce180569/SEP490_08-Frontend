import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { GoogleMap, OverlayView, useJsApiLoader } from "@react-google-maps/api";
import * as signalR from "@microsoft/signalr";
import { MapPin } from "lucide-react";
import { SIGNALR_HUB_BASE } from "../../../../config/api/api";
import { useGetPublicTrackingInfo } from "../hooks/useTracking";

export const PublicTrackingPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { data, isError, isLoading } = useGetPublicTrackingInfo(token || "");

  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number; lastUpdated: string } | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  // Khởi tạo toạ độ ban đầu khi API load xong
  useEffect(() => {
    if (data) {
      setLiveLocation({ lat: data.lat, lng: data.lng, lastUpdated: data.lastUpdated });
    }
  }, [data]);

  // Khởi tạo SignalR lắng nghe vị trí (Không cần Auth)
  useEffect(() => {
    if (!token || isError || !data) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${SIGNALR_HUB_BASE}/tracking`)
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(async () => {
        await connection.invoke("JoinTrackingGroup", token);
        connection.on("ReceivePublicLocation", (newLoc: { lat: number; lng: number; lastUpdated: string }) => {
          setLiveLocation(newLoc);
        });
      })
      .catch((err) => console.error("SignalR Connection Error: ", err));

    return () => {
      connection.stop();
    };
  }, [token, isError, data]);

  // Tự động Pan bản đồ khi vị trí thay đổi
  useEffect(() => {
    if (mapRef.current && liveLocation) {
      mapRef.current.panTo({ lat: liveLocation.lat, lng: liveLocation.lng });
    }
  }, [liveLocation]);

  if (isLoading || !isLoaded) {
    return <div className="flex h-screen w-full items-center justify-center bg-slate-50"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#EB662B] border-t-transparent"></div></div>;
  }

  if (isError || !data) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
        <MapPin className="mb-4 h-16 w-16 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700">Liên kết không hợp lệ</h2>
        <p className="text-slate-500">Liên kết này đã hết hạn hoặc không tồn tại (Hết hạn sau 24h).</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      {/* Header trạng thái */}
      <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/90 px-6 py-3 shadow-lg backdrop-blur-md">
        <p className="text-sm font-medium text-slate-800 text-center">
          Đang theo dõi hành trình của: <span className="font-bold text-[#EB662B]">{data.fullName}</span>
        </p>
        {liveLocation?.lastUpdated && (
          <p className="mt-1 text-center text-xs text-slate-500">
            Cập nhật lần cuối: {new Date(liveLocation.lastUpdated).toLocaleTimeString("vi-VN")}
          </p>
        )}
      </div>

      <GoogleMap mapContainerClassName="h-full w-full" center={liveLocation ? { lat: liveLocation.lat, lng: liveLocation.lng } : { lat: 16.047079, lng: 108.206230 }} zoom={16} onLoad={(map) => (mapRef.current = map)} options={{ disableDefaultUI: true, zoomControl: true }}>
        {liveLocation && (
          <OverlayView position={{ lat: liveLocation.lat, lng: liveLocation.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h / 2) })}>
            <div className="relative flex h-12 w-12 items-center justify-center pointer-events-none">
              <div className="absolute inset-0 animate-ping rounded-full bg-[#EB662B] opacity-50" />
              <div className="relative z-10 h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-white shadow-lg">
                {data.avatarUrl ? <img src={data.avatarUrl} alt={data.fullName} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-slate-200 text-sm font-bold text-slate-600">{data.fullName.charAt(0)}</div>}
              </div>
            </div>
          </OverlayView>
        )}
      </GoogleMap>
    </div>
  );
};