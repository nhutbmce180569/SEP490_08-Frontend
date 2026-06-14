import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { GoogleMap, Polyline, useJsApiLoader, OverlayView } from "@react-google-maps/api";
import { MapPin, Clock, Navigation, Calendar, ChevronLeft, List, Share2 } from "lucide-react";
import * as signalR from '@microsoft/signalr';
import { SIGNALR_HUB_BASE } from "../../../../config/api/api";
import { locationService } from "../../locations/services/locationService";
import { useGenerateTrackingToken } from "../../tracking/hooks/useTracking";
import { useToast } from "../../../../contexts/ToastContext";
import { useTranslation } from "../../../../contexts/LocaleContext";

// 1. Định nghĩa Types/Interfaces
export interface ItineraryLocation {
  id: number;
  dayNumber: number;
  title: string;
  locationName: string;
  locationLat: number;
  locationLng: number;
  startDuration: string | null;
  endDuration: string | null;
}

interface TourItineraryMapProps {
  itineraries: ItineraryLocation[];
  departureDate?: string;
  scheduleId?: number;
}

const defaultCenter = { lat: 16.047079, lng: 108.206230 }; // Mặc định ở khu vực miền Trung VN

export const TourItineraryMap: React.FC<TourItineraryMapProps> = ({ 
  itineraries = [],
  departureDate = new Date().toISOString(), // Fallback tránh lỗi nếu quên truyền
  scheduleId
}) => {
  const { t } = useTranslation();
  // Khởi tạo Google Maps
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const { success } = useToast();
  const { mutate: generateTrackingToken, isPending: isGeneratingToken } = useGenerateTrackingToken();

  // 2. Quản lý State & Dữ liệu phái sinh
  const uniqueDays = useMemo(() => {
    const days = Array.from(new Set(itineraries.map((i) => i.dayNumber)));
    return days.sort((a, b) => a - b);
  }, [itineraries]);

  const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL');
  const [activeLocId, setActiveLocId] = useState<number | null>(null);

  // State cho UI Panel và Đường đi động (Animation)
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [animatedPath, setAnimatedPath] = useState<google.maps.LatLng[]>([]);

  // Tích hợp logic Thời gian (Pre-tour vs In-tour)
  const isTourStarted = useMemo(() => new Date() >= new Date(departureDate), [departureDate]);
  
  // State lưu vị trí người dùng khi In-tour
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Tích hợp Lớp Vị trí Bạn bè Real-time
  const [showLiveFriends, setShowLiveFriends] = useState(true);
  const [friendLocations, setFriendLocations] = useState<any[]>([]);
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);

  // Hook 1 - Initial Load & SignalR Real-time
  useEffect(() => {
    if (!showLiveFriends) return;

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
  }, [showLiveFriends]);

  // Hook 2 - Ping vị trí của chính mình lên Server
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
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

  // Lọc lịch trình theo ngày đang chọn và sắp xếp theo thời gian bắt đầu
  const currentDayItineraries = useMemo(() => {
    let filtered = itineraries;
    if (selectedDay !== 'ALL') {
      filtered = itineraries.filter((i) => i.dayNumber === selectedDay);
    }
    return filtered.sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
      const timeA = a.startDuration || "00:00";
      const timeB = b.startDuration || "00:00";
      return timeA.localeCompare(timeB);
    });
  }, [itineraries, selectedDay]);

  // Lấy đường đi thực tế từ Directions API & Animation Vẽ Đường
  useEffect(() => {
    if (!isLoaded || !window.google) return;

    let intervalId: ReturnType<typeof setInterval>;

    const validItineraries = currentDayItineraries.filter(loc => loc.locationLat && loc.locationLng);
    if (validItineraries.length < 2) {
      setAnimatedPath([]);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    const origin = new window.google.maps.LatLng(validItineraries[0].locationLat, validItineraries[0].locationLng);
    const destination = new window.google.maps.LatLng(
      validItineraries[validItineraries.length - 1].locationLat,
      validItineraries[validItineraries.length - 1].locationLng
    );

    const waypoints = validItineraries.slice(1, -1).map(loc => ({
      location: new window.google.maps.LatLng(loc.locationLat, loc.locationLng),
      stopover: true
    }));

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          const overviewPath = result.routes[0].overview_path;
          let currentIndex = 0;
          setAnimatedPath([]);

          intervalId = setInterval(() => {
            if (currentIndex < overviewPath.length) {
              setAnimatedPath(prev => [...prev, overviewPath[currentIndex]]);
              currentIndex++;
            } else {
              clearInterval(intervalId);
            }
          }, 20); // 20ms/điểm
        } else {
          console.warn("Directions request failed due to " + status);
        }
      }
    );

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentDayItineraries, isLoaded]);

  // Tự động fitBounds để hiển thị toàn bộ lộ trình của ngày
  useEffect(() => {
    if (mapRef.current && currentDayItineraries.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidCoords = false;

      currentDayItineraries.forEach((loc) => {
        if (loc.locationLat && loc.locationLng) {
          bounds.extend(new window.google.maps.LatLng(loc.locationLat, loc.locationLng));
          hasValidCoords = true;
        }
      });

      if (hasValidCoords) {
        mapRef.current.fitBounds(bounds);
        if (currentDayItineraries.length === 1) {
          const listener = window.google.maps.event.addListener(mapRef.current, "idle", () => {
            if (mapRef.current!.getZoom()! > 15) {
              mapRef.current!.setZoom(15);
            }
            window.google.maps.event.removeListener(listener);
          });
        }
      }
    }
  }, [currentDayItineraries]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleLocationClick = (loc: ItineraryLocation) => {
    setActiveLocId(loc.id);
    if (mapRef.current && loc.locationLat && loc.locationLng && window.google) {
      mapRef.current.panTo({ lat: loc.locationLat, lng: loc.locationLng });
      mapRef.current.setZoom(16);
    }
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return "";
    return timeStr.length >= 5 ? timeStr.substring(0, 5) : timeStr;
  };

  const handleShareLocation = () => {
    generateTrackingToken(undefined, {
      onSuccess: (token) => {
        const link = window.location.origin + '/track/' + token;
        navigator.clipboard.writeText(link);
        success(t("social.itineraryTrackingLinkCopied"));
      }
    });
  };

  return (
    <div className="relative h-[80vh] min-h-[600px] w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100">
      
      {/* 1. Background Google Maps */}
      <div className="absolute inset-0 z-0">
        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-slate-300 border-t-brand rounded-full animate-spin"></div>
          </div>
        ) : (
          <GoogleMap
            mapContainerClassName="w-full h-full"
            center={defaultCenter}
            zoom={6}
            onLoad={onMapLoad}
            options={{ disableDefaultUI: true, zoomControl: true }}
          >
            {isTourStarted && (
              <div className="absolute top-4 right-14 z-10 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-sm border border-slate-200 animate-fade-in-down flex flex-col gap-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" checked={showLiveFriends} onChange={(e) => setShowLiveFriends(e.target.checked)} className="sr-only" />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${showLiveFriends ? 'bg-brand' : 'bg-slate-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showLiveFriends ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <span className="text-sm font-bold text-slate-700 select-none">{t("social.itineraryFriendLocations")}</span>
                </label>
                {showLiveFriends && lastPingTime && (
                  <div className="flex items-center gap-1.5 pl-12">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] text-slate-500 font-medium">Cập nhật: {lastPingTime.toLocaleTimeString('vi-VN', { hour12: false })}</span>
                  </div>
                )}
              </div>
            )}

            <Polyline
              path={animatedPath}
              options={{
                strokeColor: "var(--color-brand)",
                strokeWeight: 4,
                strokeOpacity: 0.8
              }}
            />
            
            {currentDayItineraries.map((loc, index) => (
              <OverlayView 
                key={loc.id} 
                position={{ lat: loc.locationLat, lng: loc.locationLng }} 
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} 
                getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h / 2) })}
              >
                <div className="relative z-10 flex flex-col items-center justify-center">
                  {/* Popup Tooltip (hiển thị khi active) */}
                  {activeLocId === loc.id && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-3 z-50 animate-fade-in-up">
                      <div className="text-[10px] font-bold text-brand mb-1">
                        {formatTime(loc.startDuration)} - {formatTime(loc.endDuration)}
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight mb-1">{loc.title}</h4>
                      <div className="text-xs text-slate-500 line-clamp-1">{loc.locationName}</div>
                      {/* Đuôi nhọn (Pointer tail) */}
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-slate-100 rotate-45"></div>
                    </div>
                  )}
                  
                  {/* Node tròn */}
                  <div 
                    onClick={() => handleLocationClick(loc)}
                    className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 text-xs font-bold shadow-sm transition-all duration-300 ${
                      activeLocId === loc.id
                        ? "scale-110 border-brand bg-brand text-white"
                        : "border-brand bg-white text-brand hover:scale-110 hover:bg-brand hover:text-white"
                    }`}
                  >
                    {index + 1}
                  </div>
                </div>
              </OverlayView>
            ))}

            {isTourStarted && userLocation && (
              <OverlayView position={userLocation} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h / 2) })}>
                <div className="relative flex items-center justify-center w-8 h-8 pointer-events-none">
                  <div className="absolute inset-0 bg-brand-light0 rounded-full opacity-50 animate-ping"></div>
                  <div className="relative w-4 h-4 bg-brand border-2 border-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)]"></div>
                </div>
              </OverlayView>
            )}

            {showLiveFriends && friendLocations.map((friend: any) => (
              <OverlayView key={`friend-${friend.userId}`} position={{ lat: friend.lat, lng: friend.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h / 2) })}>
                <div className="relative flex flex-col items-center justify-center transition-all duration-700 ease-in-out pointer-events-none">
                  <div className="w-12 h-12 rounded-full border-4 border-brand overflow-hidden bg-white shadow-lg relative z-10 pointer-events-auto cursor-pointer hover:scale-110 transition-transform">
                    {friend.avatarUrl ? (
                      <img src={friend.avatarUrl} alt={friend.fullName} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200 text-brand font-bold text-lg">{friend.fullName?.charAt(0)}</div>
                    )}
                  </div>
                  <span className="absolute top-full mt-1 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold rounded-md whitespace-nowrap shadow-sm">
                    {friend.fullName}
                  </span>
                </div>
              </OverlayView>
            ))}
          </GoogleMap>
        )}
      </div>

      {/* Floating Share Tracking Button */}
      {isTourStarted && (
        <button
          onClick={handleShareLocation}
          disabled={isGeneratingToken}
          title={t("social.itineraryShareJourney")}
          className="absolute bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand shadow-[0_8px_20px_rgba(0,0,0,0.15)] border-2 border-brand transition-all hover:scale-110 active:scale-95 disabled:opacity-70"
        >
          {isGeneratingToken ? (
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Share2 className="w-6 h-6" />
          )}
        </button>
      )}

      {/* 2. Floating Panel Lịch trình */}
      {isPanelExpanded ? (
        <div className="absolute top-4 left-4 z-10 w-[350px] max-h-[calc(100%-32px)] flex flex-col bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-slate-100 overflow-hidden animate-fade-in-right">
          <button 
            onClick={() => setIsPanelExpanded(false)} 
            className="absolute top-4 right-4 p-1.5 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors z-20"
          >
            <ChevronLeft className="w-4 h-4"/>
          </button>

          {!isTourStarted && currentDayItineraries.length > 0 && (
            <div className="mx-4 mt-4 mb-1 p-4 bg-brand-light border border-brand/20 rounded-xl shrink-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand mb-1">Điểm tập trung chặng đầu</p>
              <h4 className="text-sm font-bold text-slate-800 mb-3">{currentDayItineraries[0].locationName || currentDayItineraries[0].title}</h4>
              <button
                onClick={() => {
                  const firstLoc = currentDayItineraries[0];
                  window.open(`https://www.google.com/maps/search/?api=1&query=${firstLoc.locationLat},${firstLoc.locationLng}`);
                }}
                className="flex items-center justify-center gap-2 w-full py-2 bg-brand text-white rounded-lg text-sm font-bold shadow-sm transition-all hover:bg-brand active:scale-95"
              >
                <Navigation className="w-4 h-4" /> Chỉ đường đến điểm hẹn
              </button>
            </div>
          )}
          
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand" /> Lịch trình chi tiết
            </h3>
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
              <button
                onClick={() => { setSelectedDay('ALL'); setActiveLocId(null); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedDay === 'ALL' ? "bg-brand text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Tổng quan
              </button>
              {uniqueDays.map((day) => (
                <button
                  key={day}
                  onClick={() => { setSelectedDay(day); setActiveLocId(null); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedDay === day
                      ? "bg-brand text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Ngày {day}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {currentDayItineraries.length === 0 ? (
              <div className="text-center text-sm text-slate-500 mt-10">{t("social.itineraryNoDestinations")}</div>
            ) : (
              <div className="relative border-l-2 border-slate-100 ml-3 pl-5 space-y-6">
                {currentDayItineraries.map((loc) => (
                  <div 
                    key={loc.id} 
                    onClick={() => handleLocationClick(loc)}
                    className="relative cursor-pointer group"
                  >
                    <div 
                      className={`absolute -left-[27px] w-3 h-3 rounded-full border-2 border-white top-1 transition-all duration-300 ${
                        activeLocId === loc.id ? "bg-brand scale-150 ring-4 ring-brand/20" : "bg-slate-300 group-hover:bg-brand/50"
                      }`} 
                    />
                    
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${
                      activeLocId === loc.id 
                        ? "bg-brand-light/50 border-brand/20 shadow-sm"
                        : "bg-white border-slate-100 hover:border-blue-100 hover:bg-slate-50"
                    }`}>
                      <div className="flex items-center gap-2 text-xs font-semibold text-brand mb-2">
                        <Clock className="w-3.5 h-3.5" />
                        {loc.startDuration ? formatTime(loc.startDuration) + (loc.endDuration ? ' - ' + formatTime(loc.endDuration) : '') : 'Tự do'}
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1 leading-snug">
                        {selectedDay === 'ALL' && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md mr-2">Ngày {loc.dayNumber}</span>}
                        {loc.title}
                      </h4>
                      <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed">{loc.locationName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsPanelExpanded(true)} 
          className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-slate-100 text-slate-800 font-bold hover:bg-slate-50 transition-all"
        >
          <List className="w-5 h-5 text-brand"/> Danh sách lịch trình
        </button>
      )}
    </div>
  );
};
