import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
// 💡 Đã đổi sang Mapbox
import Map, { Marker, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import * as signalR from "@microsoft/signalr";
import { MapPin } from "lucide-react";
import { SIGNALR_HUB_BASE } from "../../../../config/api/api";
import { useGetPublicLocation } from "../hooks/useLocationTracking";
import { useTranslation } from "../../../../contexts/LocaleContext";

export const PublicTrackingPage: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const { data, isError, isLoading } = useGetPublicLocation(token || "");

  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [targetName, setTargetName] = useState<string>("");
  const mapRef = useRef<MapRef | null>(null);

  const apiKey = import.meta.env.VITE_MAPBOX_TOKEN as string;

  useEffect(() => {
    if (data) {
      setLiveLocation({ lat: data.lat, lng: data.lng });
      setTargetName(data.fullName);
    }
  }, [data]);

  useEffect(() => {
    if (!token || isError || !data) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${SIGNALR_HUB_BASE}/tracking`)
      .withAutomaticReconnect()
      .build();

    connection.start().then(async () => {
      await connection.invoke("JoinTrackingGroup", token);
      connection.on("ReceivePublicLocation", (newLoc: { lat: number; lng: number }) => {
        setLiveLocation({ lat: newLoc.lat, lng: newLoc.lng });
      });
    }).catch(err => console.error("SignalR Connection Error: ", err));

    return () => { connection.stop(); };
  }, [token, isError, data]);

  // Tự động Fly bản đồ khi vị trí thay đổi
  useEffect(() => {
    if (mapRef.current && liveLocation) {
      mapRef.current.flyTo({ center: [liveLocation.lng, liveLocation.lat], duration: 1000 });
    }
  }, [liveLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-rose-100">
          <MapPin className="h-12 w-12 text-rose-500" />
        </div>
        <h2 className="mb-2 text-2xl font-black text-slate-800">{t("social.trackingInvalidLink")}</h2>
        <p className="max-w-md text-slate-500">{t("social.trackingInvalidDesc")}</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-100">
      <div className="absolute left-1/2 top-6 z-10 w-max max-w-[90%] -translate-x-1/2 animate-fade-in-down rounded-full border border-white/20 bg-black/60 px-6 py-3 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-white">
            {t("social.trackingWatchingPrefix")} <span className="font-bold text-brand">{targetName}</span>
          </p>
          <div className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/20 px-2 py-0.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-100">{t("social.trackingLive")}</span>
          </div>
        </div>
      </div>

      <Map 
        ref={mapRef}
        initialViewState={{
          longitude: liveLocation?.lng || 108.206230,
          latitude: liveLocation?.lat || 16.047079,
          zoom: 16
        }}
        mapboxAccessToken={apiKey}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        {liveLocation && (
          <Marker longitude={liveLocation.lng} latitude={liveLocation.lat} anchor="bottom">
            <div className="pointer-events-none relative flex origin-bottom flex-col items-center justify-center">
              <div className="absolute -bottom-1 h-3 w-8 rounded-[100%] bg-black/30 blur-[3px]"></div>
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-gradient-to-tr from-brand to-brand shadow-xl">
                <MapPin className="h-6 w-6 text-white" />
                <div className="absolute inset-0 animate-ping rounded-full border-[3px] border-brand opacity-50"></div>
              </div>
              <div className="absolute -bottom-2 z-0 h-4 w-4 rotate-45 border-b-[4px] border-r-[4px] border-white bg-blue-400"></div>
            </div>
          </Marker>
        )}
      </Map>
    </div>
  );
};