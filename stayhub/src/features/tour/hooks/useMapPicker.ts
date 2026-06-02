import { useCallback, useEffect, useRef, useState } from "react";
import {
  createFallbackPlace,
  getPlaceCoordinates,
  reverseGeocodePlace,
  searchPlaces,
  toPrediction,
  type MapPlace,
  type MapPrediction,
} from "../services/mapGeocoding.service";

export type MapPickerMode = "single" | "route";
export type ActivePin = "single" | "start" | "end";

type InitialLocation = {
  lat?: number;
  lng?: number;
  address?: string;
};

type MapPickerInitialData = {
  start?: InitialLocation;
  end?: InitialLocation;
  single?: InitialLocation;
};

type Coordinates = {
  lat: number;
  lng: number;
};

type LeafletLatLngTuple = [number, number];

type LeafletLatLng = {
  lat: number;
  lng: number;
};

type LeafletMouseEvent = {
  latlng: LeafletLatLng;
};

type LeafletIcon = unknown;

type LeafletLayer = {
  addTo: (map: LeafletMap) => LeafletLayer;
};

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker;
  getLatLng: () => LeafletLatLng;
  on: (event: "dragend", handler: () => void) => LeafletMarker;
  setLatLng: (latLng: LeafletLatLngTuple) => LeafletMarker;
};

type LeafletMap = {
  invalidateSize: () => void;
  on: (event: "click", handler: (event: LeafletMouseEvent) => void) => LeafletMap;
  remove: () => void;
  removeLayer: (layer: LeafletLayer) => void;
  setView: (center: LeafletLatLngTuple, zoom: number) => LeafletMap;
};

type LeafletRuntime = {
  divIcon: (options: {
    className: string;
    html: string;
    iconAnchor: LeafletLatLngTuple;
    iconSize: LeafletLatLngTuple;
  }) => LeafletIcon;
  map: (
    element: HTMLElement,
    options: { attributionControl: boolean; zoomControl: boolean },
  ) => LeafletMap;
  marker: (
    latLng: LeafletLatLngTuple,
    options: { draggable: boolean; icon: LeafletIcon },
  ) => LeafletMarker;
  polyline: (
    latLngs: LeafletLatLngTuple[],
    options: {
      color: string;
      dashArray?: string;
      opacity: number;
      weight: number;
    },
  ) => LeafletLayer;
  tileLayer: (
    url: string,
    options: { attribution: string; maxZoom: number },
  ) => LeafletLayer;
};

type WindowWithLeaflet = Window & {
  L?: LeafletRuntime;
};

type OsrmRouteResponse = {
  routes?: Array<{
    geometry?: {
      coordinates?: [number, number][];
    };
  }>;
};

const DEFAULT_LOCATION: Coordinates = { lat: 10.762622, lng: 106.660172 };
const LEAFLET_SCRIPT_ID = "stayhub-leaflet-script";
const LEAFLET_STYLE_ID = "stayhub-leaflet-style";
const LEAFLET_SCRIPT_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_STYLE_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving";

const getLeaflet = (): LeafletRuntime | undefined =>
  (window as WindowWithLeaflet).L;

const loadLeaflet = () => {
  if (getLeaflet()) return Promise.resolve();

  if (!document.getElementById(LEAFLET_STYLE_ID)) {
    const link = document.createElement("link");
    link.id = LEAFLET_STYLE_ID;
    link.rel = "stylesheet";
    link.href = LEAFLET_STYLE_URL;
    document.head.appendChild(link);
  }

  const existingScript = document.getElementById(
    LEAFLET_SCRIPT_ID,
  ) as HTMLScriptElement | null;

  if (existingScript) {
    return new Promise<void>((resolve, reject) => {
      if (getLeaflet()) {
        resolve();
        return;
      }
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Unable to load Leaflet map script.")),
        { once: true },
      );
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = LEAFLET_SCRIPT_ID;
    script.src = LEAFLET_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Leaflet map script."));
    document.head.appendChild(script);
  });
};

const hasCoordinates = (location?: InitialLocation) => {
  return (
    location?.lat != null &&
    location?.lng != null &&
    Number.isFinite(Number(location?.lat)) &&
    Number.isFinite(Number(location?.lng))
  );
};

const toCoordinates = (location?: InitialLocation): Coordinates | null => {
  if (!hasCoordinates(location)) return null;

  return {
    lat: Number(location?.lat),
    lng: Number(location?.lng),
  };
};

const createMarkerIcon = (type: ActivePin) => {
  const L = getLeaflet();
  if (!L) {
    throw new Error("Leaflet is not loaded.");
  }

  const color =
    type === "start" ? "#10b981" : type === "end" ? "#f43f5e" : "#4f46e5";
  const label = type === "start" ? "A" : type === "end" ? "B" : "";

  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 10px 24px rgba(15,23,42,.35);color:white;font-size:12px;font-weight:800;line-height:1;">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

export const useMapPicker = (
  isOpen: boolean,
  mode: MapPickerMode = "single",
  initialData?: MapPickerInitialData,
) => {
  const [activePin, setActivePin] = useState<ActivePin>(
    mode === "route" ? "start" : "single",
  );
  const activePinRef = useRef<ActivePin>(activePin);
  const [queries, setQueries] = useState<Record<ActivePin, string>>({
    single: "",
    start: "",
    end: "",
  });
  const [locations, setLocations] = useState<Record<ActivePin, MapPlace | null>>({
    single: null,
    start: null,
    end: null,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [predictions, setPredictions] = useState<MapPrediction[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const endMarkerRef = useRef<LeafletMarker | null>(null);
  const routeLayerRef = useRef<LeafletLayer | null>(null);
  const initialDataRef = useRef(initialData);
  const suggestionRequestRef = useRef(0);
  const suggestionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  useEffect(() => {
    activePinRef.current = activePin;
  }, [activePin]);

  const cleanupMap = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    mapInstanceRef.current = null;
    markerRef.current = null;
    endMarkerRef.current = null;
    routeLayerRef.current = null;
  }, []);

  const searchPlaceByNameOrAddress = useCallback(async (query: string) => {
    const places = await searchPlaces(query, 1);
    return places[0] || null;
  }, []);

  const setMarkerPosition = useCallback((pin: ActivePin, coordinates: Coordinates) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const marker = pin === "end" ? endMarkerRef.current : markerRef.current;
    marker?.setLatLng([coordinates.lat, coordinates.lng]);
    marker?.addTo(map);
  }, []);

  const applyPlaceToPin = useCallback(
    (place: MapPlace, pin: ActivePin, shouldCenter = true) => {
      const map = mapInstanceRef.current;
      const coordinates = getPlaceCoordinates(place);

      if (map && shouldCenter) {
        map.setView([coordinates.lat, coordinates.lng], 15);
      }

      setMarkerPosition(pin, coordinates);
      setLocations((prev) => ({ ...prev, [pin]: place }));
      setQueries((prev) => ({
        ...prev,
        [pin]: place.name || place.formatted_address,
      }));
      setSearchError(null);
    },
    [setMarkerPosition],
  );

  const reverseGeocode = useCallback(
    async (coordinates: Coordinates, pin: ActivePin, switchPin = false) => {
      setIsSearching(true);
      setPredictions([]);

      try {
        const place = await reverseGeocodePlace(coordinates);
        setLocations((prev) => ({ ...prev, [pin]: place }));
        setQueries((prev) => ({
          ...prev,
          [pin]: place.name || place.formatted_address,
        }));
        setSearchError(null);

        if (switchPin && mode === "route") {
          if (pin === "start") {
            activePinRef.current = "end";
            setActivePin("end");
          }
          if (pin === "end") {
            activePinRef.current = "start";
            setActivePin("start");
          }
        }
      } catch (error) {
        console.error("Reverse geocoding failed", error);
        const fallbackPlace = createFallbackPlace(coordinates);
        setLocations((prev) => ({ ...prev, [pin]: fallbackPlace }));
        setQueries((prev) => ({
          ...prev,
          [pin]: fallbackPlace.formatted_address,
        }));
        setSearchError("Could not resolve full address. Coordinates were saved.");
      } finally {
        setIsSearching(false);
      }
    },
    [mode],
  );

  const initInitialPin = useCallback(
    async (
      pin: ActivePin,
      marker: LeafletMarker,
      fallbackCoordinates: Coordinates,
      initial?: InitialLocation,
    ) => {
      const coordinates = toCoordinates(initial) || fallbackCoordinates;
      marker.setLatLng([coordinates.lat, coordinates.lng]);

      if (initial?.address) {
        setQueries((prev) => ({ ...prev, [pin]: initial.address || "" }));
      }

      if (toCoordinates(initial)) {
        await reverseGeocode(coordinates, pin);
        return;
      }

      if (initial?.address) {
        try {
          const place = await searchPlaceByNameOrAddress(initial.address);
          if (place) {
            applyPlaceToPin(place, pin, pin !== "end");
            return;
          }
        } catch (error) {
          console.error("Initial map search failed", error);
        }
      }

      await reverseGeocode(coordinates, pin);
    },
    [applyPlaceToPin, reverseGeocode, searchPlaceByNameOrAddress],
  );

  const initMap = useCallback(() => {
    const L = getLeaflet();
    if (!mapRef.current || !L) return;

    cleanupMap();

    const initial = initialDataRef.current;
    const startLoc = toCoordinates(initial?.start) || DEFAULT_LOCATION;
    const endLoc = toCoordinates(initial?.end) || {
      lat: DEFAULT_LOCATION.lat,
      lng: DEFAULT_LOCATION.lng + 0.045,
    };
    const singleLoc = toCoordinates(initial?.single) || DEFAULT_LOCATION;
    const mapCenter = mode === "route" ? startLoc : singleLoc;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([mapCenter.lat, mapCenter.lng], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const primaryMarkerCoordinates: LeafletLatLngTuple =
      mode === "route"
        ? [startLoc.lat, startLoc.lng]
        : [singleLoc.lat, singleLoc.lng];

    const marker = L.marker(primaryMarkerCoordinates, {
      draggable: true,
      icon: createMarkerIcon(mode === "route" ? "start" : "single"),
    }).addTo(map);

    const endMarker = L.marker([endLoc.lat, endLoc.lng], {
      draggable: true,
      icon: createMarkerIcon("end"),
    });

    if (mode === "route") {
      endMarker.addTo(map);
    }

    mapInstanceRef.current = map;
    markerRef.current = marker;
    endMarkerRef.current = endMarker;

    window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    if (mode === "route") {
      void initInitialPin("start", marker, startLoc, initial?.start);
      void initInitialPin("end", endMarker, endLoc, initial?.end);
    } else {
      void initInitialPin("single", marker, singleLoc, initial?.single);
    }

    map.on("click", (event: LeafletMouseEvent) => {
      const coordinates = {
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      };
      const currentPin = activePinRef.current;

      setMarkerPosition(currentPin, coordinates);
      void reverseGeocode(coordinates, currentPin, true);
    });

    marker.on("dragend", () => {
      const latLng = marker.getLatLng();
      void reverseGeocode(
        { lat: latLng.lat, lng: latLng.lng },
        mode === "route" ? "start" : "single",
      );
    });

    endMarker.on("dragend", () => {
      const latLng = endMarker.getLatLng();
      void reverseGeocode({ lat: latLng.lat, lng: latLng.lng }, "end");
    });
  }, [cleanupMap, initInitialPin, mode, reverseGeocode, setMarkerPosition]);

  useEffect(() => {
    if (mode !== "route" || !locations.start || !locations.end) return;

    let isCancelled = false;
    const drawRoute = async () => {
      const L = getLeaflet();
      const map = mapInstanceRef.current;
      if (!L || !map) return;

      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }

      const start = getPlaceCoordinates(locations.start as MapPlace);
      const end = getPlaceCoordinates(locations.end as MapPlace);

      try {
        const url = `${OSRM_ROUTE_URL}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Route request failed.");
        }

        const data = (await response.json()) as OsrmRouteResponse;
        const coordinates = data?.routes?.[0]?.geometry?.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length === 0) {
          throw new Error("Route geometry is empty.");
        }

        if (isCancelled) return;

        routeLayerRef.current = L.polyline(
          coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
          {
            color: "#4f46e5",
            opacity: 0.85,
            weight: 4,
          },
        ).addTo(map);
      } catch (error) {
        console.error("Route drawing failed", error);
        if (isCancelled) return;

        routeLayerRef.current = L.polyline(
          [
            [start.lat, start.lng],
            [end.lat, end.lng],
          ],
          {
            color: "#4f46e5",
            dashArray: "6 8",
            opacity: 0.7,
            weight: 3,
          },
        ).addTo(map);
      }
    };

    void drawRoute();

    return () => {
      isCancelled = true;
    };
  }, [locations.end, locations.start, mode]);

  useEffect(() => {
    if (!isOpen) {
      cleanupMap();
      return;
    }

    let isCancelled = false;

    loadLeaflet()
      .then(() => {
        if (isCancelled) return;

        setQueries({ single: "", start: "", end: "" });
        setLocations({ single: null, start: null, end: null });
        setActivePin(mode === "route" ? "start" : "single");
        activePinRef.current = mode === "route" ? "start" : "single";
        setPredictions([]);
        setSearchError(null);
        initMap();
      })
      .catch((error) => {
        console.error(error);
        setIsSearching(false);
        setSearchError("Unable to load map. Please refresh and try again.");
      });

    return () => {
      isCancelled = true;
      cleanupMap();
    };
  }, [cleanupMap, initMap, isOpen, mode]);

  useEffect(() => {
    return () => {
      if (suggestionTimerRef.current) {
        window.clearTimeout(suggestionTimerRef.current);
      }
    };
  }, []);

  const handleSearchLocation = async (pin: ActivePin) => {
    const query = queries[pin];
    if (!query.trim()) return;

    setPredictions([]);
    setIsSearching(true);
    setSearchError(null);

    try {
      const place = await searchPlaceByNameOrAddress(query);
      if (place) {
        applyPlaceToPin(place, pin);
      } else {
        setSearchError("No matching places found. Try a different keyword.");
      }
    } catch (error) {
      console.error("Location search failed", error);
      setSearchError("Location search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocateMe = () => {
    setPredictions([]);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const map = mapInstanceRef.current;

        if (map) {
          map.setView([coordinates.lat, coordinates.lng], 15);
        }

        const currentPin = activePinRef.current;
        setMarkerPosition(currentPin, coordinates);
        void reverseGeocode(coordinates, currentPin);
      },
      (error) => {
        console.error("Error getting location", error);
        setIsSearching(false);
        alert("Unable to retrieve your location. Please check your browser permissions.");
      },
    );
  };

  const handleInputChange = (value: string, pin: ActivePin) => {
    setQueries((prev) => ({ ...prev, [pin]: value }));
    activePinRef.current = pin;
    setSearchError(null);

    const query = value.trim();

    if (suggestionTimerRef.current) {
      window.clearTimeout(suggestionTimerRef.current);
    }

    if (query.length < 2) {
      setPredictions([]);
      return;
    }

    suggestionTimerRef.current = window.setTimeout(() => {
      const requestId = suggestionRequestRef.current + 1;
      suggestionRequestRef.current = requestId;

      searchPlaces(query, 5)
        .then((places) => {
          if (suggestionRequestRef.current !== requestId) return;
          setPredictions(places.map(toPrediction));
          if (places.length === 0) {
            setSearchError("No suggestions found.");
          }
        })
        .catch((error) => {
          console.error("Autocomplete search failed", error);
          if (suggestionRequestRef.current === requestId) {
            setPredictions([]);
            setSearchError("Search is temporarily unavailable. Click the map to pick a location.");
          }
        });
    }, 350);
  };

  const handleSelectPrediction = (
    placeId: string,
    description: string,
    pin: ActivePin,
  ) => {
    const selectedPlace = predictions.find((p) => p.place_id === placeId)?.place;

    setQueries((prev) => ({ ...prev, [pin]: description }));
    setPredictions([]);
    setSearchError(null);

    if (selectedPlace) {
      applyPlaceToPin(selectedPlace, pin);
      return;
    }

    setIsSearching(true);
    searchPlaceByNameOrAddress(description)
      .then((place) => {
        if (place) {
          applyPlaceToPin(place, pin);
        } else {
          setSearchError("Could not load the selected place.");
        }
      })
      .catch((error) => {
        console.error("Selected location search failed", error);
        setSearchError("Could not load the selected place.");
      })
      .finally(() => {
        setIsSearching(false);
      });
  };

  const handleFocusPin = (pin: ActivePin) => {
    if (activePin !== pin) {
      setActivePin(pin);
      activePinRef.current = pin;
      setPredictions([]);
    }

    const loc = locations[pin];
    const map = mapInstanceRef.current;
    if (loc && map) {
      const coordinates = getPlaceCoordinates(loc);
      map.setView([coordinates.lat, coordinates.lng], 16);
    }
  };

  return {
    mapRef,
    queries,
    isSearching,
    locations,
    activePin,
    searchError,
    handleSearchLocation,
    handleLocateMe,
    predictions,
    handleInputChange,
    handleSelectPrediction,
    handleFocusPin,
  };
};
