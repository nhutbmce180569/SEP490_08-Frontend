import React, { useState, useRef, useCallback, useMemo, useEffect, useContext } from "react";
import Map, { Marker, Source, Layer, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import useSupercluster from "use-supercluster";
import { Users, X, Camera, Layers, Navigation, Compass, MapPin, Play, Pause, SkipForward, SkipBack, History, Flame, Film, HelpCircle, ChevronDown, Sparkles } from "lucide-react";
import type { Moment } from "../../moments/types/moment.type";
import { useGetMomentFeed, useGetMyFootprints, useGetHeatmap } from "../../moments/hooks/useMoments";
import { useGetScheduleLiveLocations, useGetTourRouteData } from "../hooks/useScheduleTracking";
import { MomentCard } from "../../moments/components/MomentCard";
import * as signalR from '@microsoft/signalr';
import { SIGNALR_HUB_BASE } from "../../../../config/api/api";
import { locationService } from "../../locations/services/locationService";
import { useTranslation } from "../../../../contexts/LocaleContext";
import { getStoredLocale } from "../../../../i18n";
import { AuthContext } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";
import { FogOfWarCanvas } from "../../moments/components/FogOfWarCanvas";
import { ticketService } from "../../../booking/services/ticket.service";

const SafeImage = ({ src, alt, className, fallbackText, fallbackClassName }: any) => {
  const [hasError, setHasError] = useState(false);
  if (hasError || !src) {
    return <div className={fallbackClassName}>{fallbackText}</div>;
  }
  return <img src={src} alt={alt} className={className} onError={() => setHasError(true)} loading="lazy" decoding="async" />;
};

interface StaffMomentsMapFeedProps {
  scheduleId: number;
  onMarkerClick: (momentId: number) => void;
  onReplayStateChange?: (isActive: boolean) => void;
  onPostMomentClick?: () => void;
  hideAdvancedFeatures?: boolean;
}

export const StaffMomentsMapFeed: React.FC<StaffMomentsMapFeedProps> = ({
  scheduleId,
  onMarkerClick,
  onReplayStateChange,
  onPostMomentClick,
  hideAdvancedFeatures = false,
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
  // Temporarily disable footprints and heatmap on Staff side to prevent 403 errors
  const footprints = useMemo<any[]>(() => [], []);
  const heatmapData = useMemo<any[]>(() => [], []);
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
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [scheduleCustomers, setScheduleCustomers] = useState<any[]>([]);

  useEffect(() => {
    if (scheduleId > 0) {
      ticketService.getByScheduleId(scheduleId).then((tickets) => {
        const uniqueCustomers = new globalThis.Map<number, any>();
        tickets.forEach(t => {
          if (t.userId) {
            uniqueCustomers.set(t.userId, {
              userId: t.userId,
              fullName: t.attendeeName || "Customer",
              avatarUrl: null,
              role: "Customer"
            });
          }
        });
        setScheduleCustomers(Array.from(uniqueCustomers.values()));
      }).catch(err => {
        console.warn("Failed to get tickets for customers list", err);
      });
    }
  }, [scheduleId]);

  const combinedMemberList = useMemo(() => {
    const list: any[] = [];
    scheduleMemberLocations.forEach(m => {
      list.push({ ...m, isOnline: true });
    });
    scheduleCustomers.forEach(c => {
      if (!list.some(m => String(m.userId) === String(c.userId))) {
        list.push({ ...c, isOnline: false, lat: null, lng: null });
      }
    });
    return list;
  }, [scheduleMemberLocations, scheduleCustomers]);

  // Sliding Day Selector indicator refs and style state
  const daySelectorContainerRef = useRef<HTMLDivElement>(null);
  const daySelectorButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [daySelectorPillStyle, setDaySelectorPillStyle] = useState<React.CSSProperties>({ opacity: 0 });

  // --- TIMELINE REPLAY STATES & CARD SWIPE GESTURES ---
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  const [dragX, setDragX] = useState(0);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const touchStartXRef = useRef<number>(0);

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
        } catch { }
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

        connection.on("ForceStopTracking", (activePlatform: string) => {
          if (isCancelled) return;
          if (activePlatform === "Mobile") {
            setIsSharingLocation(false);
            toastError(locale === 'vi' ? "Vị trí đang được chia sẻ ưu tiên trên Mobile. Đã tự động tắt trên Web." : "Mobile is currently sharing location. Web tracking stopped to yield priority.");
          }
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
        connection.off("ForceStopTracking");
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
            .catch((err) => {
              if (err.response?.status === 409) {
                setIsSharingLocation(false);
                toastError(locale === 'vi' ? "Vị trí đang được chia sẻ ưu tiên trên Mobile. Đã tự động tắt trên Web." : "Mobile is currently sharing location. Web tracking stopped to yield priority.");
              } else {
                console.warn("Lỗi ping vị trí:", err);
              }
            });
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
    const startPromise = connection.start();

    startPromise
      .then(async () => {
        if (isCancelled) {
          connection.stop().catch(() => { });
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
      startPromise
        .then(() => {
          if (connection.state === signalR.HubConnectionState.Connected) {
            connection.stop().catch(() => { });
          }
        })
        .catch(() => { });
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
    if (isMemberListOpen) setIsMemberListOpen(false);
  };

  // --- TIMELINE REPLAY LOGIC ---
  const timelineEvents = useMemo(() => {
    const events: any[] = [];

    // 1. Add moment posts as primary timeline events
    const momentsArray = Array.isArray(moments) ? moments : ((moments as any)?.pages?.flat() || []);
    momentsArray.forEach((m: any) => {
      if (m.lat != null && m.lng != null && m.createdAt) {
        const uName = m.user?.fullName || m.User?.FullName || m.fullName || 'Someone';
        events.push({
          id: `moment-${m.id || m.Id}`,
          type: 'moment',
          momentId: m.id || m.Id,
          time: new Date(m.createdAt || m.CreatedAt).getTime(),
          lat: Number(m.lat || m.Lat),
          lng: Number(m.lng || m.Lng),
          data: m,
          title: m.caption ? `📸 ${m.caption}` : `Moment by ${uName}`,
          desc: m.locationName || `Shared by ${uName}`,
          imageUrl: m.imageUrl || m.ImageUrl
        });
      }
    });

    // 2. If viewing a specific tour and no moments exist for it, fallback to tour itinerary waypoints as timeline events
    if (isSpecificTour && events.length === 0 && tourStops && tourStops.length > 0) {
      const baseTime = Date.now() - 86400000;
      tourStops.forEach((stop: any, idx: number) => {
        events.push({
          id: `stop-${stop.sequence || idx}`,
          type: idx === 0 ? 'start' : idx === tourStops.length - 1 ? 'end' : 'stop',
          momentId: null,
          time: baseTime + idx * 3600000,
          lat: Number(stop.lat),
          lng: Number(stop.lng),
          data: stop,
          title: stop.name || `Waypoint ${stop.sequence || idx + 1}`,
          desc: stop.description || `Tour Stop #${stop.sequence || idx + 1}`,
          imageUrl: stop.imageUrl || null
        });
      });
    }

    events.sort((a, b) => a.time - b.time);
    return events;
  }, [isSpecificTour, moments, tourStops]);

  // --- CARD DECK SHUFFLE & SWIPE GESTURES ---
  const [cardAnimDirection, setCardAnimDirection] = useState<'next' | 'prev'>('next');
  const prevEventIndexRef = useRef<number>(0);

  useEffect(() => {
    if (currentEventIndex !== prevEventIndexRef.current) {
      if (
        currentEventIndex > prevEventIndexRef.current ||
        (prevEventIndexRef.current === timelineEvents.length - 1 && currentEventIndex === 0)
      ) {
        setCardAnimDirection('next');
      } else {
        setCardAnimDirection('prev');
      }
      prevEventIndexRef.current = currentEventIndex;
    }
  }, [currentEventIndex, timelineEvents.length]);

  const handleNextCard = useCallback(() => {
    if (timelineEvents.length === 0) return;
    setCardAnimDirection('next');
    setCurrentEventIndex((prev) => (prev + 1) % timelineEvents.length);
  }, [timelineEvents.length]);

  const handlePrevCard = useCallback(() => {
    if (timelineEvents.length === 0) return;
    setCardAnimDirection('prev');
    setCurrentEventIndex((prev) => (prev - 1 + timelineEvents.length) % timelineEvents.length);
  }, [timelineEvents.length]);

  const handleCardDragStart = (clientX: number) => {
    setIsDraggingCard(true);
    touchStartXRef.current = clientX;
  };

  const handleCardDragMove = (clientX: number) => {
    if (!isDraggingCard) return;
    const delta = clientX - touchStartXRef.current;
    setDragX(delta);
  };

  const handleCardDragEnd = () => {
    if (!isDraggingCard) return;
    setIsDraggingCard(false);
    if (dragX < -60) {
      handleNextCard();
    } else if (dragX > 60) {
      handlePrevCard();
    }
    setDragX(0);
  };

  // --- STATE TRANSITION LOGIC ---
  const isReplayActive = isReplayMode && dockState === 'expanded' && (
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

  // Stream & Recording state refs
  const displayStreamRef = useRef<MediaStream | null>(null);

  // Recording helper functions (HD Screen & Live DOM Capture Engine)
  const startRecording = async () => {
    if (timelineEvents.length === 0) return;

    setCurrentEventIndex(0);
    recordedChunksRef.current = [];

    let stream: MediaStream | null = null;

    // 1. Try Live Tab Screen Capture API (Captures 100% of DOM: Map + Floating Polaroid Deck Cards + Captions at 60FPS)
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "browser",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 60 }
          },
          audio: false
        } as any);
        displayStreamRef.current = stream;
      } catch (err) {
        console.warn("Screen capture prompt dismissed or unsupported, falling back to Map Canvas stream", err);
      }
    }

    // 2. Fallback to Mapbox Canvas Stream with High Bitrate
    if (!stream) {
      const canvas = document.querySelector('.mapboxgl-canvas') as HTMLCanvasElement;
      if (!canvas) {
        toastError(locale === 'vi' ? 'Không tìm thấy Map Canvas' : 'Mapbox canvas element not found');
        return;
      }
      stream = canvas.captureStream(60); // 60 FPS
    }

    try {
      // 8 Mbps High Bitrate for Crisp 1080p HD Quality!
      let mimeType = 'video/webm; codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      const options: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: 8000000
      };

      const recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (displayStreamRef.current) {
          displayStreamRef.current.getTracks().forEach((track) => track.stop());
          displayStreamRef.current = null;
        }

        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `stayhub_journey_${scheduleId || "general"}.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        success(locale === 'vi' ? 'Đã tải xuống Video Hành Trình HD chất lượng cao!' : 'High-Quality HD Journey Video downloaded successfully!');
      };

      // Auto stop recording if user ends stream via browser bar
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopRecording();
        };
      }

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // Collect 1s chunks
      setIsRecording(true);
      setIsPlaying(true);
      setIsReplayMode(true);
      setDockState('expanded');

      success(locale === 'vi' ? 'Đang ghi hình video lộ trình HD...' : 'Recording HD Journey Video...');
    } catch (err) {
      console.error("Failed to start recording", err);
      toastError(locale === 'vi' ? 'Khởi tạo ghi hình thất bại.' : 'Failed to start video recording.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((track) => track.stop());
      displayStreamRef.current = null;
    }
    setIsRecording(false);
    setIsPlaying(false);
  };

  // Cinematic camera movement (Smooth & Non-flickering)
  const lastFlownIndexRef = useRef<number>(-1);
  useEffect(() => {
    if (isReplayMode && timelineEvents.length > 0 && mapRef.current) {
      if (lastFlownIndexRef.current === currentEventIndex) return;
      const event = timelineEvents[currentEventIndex];
      if (event && !isNaN(event.lng) && !isNaN(event.lat)) {
        lastFlownIndexRef.current = currentEventIndex;
        mapRef.current.flyTo({
          center: [event.lng, event.lat],
          zoom: 15.5,
          duration: 1000,
          essential: true
        });
      }
    }
  }, [currentEventIndex, isReplayMode, timelineEvents]);

  // --- FOG OF WAR FOOTPRINTS (Purple cloud canvas overlay) ---
  const validFootprints = useMemo(() => {
    const raw = (dynamicFootprints || []).filter(
      (f: any) => typeof f.lat === "number" && typeof f.lng === "number"
    );

    // --- TẠO DỮ LIỆU DẤU CHÂN "THAM QUAN" THỰC TẾ ---
    // Khắc phục tình trạng "chim bay thẳng", giả lập người dùng đi bộ khám phá
    // xung quanh các điểm du lịch (random walk) và di chuyển dọc theo tuyến đường.
    const mock: { lat: number, lng: number }[] = [];
    if (routeCoordinates && routeCoordinates.length > 0 && tourStops && tourStops.length > 0) {
      // 1. Đi dọc theo tuyến đường chính
      routeCoordinates.forEach(coord => mock.push({ lat: coord[1], lng: coord[0] }));

      // 2. Giả lập đi bộ khám phá xung quanh mỗi điểm dừng (Random Walk)
      tourStops.forEach((stop: any) => {
        let cLat = stop.lat;
        let cLng = stop.lng;
        let cAngle = Math.random() * Math.PI * 2;

        // 40 bước chân khám phá ngõ hẻm quanh điểm đến
        for (let i = 0; i < 40; i++) {
          mock.push({ lat: cLat, lng: cLng });

          // Đổi hướng ngẫu nhiên (giống như quẹo các góc phố)
          cAngle += (Math.random() - 0.5) * 1.5;

          // Khoảng cách mỗi bước ~20m - 50m (tính theo độ)
          const dist = 0.0002 + Math.random() * 0.0003;
          cLat += Math.sin(cAngle) * dist;
          cLng += Math.cos(cAngle) * dist;

          // Vòng giới hạn: không đi lạc quá xa khỏi điểm tham quan (~500m)
          const distSq = (cLat - stop.lat) ** 2 + (cLng - stop.lng) ** 2;
          if (distSq > 0.00003) {
            cAngle += Math.PI; // Quay đầu lại
          }
        }
      });
    }

    return [...raw, ...mock];
  }, [dynamicFootprints, routeCoordinates, tourStops]);

  // GeoJSON for the small glowing visited-location pins (still rendered inside Map)
  const footprintPointsGeoJSON = useMemo(() => {
    if (validFootprints.length === 0) return { type: "FeatureCollection" as const, features: [] };
    return {
      type: "FeatureCollection" as const,
      features: validFootprints.map((fp, idx) => ({
        type: "Feature" as const,
        properties: { id: idx },
        geometry: { type: "Point" as const, coordinates: [fp.lng, fp.lat] },
      })),
    };
  }, [validFootprints]);

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
            cluster: false,
            momentId: m.id || m.Id,
            userId: m.userId || userObj.id || 0,
            avatarUrl: userObj.avatarUrl || m.avatarUrl || null,
            imageUrl: m.imageUrl || m.ImageUrl || null,
            userFullName: userObj.fullName || m.fullName || "?",
            rawMoment: m
          },
          geometry: { type: "Point" as const, coordinates: [Number(m.lng || m.Lng), Number(m.lat || m.Lat)] },
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
      <div className="w-full h-full flex items-center justify-center bg-slate-100">
        <div className="animate-spin w-10 h-10 border-4 border-brand border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100">
      <Map
        ref={mapRef}
        initialViewState={viewState}
        onMove={handleMapMove}
        onLoad={onMapLoad}
        mapboxAccessToken={apiKey}
        mapStyle={isNightMode ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v12"}
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
            {/* Lớp Tuyến đường bộ (Tour Route) - Rendered via Mapbox only when Fog is OFF */}
            {showTourRoute && !showFootprints && routeCoordinates.length > 0 && (
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

            {/* FOG OF WAR pins removed – canvas overlay handles visuals */}

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

              const { cluster: isCluster, point_count: pointCount } = cluster.properties;

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
                  const cImageUrl = firstLeaf?.properties.imageUrl || cAvatarUrl;
                  const cUserFullName = firstLeaf?.properties.userFullName;
                  const userInitial = cUserFullName ? cUserFullName.charAt(0).toUpperCase() : "?";

                  return (
                    <Marker key={`cluster-${cluster.id}`} longitude={longitude} latitude={latitude} anchor="bottom">
                      <div className="relative group cursor-pointer transform transition-all duration-400 hover:scale-110 hover:-translate-y-2 origin-bottom" onClick={handleClusterClick}>
                        <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-2xl border-[3px] border-white bg-white shadow-[0_8px_20px_rgba(0,0,0,0.15)] overflow-hidden">
                          <SafeImage src={cImageUrl} alt="Moment" className="w-full h-full object-cover" fallbackClassName="w-full h-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-400" fallbackText={userInitial} />
                        </div>
                        <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center !rounded-full bg-rose-500 text-xs font-bold text-white border-2 border-white shadow-md z-20">
                          {pointCount >= 100 ? "100+" : pointCount >= 10 ? "10+" : pointCount}
                        </span>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r-[3px] border-b-[3px] border-white shadow-[4px_4px_8px_rgba(0,0,0,0.1)] z-0"></div>
                      </div>
                    </Marker>
                  );
                } else {
                  return (
                    <Marker key={`cluster-${cluster.id}`} longitude={longitude} latitude={latitude} anchor="center">
                      <div className="group relative flex items-center justify-center w-14 h-14 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.2)] border-[3px] border-white cursor-pointer transform transition-all duration-400 hover:scale-110 bg-gradient-to-br from-brand to-cyan-400" onClick={handleClusterClick}>
                        <Users className="w-6 h-6 text-white" />
                        <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center !rounded-full bg-rose-500 text-xs font-bold text-white border-2 border-white shadow-md z-20">
                          {pointCount >= 100 ? "100+" : pointCount >= 10 ? "10+" : pointCount}
                        </span>
                        <div className="absolute inset-0 rounded-full border-[3px] border-white animate-ping opacity-30 group-hover:opacity-60 pointer-events-none"></div>
                      </div>
                    </Marker>
                  );
                }
              }

              const { momentId, avatarUrl, imageUrl, userFullName } = cluster.properties;
              const momentPhoto = imageUrl || avatarUrl;
              const userInitial = userFullName ? userFullName.charAt(0).toUpperCase() : "?";

              return (
                <Marker key={`moment-${momentId}`} longitude={longitude} latitude={latitude} anchor="bottom">
                  <div className="relative group cursor-pointer transform transition-all duration-400 hover:scale-110 hover:-translate-y-2 origin-bottom" onClick={(e) => { e.stopPropagation(); onMarkerClick(momentId); }}>
                    <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-2xl border-[3px] border-white bg-white shadow-[0_8px_20px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-300 group-hover:rounded-xl group-hover:shadow-[0_12px_25px_rgba(0,0,0,0.2)]">
                      <SafeImage src={momentPhoto} alt="Moment" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" fallbackClassName="w-full h-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-400" fallbackText={userInitial} />
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

      {/* ===== FOG OF WAR – Canvas cloud overlay (sits on top of Map, below UI) ===== */}
      <FogOfWarCanvas
        mapRef={mapRef}
        footprints={validFootprints}
        visible={showFootprints}
        routeCoordinates={routeCoordinates}
        showTourRoute={showTourRoute}
      />



      {uniqueDays.length > 0 && (
        <div
          ref={daySelectorContainerRef}
          className="absolute top-[72px] sm:top-[88px] md:top-20 left-1/2 -translate-x-1/2 z-10 flex gap-2 glass-panel p-1.5 rounded-full shadow-lg animate-[fadeIn_0.5s_ease] max-w-[95vw] sm:max-w-[90vw] overflow-x-auto"
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
            className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap z-10 font-bold active:scale-95 transition-all duration-300 ${selectedDay === 'ALL'
              ? 'text-white font-black scale-105 bg-gradient-to-r from-brand to-cyan-500 shadow-sm'
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
              className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap z-10 font-bold active:scale-95 transition-all duration-300 ${selectedDay === day
                ? 'text-white font-black scale-105'
                : 'text-slate-700 hover:text-brand hover:scale-102'
                }`}
            >
              {locale === 'vi' ? `Ngày ${day}` : `Day ${day}`}
            </button>
          ))}
        </div>
      )}

      {/* Top Right Controls (Layers & Replay & Guide) */}
      <div className="absolute top-[124px] md:top-4 right-4 z-20 flex flex-col gap-3">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isLayerMenuOpen) setIsReplayMode(false);
              setIsGuideOpen(false);
              setIsMemberListOpen(false);
              setIsLayerMenuOpen(!isLayerMenuOpen);
            }}
            className="glass-button flex h-12 w-12 items-center justify-center rounded-full text-slate-700 transition-all hover:scale-110 hover:text-brand focus:outline-none shadow-md"
            title={t("social.mapLayerMoments") || "Map Layers"}
          >
            <Layers className="h-6 w-6" />
          </button>

          {isLayerMenuOpen && (
            <div className="absolute top-0 right-14 w-[calc(100vw-80px)] sm:w-72 max-w-[288px] origin-top-right rounded-[1.5rem] sm:rounded-[2rem] glass-panel p-2 sm:p-3 shadow-2xl animate-fade-in-down z-50" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col gap-1">
                {/* Lộ trình hành trình */}
                <div onClick={() => setShowTourRoute(!showTourRoute)} className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl hover:bg-white/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${showTourRoute ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}><Compass className="w-5 h-5" /></div>
                    <span className="text-sm font-bold text-slate-800">Tour Route</span>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${showTourRoute ? 'bg-brand' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300 ${showTourRoute ? 'translate-x-5' : 'translate-x-[2px]'}`} />
                  </div>
                </div>

                {/* Khoảnh khắc */}
                <div onClick={() => setShowMoments(!showMoments)} className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl hover:bg-white/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${showMoments ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-500'}`}><Camera className="w-5 h-5" /></div>
                    <span className="text-sm font-bold text-slate-800">{t("social.mapLayerMoments")}</span>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${showMoments ? 'bg-brand' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300 ${showMoments ? 'translate-x-5' : 'translate-x-[2px]'}`} />
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
                }} className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl hover:bg-white/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${isSharingLocation ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}><MapPin className="w-5 h-5" /></div>
                    <span className="text-sm font-bold text-slate-800">Share My Location</span>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${isSharingLocation ? 'bg-red-500' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300 ${isSharingLocation ? 'translate-x-5' : 'translate-x-[2px]'}`} />
                  </div>
                </div>

                {/* Dấu chân (Fog of War) */}
                {!hideAdvancedFeatures && (
                  <div onClick={() => setShowFootprints(!showFootprints)} className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl hover:bg-white/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`p-2 rounded-xl transition-colors ${showFootprints ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}><Layers className="w-5 h-5" /></div>
                      <span className="text-sm font-bold text-slate-800">{t("social.mapLayerFootprints")}</span>
                    </div>
                    <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${showFootprints ? 'bg-brand' : 'bg-slate-300'}`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300 ${showFootprints ? 'translate-x-5' : 'translate-x-[2px]'}`} />
                    </div>
                  </div>
                )}

                {/* Heatmap (Social Energy) */}
                {!hideAdvancedFeatures && (
                  <div>
                    <div onClick={() => setShowHeatmap(!showHeatmap)} className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl hover:bg-white/50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`p-2 rounded-xl transition-colors ${showHeatmap ? 'bg-orange-100 text-orange-500' : 'bg-slate-100 text-slate-500'}`}><Flame className="w-5 h-5" /></div>
                        <span className="text-sm font-bold text-slate-800">Social Energy</span>
                      </div>
                      <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${showHeatmap ? 'bg-orange-500' : 'bg-slate-300'}`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300 ${showHeatmap ? 'translate-x-5' : 'translate-x-[2px]'}`} />
                      </div>
                    </div>

                    {/* Heatmap Type Sub-options */}
                    {showHeatmap && (
                      <div className="pl-14 pr-4 pb-3 flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setHeatmapType('online'); }}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${heatmapType === 'online'
                            ? 'bg-orange-100 text-orange-600 border border-orange-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          Online
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setHeatmapType('moments'); }}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${heatmapType === 'moments'
                            ? 'bg-rose-100 text-rose-600 border border-rose-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Moments
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
        {!hideAdvancedFeatures && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLayerMenuOpen(false);
              setIsMemberListOpen(false);
              setIsReplayMode(!isReplayMode);
              if (isSpecificTour) setIsPlaying(!isReplayMode);
              setCurrentEventIndex(0);
              setDockState('expanded');
            }}
            className={`glass-button flex h-12 w-12 items-center justify-center rounded-full transition-all hover:scale-110 focus:outline-none shadow-md ${isReplayMode ? 'bg-brand !text-white border-none' : 'text-slate-700 hover:text-brand'}`}
            title="Timeline Replay"
          >
            <div className="relative">
              {isReplayMode ? (
                <Pause className="h-6 w-6" fill="currentColor" />
              ) : (
                <History className="h-6 w-6" />
              )}
              {isReplayMode && (
                <div className="absolute inset-0 animate-ping rounded-full border-2 border-white opacity-50" />
              )}
            </div>
          </button>
        )}

        {/* Nút Hướng dẫn */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLayerMenuOpen(false);
            setIsMemberListOpen(false);
            setIsGuideOpen(true);
          }}
          className="glass-button flex h-12 w-12 items-center justify-center rounded-full text-slate-700 transition-all hover:scale-110 hover:text-brand focus:outline-none"
          title={locale === 'vi' ? "Hướng dẫn sử dụng" : "User Guide"}
        >
          <HelpCircle className="h-6 w-6" />
        </button>

        {/* Nút Danh sách thành viên (Customer List) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLayerMenuOpen(false);
            setIsGuideOpen(false);
            setIsMemberListOpen(!isMemberListOpen);
          }}
          className={`glass-button flex h-12 w-12 items-center justify-center rounded-full transition-all hover:scale-110 focus:outline-none shadow-md ${isMemberListOpen ? 'bg-brand !text-white border-none' : 'text-slate-700 hover:text-brand'}`}
          title={locale === 'vi' ? "Danh sách thành viên" : "Member List"}
        >
          <Users className="h-6 w-6" />
        </button>

        {isMemberListOpen && (
          <div className="absolute top-0 right-14 w-[calc(100vw-80px)] sm:w-72 max-w-[288px] origin-top-right rounded-[1.5rem] sm:rounded-[2rem] glass-panel p-2 sm:p-3 shadow-2xl animate-fade-in-down z-50" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 px-2 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800">{locale === 'vi' ? "Danh sách thành viên" : "Member List"}</h4>
            </div>
            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar">
              {combinedMemberList.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500">
                  {locale === 'vi' ? "Không có thành viên nào" : "No members found"}
                </div>
              ) : (
                combinedMemberList.map((member) => (
                  <div
                    key={member.userId}
                    onClick={() => {
                      if (member.isOnline && member.lng && member.lat && mapRef.current) {
                        mapRef.current.flyTo({ center: [member.lng, member.lat], zoom: 16, duration: 1000 });
                        setIsMemberListOpen(false);
                      } else if (!member.isOnline) {
                        toastError(locale === 'vi' ? "Khách hàng này đang offline nên không có vị trí" : "This customer is offline, no location available");
                      }
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${member.isOnline ? 'hover:bg-white/50 cursor-pointer' : 'opacity-70 hover:bg-white/30 cursor-pointer'}`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 border border-white shrink-0">
                      <SafeImage
                        src={member.avatarUrl}
                        alt={member.fullName}
                        className={`w-full h-full object-cover ${!member.isOnline ? 'grayscale' : ''}`}
                        fallbackClassName={`w-full h-full flex items-center justify-center ${member.isOnline ? 'bg-brand' : 'bg-slate-400'} text-white text-xs font-bold`}
                        fallbackText={member.fullName?.charAt(0) || "U"}
                      />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-bold text-slate-800 truncate">{member.fullName || "User"}</span>
                      {member.role === "Staff" && (
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Staff</span>
                      )}
                      {!member.isOnline && (
                        <span className="text-[10px] font-medium text-slate-400">Offline</span>
                      )}
                    </div>
                    {member.isOnline && (
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)] shrink-0"></div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Nút Điều hướng Nhanh & Ảnh mới nhất (Góc dưới trái) */}
      <div className="absolute bottom-6 left-4 z-20 flex flex-col gap-2.5">
        {!isReplayMode && (
          <button
            onClick={handleJumpToNewest}
            disabled={points.length === 0}
            className={`glass-button flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition-all shadow-md ${points.length === 0
              ? 'opacity-40 cursor-not-allowed text-slate-400 bg-white/70 dark:bg-slate-800/70'
              : 'text-slate-800 dark:text-slate-100 hover:scale-105 active:scale-95 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800'
              }`}
          >
            <Navigation className={`h-4 w-4 ${points.length === 0 ? 'text-slate-400' : 'text-brand'}`} />
            {t("social.mapNewestPhoto")}
          </button>
        )}
      </div>

      {/* Floating Location Buttons (Lower Right) */}
      <div
        className={`absolute ${isReplayMode
          ? (dockState === 'expanded' || !isSpecificTour ? 'bottom-[230px]' : 'bottom-[90px]')
          : 'bottom-6'
          } right-4 z-20 flex flex-col gap-2.5 transition-all duration-300`}
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
            className="glass-button flex h-11 w-11 items-center justify-center rounded-full text-slate-700 dark:text-slate-200 bg-white/95 dark:bg-slate-900/95 shadow-md border border-slate-200/80 dark:border-slate-800 transition-all hover:scale-105 hover:text-brand dark:hover:text-brand focus:outline-none backdrop-blur-md"
            title="Vị trí của bạn"
          >
            <Navigation className={`h-4.5 w-4.5 ${myLocation ? 'text-brand fill-current' : 'text-slate-600 dark:text-slate-300'}`} />
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
            className="glass-button flex h-11 w-11 items-center justify-center rounded-full text-slate-700 dark:text-slate-200 bg-white/95 dark:bg-slate-900/95 shadow-md border border-slate-200/80 dark:border-slate-800 transition-all hover:scale-105 hover:text-brand dark:hover:text-brand focus:outline-none backdrop-blur-md"
            title="Tiêu điểm Tour"
          >
            <Compass className="h-4.5 w-4.5" />
          </button>
        )}
      </div>



      {/* Immersive Floating Post Moment Button (Clean Icon Only) */}
      {onPostMomentClick && !isReplayMode && !isPostButtonHidden && (
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onClick={(e) => { e.stopPropagation(); onPostMomentClick(); }}
          className="group absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center cursor-pointer select-none transition-all duration-300 hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-5 duration-300"
          title={t("social.postMoment") || "POST MOMENT"}
        >
          <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-brand text-white border-4 border-white shadow-[0_8px_25px_rgba(0,104,224,0.35)] transition-all duration-300 group-hover:shadow-[0_12px_30px_rgba(0,104,224,0.5)] overflow-hidden">
            <Camera className="w-6.5 h-6.5 text-white" />
          </div>
        </div>
      )}

      {/* 📸 Floating Polaroid Photo Deck Stack (Cọc Ảnh Polaroid Chữ Viết Tay & Card Shuffling Swipe Gestures) */}
      {isReplayMode && timelineEvents.length > 0 && (
        <div className="absolute right-1/2 translate-x-1/2 md:translate-x-0 md:right-4 bottom-[8.5rem] md:bottom-auto md:top-16 z-30 w-[85vw] sm:w-80 pointer-events-auto transition-all duration-500 ease-out select-none">
          <div className="relative group">

            {/* Background Card Layer 2 (Bottom photo peeking out of deck) */}
            {timelineEvents[(currentEventIndex + 2) % timelineEvents.length] && (
              <div className="absolute inset-0 bg-white/70 rounded-3xl p-3 shadow-md transform rotate-[-6deg] translate-y-3 translate-x-2 border border-slate-200/60 pointer-events-none transition-transform duration-500">
                <div className="w-full h-36 rounded-2xl bg-slate-200 overflow-hidden opacity-50">
                  <SafeImage src={timelineEvents[(currentEventIndex + 2) % timelineEvents.length].imageUrl} alt="Stacked" className="w-full h-full object-cover" fallbackClassName="w-full h-full bg-slate-300" fallbackText="" />
                </div>
              </div>
            )}

            {/* Background Card Layer 1 (Middle photo peeking out of deck) */}
            {timelineEvents[(currentEventIndex + 1) % timelineEvents.length] && (
              <div className="absolute inset-0 bg-white/90 rounded-3xl p-3 shadow-lg transform rotate-[4deg] translate-y-1.5 translate-x-1 border border-slate-200/80 pointer-events-none transition-transform duration-500">
                <div className="w-full h-36 rounded-2xl bg-slate-200 overflow-hidden opacity-70">
                  <SafeImage src={timelineEvents[(currentEventIndex + 1) % timelineEvents.length].imageUrl} alt="Stacked" className="w-full h-full object-cover" fallbackClassName="w-full h-full bg-slate-300" fallbackText="" />
                </div>
              </div>
            )}

            {/* Front Active Polaroid Photo Card (Shuffles automatically on Play or drag left/right to swipe) */}
            <div
              key={`deck-card-${currentEventIndex}`}
              onMouseDown={(e) => handleCardDragStart(e.clientX)}
              onMouseMove={(e) => handleCardDragMove(e.clientX)}
              onMouseUp={handleCardDragEnd}
              onMouseLeave={handleCardDragEnd}
              onTouchStart={(e) => handleCardDragStart(e.touches[0].clientX)}
              onTouchMove={(e) => handleCardDragMove(e.touches[0].clientX)}
              onTouchEnd={handleCardDragEnd}
              style={{
                transform: `translateX(${dragX}px) rotate(${dragX * 0.08}deg)`,
                transition: isDraggingCard ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
              className={`relative bg-white/95 backdrop-blur-xl rounded-3xl p-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-white cursor-grab active:cursor-grabbing hover:shadow-[0_25px_70px_rgba(0,0,0,0.3)] ${cardAnimDirection === 'next' ? 'animate-polaroid-shuffle-next' : 'animate-polaroid-shuffle-prev'
                }`}
            >
              {/* Visual Swipe Indicator Hints */}
              {dragX < -25 && (
                <div className="absolute top-3 right-3 z-20 bg-brand text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md animate-fade-in">
                  {locale === 'vi' ? 'Tiếp ➔' : 'Next ➔'}
                </div>
              )}
              {dragX > 25 && (
                <div className="absolute top-3 left-3 z-20 bg-slate-800 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md animate-fade-in">
                  {locale === 'vi' ? '🕹️ Trước' : '🕹️ Prev'}
                </div>
              )}

              {/* Author Header */}
              <div className="flex items-center justify-between mb-2.5 px-1 pointer-events-none">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-200 shadow-sm shrink-0">
                    <SafeImage src={timelineEvents[currentEventIndex]?.data?.user?.avatarUrl || timelineEvents[currentEventIndex]?.data?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" fallbackClassName="w-full h-full bg-brand text-white flex items-center justify-center font-bold text-xs" fallbackText={timelineEvents[currentEventIndex]?.title?.charAt(0) || "U"} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1 leading-tight">
                      {timelineEvents[currentEventIndex]?.data?.user?.fullName || timelineEvents[currentEventIndex]?.data?.fullName || timelineEvents[currentEventIndex]?.title}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                      {new Date(timelineEvents[currentEventIndex]?.time).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {currentEventIndex + 1}/{timelineEvents.length}
                </span>
              </div>

              {/* Rounded Photo Frame */}
              <div
                className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden shadow-inner bg-slate-900 transition-transform duration-300 pointer-events-auto cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  const currentEvt = timelineEvents[currentEventIndex];
                  if (currentEvt?.momentId && onMarkerClick) {
                    onMarkerClick(currentEvt.momentId);
                  }
                }}
              >
                <SafeImage
                  src={timelineEvents[currentEventIndex]?.imageUrl}
                  alt="Moment Photo"
                  className="w-full h-full object-cover"
                  fallbackClassName="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-white p-4 text-center"
                  fallbackText={<div className="flex flex-col items-center gap-1.5"><MapPin className="w-7 h-7 text-brand" /><span className="text-xs font-bold">{timelineEvents[currentEventIndex]?.title}</span></div>}
                />
              </div>

              {/* Handwritten Status / Caption Area */}
              <div className="mt-3 px-1 min-h-[44px] pointer-events-none">
                <p className="font-handwriting text-2xl text-slate-800 leading-snug line-clamp-2 selection:bg-brand/20">
                  "{timelineEvents[currentEventIndex]?.desc || timelineEvents[currentEventIndex]?.title || (locale === 'vi' ? 'Khoảnh khắc đáng nhớ trong chuyến đi' : 'Memorable moment along the journey')}"
                </p>
              </div>

              {/* Interactive Swipe Hint Footer */}
              <div className="mt-1 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium px-1 pointer-events-none">
                <span>{locale === 'vi' ? '‹ Vuốt phải (Trước)' : '‹ Swipe Right (Prev)'}</span>
                <span className="text-brand font-bold">{locale === 'vi' ? '👈 Vuốt cọc ảnh 👉' : '👈 Swipe Photo Deck 👉'}</span>
                <span>{locale === 'vi' ? 'Vuốt trái (Tiếp) ›' : 'Swipe Left (Next) ›'}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Timeline Replay Bar (iOS 26 Liquid Glass Bar - Spacious, Premium & Non-blocking) */}
      {isReplayMode && (!isSpecificTour || timelineEvents.length > 0) && (
        <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl md:max-w-2xl lg:max-w-3xl px-2 sm:px-4 pointer-events-auto transition-all duration-300">
          <div className="w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-[1.25rem] sm:rounded-3xl p-2 sm:p-4 shadow-[0_16px_50px_rgba(0,0,0,0.18),inset_0_1.5px_2px_rgba(255,255,255,0.9)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.4)] flex flex-col gap-2 sm:gap-2.5 relative">

            {/* Top Row: Event Info & All Controls in 1 Single Line */}
            <div className="flex items-center justify-between gap-3.5 w-full">
              {/* Left: Thumbnail & Info */}
              <div
                className={`flex items-center gap-3 min-w-0 flex-1 ${timelineEvents[currentEventIndex]?.momentId ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                onClick={() => {
                  const evt = timelineEvents[currentEventIndex];
                  if (evt?.momentId && onMarkerClick) {
                    onMarkerClick(evt.momentId);
                  }
                }}
              >
                <div className={`w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-white/90 dark:border-slate-700 shrink-0 ${!timelineEvents[currentEventIndex]?.imageUrl ? 'bg-gradient-to-br from-brand to-cyan-400 text-white flex items-center justify-center' : ''}`}>
                  <SafeImage src={timelineEvents[currentEventIndex]?.imageUrl} alt="Event" className="w-full h-full object-cover" fallbackClassName="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand to-cyan-400 text-white" fallbackText={<MapPin className="w-4 h-4" />} />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9.5px] font-black text-brand bg-brand/10 dark:bg-brand/20 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      {new Date(timelineEvents[currentEventIndex]?.time).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-bold shrink-0">
                      {currentEventIndex + 1}/{timelineEvents.length}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate mt-0.5">
                    {timelineEvents[currentEventIndex]?.title}
                  </span>
                </div>
              </div>

              {/* Right: Liquid Glass Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handlePrevCard}
                  title={locale === 'vi' ? 'Lùi bài' : 'Previous'}
                  className="w-8.5 h-8.5 rounded-full text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 hover:bg-brand/10 hover:text-brand dark:hover:text-brand flex items-center justify-center active:scale-95 transition-all shadow-sm"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (currentEventIndex >= timelineEvents.length - 1) {
                      setCurrentEventIndex(0);
                    }
                    setIsPlaying(!isPlaying);
                  }}
                  title={isPlaying ? 'Pause' : 'Play'}
                  className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shadow-[0_4px_16px_rgba(0,104,224,0.4)] hover:bg-brand-hover hover:scale-105 active:scale-95 transition-all"
                >
                  {isPlaying ? <Pause className="w-4.5 h-4.5 fill-current" /> : <Play className="w-4.5 h-4.5 ml-0.5 fill-current" />}
                </button>

                <button
                  onClick={handleNextCard}
                  title={locale === 'vi' ? 'Tiếp theo' : 'Next'}
                  className="w-8.5 h-8.5 rounded-full text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 hover:bg-brand/10 hover:text-brand dark:hover:text-brand flex items-center justify-center active:scale-95 transition-all shadow-sm"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setPlaybackSpeed(prev => prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1)}
                  title={locale === 'vi' ? 'Tốc độ phát' : 'Playback Speed'}
                  className="px-2.5 py-1 text-xs font-black bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-full hover:bg-brand/10 hover:text-brand dark:hover:text-brand transition-colors shadow-sm ml-0.5"
                >
                  {playbackSpeed}x
                </button>

                <button
                  onClick={() => { setIsReplayMode(false); setIsPlaying(false); }}
                  title={locale === 'vi' ? 'Đóng' : 'Close'}
                  className="w-8.5 h-8.5 rounded-full bg-slate-100/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Line: Scrubber Range */}
            <div className="w-full h-2.5 group relative px-0.5 mt-0.5">
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand via-cyan-400 to-indigo-500 transition-all duration-300" style={{ width: `${(currentEventIndex / Math.max(1, timelineEvents.length - 1)) * 100}%` }}></div>
              </div>
              <input
                type="range" min="0" max={Math.max(0, timelineEvents.length - 1)}
                value={currentEventIndex}
                onChange={(e) => { setCurrentEventIndex(Number(e.target.value)); setIsPlaying(false); }}
                className="absolute top-1/2 -translate-y-1/2 w-full h-2.5 opacity-0 cursor-pointer z-10"
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-brand rounded-full shadow-md pointer-events-none transition-all duration-300"
                style={{ left: `calc(${(currentEventIndex / Math.max(1, timelineEvents.length - 1)) * 100}% - 7px)` }}
              ></div>
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
