import React, { useState, useRef, useCallback, useMemo, useEffect, useContext } from "react";
import Map, { Marker, Source, Layer, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import useSupercluster from "use-supercluster";
import { Users, X, Camera, Layers, Navigation, Compass, MapPin, Play, Pause, SkipForward, SkipBack, History, Flame, Film, HelpCircle, ChevronDown, Sparkles } from "lucide-react";
import type { Moment } from "../types/moment.type";
import { useGetMomentFeed, useGetMyFootprints, useGetHeatmap } from "../hooks/useMoments"; 
import { useGetScheduleLiveLocations, useGetTourRouteData } from "../../tracking/hooks/useScheduleTracking";
import { MomentCard } from "./MomentCard"; 
import * as signalR from '@microsoft/signalr';
import { SIGNALR_HUB_BASE } from "../../../../config/api/api";
import { locationService } from "../../locations/services/locationService";
import { ShareLocationButton } from "../../tracking/components/ShareLocationButton";
import { useTranslation } from "../../../../contexts/LocaleContext";
import { getStoredLocale } from "../../../../i18n";
import { AuthContext } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";

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
  onPostMomentClick?: () => void;
}

export const MomentsMapFeed: React.FC<MomentsMapFeedProps> = ({
  scheduleId,
  onMarkerClick,
  onReplayStateChange,
  onPostMomentClick,
}) => {
  const { t } = useTranslation();
  const locale = getStoredLocale();
  const { user } = useContext(AuthContext);
  const { success, error: toastError } = useToast();

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const apiKey = import.meta.env.VITE_MAPBOX_TOKEN as string;
  if (!apiKey) {
    console.error("VITE_MAPBOX_TOKEN is missing in .env file. Please check your .env configuration.");
  }

  // --- API FETCHING ---
  const { data: moments, isLoading: isMomentsLoading } = useGetMomentFeed(scheduleId);
  const { data: footprints } = useGetMyFootprints();
  const { data: routeData, isLoading: isRouteLoading } = useGetTourRouteData(scheduleId);
  const { data: scheduleLocations } = useGetScheduleLiveLocations(scheduleId ?? 0);

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
  const [heatmapType, setHeatmapType] = useState<'online' | 'moments'>('online');
  // Heatmap lay tu LocationLogs (giong mobile); chi fetch khi bat lop heatmap.
  const { data: heatmapData } = useGetHeatmap(scheduleId, heatmapType, showHeatmap);
  const [isNightMode, setIsNightMode] = useState(false);
  const [dockState, setDockState] = useState<'collapsed' | 'expanded'>('expanded');
  
  const [isPostButtonHidden, setIsPostButtonHidden] = useState<boolean>(() => {
    return localStorage.getItem("post_button_hidden") === "true";
  });
  const touchStartYRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - touchStartYRef.current;
    if (deltaY > 50) {
      setIsPostButtonHidden(true);
      localStorage.setItem("post_button_hidden", "true");
    }
  };
  
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
  const [scheduleMemberLocations, setScheduleMemberLocations] = useState<any[]>([]);
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState<boolean>(() => {
    return localStorage.getItem("share_my_location") === "true";
  });
  const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Sliding Day Selector indicator refs and style state
  const daySelectorContainerRef = useRef<HTMLDivElement>(null);
  const daySelectorButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [daySelectorPillStyle, setDaySelectorPillStyle] = useState<React.CSSProperties>({ opacity: 0 });

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
  const uniqueDays = useMemo(() => {
    if (!routeData?.waypoints) return [];
    const days = Array.from(new Set(routeData.waypoints.map((wp: any) => wp.dayNumber).filter((d): d is number => typeof d === 'number')));
    return days.sort((a, b) => a - b);
  }, [routeData]);

  const filteredWaypoints = useMemo(() => {
    if (!routeData?.waypoints) return [];
    if (selectedDay === 'ALL') return routeData.waypoints;
    return routeData.waypoints.filter((wp: any) => wp.dayNumber === selectedDay);
  }, [routeData, selectedDay]);

  const tourStops = useMemo(() => filteredWaypoints, [filteredWaypoints]);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  // Cập nhật vị trí và kích thước của thanh trượt (sliding pill) khi chọn ngày
  useEffect(() => {
    const activeKey = String(selectedDay);
    const activeBtn = daySelectorButtonRefs.current[activeKey];
    const container = daySelectorContainerRef.current;
    
    if (activeBtn && container) {
      setDaySelectorPillStyle({
        left: `${activeBtn.offsetLeft}px`,
        width: `${activeBtn.offsetWidth}px`,
        height: `${activeBtn.offsetHeight}px`,
        top: `${activeBtn.offsetTop}px`,
        opacity: 1,
        transition: 'all 350ms cubic-bezier(0.34, 1.56, 0.64, 1)'
      });
    }
  }, [selectedDay, uniqueDays]);

  useEffect(() => {
    if (!filteredWaypoints || filteredWaypoints.length < 2 || !routeData) {
      setRouteCoordinates([]);
      return;
    }

    let isCancelled = false;

    const fetchMapboxRoute = async () => {
      try {
        const apiKey = import.meta.env.VITE_MAPBOX_TOKEN;
        if (!apiKey) throw new Error("Mapbox access token is missing.");

        const segmentPromises = [];
        for (let i = 0; i < filteredWaypoints.length - 1; i++) {
          const wpStart = filteredWaypoints[i];
          const wpEnd = filteredWaypoints[i + 1];

          segmentPromises.push((async () => {
            try {
              const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${wpStart.lng},${wpStart.lat};${wpEnd.lng},${wpEnd.lat}?geometries=geojson&overview=full&access_token=${apiKey}`;
              const res = await fetch(url);
              if (!res.ok) {
                throw new Error(`Segment directions failed with status: ${res.status}`);
              }
              const data = await res.json();
              const coords = data.routes?.[0]?.geometry?.coordinates;
              if (Array.isArray(coords) && coords.length > 0) {
                return coords;
              }
            } catch (err) {
              console.warn(`Mapbox Directions failed for segment index ${i} (from ${wpStart.lng},${wpStart.lat} to ${wpEnd.lng},${wpEnd.lat}). Drawing straight line:`, err);
            }
            // Fallback to straight line for this segment only
            return [
              [wpStart.lng, wpStart.lat],
              [wpEnd.lng, wpEnd.lat]
            ];
          })());
        }

        const segmentsCoords = await Promise.all(segmentPromises);
        
        if (isCancelled) return;

        // Flatten all segment coordinates into one single route linestring
        const allCoords = segmentsCoords.flat();
        setRouteCoordinates(allCoords);
      } catch (err) {
        console.error("Mapbox Directions API failed completely. Falling back to straight lines:", err);
        if (!isCancelled) {
          setRouteCoordinates(routeData.geometryCoordinates || []);
        }
      }
    };

    fetchMapboxRoute();

    return () => {
      isCancelled = true;
    };
  }, [filteredWaypoints]);

  // --- 🔴 ĐÃ MỞ LẠI: HOOK 1 - KẾT NỐI SIGNALR ĐỂ XEM BẠN BÈ ---
  useEffect(() => {
    if (!showLiveLocations) return;

    let isCancelled = false;
    let connection: signalR.HubConnection | null = null;

    const initLocationService = async () => {
      // Manager & Staff do not have friendship features, so prevent querying friends or connecting to friendship hub
      const savedUser = localStorage.getItem("user");
      let isStaffOrManager = false;
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          const roles = parsed.roles || parsed.Roles || [];
          if (Array.isArray(roles)) {
            isStaffOrManager = roles.includes("Manager") || roles.includes("Staff") || roles.includes("Admin");
          } else if (typeof roles === "string") {
            isStaffOrManager = roles === "Manager" || roles === "Staff" || roles === "Admin";
          }
        } catch {}
      }

      if (isStaffOrManager || isCancelled) {
        return;
      }

      try {
        const initialFriends = await locationService.getLiveFriends();
        if (isCancelled) return;
        setFriendLocations(initialFriends?.data || initialFriends || []);
      } catch (err) {
        console.warn("Lỗi lấy danh sách bạn bè live:", err);
      }

      const token = localStorage.getItem("accessToken");
      if (!token || isCancelled) return;

      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${SIGNALR_HUB_BASE}/friendship`, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect()
        .build();

      try {
        await connection.start();
        if (isCancelled) {
          connection.stop();
          return;
        }

        connection.on("ReceiveFriendLocation", (data: any) => {
          if (isCancelled) return;
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

        connection.on("ReceiveUserStoppedSharing", (userId: number) => {
          if (isCancelled) return;
          setFriendLocations((prev) => prev.filter((f) => String(f.userId) !== String(userId)));
        });
      } catch (err) {
        if (!isCancelled) {
          console.warn("Error connecting to SignalR:", err);
        }
      }
    };

    initLocationService();

    return () => {
      isCancelled = true;
      if (connection) {
        connection.off("ReceiveFriendLocation");
        connection.off("ReceiveUserStoppedSharing");
        connection.stop();
      }
    };
  }, [showLiveLocations]);

  useEffect(() => {
    if (!isSharingLocation) {
      setMyLocation(null);
      return;
    }
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
  }, [scheduleId, isSharingLocation]);

  // Sync scheduleLocations data from API polling
  useEffect(() => {
    setScheduleMemberLocations([]);
  }, [scheduleId]);

  useEffect(() => {
    if (!scheduleLocations || scheduleLocations.length === 0) return;
    setScheduleMemberLocations((prev) => {
      const merged = [...prev];
      scheduleLocations.forEach((incoming: any) => {
        const idx = merged.findIndex((p) => p.userId === incoming.userId);
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], ...incoming };
        } else {
          merged.push(incoming);
        }
      });
      return merged;
    });
  }, [scheduleLocations]);

  // Real-time schedule tracking SignalR Hub
  useEffect(() => {
    if (scheduleId <= 0 || !showLiveLocations) return;

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
        if (isCancelled) {
          connection.stop();
          return;
        }
        await connection.invoke("JoinTourTrackingGroup", scheduleId);

        connection.on("ReceiveTourLocationUpdate", (update: any) => {
          if (isCancelled) return;
          console.log("[DEBUG] SignalR Moments map tour push:", update);
          setScheduleMemberLocations((prev) => {
            const next = [...prev];
            const idx = next.findIndex((item) => item.userId === update.userId);
            if (idx >= 0) {
              next[idx] = { ...next[idx], ...update };
            } else {
              next.push(update);
            }
            return next;
          });
        });
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn("[SignalR] Tour tracking not available in Moments:", err);
        }
      });

    return () => {
      isCancelled = true;
      connection.off("ReceiveTourLocationUpdate");
      connection.stop().catch(() => {});
    };
  }, [scheduleId, showLiveLocations]);

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
    if (!moments) return [];

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
      onReplayStateChange(isReplayMode);
    }
  }, [isReplayMode, onReplayStateChange]);

  const userRole = useMemo(() => {
    if (!user) return "Customer";
    const roles = user.roles || user.Roles || [];
    if (Array.isArray(roles)) {
      if (roles.includes("Manager")) return "Manager";
      if (roles.includes("Staff")) return "Staff";
      if (roles.includes("Admin")) return "Manager";
    } else if (typeof roles === "string") {
      if (roles === "Manager" || roles === "Admin") return "Manager";
      if (roles === "Staff") return "Staff";
    }
    return "Customer";
  }, [user]);

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

    const allPeople: any[] = [];
    if (scheduleId && scheduleId > 0) {
      // Tour tracking mode: show schedule members (filtered by backend role-based permissions)
      scheduleMemberLocations.forEach((loc) => {
        // Exclude current user (since they are already drawn as the blue myLocation beacon)
        if (user?.id && String(loc.userId) === String(user.id)) {
          return;
        }
        if (!allPeople.some((p) => String(p.userId) === String(loc.userId))) {
          allPeople.push(loc);
        }
      });

      // Customer also sees their online friends!
      if (userRole === "Customer") {
        friendLocations.forEach((loc) => {
          if (user?.id && String(loc.userId) === String(user.id)) {
            return;
          }
          if (!allPeople.some((p) => String(p.userId) === String(loc.userId))) {
            allPeople.push(loc);
          }
        });
      }
    } else {
      // Global mode: only show online friends (ONLY for Customers, Manager/Staff have no friends)
      if (userRole === "Customer") {
        friendLocations.forEach((loc) => {
          if (user?.id && String(loc.userId) === String(user.id)) {
            return;
          }
          if (!allPeople.some((p) => String(p.userId) === String(loc.userId))) {
            allPeople.push(loc);
          }
        });
      }
    }

    allPeople.forEach(friend => {
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
  }, [friendLocations, scheduleMemberLocations, scheduleId, myLocation, discreteZoom, user?.id, userRole]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying || timelineEvents.length === 0) return;
    if (currentEventIndex >= timelineEvents.length - 1) {
       setIsPlaying(false);
       if (isRecording) {
         stopRecording();
       }
       return;
    }
    const interval = 3000 / playbackSpeed;
    const timer = setTimeout(() => setCurrentEventIndex(prev => prev + 1), interval);
    return () => clearTimeout(timer);
  }, [isPlaying, currentEventIndex, timelineEvents.length, playbackSpeed, isRecording]);

  // Sync isPlaying with recording state (auto-stop recording if playback is paused/interrupted)
  useEffect(() => {
    if (!isPlaying && isRecording) {
      stopRecording();
    }
  }, [isPlaying, isRecording]);

  // Recording helper functions
  const startRecording = () => {
    if (timelineEvents.length === 0) return;
    
    setCurrentEventIndex(0);
    recordedChunksRef.current = [];
    
    const canvas = document.querySelector('.mapboxgl-canvas') as HTMLCanvasElement;
    if (!canvas) {
      toastError("Mapbox canvas element not found");
      return;
    }

    try {
      const stream = canvas.captureStream(30); // 30 FPS
      let options = { mimeType: 'video/webm; codecs=vp9' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
      }
      
      const recorder = new MediaRecorder(stream, options);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `stayhub_journey_${scheduleId || "general"}.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        success("Journey video downloaded successfully!");
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setIsPlaying(true);
      setIsReplayMode(true);
      setDockState('expanded');
      
      success("Ghi hình hành trình bắt đầu...");
    } catch (err) {
      console.error("Failed to start recording", err);
      toastError("Ghi hình thất bại.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPlaying(false);
  };

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
    if (!routeCoordinates || routeCoordinates.length < 2) return undefined;
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
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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

  // Tự động căn lề / zoom camera khi đổi ngày (hiệu ứng chuyển cảnh động)
  useEffect(() => {
    if (isMapReady && mapRef.current && tourStops && tourStops.length > 0) {
      const timer = setTimeout(() => {
        if (!mapRef.current) return;
        if (tourStops.length === 1) {
          mapRef.current.flyTo({
            center: [tourStops[0].lng, tourStops[0].lat],
            zoom: 15,
            duration: 1000
          });
        } else {
          const lngs = tourStops.map((s: any) => s.lng);
          const lats = tourStops.map((s: any) => s.lat);
          mapRef.current.fitBounds([
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)]
          ], { padding: 80, duration: 1000 });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedDay, tourStops, isMapReady]);

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
        preserveDrawingBuffer={true}
      >
        <style>{`
          .glass-panel {
            background: rgba(255, 255, 255, 0.18);
            backdrop-filter: blur(30px) saturate(180%);
            -webkit-backdrop-filter: blur(30px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.25);
            box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 8px 32px 0 rgba(0, 0, 0, 0.08);
          }
          .glass-panel-dark {
            background: rgba(15, 23, 42, 0.35);
            backdrop-filter: blur(30px) saturate(180%);
            -webkit-backdrop-filter: blur(30px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.08), 0 8px 32px 0 rgba(0, 0, 0, 0.2);
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
              const isStaff = friend.role === "Staff";
              const markerColor = isStaff ? "bg-emerald-500" : "bg-green-500";
              const pingColor = isStaff ? "bg-emerald-400" : "bg-green-400";

              const friendMoment = points.find((p: any) => String(p.properties.userId) === String(friend.userId));
              const momentId = friendMoment?.properties.momentId;

              return (
                <Marker key={`friend-${friend.userId}`} longitude={fLng} latitude={fLat} anchor="bottom">
                  <div 
                    className="relative flex flex-col items-center justify-center transition-all duration-500 group pointer-events-auto cursor-pointer hover:-translate-y-2"
                    onClick={(e) => {
                      if (momentId) {
                        e.stopPropagation();
                        onMarkerClick(momentId);
                      }
                    }}
                  >
                    <div className={`absolute inset-0 ${pingColor} rounded-full opacity-20 animate-ping w-16 h-16 -left-2 -top-2 pointer-events-none`}></div>
                    <div className="relative z-10">
                      <div 
                        className="w-12 h-12 rounded-full border-[3px] overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.2)] bg-slate-100"
                        style={{ borderColor: isStaff ? "#10b981" : "#ffffff" }}
                      >
                        <SafeImage src={friend.avatarUrl} alt={friend.fullName} className="w-full h-full object-cover" fallbackClassName={`w-full h-full flex items-center justify-center ${isStaff ? 'bg-emerald-500' : 'bg-green-500'} text-white font-bold text-lg`} fallbackText={friend.fullName?.charAt(0)} />
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${markerColor} border-2 border-white rounded-full shadow-sm z-20`}></div>
                      {isStaff && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow z-30 uppercase tracking-wide border border-white">
                          STAFF
                        </span>
                      )}
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
          {myLocation && (() => {
            const myMoment = points.find((p: any) => String(p.properties.userId) === String(user?.id));
            const myMomentId = myMoment?.properties.momentId;
            return (
              <Marker longitude={myLocation.lng} latitude={myLocation.lat} anchor="center">
                <div className="relative flex flex-col items-center justify-center pointer-events-none">
                  <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-[ping_2s_ease-in-out_infinite] w-20 h-20 -left-4 -top-4"></div>
                  <div className="absolute inset-0 bg-blue-400 rounded-full opacity-30 animate-[ping_3s_ease-in-out_infinite] w-16 h-16 -left-2 -top-2"></div>
                  <div className="relative z-10">
                    <div 
                      className="w-12 h-12 rounded-full border-[3px] border-white overflow-hidden bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] pointer-events-auto cursor-pointer hover:scale-110 transition-transform duration-300"
                      onClick={(e) => {
                        if (myMomentId) {
                          e.stopPropagation();
                          onMarkerClick(myMomentId);
                        }
                      }}
                    >
                      <SafeImage src={myAvatar} alt="Me" className="w-full h-full object-cover" fallbackClassName="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold text-lg" fallbackText={user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"} />
                    </div>
                    {/* Directional Beacon Arrow */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 rotate-45 border-r-[2px] border-b-[2px] border-white z-0 rounded-sm"></div>
                  </div>
                </div>
              </Marker>
            );
          })()}
          </>
        )}
      </Map>

      {/* Share Button */}
      <div className="absolute top-20 md:top-4 left-4 z-20">
        <ShareLocationButton 
          onShareStart={() => {
            setIsSharingLocation(true);
            localStorage.setItem("share_my_location", "true");
          }} 
        />
      </div>

      {uniqueDays.length > 0 && (
        <div 
          ref={daySelectorContainerRef}
          className="absolute top-[140px] md:top-20 left-1/2 -translate-x-1/2 z-20 flex gap-2 glass-panel p-1.5 rounded-full shadow-lg animate-[fadeIn_0.5s_ease] max-w-[90vw] overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Sliding indicator background pill */}
          <div 
            className="absolute bg-gradient-to-r from-brand to-cyan-500 rounded-full shadow-[0_4px_12px_rgba(0,104,224,0.3)] pointer-events-none"
            style={daySelectorPillStyle}
          />
          
          <button
            ref={(el) => { daySelectorButtonRefs.current['ALL'] = el; }}
            onClick={() => setSelectedDay('ALL')}
            style={{ transition: 'color 300ms ease, transform 300ms ease' }}
            className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap z-10 font-bold active:scale-95 transition-all duration-300 ${
              selectedDay === 'ALL'
                ? 'text-white font-black scale-105'
                : 'text-slate-700 hover:text-brand hover:scale-102'
            }`}
          >
            {locale === 'vi' ? 'Tổng quan' : 'Overview'}
          </button>
          {uniqueDays.map((day) => (
            <button
              key={day}
              ref={(el) => { daySelectorButtonRefs.current[String(day)] = el; }}
              onClick={() => setSelectedDay(day)}
              style={{ transition: 'color 300ms ease, transform 300ms ease' }}
              className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap z-10 font-bold active:scale-95 transition-all duration-300 ${
                selectedDay === day
                  ? 'text-white font-black scale-105'
                  : 'text-slate-700 hover:text-brand hover:scale-102'
              }`}
            >
              {locale === 'vi' ? `Ngày ${day}` : `Day ${day}`}
            </button>
          ))}
        </div>
      )}

      {/* Top Right Controls (Layers & Replay) */}
      <div className="absolute top-20 md:top-4 right-4 z-20 flex flex-row-reverse md:flex-col gap-3">
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setIsLayerMenuOpen(!isLayerMenuOpen); }}
            className="glass-button flex h-12 w-12 items-center justify-center rounded-full text-slate-700 transition-all hover:scale-110 hover:text-brand focus:outline-none"
          >
            <Layers className="h-6 w-6" />
          </button>
          
          {isLayerMenuOpen && (
            <div className="absolute top-full right-0 mt-3 w-[calc(100vw-32px)] sm:w-72 max-w-[288px] origin-top-right rounded-[2rem] glass-panel p-3 shadow-2xl animate-fade-in-down z-50" onClick={(e) => e.stopPropagation()}>
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

                {/* Chia sẻ vị trí của tôi */}
                <div onClick={async () => {
                  const newVal = !isSharingLocation;
                  setIsSharingLocation(newVal);
                  localStorage.setItem("share_my_location", newVal ? "true" : "false");
                  if (!newVal) {
                    try {
                      await locationService.stopLocationSharing();
                    } catch (err) {
                      console.warn("Failed to stop location sharing on backend:", err);
                    }
                  }
                }} className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${isSharingLocation ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}><MapPin className="w-5 h-5" /></div>
                    <span className="text-sm font-bold text-slate-800">Share My Location</span>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${isSharingLocation ? 'bg-red-500' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300 ${isSharingLocation ? 'translate-x-5' : 'translate-x-[2px]'}`} />
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
                <div>
                  <div onClick={() => setShowHeatmap(!showHeatmap)} className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl transition-colors ${showHeatmap ? 'bg-orange-100 text-orange-500' : 'bg-slate-100 text-slate-500'}`}><Flame className="w-5 h-5" /></div>
                      <span className="text-sm font-bold text-slate-800">Social Energy</span>
                    </div>
                    <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${showHeatmap ? 'bg-orange-500' : 'bg-slate-300'}`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300 ${showHeatmap ? 'translate-x-5' : 'translate-x-[2px]'}`} />
                    </div>
                  </div>

                  {showHeatmap && (
                    <div className="mt-1.5 flex gap-1.5 px-4 pb-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setHeatmapType('online'); }}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                          heatmapType === 'online'
                            ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm'
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100/50'
                        }`}
                      >
                        Online Users
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setHeatmapType('moments'); }}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                          heatmapType === 'moments'
                            ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm'
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100/50'
                        }`}
                      >
                        Popular Moments
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {isPostButtonHidden && onPostMomentClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPostButtonHidden(false);
              localStorage.setItem("post_button_hidden", "false");
              onPostMomentClick();
            }}
            className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white border-3 border-white shadow-[0_8px_25px_rgba(0,104,224,0.35)] transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer animate-in fade-in zoom-in-50 duration-200"
            title={t("social.postMoment") || "POST MOMENT"}
          >
            <Camera className="h-5.5 w-5.5 text-white" />
          </button>
        )}

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

        {/* Nút Hướng dẫn */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsGuideOpen(true);
          }}
          className="glass-button flex h-12 w-12 items-center justify-center rounded-full text-slate-700 transition-all hover:scale-110 hover:text-brand focus:outline-none"
          title={locale === 'vi' ? "Hướng dẫn sử dụng" : "User Guide"}
        >
          <HelpCircle className="h-6 w-6" />
        </button>
      </div>

      {/* Nút Điều hướng Nhanh (Góc dưới phải) */}
      <div 
        className={`absolute ${
          isReplayMode 
            ? (dockState === 'expanded' || !isSpecificTour ? 'bottom-[320px]' : 'bottom-[100px]') 
            : 'bottom-28'
        } right-4 z-20 flex flex-col gap-3 transition-all duration-300`}
      >
        {typeof navigator !== 'undefined' && 'geolocation' in navigator && (
          <button
            onClick={(e) => {
              e.stopPropagation();
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
            className="glass-button flex h-12 w-12 items-center justify-center rounded-full text-slate-700 bg-white/95 shadow-lg border border-slate-200/80 transition-all hover:scale-105 hover:text-brand focus:outline-none"
            title="Vị trí của bạn"
          >
            <Navigation className={`h-5 w-5 ${myLocation ? 'text-brand fill-current' : 'text-slate-600'}`} />
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
          <button 
            onClick={handleJumpToNewest} 
            disabled={points.length === 0}
            className={`glass-button flex items-center gap-2.5 rounded-full px-5 py-3 text-sm font-bold transition-all ${
              points.length === 0 
                ? 'opacity-40 cursor-not-allowed text-slate-400 bg-white/70' 
                : 'text-slate-800 hover:scale-105 active:scale-95'
            }`}
          >
            <Navigation className={`h-4 w-4 ${points.length === 0 ? 'text-slate-400' : 'text-brand'}`} />
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

      {/* Immersive Floating Post Moment Button (Matching Screenshot) */}
      {onPostMomentClick && !isReplayMode && !isPostButtonHidden && (
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onClick={(e) => { e.stopPropagation(); onPostMomentClick(); }}
          className="group absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5 cursor-pointer select-none transition-all duration-300 hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          {/* Circular Camera Button with White Ring */}
          <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-brand text-white border-4 border-white shadow-[0_8px_25px_rgba(0,104,224,0.35)] transition-all duration-300 group-hover:shadow-[0_12px_30px_rgba(0,104,224,0.5)] overflow-hidden">
            <Camera className="w-6.5 h-6.5 text-white" />
            <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping opacity-45 group-hover:opacity-0 delay-75"></div>
          </div>

          {/* Label Pill Card */}
          <div className="flex items-center gap-2 pl-3.5 pr-2 py-1 rounded-xl bg-white/95 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.12)] backdrop-blur-md">
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-700 whitespace-nowrap">
              {t("social.postMoment") || "POST MOMENT"}
            </span>
            
            <div className="h-3.5 w-[1px] bg-slate-200"></div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPostButtonHidden(true);
                localStorage.setItem("post_button_hidden", "true");
              }}
              className="flex items-center justify-center w-5 h-5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              title={t("social.hideButton") || (locale === 'vi' ? "Thu gọn" : "Collapse")}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
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
                     <div className="flex items-center gap-3 self-end sm:self-auto">
                       {!isReplayActive && (
                         <button onClick={() => { if (currentEventIndex >= timelineEvents.length - 1) { setCurrentEventIndex(0); } setIsPlaying(true); }} className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shadow-md hover:bg-brand-hover hover:scale-105 transition-all">
                            <Play className="w-4 h-4 ml-0.5 fill-current" />
                         </button>
                       )}
                       {isRecording ? (
                          <button onClick={stopRecording} title="Stop Recording" className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 animate-pulse transition-all">
                             <span className="w-3 h-3 bg-white rounded-sm"></span>
                          </button>
                        ) : (
                          <button onClick={startRecording} title="Export Journey Video" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                             <Film className="w-4 h-4" />
                          </button>
                        )}
                       <button onClick={() => { setIsReplayMode(false); setIsPlaying(false); }} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                          <X className="w-5 h-5" />
                       </button>
                     </div>
                  </div>

                  {/* Slider */}
                  <div className="w-full h-8 mb-4 group relative px-2">
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
                     {isRecording ? (
                        <button onClick={stopRecording} title="Stop Recording" className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 animate-pulse transition-all">
                           <span className="w-3 h-3 bg-white rounded-sm"></span>
                        </button>
                      ) : (
                        <button onClick={startRecording} title="Export Journey Video" className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors flex items-center justify-center">
                           <Film className="w-4 h-4" />
                        </button>
                      )}
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

      {/* Hướng dẫn sử dụng bản đồ (Map Guide Modal) */}
      {isGuideOpen && (
        <div className="absolute inset-0 z-[100] h-full w-full bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsGuideOpen(false)}>
          <div className="w-full max-w-lg glass-panel-dark text-white rounded-3xl p-6 shadow-2xl relative animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setIsGuideOpen(false)} 
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-center mb-6 bg-gradient-to-r from-brand-light to-cyan-300 bg-clip-text text-transparent uppercase tracking-wider">
              🗺️ {locale === 'vi' ? "Hướng dẫn sử dụng Bản đồ" : "Map Features Guide"}
            </h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-sm leading-relaxed">
              <div className="flex gap-4.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="p-2.5 h-10 w-10 bg-brand/20 text-brand rounded-xl flex items-center justify-center shrink-0"><MapPin className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-bold text-slate-100">{locale === 'vi' ? "Chia sẻ vị trí" : "Share Live Location"}</h4>
                  <p className="text-xs text-slate-400 mt-1">{locale === 'vi' ? "Tạo và gửi liên kết (qua Chat hoặc sao chép) để bạn bè và người thân có thể theo dõi hành trình của bạn trong vòng 24 giờ." : "Generate and copy or send a live tracking link so friends and family can view your movements on the map for 24 hours."}</p>
                </div>
              </div>
              <div className="flex gap-4.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="p-2.5 h-10 w-10 bg-pink-500/20 text-pink-400 rounded-xl flex items-center justify-center shrink-0"><Camera className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-bold text-slate-100">{locale === 'vi' ? "Khoảnh khắc & Ảnh mới nhất" : "Moments & Latest Photo"}</h4>
                  <p className="text-xs text-slate-400 mt-1">{locale === 'vi' ? "Các bức ảnh được chụp kèm tọa độ GPS sẽ hiển thị dưới dạng ghim. Nút 'Ảnh mới nhất' giúp bạn nhảy nhanh camera đến vị trí ảnh mới được đăng." : "Photos posted with GPS tags show up as markers. The 'Latest Photo' button dynamically pans the camera to focus on the newest moment."}</p>
                </div>
              </div>
              <div className="flex gap-4.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="p-2.5 h-10 w-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center shrink-0"><Compass className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-bold text-slate-100">{locale === 'vi' ? "Lộ trình theo ngày" : "Itinerary by Day"}</h4>
                  <p className="text-xs text-slate-400 mt-1">{locale === 'vi' ? "Thanh điều hướng ngày ở phía trên cho phép bạn lọc lộ trình, danh sách điểm dừng và đường vẽ hành trình theo từng ngày cụ thể của tour." : "The top day navigation bar lets you filter route paths, stop waypoints, and polylines for each individual day of your tour schedule."}</p>
                </div>
              </div>
              <div className="flex gap-4.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="p-2.5 h-10 w-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0"><Layers className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-bold text-slate-100">{locale === 'vi' ? "Bật/Tắt Lớp Bản đồ (Layers)" : "Map Layers Menu"}</h4>
                  <p className="text-xs text-slate-400 mt-1">{locale === 'vi' ? "Ẩn hoặc hiện các thông tin bổ sung: Lộ trình tour, Khoảnh khắc du lịch, Vị trí bạn bè trực tuyến, Dấu chân cá nhân (Fog of War) và Bản đồ nhiệt (Heatmap)." : "Show or hide specific details: Tour Route path, Check-in Moments, Live Friend Locations, Footprints (Fog of War) and Social Energy Heatmap."}</p>
                </div>
              </div>
              <div className="flex gap-4.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="p-2.5 h-10 w-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center shrink-0"><History className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-bold text-slate-100">{locale === 'vi' ? "Tua lại hành trình (Timeline Replay)" : "Timeline Replay Dock"}</h4>
                  <p className="text-xs text-slate-400 mt-1">{locale === 'vi' ? "Nhấn nút Lịch sử ở góc phải để mở bảng điều khiển tua hành trình. Bạn có thể bấm Phát để camera bay tự động dọc các sự kiện theo đúng thứ tự thời gian." : "Click the history icon to open the timeline playback controller. Click Play to watch the camera dynamically trace and fly along stop events chronologically."}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsGuideOpen(false)}
              className="mt-6 w-full py-3 bg-brand text-white font-bold rounded-2xl shadow-lg hover:bg-brand-hover active:scale-[0.98] transition-all text-center"
            >
              {locale === 'vi' ? "Đã hiểu" : "Got It"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};