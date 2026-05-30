import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { GoogleMap, Marker, Polyline, useJsApiLoader, OverlayView } from "@react-google-maps/api";
import { MapPin, Clock, Navigation, Calendar } from "lucide-react";
import * as signalR from '@microsoft/signalr';
import { SIGNALR_HUB_BASE } from "../../../../config/api/api";
import { locationService } from "../../locations/services/locationService";

// 1. Định nghĩa Types/Interfaces
export interface ItineraryLocation {
  id: number;
  dayNumber: number;
  title: string;
  locationName: string;
  locationLat: number;
  locationLng: number;
  startDuration: string;
  endDuration: string;
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
  // Khởi tạo Google Maps
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  // 2. Quản lý State & Dữ liệu phái sinh
  // Bóc tách mảng Unique Days (Các ngày duy nhất) và sắp xếp tăng dần
  const uniqueDays = useMemo(() => {
    const days = Array.from(new Set(itineraries.map((i) => i.dayNumber)));
    return days.sort((a, b) => a - b);
  }, [itineraries]);

  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [activeLocId, setActiveLocId] = useState<number | null>(null);

  // YÊU CẦU 2: Tích hợp logic Thời gian (Pre-tour vs In-tour)
  const isTourStarted = useMemo(() => new Date() >= new Date(departureDate), [departureDate]);
  
  // State lưu vị trí người dùng khi In-tour
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // YÊU CẦU 3: Tích hợp Lớp Vị trí Bạn bè Real-time
  const [showLiveFriends, setShowLiveFriends] = useState(true);
  const [friendLocations, setFriendLocations] = useState<any[]>([]);
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);

  // BƯỚC 3: Hook 1 - Initial Load & SignalR Real-time
  useEffect(() => {
    if (!showLiveFriends) return;

    let connection: signalR.HubConnection;

    const initLocationService = async () => {
      try {
        const initialFriends = await locationService.getLiveFriends();
        // Lấy đúng mảng bên trong thuộc tính data do Backend trả về (nếu có)
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

  // BƯỚC 4: Hook 2 - Ping vị trí của chính mình lên Server
  useEffect(() => {
    // Bỏ isTourStarted để ứng dụng luôn lấy GPS và ping khi mở map
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

  // Tự động set selectedDay là ngày đầu tiên nếu danh sách thay đổi và selectedDay hiện tại không tồn tại
  useEffect(() => {
    if (uniqueDays.length > 0 && !uniqueDays.includes(selectedDay)) {
      setSelectedDay(uniqueDays[0]);
    }
  }, [uniqueDays, selectedDay]);

  // Lọc lịch trình theo ngày đang chọn và sắp xếp theo thời gian bắt đầu
  const currentDayItineraries = useMemo(() => {
    return itineraries
      .filter((i) => i.dayNumber === selectedDay)
      .sort((a, b) => {
        const timeA = a.startDuration || "00:00";
        const timeB = b.startDuration || "00:00";
        return timeA.localeCompare(timeB);
      });
  }, [itineraries, selectedDay]);

  // Mảng đường đi (Polyline) nối tọa độ các điểm đến
  const polylinePath = useMemo(() => {
    return currentDayItineraries
      .filter((loc) => loc.locationLat && loc.locationLng)
      .map((loc) => ({ lat: loc.locationLat, lng: loc.locationLng }));
  }, [currentDayItineraries]);

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
        // Điều chỉnh zoom sau khi fitBounds nếu chỉ có 1 điểm duy nhất
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

  // Hàm Xử lý khi nhấn vào 1 mục trên Timeline
  const handleLocationClick = (loc: ItineraryLocation) => {
    setActiveLocId(loc.id);
    if (mapRef.current && loc.locationLat && loc.locationLng && window.google) {
      mapRef.current.panTo({ lat: loc.locationLat, lng: loc.locationLng });
      mapRef.current.setZoom(16);
    }
  };

  // Hàm tiện ích cắt format HH:mm:ss thành HH:mm
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "--:--";
    return timeStr.length >= 5 ? timeStr.substring(0, 5) : timeStr;
  };
console.log("=== DANH SÁCH BẠN BÈ ===", friendLocations);
  return (
    <div className="flex flex-col md:flex-row h-[70vh] min-h-[500px] w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* 3. Panel Trái: Day Stepper & Timeline */}
      <div className="w-full md:w-[380px] flex flex-col border-b md:border-b-0 md:border-r border-slate-200 bg-white shrink-0">

        {/* YÊU CẦU 2: Pre-tour Banner (Hiển thị khi Tour chưa bắt đầu) */}
        {!isTourStarted && currentDayItineraries.length > 0 && (
          <div className="mx-4 mt-4 mb-1 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600 mb-1">Điểm tập trung chặng đầu</p>
            <h4 className="text-sm font-bold text-slate-800 mb-3">{currentDayItineraries[0].locationName || currentDayItineraries[0].title}</h4>
            <button
              onClick={() => {
                const firstLoc = currentDayItineraries[0];
                window.open(`https://www.google.com/maps/search/?api=1&query=${firstLoc.locationLat},${firstLoc.locationLng}`);
              }}
              className="flex items-center justify-center gap-2 w-full py-2 bg-[#EB662B] text-white rounded-lg text-sm font-bold shadow-sm transition-all hover:bg-orange-600 active:scale-95"
            >
              <Navigation className="w-4 h-4" /> Chỉ đường đến điểm hẹn
            </button>
          </div>
        )}
        
        {/* Header Tabs Chọn Ngày */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#EB662B]" /> Lịch trình chi tiết
          </h3>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
            {uniqueDays.length === 0 ? (
              <span className="text-sm text-slate-400">Không có dữ liệu ngày</span>
            ) : (
              uniqueDays.map((day) => (
                <button
                  key={day}
                  onClick={() => { setSelectedDay(day); setActiveLocId(null); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedDay === day
                      ? "bg-[#EB662B] text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Ngày {day}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Body Lịch trình (Timeline) */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {currentDayItineraries.length === 0 ? (
            <div className="text-center text-sm text-slate-500 mt-10">Không có điểm đến nào trong ngày này.</div>
          ) : (
            <div className="relative border-l-2 border-slate-100 ml-3 pl-5 space-y-6">
              {currentDayItineraries.map((loc, idx) => (
                <div 
                  key={loc.id} 
                  onClick={() => handleLocationClick(loc)}
                  className="relative cursor-pointer group"
                >
                  {/* Dấu chấm Timeline */}
                  <div 
                    className={`absolute -left-[27px] w-3 h-3 rounded-full border-2 border-white top-1 transition-all duration-300 ${
                      activeLocId === loc.id ? "bg-[#EB662B] scale-150 ring-4 ring-[#EB662B]/20" : "bg-slate-300 group-hover:bg-[#EB662B]/50"
                    }`} 
                  />
                  
                  {/* Nội dung Card */}
                  <div className={`p-4 rounded-xl border transition-all duration-300 ${
                    activeLocId === loc.id 
                      ? "bg-orange-50/50 border-orange-200 shadow-sm" 
                      : "bg-white border-slate-100 hover:border-orange-100 hover:bg-slate-50"
                  }`}>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#EB662B] mb-2">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(loc.startDuration)} - {formatTime(loc.endDuration)}
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1 leading-snug">{loc.title}</h4>
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

      {/* 4. Panel Phải: Google Maps */}
      <div className="flex-1 relative bg-slate-100 min-h-[300px]">
        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-slate-300 border-t-[#EB662B] rounded-full animate-spin"></div>
          </div>
        ) : (
          <GoogleMap
            mapContainerClassName="w-full h-full"
            center={defaultCenter}
            zoom={6}
            onLoad={onMapLoad}
            options={{ disableDefaultUI: true, zoomControl: true }}
          >
            {/* YÊU CẦU 3: Toggle Button Bật/Tắt Vị trí bạn bè (Nổi góc bản đồ) */}
            {isTourStarted && (
              <div className="absolute top-4 right-14 z-10 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-sm border border-slate-200 animate-fade-in-down flex flex-col gap-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" checked={showLiveFriends} onChange={(e) => setShowLiveFriends(e.target.checked)} className="sr-only" />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${showLiveFriends ? 'bg-[#EB662B]' : 'bg-slate-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showLiveFriends ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <span className="text-sm font-bold text-slate-700 select-none">Vị trí bạn bè</span>
                </label>
                {showLiveFriends && lastPingTime && (
                  <div className="flex items-center gap-1.5 pl-12">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] text-slate-500 font-medium">Cập nhật: {lastPingTime.toLocaleTimeString('vi-VN', { hour12: false })}</span>
                  </div>
                )}
              </div>
            )}

            <Polyline path={polylinePath} options={{ strokeColor: "#EB662B", strokeWeight: 4, strokeOpacity: 0.8 }} />
            
            {currentDayItineraries.map((loc) => (
              <Marker key={loc.id} position={{ lat: loc.locationLat, lng: loc.locationLng }} onClick={() => handleLocationClick(loc)} animation={activeLocId === loc.id ? window.google.maps.Animation.BOUNCE : undefined} />
            ))}

            {/* YÊU CẦU 2: Marker Vị trí GPS hiện tại của User (Chấm xanh Pulse Effect) */}
            {isTourStarted && userLocation && (
              <OverlayView position={userLocation} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h / 2) })}>
                <div className="relative flex items-center justify-center w-8 h-8 pointer-events-none">
                  <div className="absolute inset-0 bg-blue-500 rounded-full opacity-50 animate-ping"></div>
                  <div className="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)]"></div>
                </div>
              </OverlayView>
            )}

            {/* YÊU CẦU 3: Lớp Marker Avatar Bạn bè */}
            {showLiveFriends && friendLocations.map((friend: any) => (
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
        )}
      </div>
    </div>
  );
};