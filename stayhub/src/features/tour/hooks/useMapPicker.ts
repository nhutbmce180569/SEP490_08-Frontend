import { useCallback, useEffect, useRef, useState } from "react";

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

type NominatimAddress = Record<string, string | undefined>;

type NominatimResult = {
  place_id?: number | string;
  osm_type?: string;
  osm_id?: number | string;
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  address?: NominatimAddress;
};

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type MapPlace = {
  place_id: string;
  name: string;
  formatted_address: string;
  address_components: AddressComponent[];
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  raw?: NominatimResult;
};

type MapPrediction = {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  place: MapPlace;
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
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
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

const createLocation = (coordinates: Coordinates) => ({
  lat: () => coordinates.lat,
  lng: () => coordinates.lng,
});

const splitDisplayName = (displayName: string) => {
  const [main, ...rest] = displayName.split(",").map((part) => part.trim());
  return {
    mainText: main || displayName,
    secondaryText: rest.join(", "),
  };
};

const firstAvailableAddressValue = (
  address: NominatimAddress | undefined,
  keys: string[],
) => {
  for (const key of keys) {
    const value = address?.[key];
    if (value) return value;
  }
  return "";
};

const createAddressComponents = (
  address: NominatimAddress | undefined,
): AddressComponent[] => {
  const components: AddressComponent[] = [];
  const country = address?.country;
  const city = firstAvailableAddressValue(address, [
    "city",
    "town",
    "village",
    "municipality",
    "county",
    "state_district",
    "state",
  ]);
  const state = address?.state;

  if (country) {
    components.push({
      long_name: country,
      short_name: country,
      types: ["country"],
    });
  }

  if (city) {
    components.push({
      long_name: city,
      short_name: city,
      types: ["locality"],
    });
  }

  if (state && state !== city) {
    components.push({
      long_name: state,
      short_name: state,
      types: ["administrative_area_level_1"],
    });
  }

  return components;
};

const getResultName = (result: NominatimResult) => {
  const addressName = firstAvailableAddressValue(result.address, [
    "tourism",
    "amenity",
    "building",
    "road",
    "suburb",
    "neighbourhood",
    "city",
    "town",
    "village",
  ]);

  return (
    result.name ||
    addressName ||
    splitDisplayName(result.display_name || "").mainText ||
    "Selected location"
  );
};

const hasResultCoordinates = (result: NominatimResult) => {
  return Number.isFinite(Number(result.lat)) && Number.isFinite(Number(result.lon));
};

const createPlaceFromNominatim = (result: NominatimResult): MapPlace => {
  if (!hasResultCoordinates(result)) {
    throw new Error("Location result is missing coordinates.");
  }

  const coordinates = {
    lat: Number(result.lat),
    lng: Number(result.lon),
  };
  const formattedAddress =
    result.display_name ||
    `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
  const placeId =
    result.place_id?.toString() ||
    `${result.osm_type || "osm"}-${result.osm_id || formattedAddress}`;

  return {
    place_id: placeId,
    name: getResultName(result),
    formatted_address: formattedAddress,
    address_components: createAddressComponents(result.address),
    geometry: {
      location: createLocation(coordinates),
    },
    raw: result,
  };
};

const createFallbackPlace = (coordinates: Coordinates): MapPlace => {
  const formattedAddress = `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;

  return {
    place_id: `coords-${formattedAddress}`,
    name: formattedAddress,
    formatted_address: formattedAddress,
    address_components: [],
    geometry: {
      location: createLocation(coordinates),
    },
  };
};

const getPlaceCoordinates = (place: MapPlace): Coordinates => ({
  lat: place.geometry.location.lat(),
  lng: place.geometry.location.lng(),
});

const toPrediction = (place: MapPlace): MapPrediction => {
  const { mainText, secondaryText } = splitDisplayName(place.formatted_address);

  return {
    place_id: place.place_id,
    description: place.formatted_address,
    structured_formatting: {
      main_text: place.name || mainText,
      secondary_text: secondaryText,
    },
    place,
  };
};

const fetchNominatimSearch = async (query: string, limit = 5) => {
  const url = new URL(`${NOMINATIM_BASE_URL}/search`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", query);
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "vn");
  url.searchParams.set("accept-language", "vi,en");
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Location search failed.");
  }

  const results = (await response.json()) as NominatimResult[];
  return results
    .filter(hasResultCoordinates)
    .map(createPlaceFromNominatim);
};

const fetchNominatimReverse = async (coordinates: Coordinates) => {
  const url = new URL(`${NOMINATIM_BASE_URL}/reverse`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(coordinates.lat));
  url.searchParams.set("lon", String(coordinates.lng));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "vi,en");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Reverse geocoding failed.");
  }

  const result = (await response.json()) as NominatimResult;
  if (!hasResultCoordinates(result)) {
    throw new Error("Reverse geocoding did not return coordinates.");
  }

  return createPlaceFromNominatim(result);
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

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const endMarkerRef = useRef<LeafletMarker | null>(null);
  const routeLayerRef = useRef<LeafletLayer | null>(null);
  const initialDataRef = useRef(initialData);
  const suggestionRequestRef = useRef(0);

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
    const places = await fetchNominatimSearch(query, 1);
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
    },
    [setMarkerPosition],
  );

  const reverseGeocode = useCallback(
    async (coordinates: Coordinates, pin: ActivePin, switchPin = false) => {
      setIsSearching(true);
      setPredictions([]);

      try {
        const place = await fetchNominatimReverse(coordinates);
        setLocations((prev) => ({ ...prev, [pin]: place }));
        setQueries((prev) => ({
          ...prev,
          [pin]: place.name || place.formatted_address,
        }));

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

    const marker = L.marker(
      primaryMarkerCoordinates,
      {
        draggable: true,
        icon: createMarkerIcon(mode === "route" ? "start" : "single"),
      },
    ).addTo(map);

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
        initMap();
      })
      .catch((error) => {
        console.error(error);
        setIsSearching(false);
      });

    return () => {
      isCancelled = true;
      cleanupMap();
    };
  }, [cleanupMap, initMap, isOpen, mode]);

  const handleSearchLocation = async (pin: ActivePin) => {
    const query = queries[pin];
    if (!query.trim()) return;

    setPredictions([]);
    setIsSearching(true);

    try {
      const place = await searchPlaceByNameOrAddress(query);
      if (place) {
        applyPlaceToPin(place, pin);
      }
    } catch (error) {
      console.error("Location search failed", error);
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

    const query = value.trim();
    const requestId = suggestionRequestRef.current + 1;
    suggestionRequestRef.current = requestId;

    if (query.length < 2) {
      setPredictions([]);
      return;
    }

    fetchNominatimSearch(query, 5)
      .then((places) => {
        if (suggestionRequestRef.current !== requestId) return;
        setPredictions(places.map(toPrediction));
      })
      .catch((error) => {
        console.error("Autocomplete search failed", error);
        if (suggestionRequestRef.current === requestId) {
          setPredictions([]);
        }
      });
  };

  const handleSelectPrediction = (
    placeId: string,
    description: string,
    pin: ActivePin,
  ) => {
    const selectedPlace = predictions.find((p) => p.place_id === placeId)?.place;

    setQueries((prev) => ({ ...prev, [pin]: description }));
    setPredictions([]);

    if (selectedPlace) {
      applyPlaceToPin(selectedPlace, pin);
      return;
    }

    setIsSearching(true);
    searchPlaceByNameOrAddress(description)
      .then((place) => {
        if (place) {
          applyPlaceToPin(place, pin);
        }
      })
      .catch((error) => {
        console.error("Selected location search failed", error);
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
    handleSearchLocation,
    handleLocateMe,
    predictions,
    handleInputChange,
    handleSelectPrediction,
    handleFocusPin,
  };
};
