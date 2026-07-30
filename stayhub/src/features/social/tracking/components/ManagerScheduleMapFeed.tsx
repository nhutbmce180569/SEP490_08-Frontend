import React, { useState, useRef, useCallback, useMemo, useEffect, useContext } from "react";
import Map, { Marker, Source, Layer, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Navigation, Compass, Layers, MapPin, X, Navigation2 } from "lucide-react";
import * as signalR from '@microsoft/signalr';

import { SIGNALR_HUB_BASE } from "../../../../config/api/api";
import { useGetScheduleLiveLocations, useGetTourRouteData } from "../../tracking/hooks/useScheduleTracking";
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

interface ManagerScheduleMapFeedProps {
  scheduleId: number | null;
}

export const ManagerScheduleMapFeed: React.FC<ManagerScheduleMapFeedProps> = ({ scheduleId }) => {
  const { t } = useTranslation();
  const locale = getStoredLocale();
  const { user } = useContext(AuthContext);
  const { error: showError, success: showSuccess } = useToast();

  const apiKey = import.meta.env.VITE_MAPBOX_TOKEN as string;

  const { data: routeData, isLoading: isRouteLoading } = useGetTourRouteData(scheduleId || 0);
  const { data: scheduleLocations } = useGetScheduleLiveLocations(scheduleId ?? 0);

  const mapRef = useRef<MapRef | null>(null);
  const [viewState, setViewState] = useState({
    latitude: 10.0451, // Default: Cần Thơ
    longitude: 105.7468,
    zoom: 12,
  });

  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isNightMode, setIsNightMode] = useState(false);
  const [showLiveLocations, setShowLiveLocations] = useState(true); 
  const [showTourRoute, setShowTourRoute] = useState(true);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [scheduleMemberLocations, setScheduleMemberLocations] = useState<any[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);

  const [activeRouteStaffId, setActiveRouteStaffId] = useState<string | null>(null);
  const [directRouteCoords, setDirectRouteCoords] = useState<[number, number][]>([]);

  useEffect(() => {
    const hour = new Date().getHours();
    setIsNightMode(hour < 6 || hour > 18);
  }, []);

  const tourStops = useMemo(() => {
    if (!routeData?.waypoints) return [];
    return routeData.waypoints;
  }, [routeData]);

  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!tourStops || tourStops.length < 2 || !routeData) {
      setRouteCoordinates([]);
      return;
    }
    let isCancelled = false;
    const fetchMapboxRoute = async () => {
      try {
        if (!apiKey) throw new Error("Mapbox access token is missing.");
        const segmentPromises = [];
        for (let i = 0; i < tourStops.length - 1; i++) {
          const wpStart = tourStops[i];
          const wpEnd = tourStops[i + 1];
          segmentPromises.push((async () => {
            try {
              const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${wpStart.lng},${wpStart.lat};${wpEnd.lng},${wpEnd.lat}?geometries=geojson&overview=full&access_token=${apiKey}`;
              const res = await fetch(url);
              if (!res.ok) throw new Error(`Segment directions failed with status: ${res.status}`);
              const data = await res.json();
              const coords = data.routes?.[0]?.geometry?.coordinates;
              if (Array.isArray(coords) && coords.length > 0) {
                return coords;
              }
            } catch (err) {
              console.warn(`Mapbox Directions failed for segment index ${i}. Drawing straight line:`, err);
            }
            return [[wpStart.lng, wpStart.lat], [wpEnd.lng, wpEnd.lat]];
          })());
        }
        const segmentsCoords = await Promise.all(segmentPromises);
        if (isCancelled) return;
        setRouteCoordinates(segmentsCoords.flat());
      } catch (err) {
        console.error("Mapbox Directions API failed completely. Falling back to straight lines:", err);
        if (!isCancelled) {
          setRouteCoordinates(routeData.geometryCoordinates || []);
        }
      }
    };
    fetchMapboxRoute();
    return () => { isCancelled = true; };
  }, [tourStops, apiKey, routeData]);

  const tourRouteGeoJSON = useMemo(() => {
    if (!routeCoordinates || routeCoordinates.length < 2) return undefined;
    return {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates: routeCoordinates },
    };
  }, [routeCoordinates]);

  const directRouteGeoJSON = useMemo(() => {
    if (!directRouteCoords || directRouteCoords.length < 2) return undefined;
    return {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates: directRouteCoords },
    };
  }, [directRouteCoords]);

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
    if (!scheduleId || scheduleId <= 0 || !showLiveLocations) return;

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
          console.warn("[SignalR] Tour tracking not available:", err);
        }
      });

    return () => {
      isCancelled = true;
      connection.off("ReceiveTourLocationUpdate");
      connection.stop().catch(() => {});
    };
  }, [scheduleId, showLiveLocations]);

  const onMapLoad = useCallback(() => {
    setIsMapReady(true);
  }, []);

  const handleMapMove = useCallback((evt: any) => {
    setViewState(evt.viewState);
  }, []);

  const handleMapClick = () => {
    if (isLayerMenuOpen) setIsLayerMenuOpen(false);
  };

  const hasCenteredRef = useRef(false);

  useEffect(() => {
    if (isMapReady && !hasCenteredRef.current) {
      if (tourStops && tourStops.length > 0) {
        if (tourStops.length === 1) {
          mapRef.current?.flyTo({ center: [tourStops[0].lng, tourStops[0].lat], zoom: 15, duration: 1500 });
        } else {
          const lngs = tourStops.map((s: any) => s.lng);
          const lats = tourStops.map((s: any) => s.lat);
          mapRef.current?.fitBounds([
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)]
          ], { padding: 80, duration: 1000 });
        }
        hasCenteredRef.current = true;
      } else if (scheduleMemberLocations && scheduleMemberLocations.length > 0) {
         mapRef.current?.flyTo({ center: [scheduleMemberLocations[0].lng, scheduleMemberLocations[0].lat], zoom: 13, duration: 1500 });
         hasCenteredRef.current = true;
      }
    }
  }, [tourStops, scheduleMemberLocations, isMapReady]);

  useEffect(() => { hasCenteredRef.current = false; }, [scheduleId]);

  const discreteZoom = Math.round(viewState.zoom);
  const visualMemberLocations = useMemo(() => {
    const zoom = discreteZoom;
    const threshold = 0.0003 * Math.pow(2, 15 - zoom);
    const radius = 0.0004 * Math.pow(2, 15 - zoom);

    const placed: { lat: number, lng: number }[] = [];
    const result: any[] = [];

    const allPeople = [...scheduleMemberLocations];
    
    allPeople.forEach(member => {
      const fLat = Number(member.lat ?? member.Lat);
      const fLng = Number(member.lng ?? member.Lng);
      if (isNaN(fLat) || isNaN(fLng)) return;

      const overlaps = placed.filter(p => 
        Math.abs(p.lat - fLat) < threshold && Math.abs(p.lng - fLng) < threshold
      );

      if (overlaps.length > 0) {
        const count = overlaps.length;
        const angle = (count * 137.5) * (Math.PI / 180); 
        const pushRadius = radius + (Math.floor(count / 4) * radius * 0.3);

        const offsetLat = fLat + pushRadius * Math.cos(angle);
        const offsetLng = fLng + pushRadius * Math.sin(angle);
        
        placed.push({ lat: offsetLat, lng: offsetLng });
        result.push({ ...member, visualLat: offsetLat, visualLng: offsetLng });
      } else {
        placed.push({ lat: fLat, lng: fLng });
        result.push({ ...member, visualLat: fLat, visualLng: fLng });
      }
    });

    return result;
  }, [scheduleMemberLocations, discreteZoom]);

  const handleGetCurrentLocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setMyLocation({ lat: latitude, lng: longitude });
          mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 16, duration: 1000 });
        },
        (err) => console.warn("Lỗi lấy vị trí GPS:", err)
      );
    }
  }, []);

  const handleStaffClick = useCallback((staff: any) => {
     mapRef.current?.flyTo({ center: [staff.visualLng, staff.visualLat], zoom: 16, duration: 1000 });
  }, []);

  const handleStaffDoubleClick = useCallback(async (staff: any) => {
     let origin = myLocation;
     if (!origin) {
        if ("geolocation" in navigator) {
           showSuccess(t("social.gettingLocation", "Getting your location to generate route..."));
           try {
               origin = await new Promise((resolve, reject) => {
                   navigator.geolocation.getCurrentPosition(
                     (pos) => {
                       const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                       setMyLocation(loc);
                       resolve(loc);
                     },
                     reject,
                     { timeout: 10000, enableHighAccuracy: true }
                   );
               });
           } catch (err) {
               showError(t("social.locationError", "Unable to get your location. Please grant location permissions."));
               return;
           }
        } else {
           showError("Trình duyệt không hỗ trợ GPS.");
           return;
        }
     }
     
     if (!origin) return;

     try {
         const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${staff.visualLng},${staff.visualLat}?geometries=geojson&overview=full&access_token=${apiKey}`;
         const res = await fetch(url);
         const data = await res.json();
         const coords = data.routes?.[0]?.geometry?.coordinates;
         if (coords && coords.length > 0) {
             setDirectRouteCoords(coords);
             setActiveRouteStaffId(staff.userId);
             mapRef.current?.fitBounds([
                 [Math.min(origin.lng, staff.visualLng), Math.min(origin.lat, staff.visualLat)],
                 [Math.max(origin.lng, staff.visualLng), Math.max(origin.lat, staff.visualLat)]
             ], { padding: 100, duration: 1500 });
         } else {
             showError("Không tìm thấy đường đi khả thi.");
         }
     } catch (err) {
         showError("Lỗi kết nối khi lấy dữ liệu chỉ đường.");
     }
  }, [myLocation, apiKey, showError, showSuccess, t]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100 rounded-2xl shadow-sm border border-slate-200">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMapMove}
        onLoad={onMapLoad}
        mapboxAccessToken={apiKey}
        mapStyle={isNightMode ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v12"}
        style={{ width: "100%", height: "100%" }}
        onClick={handleMapClick}
        attributionControl={false}
      >
        <style>{`
          .glass-panel {
            background: rgba(255, 255, 255, 0.18);
            backdrop-filter: blur(30px) saturate(180%);
            -webkit-backdrop-filter: blur(30px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.25);
            box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 8px 32px 0 rgba(0, 0, 0, 0.08);
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
            {showTourRoute && routeCoordinates.length > 0 && (
              <Source id="tour-route-source" type="geojson" data={tourRouteGeoJSON}>
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

            {activeRouteStaffId && directRouteCoords.length > 0 && directRouteGeoJSON && (
              <Source id="direct-route-source" type="geojson" data={directRouteGeoJSON}>
                <Layer
                  id="direct-route-line-glow"
                  type="line"
                  paint={{
                    "line-color": "#f97316",
                    "line-width": 8,
                    "line-opacity": 0.4,
                    "line-blur": 4,
                  }}
                  layout={{ "line-join": "round", "line-cap": "round" }}
                />
                <Layer
                  id="direct-route-line"
                  type="line"
                  paint={{
                    "line-color": "#ea580c",
                    "line-width": 4,
                  }}
                  layout={{ "line-join": "round", "line-cap": "round" }}
                />
              </Source>
            )}

            {showTourRoute && tourStops.map((stop, idx) => (
                <Marker key={`stop-${idx}`} longitude={stop.lng} latitude={stop.lat} anchor="bottom">
                  <div className="flex flex-col items-center group cursor-pointer relative z-10 transition-transform duration-500 hover:scale-110">
                    <div className="glass-panel text-slate-800 px-3 py-1.5 rounded-xl shadow-lg text-[12px] font-bold border border-white/40 mb-2 whitespace-nowrap opacity-90 group-hover:opacity-100 transition-opacity">
                      <span className="text-brand mr-1 font-black">{stop.sequence}.</span>
                      {stop.name}
                    </div>
                    <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-brand to-cyan-400 border-2 border-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,104,224,0.4)] group-hover:rotate-12 transition-transform duration-300">
                      <Compass className="w-4 h-4 text-white" />
                    </div>
                    <div className="w-1.5 h-1.5 bg-brand rounded-full mt-1 shadow-sm opacity-80"></div>
                  </div>
                </Marker>
            ))}

            {showLiveLocations && visualMemberLocations.map((member: any) => {
              const fLat = member.visualLat;
              const fLng = member.visualLng;
              const isStaff = member.role === "Staff" || member.role === "Manager";
              const markerColor = isStaff ? "bg-emerald-500" : "bg-blue-500";
              const pingColor = isStaff ? "bg-emerald-400" : "bg-blue-400";
              const tagText = isStaff ? (member.role || "STAFF").toUpperCase() : "CUSTOMER";

              return (
                <Marker key={`member-${member.userId}`} longitude={fLng} latitude={fLat} anchor="bottom">
                  <div className="relative flex flex-col items-center justify-center transition-all duration-500 group pointer-events-auto cursor-pointer hover:-translate-y-2">
                    <div className={`absolute inset-0 ${pingColor} rounded-full opacity-20 animate-ping w-16 h-16 -left-2 -top-2 pointer-events-none`}></div>
                    <div className="relative z-10">
                      <div 
                        className="w-12 h-12 rounded-full border-[3px] overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.2)] bg-slate-100"
                        style={{ borderColor: isStaff ? "#10b981" : "#3b82f6" }}
                      >
                        <SafeImage src={member.avatarUrl} alt={member.fullName} className="w-full h-full object-cover" fallbackClassName={`w-full h-full flex items-center justify-center ${markerColor} text-white font-bold text-lg`} fallbackText={member.fullName?.charAt(0)} />
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${markerColor} border-2 border-white rounded-full shadow-sm z-20`}></div>
                      <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 ${isStaff ? 'bg-emerald-600' : 'bg-blue-600'} text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow z-30 uppercase tracking-wide border border-white`}>
                        {tagText}
                      </span>
                    </div>
                    <div className="mt-1.5 px-2.5 py-0.5 glass-panel text-slate-800 text-[11px] font-bold rounded-full whitespace-nowrap shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
                      {member.fullName}
                    </div>
                  </div>
                </Marker>
              );
            })}

            {myLocation && (
              <Marker longitude={myLocation.lng} latitude={myLocation.lat} anchor="center">
                <div className="relative flex flex-col items-center justify-center pointer-events-none">
                  <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-[ping_2s_ease-in-out_infinite] w-20 h-20 -left-4 -top-4"></div>
                  <div className="absolute inset-0 bg-blue-400 rounded-full opacity-30 animate-[ping_3s_ease-in-out_infinite] w-16 h-16 -left-2 -top-2"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-full border-[3px] border-white overflow-hidden bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] pointer-events-auto cursor-pointer hover:scale-110 transition-transform duration-300">
                      <SafeImage src={(user as any)?.avatarUrl || (user as any)?.AvatarUrl} alt="Me" className="w-full h-full object-cover" fallbackClassName="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold text-lg" fallbackText={user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"} />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 rotate-45 border-r-[2px] border-b-[2px] border-white z-0 rounded-sm"></div>
                  </div>
                </div>
              </Marker>
            )}
          </>
        )}
      </Map>

      {/* Top Right Controls (Layers) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
        <div className="relative">
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              setIsLayerMenuOpen(!isLayerMenuOpen); 
            }}
            className="glass-button flex h-12 w-12 items-center justify-center rounded-full text-slate-700 transition-all hover:scale-110 hover:text-brand focus:outline-none shadow-md"
            title={t("social.mapLayers", "Map Layers")}
          >
            <Layers className="h-6 w-6" />
          </button>
          
          {isLayerMenuOpen && (
            <div className="absolute top-0 right-14 w-64 max-w-[288px] origin-top-right rounded-[1.5rem] glass-panel p-2 shadow-2xl animate-fade-in-down z-50" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col gap-1">
                {/* Lộ trình hành trình */}
                <div onClick={() => setShowTourRoute(!showTourRoute)} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${showTourRoute ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}><Compass className="w-5 h-5" /></div>
                    <span className="text-sm font-bold text-slate-800">{t("social.tourRoute", "Tour Route")}</span>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${showTourRoute ? 'bg-brand' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300 ${showTourRoute ? 'translate-x-5' : 'translate-x-[2px]'}`} />
                  </div>
                </div>

                {/* Vị trí staff/khách */}
                <div onClick={() => setShowLiveLocations(!showLiveLocations)} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${showLiveLocations ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}><MapPin className="w-5 h-5" /></div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">{t("social.liveLocations", "Live Locations")}</span>
                    </div>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${showLiveLocations ? 'bg-brand' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300 ${showLiveLocations ? 'translate-x-5' : 'translate-x-[2px]'}`} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Left: Staff List */}
      <div className="absolute bottom-6 left-4 z-20 flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
         {visualMemberLocations.filter((m: any) => m.role === "Staff" || m.role === "Manager").map((staff: any) => {
             const isActive = activeRouteStaffId === staff.userId;
             return (
               <div 
                  key={staff.userId}
                  className={`glass-panel p-2 pr-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-lg border-2 ${isActive ? 'border-orange-400 bg-orange-50/90' : 'border-transparent hover:bg-white/90 bg-white/70'}`}
               >
                  <div className="flex items-center gap-3 w-full" onClick={() => handleStaffClick(staff)} onDoubleClick={(e) => { e.preventDefault(); handleStaffDoubleClick(staff); }}>
                      <div className="w-10 h-10 rounded-full border-2 border-emerald-500 overflow-hidden shrink-0 bg-slate-100">
                         <SafeImage src={staff.avatarUrl} alt={staff.fullName} className="w-full h-full object-cover" fallbackClassName="w-full h-full flex items-center justify-center bg-emerald-500 text-white font-bold text-sm" fallbackText={staff.fullName?.charAt(0)} />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-xs font-black text-emerald-600 uppercase">{(staff.role || "STAFF")}</span>
                         <span className="text-sm font-bold text-slate-800 whitespace-nowrap">{staff.fullName}</span>
                      </div>
                  </div>
                  {isActive ? (
                     <button onClick={(e) => { e.stopPropagation(); setActiveRouteStaffId(null); setDirectRouteCoords([]); }} className="p-1.5 rounded-full hover:bg-orange-200 text-orange-600 transition-colors ml-2 shrink-0">
                        <X className="w-4 h-4" />
                     </button>
                  ) : (
                     <button onClick={(e) => { e.stopPropagation(); handleStaffDoubleClick(staff); }} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors ml-2 shrink-0" title="Chỉ đường tới Staff này">
                        <Navigation2 className="w-4 h-4" />
                     </button>
                  )}
               </div>
             )
         })}
      </div>

      <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-2.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (myLocation) {
              mapRef.current?.flyTo({ center: [myLocation.lng, myLocation.lat], zoom: 16, duration: 1000 });
            } else {
              handleGetCurrentLocation();
            }
          }}
          className="glass-button flex h-11 w-11 items-center justify-center rounded-full text-slate-700 bg-white/95 shadow-md border border-slate-200/80 transition-all hover:scale-105 hover:text-brand focus:outline-none backdrop-blur-md"
          title={t("social.yourLocation", "Your Location")}
        >
          <Navigation className={`h-4.5 w-4.5 ${myLocation ? 'text-brand fill-current' : 'text-slate-600'}`} />
        </button>
      </div>
      
      {!scheduleId && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-30 flex items-center justify-center">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center">
                <MapPin className="w-10 h-10 text-brand mb-2 opacity-50" />
                <h3 className="font-bold text-slate-700">{t("social.noScheduleSelected", "No schedule selected")}</h3>
                <p className="text-sm text-slate-500">{t("social.noScheduleSelectedDescShort", "Please select a schedule to track on the map")}</p>
            </div>
        </div>
      )}
    </div>
  );
};
