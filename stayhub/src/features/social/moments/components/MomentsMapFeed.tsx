import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { GoogleMap, OverlayView, useJsApiLoader, Polygon } from "@react-google-maps/api";
import useSupercluster from "use-supercluster";
import { Users, X, Camera, Layers, Navigation } from "lucide-react";
import type { Moment } from "../types/moment.type";
import { useGetMomentFeed, useGetMyFootprints } from "../hooks/useMoments"; 
import { MomentCard } from "./MomentCard"; 
import * as signalR from '@microsoft/signalr';
import { SIGNALR_HUB_BASE } from "../../../../config/api/api";
import { locationService } from "../../locations/services/locationService";

interface MomentsMapFeedProps {
  scheduleId: number;
  onMarkerClick: (momentId: number) => void;
}

const defaultCenter = { lat: 10.0451, lng: 105.7468 };

export const MomentsMapFeed: React.FC<MomentsMapFeedProps> = ({
  scheduleId,
  onMarkerClick,
}) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string
  });

  const { data: moments } = useGetMomentFeed(scheduleId);
  
  // ✨ Lấy dữ liệu dấu chân cào map từ API
  const { data: footprints } = useGetMyFootprints();

  const mapRef = useRef<google.maps.Map | null>(null);
  const [zoom, setZoom] = useState<number>(12);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [activeClusterMoments, setActiveClusterMoments] = useState<Moment[] | null>(null);

  // Giai đoạn 2: State quản lý Lớp (Layers) và Menu
  const [showMoments, setShowMoments] = useState(true);
  const [showLiveLocations, setShowLiveLocations] = useState(true); // State được thêm theo yêu cầu, nhưng chưa có nguồn dữ liệu riêng cho "Vị trí live"
  const [showFootprints, setShowFootprints] = useState(false);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [friendLocations, setFriendLocations] = useState<any[]>([]);
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);

  // Hook 1: Initial Load & SignalR Real-time
  useEffect(() => {
    if (!showLiveLocations) return;

    let connection: signalR.HubConnection;

    const initLocationService = async () => {
      try {
        const initialFriends = await locationService.getLiveFriends();
        setFriendLocations(initialFriends?.data || initialFriends || []);
      } catch (err) {
        console.error("Lỗi lấy danh sách bạn bè live:", err);
      }

      const token = localStorage.getItem("accessToken");
      if (!token) return;

      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${SIGNALR_HUB_BASE}/friendship`, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect()
        .build();

      connection
        .start()
        .then(() => {
          connection.on("ReceiveFriendLocation", (data: any) => {
            setFriendLocations((prev) => {
              const index = prev.findIndex((f) => f.userId === data.userId);
              if (index !== -1) {
                const newFriends = [...prev];
                newFriends[index] = { ...newFriends[index], lat: data.lat, lng: data.lng, lastUpdated: data.lastUpdated };
                return newFriends;
              }
              return [...prev, data];
            });
          });
        })
        .catch((err) => console.error("Error connecting to SignalR:", err));
    };

    initLocationService();

    return () => {
      if (connection) connection.stop();
    };
  }, [showLiveLocations]);

  // Hook 2: Ping GPS của chính mình lên Server
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          locationService.pingLocation(latitude, longitude, scheduleId)
            .then(() => setLastPingTime(new Date()))
            .catch((err) => console.error("Lỗi ping vị trí:", err));
        },
        (err) => console.warn("Lỗi lấy vị trí GPS:", err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [scheduleId]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleMapClick = () => {
    if (isLayerMenuOpen) setIsLayerMenuOpen(false);
  };

  const onMapIdle = useCallback(() => {
    if (mapRef.current) {
      const mapBounds = mapRef.current.getBounds();
      if (mapBounds) {
        setBounds([
          mapBounds.getSouthWest().lng(),
          mapBounds.getSouthWest().lat(),
          mapBounds.getNorthEast().lng(),
          mapBounds.getNorthEast().lat(),
        ]);
      }
      setZoom(mapRef.current.getZoom() || 12);
    }
  }, []);


// --- ✨ THUẬT TOÁN FOG OF WAR (CÀO MAP CHUẨN XÁC 100%) ---
  const fogPaths = useMemo(() => {
    // 1. TẤM BẠT CHE THẾ GIỚI (Vẽ XUÔI chiều kim đồng hồ)
    // Phải có các điểm neo (-90, 0, 90) để Google Maps không bị lỗi "Đi tắt"
    const worldBounds = [
      // Cạnh trên (Chạy từ Tây sang Đông)
      { lat: 85, lng: -180 },
      { lat: 85, lng: -90 },
      { lat: 85, lng: 0 },
      { lat: 85, lng: 90 },
      { lat: 85, lng: 180 },
      // Cạnh phải đi xuống
      { lat: -85, lng: 180 },
      // Cạnh dưới (Chạy từ Đông về Tây)
      { lat: -85, lng: 90 },
      { lat: -85, lng: 0 },
      { lat: -85, lng: -90 },
      { lat: -85, lng: -180 },
      // Tự động nối khép kín lên góc trên trái
    ];

    if (!footprints || footprints.length === 0) return [worldBounds];

    // 2. TẠO LỖ THỦNG LỤC GIÁC (Bắt buộc vẽ NGƯỢC chiều kim đồng hồ)
    const hexagonHoles = footprints.map((fp: any) => {
      const path = [];
      const earthRadius = 6371000;
      const lat = (fp.lat * Math.PI) / 180;
      const lng = (fp.lng * Math.PI) / 180;
      const d = 300 / earthRadius; // Bán kính lỗ thủng (Đang set 300 mét cho dễ nhìn)

      // Vòng lặp chạy lùi (360 -> 0) để tạo hướng Ngược chiều kim đồng hồ -> Tạo ra Lỗ
      for (let i = 360; i >= 0; i -= 60) {
        const brng = (i * Math.PI) / 180;
        const pLat = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(brng));
        const pLng = lng + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat), Math.cos(d) - Math.sin(lat) * Math.sin(pLat));
        path.push({ lat: (pLat * 180) / Math.PI, lng: (pLng * 180) / Math.PI });
      }
      return path;
    });

    // Gom Tấm bạt và Các lỗ thủng lại
    return [worldBounds, ...hexagonHoles];
  }, [footprints]);


  const points = useMemo(() => {
    if (!moments) return [];
    const momentsArray = Array.isArray(moments) 
      ? moments 
      : ((moments as any).pages?.flat() || (moments as any).data || (moments as any).value || []);

    return momentsArray
      .filter((m: any) => {
        const latitude = m.lat !== undefined ? m.lat : m.Lat;
        const longitude = m.lng !== undefined ? m.lng : m.Lng;
        return latitude != null && longitude != null;
      })
      .map((m: any) => {
        const latitude = m.lat !== undefined ? m.lat : m.Lat;
        const longitude = m.lng !== undefined ? m.lng : m.Lng;
        const userObj = m.user || m.User;

        return {
          type: "Feature" as const,
          properties: {
            cluster: false,
            momentId: m.id || m.Id,
            userId: m.userId || userObj?.id || userObj?.Id,
            avatarUrl: userObj?.avatarUrl || userObj?.AvatarUrl,
            userFullName: userObj?.fullName || userObj?.FullName,
            rawMoment: m 
          },
          geometry: {
            type: "Point" as const,
            coordinates: [Number(longitude), Number(latitude)], 
          },
        };
      });
  }, [moments]);

  useEffect(() => {
    if (points.length > 0 && mapRef.current && center === defaultCenter) {
      const firstPoint = points[0].geometry.coordinates;
      setCenter({ lat: firstPoint[1], lng: firstPoint[0] });
    }
  }, [points, center]);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: 80, maxZoom: 19 },
  });

  if (!isLoaded) {
    return (
      <div className="w-full h-[80vh] flex items-center justify-center bg-slate-100 rounded-3xl">
        <div className="animate-spin w-10 h-10 border-4 border-[#EB662B] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  function handleJumpToNewest(event: React.MouseEvent<HTMLButtonElement>): void {
    event.stopPropagation();
    if (points.length > 0 && mapRef.current) {
      const [longitude, latitude] = points[0].geometry.coordinates;
      const newCenter = {
        lat: latitude,
        lng: longitude,
      };
      setCenter(newCenter);
      mapRef.current.panTo(newCenter);
      mapRef.current.setZoom(16);
    }
  }

  return (
    <div className="relative w-full h-[80vh] overflow-hidden rounded-3xl shadow-xl border border-slate-200 bg-slate-100">
      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={center}
        zoom={zoom}
        onLoad={onMapLoad}
        onIdle={onMapIdle}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        }}
        onClick={handleMapClick}
      >
        {/* Lớp "Dấu chân" (Fog of War) - Render có điều kiện */}
        {showFootprints && (
          <Polygon
            paths={fogPaths}
            options={{
              fillColor: "#a3b1c6", // Màu xám sương mù
              fillOpacity: 0.35,    // Độ che phủ 35%
              strokeOpacity: 0,     // Ẩn đường viền
              clickable: false,
            }}
          />
        )}

        {/* Lớp "Khoảnh khắc" & "Vị trí" (Markers & Clusters) - Render có điều kiện */}
        {/* Hiện tại, cả "Khoảnh khắc" và "Vị trí bạn bè" đều dùng chung nguồn dữ liệu `moments`.
            Logic render sẽ dựa vào `showMoments` để tránh xung đột. `showLiveLocations` đã có sẵn để tích hợp trong tương lai. */}
        {showMoments && clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount, momentId, avatarUrl, userFullName } = cluster.properties;

          if (isCluster) {
            const leaves = supercluster ? supercluster.getLeaves(cluster.id as number, Infinity) : [];
            const userIds = new Set(leaves.map((l: any) => String(l.properties.userId)));
            const isSingleUserCluster = userIds.size === 1;

            const handleClusterClick = () => {
              if (!supercluster) return;
              const extractedMoments = leaves.map((leaf: any) => leaf.properties.rawMoment);
              setActiveClusterMoments(extractedMoments);
              mapRef.current?.panTo({ lat: latitude, lng: longitude });
            };

            if (isSingleUserCluster) {
              const firstLeaf = leaves[0];
              const cAvatarUrl = firstLeaf?.properties.avatarUrl;
              const cUserFullName = firstLeaf?.properties.userFullName;
              const userInitial = cUserFullName ? cUserFullName.charAt(0).toUpperCase() : "?";

              return (
                <OverlayView key={`cluster-${cluster.id}`} position={{ lat: latitude, lng: longitude }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -h })}>
                  <div className="relative group cursor-pointer transform transition-all duration-300 hover:scale-110 hover:-translate-y-2 origin-bottom" onClick={handleClusterClick}>
                <div className="relative z-10 flex items-center justify-center w-14 h-14 !rounded-full border-4 border-white bg-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] overflow-hidden">
                      {cAvatarUrl ? <img src={cAvatarUrl} alt="Moment" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-400">{userInitial}</div>}
                  <div className="absolute inset-0 !rounded-full border-[3px] border-[#4880ff] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center !rounded-full bg-rose-500 text-xs font-bold text-white border-2 border-white shadow-md z-20">{pointCount}</span>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r-[4px] border-b-[4px] border-white shadow-[4px_4px_8px_rgba(0,0,0,0.1)] z-0"></div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-black/20 rounded-full blur-[2px]"></div>
                  </div>
                </OverlayView>
              );
            } else {
              return (
                <OverlayView key={`cluster-${cluster.id}`} position={{ lat: latitude, lng: longitude }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h / 2) })}>
              <div className="group relative flex items-center justify-center w-14 h-14 !rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.2)] border-4 border-white cursor-pointer transform transition-all duration-300 hover:scale-110 bg-gradient-to-tr from-blue-600 to-blue-400" onClick={handleClusterClick}>
                    <Users className="w-6 h-6 text-white" />
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center !rounded-full bg-rose-500 text-xs font-bold text-white border-2 border-white shadow-md z-20">{pointCount}</span>
                <div className="absolute inset-0 !rounded-full border-[3px] border-blue-400 animate-ping opacity-20 group-hover:opacity-60 pointer-events-none"></div>
                  </div>
                </OverlayView>
              );
            }
          }

          const userInitial = userFullName ? userFullName.charAt(0).toUpperCase() : "?";

          return (
            <OverlayView key={`moment-${momentId}`} position={{ lat: latitude, lng: longitude }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -h })}>
              <div className="relative group cursor-pointer transform transition-all duration-300 hover:scale-110 hover:-translate-y-2 origin-bottom" onClick={() => onMarkerClick(momentId)}>
            <div className="relative z-10 flex items-center justify-center w-14 h-14 !rounded-full border-4 border-white bg-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] overflow-hidden">
                  {avatarUrl ? <img src={avatarUrl} alt="Moment" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-400">{userInitial}</div>}
              <div className="absolute inset-0 !rounded-full border-[3px] border-[#4880ff] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r-[4px] border-b-[4px] border-white shadow-[4px_4px_8px_rgba(0,0,0,0.1)] z-0"></div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-black/20 rounded-full blur-[2px]"></div>
              </div>
            </OverlayView>
          );
        })}

        {/* Lớp Marker Avatar Bạn bè (Real-time Location) */}
        {showLiveLocations && friendLocations.map((friend: any) => (
          <OverlayView key={`friend-${friend.userId}`} position={{ lat: friend.lat, lng: friend.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h / 2) })}>
            <div className="relative flex flex-col items-center justify-center transition-all duration-700 ease-in-out pointer-events-none">
              <div className="w-12 h-12 rounded-full border-4 border-[#EB662B] overflow-hidden bg-white shadow-lg relative z-10 pointer-events-auto cursor-pointer hover:scale-110 transition-transform">
                {friend.avatarUrl ? (
                  <img src={friend.avatarUrl} alt={friend.fullName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200 text-[#EB662B] font-bold text-lg">{friend.fullName?.charAt(0)}</div>
                )}
              </div>
              <span className="absolute top-full mt-1 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold rounded-md whitespace-nowrap shadow-sm">
                {friend.fullName}
              </span>
            </div>
          </OverlayView>
        ))}
      </GoogleMap>

      {/* Giai đoạn 2: Menu "Lớp hiển thị" */}
      <div className="absolute top-4 right-4 z-20">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLayerMenuOpen(!isLayerMenuOpen);
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition-all hover:scale-110 hover:text-[#EB662B] focus:outline-none focus:ring-2 focus:ring-[#EB662B] focus:ring-offset-2"
            aria-label="Toggle Layers"
          >
            <Layers className="h-6 w-6" />
          </button>
          
          {isLayerMenuOpen && (
            <div 
              className="absolute top-full right-0 mt-2 w-56 origin-top-right rounded-xl bg-white/90 backdrop-blur-md p-2 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in-down"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                <div onClick={() => setShowMoments(!showMoments)} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-100/70 cursor-pointer">
                  <span className="text-sm font-medium text-slate-800">Khoảnh khắc</span>
                  <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${showMoments ? 'bg-[#EB662B]' : 'bg-slate-300'}`}>
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showMoments ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
                <div onClick={() => setShowLiveLocations(!showLiveLocations)} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-100/70 cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800">Vị trí bạn bè</span>
                    {showLiveLocations && lastPingTime && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] text-slate-500 font-medium leading-none">Cập nhật: {lastPingTime.toLocaleTimeString('vi-VN', { hour12: false })}</span>
                      </div>
                    )}
                  </div>
                  <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${showLiveLocations ? 'bg-[#EB662B]' : 'bg-slate-300'}`}>
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showLiveLocations ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
                <div onClick={() => setShowFootprints(!showFootprints)} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-100/70 cursor-pointer">
                  <span className="text-sm font-medium text-slate-800">Dấu chân</span>
                  <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${showFootprints ? 'bg-[#EB662B]' : 'bg-slate-300'}`}>
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showFootprints ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Giai đoạn 2: Nút "Đến ảnh mới nhất" */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <button onClick={handleJumpToNewest} className="flex items-center gap-2.5 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-lg ring-1 ring-slate-900/5 transition-all hover:scale-105 hover:bg-slate-50 active:scale-95">
          <Navigation className="h-4 w-4 text-[#EB662B]" />
          Ảnh mới nhất
        </button>
      </div>

      {activeClusterMoments && (
        <div className="absolute inset-0 z-30 h-full w-full bg-white/5 backdrop-blur-sm flex flex-col animate-slide-up">
          <button onClick={() => setActiveClusterMoments(null)} className="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-black/10 text-slate-800 hover:bg-black/20 backdrop-blur-md transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1 overflow-y-auto px-4 pt-24 pb-12 space-y-6 custom-scrollbar flex flex-col items-center">
            {activeClusterMoments.map((moment) => (
              <div key={`cluster-feed-${moment.id}`} className="w-full flex justify-center shrink-0">
                <MomentCard moment={moment} />
              </div>
            ))}
          </div>
          <button className="absolute bottom-8 right-8 z-50 w-16 h-16 !rounded-full overflow-hidden flex items-center justify-center bg-[#EB662B]/90 backdrop-blur-md text-white border-4 border-white/80 shadow-[0_8px_20px_rgba(235,102,43,0.4)] hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer">
            <Camera className="w-7 h-7 text-white" />
          </button>
        </div>
      )}
    </div>
  );
};