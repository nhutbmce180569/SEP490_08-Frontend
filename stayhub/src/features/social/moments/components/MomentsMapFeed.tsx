import React, { useState, useRef, useCallback, useMemo, useEffect, useContext } from "react";
import Map, { Marker, Source, Layer, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import useSupercluster from "use-supercluster";
import { Users, X, Camera, Layers, Navigation, Compass, MapPin, Play, Pause, SkipForward, SkipBack, History, Flame } from "lucide-react";
import type { Moment } from "../types/moment.type";
import { useGetMomentFeed, useGetMyFootprints, useGetHeatmap } from "../hooks/useMoments"; 
import { useGetTourRouteData } from "../../tracking/hooks/useScheduleTracking";
import { MomentCard } from "./MomentCard"; 
import * as signalR from '@microsoft/signalr';
import { SIGNALR_HUB_BASE } from "../../../../config/api/api";
import { locationService } from "../../locations/services/locationService";
import { ShareLocationButton } from "../../tracking/components/ShareLocationButton";
import { useTranslation } from "../../../../contexts/LocaleContext";
import { getStoredLocale } from "../../../../i18n";
import { AuthContext } from "../../../../contexts/AuthContext";

const SafeImage = ({ src, alt, className, fallbackText, fallbackClassName }: any) => {
  const [hasError, setHasError] = useState(false);
  if (hasError || !src) {
    return <div className={fallbackClassName}>{fallbackText}</div>;
  }
  return <img src={src} alt={alt} className={className} onError={() => setHasError(true)} loading="lazy" decoding="async" />;
};

interface MomentsMapFeedProps {
  scheduleId: number;
  onMarkerClick: (momentId: number) => void;
  onReplayStateChange?: (isActive: boolean) => void;
}

export const MomentsMapFeed: React.FC<MomentsMapFeedProps> = ({
  scheduleId,
  onMarkerClick,
  onReplayStateChange,
}) => {
  const { t } = useTranslation();
  const locale = getStoredLocale();
  const { user } = useContext(AuthContext);

  const apiKey = import.meta.env.VITE_MAPBOX_TOKEN as string;
  if (!apiKey) {
    console.error("VITE_MAPBOX_TOKEN is missing in .env file. Please check your .env configuration.");
  }

  // --- API FETCHING ---
  const { data: moments, isLoading: isMomentsLoading } = useGetMomentFeed(scheduleId);
  const { data: footprints } = useGetMyFootprints();
  const { data: routeData, isLoading: isRouteLoading } = useGetTourRouteData(scheduleId);

  const mapRef = useRef<MapRef | null>(null);
  const [viewState, setViewState] = useState({
    latitude: 10.0451, // Default: Cần Thơ
    longitude: 105.7468,
    zoom: 12,
  });
  const [bounds, setBounds] = useState<[number, number, number, number] | undefined>(undefined);
  const [activeClusterMoments, setActiveClusterMoments] = useState<Moment[] | null>(null);

  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [dynamicFootprints, setDynamicFootprints] = useState<any[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  // Heatmap lay tu LocationLogs (giong mobile); chi fetch khi bat lop heatmap.
  const { data: heatmapData } = useGetHeatmap(scheduleId, showHeatmap);
  const [isNightMode, setIsNightMode] = useState(false);
  const [dockState, setDockState] = useState<'collapsed' | 'expanded'>('expanded');
  
  const discreteZoom = Math.round(viewState.zoom);

  // --- TIMELINE SCOPE ---
  const isSpecificTour = scheduleId !== undefined && scheduleId !== null && scheduleId > 0;

  // --- STATES QUẢN LÝ LỚP (LAYERS) ---
  const [showMoments, setShowMoments] = useState(true);
  const [showLiveLocations, setShowLiveLocations] = useState(true); 
  const [showFootprints, setShowFootprints] = useState(false);
  const [showTourRoute, setShowTourRoute] = useState(true);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  
  const [friendLocations, setFriendLocations] = useState<any[]>([]);
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // --- TIMELINE REPLAY STATES ---
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  useEffect(() => {
    if (footprints && Array.isArray(footprints)) {
      setDynamicFootprints(footprints);
    }
    
    // Auto Day/Night theme based on time
    const hour = new Date().getHours();
    setIsNightMode(hour < 6 || hour > 18);
  }, [footprints]);

  // Trích xuất dữ liệu lộ trình
  const tourStops = useMemo(() => routeData?.waypoints || [], [routeData]);
  const routeCoordinates = useMemo(() => routeData?.geometryCoordinates || [], [routeData]);

  // --- 🔴 ĐÃ MỞ LẠI: HOOK 1 - KẾT NỐI SIGNALR ĐỂ XEM BẠN BÈ ---
  useEffect(() => {
    if (!showLiveLocations) return;

    let connection: signalR.HubConnection;

    const initLocationService = async () => {
      try {
        const initialFriends = await locationService.getLiveFriends();
        setFriendLocations(initialFriends?.data || initialFriends || []);
      } catch (err) {
        console.warn("Lỗi lấy danh sách bạn bè live:", err);
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
        .catch((err) => console.warn("Error connecting to SignalR:", err));
    };

    initLocationService();

    return () => {
      if (connection) connection.stop();
    };
  }, [showLiveLocations]);

  // --- 🔴 ĐÃ MỞ LẠI: HOOK 2 - PING GPS CỦA CHÍNH MÌNH LÊN SERVER ---
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setMyLocation({ lat: latitude, lng: longitude });
          locationService.pingLocation(latitude, longitude, scheduleId)
            .then(() => {
              setLastPingTime(new Date());
              setDynamicFootprints(prev => {
                const isExist = prev.some(f => Math.abs(f.lat - latitude) < 0.00015 && Math.abs(f.lng - longitude) < 0.00015);
                if (isExist) return prev;
                return [...prev, { lat: latitude, lng: longitude }];
              });
            })
            .catch((err) => console.warn("Lỗi ping vị trí:", err));
        },
        (err) => console.warn("Lỗi lấy vị trí GPS:", err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [scheduleId]);

  // --- MAPBOX HANDLERS ---
  const updateBounds = useCallback(() => {
    if (mapRef.current) {
      const mapBounds = mapRef.current.getMap().getBounds();
      if (mapBounds) {
        setBounds([
          mapBounds.getWest(), mapBounds.getSouth(),
          mapBounds.getEast(), mapBounds.getNorth(),
        ]);
      }
    }
  }, []);

  const onMapLoad = useCallback(() => {
    setIsMapReady(true);
    updateBounds();
  }, [updateBounds]);

  const handleMapMove = useCallback((evt: any) => {
    setViewState(evt.viewState);
    updateBounds();
  }, [updateBounds]);

  const handleMapClick = () => {
    if (isLayerMenuOpen) setIsLayerMenuOpen(false);
  };

  // --- TIMELINE REPLAY LOGIC ---
  const timelineEvents = useMemo(() => {
    // Rule: Timeline Replay must NEVER combine events from unrelated tours.
    if (!isSpecificTour) return [];

    const events: any[] = [];
    
    const momentsArray = Array.isArray(moments) ? moments : ((moments as any).pages?.flat() || []);
    momentsArray.forEach((m: any) => {
      if (m.lat != null && m.lng != null && m.createdAt) {
        events.push({
          id: `moment-${m.id}`,
          type: 'moment',
          time: new Date(m.createdAt).getTime(),
          lat: Number(m.lat),
          lng: Number(m.lng),
          data: m,
          title: `${m.user?.fullName || m.fullName || 'Someone'} shared a moment`,
          desc: m.caption || 'A memorable moment was captured.',
          imageUrl: m.imageUrl || m.ImageUrl
        });
      }
    });

    events.sort((a, b) => a.time - b.time);
    
    // Add Start and End storytelling events
    if (events.length > 0 && tourStops.length > 0) {
      const firstStop = tourStops[0];
      events.unshift({
         id: 'start-journey', type: 'start', time: events[0].time - 60000,
         lat: firstStop.lat, lng: firstStop.lng, data: null,
         title: 'The adventure begins', desc: `Departed from ${firstStop.name}`, imageUrl: null
      });
    }
    if (events.length > 0 && tourStops.length > 1) {
      const lastStop = tourStops[tourStops.length - 1];
      events.push({
         id: 'end-journey', type: 'end', time: events[events.length - 1].time + 60000,
         lat: lastStop.lat, lng: lastStop.lng, data: null,
         title: 'Reached Destination', desc: `Arrived at ${lastStop.name}`, imageUrl: null
      });
    }
    return events;
  }, [moments, tourStops, isSpecificTour]);

  // --- STATE TRANSITION LOGIC ---
  const isReplayActive = isReplayMode && dockState === 'expanded' && isSpecificTour && (
    isPlaying || (currentEventIndex > 0 && currentEventIndex < timelineEvents.length - 1)
  );

  useEffect(() => {
    if (onReplayStateChange) {
      onReplayStateChange(isReplayActive);
    }
  }, [isReplayActive, onReplayStateChange]);

  // --- COLLISION AVOIDANCE LOGIC (FRIENDS & ME) ---
  const visualFriendLocations = useMemo(() => {
    const zoom = discreteZoom;
    // Offset increases visually as zoom decreases
    const threshold = 0.0003 * Math.pow(2, 15 - zoom);
    const radius = 0.0004 * Math.pow(2, 15 - zoom);

    const placed: { lat: number, lng: number }[] = [];
    const result: any[] = [];

    // Place current user first (highest hierarchy - it won't be pushed out)
    if (myLocation) {
      placed.push({ lat: myLocation.lat, lng: myLocation.lng });
    }

    friendLocations.forEach(friend => {
      const fLat = Number(friend.lat ?? friend.Lat);
      const fLng = Number(friend.lng ?? friend.Lng);
      if (isNaN(fLat) || isNaN(fLng)) return;

      const overlaps = placed.filter(p => 
        Math.abs(p.lat - fLat) < threshold && Math.abs(p.lng - fLng) < threshold
      );

      if (overlaps.length > 0) {
        const count = overlaps.length;
        const angle = (count * 137.5) * (Math.PI / 180); // Fanning out mathematically
        const pushRadius = radius + (Math.floor(count / 4) * radius * 0.3);

        const offsetLat = fLat + pushRadius * Math.cos(angle);
        const offsetLng = fLng + pushRadius * Math.sin(angle);
        
        placed.push({ lat: offsetLat, lng: offsetLng });
        result.push({ ...friend, visualLat: offsetLat, visualLng: offsetLng });
      } else {
        placed.push({ lat: fLat, lng: fLng });
        result.push({ ...friend, visualLat: fLat, visualLng: fLng });
      }
    });

    return result;
  }, [friendLocations, myLocation, discreteZoom]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying || timelineEvents.length === 0) return;
    if (currentEventIndex >= timelineEvents.length - 1) {
       setIsPlaying(false);
       return;
    }
    const interval = 3000 / playbackSpeed;
    const timer = setTimeout(() => setCurrentEventIndex(prev => prev + 1), interval);
    return () => clearTimeout(timer);
  }, [isPlaying, currentEventIndex, timelineEvents.length, playbackSpeed]);

  // Cinematic camera movement
  useEffect(() => {
    if (isReplayMode && timelineEvents.length > 0 && mapRef.current) {
      const event = timelineEvents[currentEventIndex];
      if (event) {
        mapRef.current.flyTo({ center: [event.lng, event.lat], zoom: 16, duration: 1200 });
      }
    }
  }, [currentEventIndex, isReplayMode, timelineEvents]);

  // --- FOG OF WAR ---
  const fogGeoJSON = useMemo(() => {
    const worldBounds = [
      [-180, 85], [-90, 85], [0, 85], [90, 85], [180, 85],
      [180, -85], [90, -85], [0, -85], [-90, -85], [-180, -85], [-180, 85]
    ];

    if (!dynamicFootprints || !Array.isArray(dynamicFootprints) || dynamicFootprints.length === 0) {
      return {
        type: "FeatureCollection" as const,
        features: [{
          type: "Feature" as const,
          geometry: { type: "Polygon" as const, coordinates: [worldBounds] },
          properties: {},
        }],
      };
    }

    // Khử trùng lặp các điểm quá gần nhau (< 0.0003 độ ~ 30m) để tránh đục lỗ đè lên nhau gây vỡ đa giác
    const uniqueFootprints = dynamicFootprints
      .filter((fp: any) => fp && fp.lat != null && fp.lng != null && !isNaN(Number(fp.lat)) && !isNaN(Number(fp.lng)))
      .reduce((acc: any[], current: any) => {
        const isDuplicate = acc.some((item) => {
          return Math.abs(Number(item.lat) - Number(current.lat)) < 0.0003 && 
                 Math.abs(Number(item.lng) - Number(current.lng)) < 0.0003;
        });
        if (!isDuplicate) acc.push(current);
        return acc;
      }, []);

    const hexagonHoles = uniqueFootprints
      .map((fp: any) => {
        const path = [];
        const r_earth = 6378137; // Bán kính chuẩn xích đạo (mét)
        const radius = 300;     // Bán kính vùng đục lỗ (mét)
        
        const centerLat = Number(fp.lat);
        const centerLng = Number(fp.lng);

        for (let i = 0; i < 6; i++) {
          const angle = (i * 60 * Math.PI) / 180;
          // Tính toán độ dịch vĩ độ và kinh độ chuẩn xác theo mét ra độ (degrees)
          const latOffset = (radius * Math.sin(angle)) / r_earth;
          const lngOffset = (radius * Math.cos(angle)) / (r_earth * Math.cos((centerLat * Math.PI) / 180));
          
          const pLat = centerLat + (latOffset * 180) / Math.PI;
          const pLng = centerLng + (lngOffset * 180) / Math.PI;
          path.push([pLng, pLat]); // Định dạng [lng, lat] chuẩn Mapbox
        }
        path.push(path[0]); // BẮT BUỘC: Khép kín điểm đầu-cuối để chống vỡ hình đa giác (Oops vát góc)
        return path;
      })
      .filter(path => path.length > 0);

    return {
      type: "FeatureCollection" as const,
      features: [{
        type: "Feature" as const,
        geometry: { type: "Polygon" as const, coordinates: [worldBounds, ...hexagonHoles] },
        properties: {},
      }],
    };
  }, [dynamicFootprints]);

  // --- TOUR ROUTE LINESTRING ---
  const tourRouteGeoJSON = useMemo(() => {
    return {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates: routeCoordinates },
    };
  }, [routeCoordinates]);

  // --- MOMENT POINTS ---
  const points = useMemo(() => {
    if (!moments) return [];
    const momentsArray = Array.isArray(moments) ? moments : ((moments as any).pages?.flat() || []);
    return momentsArray
      .filter((m: any) => m.lat != null && m.lng != null)
      .map((m: any) => {
        const userObj = m.user || {};
        return {
          type: "Feature" as const,
          properties: {
            cluster: false, momentId: m.id, userId: m.userId || userObj.id || 0,
            avatarUrl: userObj.avatarUrl || m.avatarUrl || null,
            userFullName: userObj.fullName || m.fullName || "?", rawMoment: m 
          },
          geometry: { type: "Point" as const, coordinates: [Number(m.lng), Number(m.lat)] },
        };
      });
  }, [moments]);

  // --- HEATMAP POINTS (tu LocationLogs, giong mobile) ---
  // Moi diem co weight = so lan di qua o luoi -> chuan hoa ve 0..1 cho mapbox.
  const heatmapPoints = useMemo(() => {
    const src = Array.isArray(heatmapData) ? heatmapData : [];
    if (src.length === 0) {
      // Fallback: neu chua co log di chuyen, dung vi tri cac anh (weight 1) de lop van hien.
      return points.map((p: any) => ({ ...p, properties: { ...p.properties, weight: 1 } }));
    }
    const maxW = Math.max(...src.map((p: any) => Number(p.weight) || 1), 1);
    return src
      .filter((p: any) => p.lat != null && p.lng != null)
      .map((p: any) => ({
        type: "Feature" as const,
        properties: { weight: (Number(p.weight) || 1) / maxW },
        geometry: { type: "Point" as const, coordinates: [Number(p.lng), Number(p.lat)] },
      }));
  }, [heatmapData, points]);

  const hasCenteredRef = useRef(false);

  // Tự động định vị
  useEffect(() => {
    if (isMapReady && !hasCenteredRef.current) {
      if (points && points.length > 0) {
        const firstPoint = points[0].geometry.coordinates;
        mapRef.current?.flyTo({ center: [firstPoint[0], firstPoint[1]], zoom: 13, duration: 1500 });
        hasCenteredRef.current = true;
      } else if (tourStops && tourStops.length > 0) {
        mapRef.current?.flyTo({ center: [tourStops[0].lng, tourStops[0].lat], zoom: 13, duration: 1500 });
        hasCenteredRef.current = true;
      }
    }
  }, [points, tourStops, isMapReady]);

  useEffect(() => { hasCenteredRef.current = false; }, [scheduleId]);

  const { clusters, supercluster } = useSupercluster({
    points, bounds: bounds ?? undefined, zoom: viewState.zoom, options: { radius: 80, maxZoom: 19 },
  });

  function handleJumpToNewest(event: React.MouseEvent<HTMLButtonElement>): void {
    event.stopPropagation();
    if (points.length > 0 && mapRef.current) {
      const [longitude, latitude] = points[0].geometry.coordinates;
      mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 16, duration: 1200 });
    }
  }

  const myAvatar = (user as any)?.avatarUrl || (user as any)?.AvatarUrl;

  if (isMomentsLoading || isRouteLoading) {
    return (
      <div className="w-full h-[80vh] flex items-center justify-center bg-slate-100 rounded-3xl">
        <div className="animate-spin w-10 h-10 border-4 border-brand border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[80vh] overflow-hidden rounded-3xl shadow-xl border border-slate-200 bg-slate-100">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMapMove}
        onLoad={onMapLoad}
        mapboxAccessToken={apiKey}
        mapStyle={isNightMode ? "mapbox://styles/mapbox/navigation-night-v1" : "mapbox://styles/mapbox/navigation-day-v1"}
        style={{ width: "100%", height: "100%" }}
        onClick={handleMapClick}
        attributionControl={false}
      >
        <style>{`
          .glass-panel {
            background: rgba(255, 255, 255, 0.75);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.6);
          }
          .glass-panel-dark {
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .glass-button {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.8);
          }
        `}</style>
        {isMapReady && (
          <>
            {/* Lớp Tuyến đường bộ (Tour Route) */}
            {showTourRoute && routeCoordinates.length > 0 && (
              <Source id="tour-route-source" type="geojson" data={tourRouteGeoJSON}>
                {/* Lớp viền phát sáng/độ bóng phía dưới */}
                <Layer
                  id="tour-route-line-glow"
                  type="line"
                  paint={{
                    "line-color": "#0046a0",
                    "line-width": ["interpolate", ["linear"], ["zoom"], 10, 8, 15, 14],
                    "line-opacity": 0.5,
                    "line-blur": 6,
                  }}
                  layout={{ "line-join": "round", "line-cap": "round" }}
                />
                {/* Lớp đường chính phía trên */}
                <Layer
                  id="tour-route-line"
                  type="line"
                  paint={{
                    "line-color": "#0ea5e9",
                    "line-width": ["interpolate", ["linear"], ["zoom"], 10, 3, 15, 6],
                  }}
                  layout={{ "line-join": "round", "line-cap": "round" }}
                />
                <Layer
                  id="tour-route-dash"
                  type="line"
                  paint={{
                    "line-color": "#ffffff",
                    "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1, 15, 2],
                    "line-dasharray": [2, 4],
                    "line-opacity": 0.8
                  }}
                  layout={{ "line-join": "round", "line-cap": "round" }}
                />
              </Source>
            )}

            {/* Lớp Điểm dừng (Waypoints) */}
            {showTourRoute && tourStops.map((stop, idx) => {
              const isActive = isReplayMode && timelineEvents[currentEventIndex]?.lat === stop.lat && timelineEvents[currentEventIndex]?.lng === stop.lng;
              return (
                <Marker key={`stop-${idx}`} longitude={stop.lng} latitude={stop.lat} anchor="bottom">
                  <div className={`flex flex-col items-center group cursor-pointer relative z-10 transition-transform duration-500 ${isActive ? 'scale-125' : 'hover:scale-110'}`}>
                    <div className="glass-panel text-slate-800 px-3 py-1.5 rounded-xl shadow-lg text-[12px] font-bold border border-white/40 mb-2 whitespace-nowrap opacity-90 group-hover:opacity-100 transition-opacity">
                      <span className="text-brand mr-1 font-black">{stop.sequence}.</span>
                      {stop.name}
                    </div>
                    <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-brand to-cyan-400 border-2 border-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,104,224,0.4)] group-hover:rotate-12 transition-transform duration-300">
                      <Compass className="w-4 h-4 text-white" />
                      {isActive && <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-40"></div>}
                    </div>
                    <div className="w-1.5 h-1.5 bg-brand rounded-full mt-1 shadow-sm opacity-80"></div>
                  </div>
                </Marker>
              );
            })}

            {/* Lớp Dấu chân (Fog of War) */}
            {showFootprints && fogGeoJSON && (
              <Source id="fog-source" type="geojson" data={fogGeoJSON}>
                <Layer id="fog-layer" type="fill" paint={{ "fill-color": isNightMode ? "#0f172a" : "#94a3b8", "fill-opacity": 0.6 }} />
              </Source>
            )}

            {/* Lớp Heatmap (Social Energy) */}
            {showHeatmap && heatmapPoints && heatmapPoints.length > 0 && (
              <Source id="heatmap-source" type="geojson" data={{ type: "FeatureCollection" as const, features: heatmapPoints }}>
                <Layer 
                  id="heatmap-layer" 
                  type="heatmap"
                  paint={{
                    "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
                    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 15, 3],
                    "heatmap-color": [
                      "interpolate", ["linear"], ["heatmap-density"],
                      0, "rgba(34, 211, 238, 0)",
                      0.2, "rgba(45, 212, 191, 0.4)",
                      0.4, "rgba(139, 92, 246, 0.6)",
                      0.7, "rgba(236, 72, 153, 0.8)",
                      1, "rgba(249, 115, 22, 1)"
                    ],
                    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 10, 15, 40],
                    "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 10, 1, 16, 0]
                  }}
                />
              </Source>
            )}

            {/* Lớp Hình ảnh (Moments) */}
            {showMoments && clusters.map((cluster) => {
              const [longitude, latitude] = cluster.geometry.coordinates;
              if (isNaN(latitude) || isNaN(longitude)) return null;

              const { cluster: isCluster, point_count: pointCount, momentId, avatarUrl, userFullName } = cluster.properties;

              if (isCluster) {
                const leaves = supercluster ? supercluster.getLeaves(cluster.id as number, Infinity) : [];
                const isSingleUserCluster = new Set(leaves.map((l: any) => String(l.properties.userId))).size === 1;

                const handleClusterClick = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (!supercluster) return;
                  setActiveClusterMoments(leaves.map((leaf: any) => leaf.properties.rawMoment));
                  mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 15, duration: 800 });
                };

                if (isSingleUserCluster) {
                  const firstLeaf = leaves[0];
                  const cAvatarUrl = firstLeaf?.properties.avatarUrl;
                  const cUserFullName = firstLeaf?.properties.userFullName;
                  const userInitial = cUserFullName ? cUserFullName.charAt(0).toUpperCase() : "?";

                  return (
                    <Marker key={`cluster-${cluster.id}`} longitude={longitude} latitude={latitude} anchor="bottom">
                      <div className="relative group cursor-pointer transform transition-all duration-400 hover:scale-110 hover:-translate-y-2 origin-bottom" onClick={handleClusterClick}>
                        <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full border-[3px] border-white bg-white shadow-[0_8px_20px_rgba(0,0,0,0.15)] overflow-hidden">
                          <SafeImage src={cAvatarUrl} alt="Moment" className="w-full h-full object-cover" fallbackClassName="w-full h-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-400" fallbackText={userInitial} />
                        </div>
                        <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center !rounded-full bg-rose-500 text-xs font-bold text-white border-2 border-white shadow-md z-20">{pointCount}</span>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r-[3px] border-b-[3px] border-white shadow-[4px_4px_8px_rgba(0,0,0,0.1)] z-0"></div>
                      </div>
                    </Marker>
                  );
                } else {
                  return (
                    <Marker key={`cluster-${cluster.id}`} longitude={longitude} latitude={latitude} anchor="center">
                      <div className="group relative flex items-center justify-center w-14 h-14 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.2)] border-[3px] border-white cursor-pointer transform transition-all duration-400 hover:scale-110 bg-gradient-to-br from-brand to-cyan-400" onClick={handleClusterClick}>
                        <Users className="w-6 h-6 text-white" />
                        <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center !rounded-full bg-rose-500 text-xs font-bold text-white border-2 border-white shadow-md z-20">{pointCount}</span>
                        <div className="absolute inset-0 rounded-full border-[3px] border-white animate-ping opacity-30 group-hover:opacity-60 pointer-events-none"></div>
                      </div>
                    </Marker>
                  );
                }
              }

              const userInitial = userFullName ? userFullName.charAt(0).toUpperCase() : "?";

              return (
                <Marker key={`moment-${momentId}`} longitude={longitude} latitude={latitude} anchor="bottom">
                  <div className="relative group cursor-pointer transform transition-all duration-400 hover:scale-110 hover:-translate-y-2 origin-bottom" onClick={(e) => { e.stopPropagation(); onMarkerClick(momentId); }}>
                    <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-2xl border-[3px] border-white bg-white shadow-[0_8px_20px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-300 group-hover:rounded-xl group-hover:shadow-[0_12px_25px_rgba(0,0,0,0.2)]">
                      <SafeImage src={avatarUrl} alt="Moment" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" fallbackClassName="w-full h-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-400" fallbackText={userInitial} />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r-[3px] border-b-[3px] border-white shadow-[4px_4px_8px_rgba(0,0,0,0.1)] z-0"></div>
                    
                    {/* Hover Tooltip */}
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none z-20 flex flex-col items-center">
                      <div className="glass-panel-dark text-white px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-xl flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20">
                           <SafeImage src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" fallbackClassName="bg-white/20 w-full h-full" fallbackText="" />
                        </div>
                        <span>{userFullName}</span>
                      </div>
                    </div>
                  </div>
                </Marker>
              );
            })}

            {/* Lớp Vị trí Bạn bè (Realtime Locations) */}
            {showLiveLocations && visualFriendLocations.map((friend: any) => {
              const fLat = friend.visualLat;
              const fLng = friend.visualLng;

              return (
                <Marker key={`friend-${friend.userId}`} longitude={fLng} latitude={fLat} anchor="bottom">
                  <div className="relative flex flex-col items-center justify-center transition-all duration-500 group pointer-events-auto cursor-pointer hover:-translate-y-2">
                    <div className="absolute inset-0 bg-green-400 rounded-full opacity-20 animate-ping w-16 h-16 -left-2 -top-2 pointer-events-none"></div>
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-full border-[3px] border-white overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.2)] bg-slate-100">
                        <SafeImage src={friend.avatarUrl} alt={friend.fullName} className="w-full h-full object-cover" fallbackClassName="w-full h-full flex items-center justify-center bg-emerald-500 text-white font-bold text-lg" fallbackText={friend.fullName?.charAt(0)} />
                      </div>
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm z-20"></div>
                    </div>
                    <div className="mt-1.5 px-2.5 py-0.5 glass-panel text-slate-800 text-[11px] font-bold rounded-full whitespace-nowrap shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
                      {friend.fullName}
                    </div>
                  </div>
                </Marker>
              );
            })}

            {/* Lớp Highlight Sự kiện (Timeline Replay) */}
            {isReplayMode && timelineEvents[currentEventIndex] && (
              <Marker 
                longitude={timelineEvents[currentEventIndex].lng} 
                latitude={timelineEvents[currentEventIndex].lat} 
                anchor="bottom"
              >
                <div className="relative flex flex-col items-center justify-center animate-bounce">
                  <div className="absolute inset-0 bg-brand rounded-full opacity-30 animate-[ping_2s_ease-in-out_infinite] w-24 h-24 -left-5 -top-5 pointer-events-none"></div>
                  <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full border-[3px] border-white shadow-[0_0_20px_rgba(0,104,224,0.6)] overflow-hidden bg-gradient-to-br from-brand to-cyan-400">
                    <SafeImage src={timelineEvents[currentEventIndex].imageUrl} alt="Active Event" className="w-full h-full object-cover" fallbackClassName="flex items-center justify-center w-full h-full" fallbackText={<MapPin className="w-6 h-6 text-white" />} />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r-[3px] border-b-[3px] border-white shadow-[4px_4px_8px_rgba(0,0,0,0.1)] z-0"></div>
                </div>
              </Marker>
            )}

          {/* Lớp Vị trí Hiện tại của Bản thân */}
          {myLocation && (
            <Marker longitude={myLocation.lng} latitude={myLocation.lat} anchor="center">
              <div className="relative flex flex-col items-center justify-center pointer-events-none">
                <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-[ping_2s_ease-in-out_infinite] w-20 h-20 -left-4 -top-4"></div>
                <div className="absolute inset-0 bg-blue-400 rounded-full opacity-30 animate-[ping_3s_ease-in-out_infinite] w-16 h-16 -left-2 -top-2"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-full border-[3px] border-white overflow-hidden bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] pointer-events-auto cursor-pointer hover:scale-110 transition-transform duration-300">
                    <SafeImage src={myAvatar} alt="Me" className="w-full h-full object-cover" fallbackClassName="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold text-lg" fallbackText={user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"} />
                  </div>
                  {/* Directional Beacon Arrow */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 rotate-45 border-r-[2px] border-b-[2px] border-white z-0 rounded-sm"></div>
                </div>
              </div>
            </Marker>
          )}
          </>
        )}
      </Map>

      {/* Share Button */}
      <div className="absolute top-4 left-4 z-20">
        <ShareLocationButton />
      </div>

      {/* Top Right Controls (Layers & Replay) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setIsLayerMenuOpen(!isLayerMenuOpen); }}
            className="glass-button flex h-12 w-12 items-center justify-center rounded-full text-slate-700 transition-all hover:scale-110 hover:text-brand focus:outline-none"
          >
            <Layers className="h-6 w-6" />
          </button>
          
          {isLayerMenuOpen && (
            <div className="absolute top-full right-0 mt-3 w-72 origin-top-right rounded-[2rem] glass-panel p-3 shadow-2xl animate-fade-in-down z-50" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col gap-1">
                {/* Lộ trình hành trình */}
                <div onClick={() => setShowTourRoute(!showTourRoute)} className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${showTourRoute ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}><Compass className="w-5 h-5" /></div>
                    <span className="text-sm font-bold text-slate-800">Tour Route</span>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${showTourRoute ? 'bg-brand' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300 ${showTourRoute ? 'translate-x-5' : 'translate-x-[2px]'}`} />
                  </div>
                </div>

                {/* Khoảnh khắc */}
                <div onClick={() => setShowMoments(!showMoments)} className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${showMoments ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-500'}`}><Camera className="w-5 h-5" /></div>
                    <span className="text-sm font-bold text-slate-800">{t("social.mapLayerMoments")}</span>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${showMoments ? 'bg-brand' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300 ${showMoments ? 'translate-x-5' : 'translate-x-[2px]'}`} />
                  </div>
                </div>

                {/* Vị trí bạn bè */}
                <div onClick={() => setShowLiveLocations(!showLiveLocations)} className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${showLiveLocations ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}><Users className="w-5 h-5" /></div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">{t("social.mapLayerFriendLocations")}</span>
                      {showLiveLocations && lastPingTime && <span className="text-[10px] text-slate-500 font-medium leading-none mt-1">Live</span>}
                    </div>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${showLiveLocations ? 'bg-brand' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300 ${showLiveLocations ? 'translate-x-5' : 'translate-x-[2px]'}`} />
                  </div>
                </div>

                {/* Dấu chân (Fog of War) */}
                <div onClick={() => setShowFootprints(!showFootprints)} className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${showFootprints ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}><Layers className="w-5 h-5" /></div>
                    <span className="text-sm font-bold text-slate-800">{t("social.mapLayerFootprints")}</span>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${showFootprints ? 'bg-brand' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300 ${showFootprints ? 'translate-x-5' : 'translate-x-[2px]'}`} />
                  </div>
                </div>

                {/* Heatmap (Social Energy) */}
                <div onClick={() => setShowHeatmap(!showHeatmap)} className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${showHeatmap ? 'bg-orange-100 text-orange-500' : 'bg-slate-100 text-slate-500'}`}><Flame className="w-5 h-5" /></div>
                    <span className="text-sm font-bold text-slate-800">Social Energy</span>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${showHeatmap ? 'bg-orange-500' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300 ${showHeatmap ? 'translate-x-5' : 'translate-x-[2px]'}`} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nút Timeline Replay */}
        {(!isSpecificTour || timelineEvents.length > 0) && (
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              setIsReplayMode(!isReplayMode); 
              if (isSpecificTour) setIsPlaying(!isReplayMode); 
              setCurrentEventIndex(0); 
              setDockState('expanded');
            }}
            className={`glass-button flex h-12 w-12 items-center justify-center rounded-full transition-all hover:scale-110 focus:outline-none ${isReplayMode ? 'bg-brand !text-white border-none' : 'text-slate-700 hover:text-brand'}`}
            title="Timeline Replay"
          >
            <History className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Nút Điều hướng Nhanh (Góc dưới phải) */}
      <div className="absolute bottom-28 right-4 z-20 flex flex-col gap-3">
        {myLocation && (
          <button
            onClick={(e) => { e.stopPropagation(); mapRef.current?.flyTo({ center: [myLocation.lng, myLocation.lat], zoom: 16, duration: 1000 }); }}
            className="glass-button flex h-12 w-12 items-center justify-center rounded-full text-slate-700 transition-all hover:scale-105 hover:text-brand focus:outline-none"
            title="Vị trí của bạn"
          >
            <Navigation className="h-5 w-5" />
          </button>
        )}
        {tourStops && tourStops.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (mapRef.current && tourStops.length > 0) {
                const lngs = tourStops.map((s: any) => s.lng);
                const lats = tourStops.map((s: any) => s.lat);
                mapRef.current.fitBounds([
                  [Math.min(...lngs), Math.min(...lats)],
                  [Math.max(...lngs), Math.max(...lats)]
                ], { padding: 60, duration: 1000 });
              }
            }}
            className="glass-button flex h-12 w-12 items-center justify-center rounded-full text-slate-700 transition-all hover:scale-105 hover:text-brand focus:outline-none"
            title="Tiêu điểm Tour"
          >
            <Compass className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nút quay về ảnh mới nhất */}
      {!isReplayMode && (
        <div className="absolute bottom-6 left-4 z-20">
          <button onClick={handleJumpToNewest} className="glass-button flex items-center gap-2.5 rounded-full px-5 py-3 text-sm font-bold text-slate-800 transition-all hover:scale-105">
            <Navigation className="h-4 w-4 text-brand" />
            {t("social.mapNewestPhoto")}
          </button>
        </div>
      )}

      {/* Floating Central Actions (Playback Controls) */}
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ease-out flex flex-col items-center gap-2 ${isReplayActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
         <div className="flex items-center justify-center gap-4 md:gap-8">
           <button onClick={() => setPlaybackSpeed(prev => prev === 1 ? 2 : prev === 2 ? 5 : 1)} className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.1)] border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white hover:text-brand transition-colors flex items-center justify-center">
              {playbackSpeed}x
           </button>
           <div className="flex items-center gap-4 bg-white/95 backdrop-blur-md px-6 py-2.5 rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.15)] border border-slate-100">
             <button onClick={() => setCurrentEventIndex(prev => Math.max(0, prev - 1))} className="p-2 text-slate-600 hover:text-brand transition-colors"><SkipBack className="w-6 h-6 fill-current" /></button>
             <button onClick={() => { if (currentEventIndex >= timelineEvents.length - 1) { setCurrentEventIndex(0); } setIsPlaying(!isPlaying); }} className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 ml-1 fill-current" />}
             </button>
             <button onClick={() => setCurrentEventIndex(prev => Math.min(timelineEvents.length - 1, prev + 1))} className="p-2 text-slate-600 hover:text-brand transition-colors"><SkipForward className="w-6 h-6 fill-current" /></button>
           </div>
           <div className="w-12 h-12"></div> {/* Spacer for balance */}
         </div>
         {/* Invisible label spacer to exactly match the vertical height of the Post Moment FAB layout */}
         <span className="whitespace-nowrap text-[11px] font-bold text-transparent px-2.5 py-1 select-none pointer-events-none">
           Spacer Label
         </span>
      </div>

      {/* Timeline Replay Dock */}
      {isReplayMode && (!isSpecificTour || timelineEvents.length > 0) && (
        <div className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-500 ease-in-out flex justify-center ${(!isSpecificTour || dockState === 'expanded') ? 'h-[300px]' : 'h-[80px]'}`}>
          <div className="w-full max-w-4xl h-full glass-panel rounded-t-[2rem] border-b-0 flex flex-col relative overflow-hidden shadow-[0_-8px_30px_rgba(0,0,0,0.1)]">
            
            {/* Expand/Collapse Handle */}
            {isSpecificTour && (
              <div 
                className="w-full h-6 flex items-center justify-center cursor-pointer hover:bg-black/5 transition-colors absolute top-0 left-0 right-0 z-10"
                onClick={() => setDockState(prev => prev === 'expanded' ? 'collapsed' : 'expanded')}
              >
                <div className="w-12 h-1.5 bg-slate-300 rounded-full mt-2"></div>
              </div>
            )}

            <div className="flex-1 flex flex-col px-6 pb-6 pt-8">
              {!isSpecificTour ? (
                <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in-up pb-20 relative">
                  <button onClick={() => setIsReplayMode(false)} className="absolute -top-4 right-0 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors">
                     <X className="w-4 h-4" />
                  </button>
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <History className="w-6 h-6 text-brand" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">✨ Open a specific tour to relive your memories</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
                    Timeline Replay is designed to replay one journey at a time.
                  </p>
                  <button onClick={() => setIsReplayMode(false)} className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-full shadow-md hover:scale-105 transition-all">
                    Browse My Tours
                  </button>
                </div>
              ) : dockState === 'expanded' ? (
                <div className="flex flex-col h-full animate-fade-in-up">
                  {/* Expanded Content */}
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl overflow-hidden shadow-md border-2 border-white ${!timelineEvents[currentEventIndex]?.imageUrl ? 'bg-gradient-to-br from-brand to-cyan-400 text-white flex items-center justify-center' : ''}`}>
                          <SafeImage src={timelineEvents[currentEventIndex]?.imageUrl} alt="Event" className="w-full h-full object-cover" fallbackClassName="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand to-cyan-400 text-white" fallbackText={<MapPin className="w-8 h-8" />} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-brand tracking-widest uppercase">
                             {new Date(timelineEvents[currentEventIndex]?.time).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          <span className="text-lg font-bold text-slate-800 line-clamp-1">
                             {timelineEvents[currentEventIndex]?.title}
                          </span>
                          <span className="text-sm text-slate-500 line-clamp-1">
                             {timelineEvents[currentEventIndex]?.desc}
                          </span>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                       {!isReplayActive && (
                         <button onClick={() => { if (currentEventIndex >= timelineEvents.length - 1) { setCurrentEventIndex(0); } setIsPlaying(true); }} className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shadow-md hover:bg-brand-hover hover:scale-105 transition-all">
                            <Play className="w-4 h-4 ml-0.5 fill-current" />
                         </button>
                       )}
                       <button onClick={() => { setIsReplayMode(false); setIsPlaying(false); }} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                          <X className="w-5 h-5" />
                       </button>
                     </div>
                  </div>

                  {/* Slider */}
                  <div className="w-full mb-4 group relative px-2">
                     <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 h-2 bg-slate-200/80 rounded-full overflow-hidden">
                        <div className="h-full bg-brand transition-all duration-300" style={{ width: `${(currentEventIndex / Math.max(1, timelineEvents.length - 1)) * 100}%` }}></div>
                     </div>
                     <input 
                       type="range" min="0" max={Math.max(0, timelineEvents.length - 1)} 
                       value={currentEventIndex} 
                       onChange={(e) => { setCurrentEventIndex(Number(e.target.value)); setIsPlaying(false); }}
                       className="absolute top-1/2 -translate-y-1/2 w-full h-8 opacity-0 cursor-pointer z-10"
                     />
                     <div 
                       className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-4 border-brand rounded-full shadow-md pointer-events-none transition-all duration-300" 
                       style={{ left: `calc(${(currentEventIndex / Math.max(1, timelineEvents.length - 1)) * 100}% - 10px)` }}
                     ></div>
                  </div>

                  {/* Safe Area for Post Moment FAB / Central Actions */}
                  <div className="h-[96px] w-full shrink-0 flex items-center justify-center">
                     {!isReplayActive && currentEventIndex >= timelineEvents.length - 1 && (
                       <span className="text-sm font-medium text-slate-500 animate-fade-in-up bg-slate-100/80 px-5 py-2.5 rounded-full border border-slate-200/60 shadow-sm backdrop-blur-sm">
                         Ready to capture your next moment?
                       </span>
                     )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between h-full animate-fade-in-up">
                  {/* Collapsed Content */}
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-cyan-400 flex items-center justify-center text-white shadow-md">
                        <History className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">Timeline Replay</span>
                        <span className="text-xs text-slate-500 line-clamp-1">{new Date(timelineEvents[currentEventIndex]?.time).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', {hour: '2-digit', minute:'2-digit'})} • {timelineEvents[currentEventIndex]?.title}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <button onClick={() => { if (currentEventIndex >= timelineEvents.length - 1) { setCurrentEventIndex(0); } setIsPlaying(!isPlaying); }} className="w-10 h-10 bg-slate-900 text-white rounded-full shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
                     </button>
                     <button onClick={() => { setIsReplayMode(false); setIsPlaying(false); }} className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors flex items-center justify-center">
                        <X className="w-4 h-4" />
                     </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cluster Modal (Hiển thị các ảnh gom cụm) */}
      {activeClusterMoments && (
        <div className="absolute inset-0 z-50 h-full w-full bg-slate-900/60 backdrop-blur-xl flex flex-col animate-slide-up rounded-3xl">
          <button onClick={() => setActiveClusterMoments(null)} className="absolute top-6 right-6 z-[60] p-3 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md transition-colors cursor-pointer">
            <X className="w-6 h-6" />
          </button>
          <div className="flex-1 overflow-y-auto px-4 pt-24 pb-12 space-y-8 custom-scrollbar flex flex-col items-center">
            {activeClusterMoments.map((moment) => (
              <div key={`cluster-feed-${moment.id}`} className="w-full flex justify-center shrink-0">
                <MomentCard moment={moment} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};