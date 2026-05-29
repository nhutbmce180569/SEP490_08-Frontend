import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { GoogleMap, OverlayView, useJsApiLoader, Polygon } from "@react-google-maps/api";
import useSupercluster from "use-supercluster";
import { Users, X, Camera } from "lucide-react";
import type { Moment } from "../types/moment.type";
import { useGetMomentFeed, useGetMyFootprints } from "../hooks/useMoments"; 
import { MomentCard } from "./MomentCard"; 

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

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

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
      >
        {/* ✨ MÀNG SƯƠNG MÙ VÀ LỖ THỦNG LỤC GIÁC */}
        <Polygon
          paths={fogPaths}
          options={{
            fillColor: "#a3b1c6", // Màu xám sương mù
            fillOpacity: 0.35,    // Độ che phủ 35%
            strokeOpacity: 0,     // Ẩn đường viền
            clickable: false,
          }}
        />

        {clusters.map((cluster) => {
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
      </GoogleMap>

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