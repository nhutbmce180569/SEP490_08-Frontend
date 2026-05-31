import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { GoogleMap, OverlayView, useJsApiLoader } from "@react-google-maps/api";
import * as signalR from "@microsoft/signalr";
import { MapPin } from "lucide-react";
import { SIGNALR_HUB_BASE } from "../../../../config/api/api";
import { useGetPublicLocation } from "../hooks/useLocationTracking";

export const PublicTrackingPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { data, isError, isLoading } = useGetPublicLocation(token || "");

  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [targetName, setTargetName] = useState<string>("");

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  // Khởi tạo toạ độ ban đầu khi API load xong
  useEffect(() => {
    if (data) {
      setLiveLocation({ lat: data.lat, lng: data.lng });
      setTargetName(data.fullName);
    }
  }, [data]);

  // Khởi tạo SignalR lắng nghe vị trí (Không cần Auth)
  useEffect(() => {
    if (!token || isError || !data) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${SIGNALR_HUB_BASE}/tracking`) // Kết nối public không kẹp Auth Header
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(async () => {
        await connection.invoke("JoinTrackingGroup", token);
        connection.on("ReceivePublicLocation", (newLoc: { lat: number; lng: number }) => {
          setLiveLocation({ lat: newLoc.lat, lng: newLoc.lng });
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
      mapRef.current.panTo(liveLocation);
    }
  }, [liveLocation]);

  if (isLoading || !isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0068E0] border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-rose-100">
          <MapPin className="h-12 w-12 text-rose-500" />
        </div>
        <h2 className="mb-2 text-2xl font-black text-slate-800">Liên kết không hợp lệ</h2>
        <p className="max-w-md text-slate-500">Liên kết này đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu người thân chia sẻ lại liên kết mới (Thường có hiệu lực 24h).</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-100">
      {/* Floating Card: Header trạng thái Live Tracking */}
      <div className="absolute left-1/2 top-6 z-10 w-max max-w-[90%] -translate-x-1/2 animate-fade-in-down rounded-full border border-white/20 bg-black/60 px-6 py-3 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-white">
            Đang theo dõi hành trình của: <span className="font-bold text-[#0068E0]">{targetName}</span>
          </p>
          <div className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/20 px-2 py-0.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-100">Live</span>
          </div>
        </div>
      </div>

      <GoogleMap 
        mapContainerClassName="h-full w-full" 
        center={liveLocation || { lat: 16.047079, lng: 108.206230 }} 
        zoom={16} 
        onLoad={(map) => {
          mapRef.current = map;
        }} 
        options={{ disableDefaultUI: true, zoomControl: true, clickableIcons: false }}
      >
        {liveLocation && (
          <OverlayView position={liveLocation} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h) })}>
            <div className="pointer-events-none relative flex origin-bottom flex-col items-center justify-center">
              <div className="absolute -bottom-1 h-3 w-8 rounded-[100%] bg-black/30 blur-[3px]"></div>
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-gradient-to-tr from-[#0068E0] to-blue-400 shadow-xl">
                <MapPin className="h-6 w-6 text-white" />
                <div className="absolute inset-0 animate-ping rounded-full border-[3px] border-[#0068E0] opacity-50"></div>
              </div>
              <div className="absolute -bottom-2 z-0 h-4 w-4 rotate-45 border-b-[4px] border-r-[4px] border-white bg-blue-400"></div>
            </div>
          </OverlayView>
        )}
      </GoogleMap>
    </div>
  );
};