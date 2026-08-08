import { useCallback, useEffect, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { tStored } from "../../../i18n/tStored";
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

export type MapPickerCoordinates = {
  lat: number;
  lng: number;
};

type OsrmRouteResponse = {
  routes?: Array<{
    geometry?: {
      coordinates?: [number, number][];
    };
  }>;
};

const DEFAULT_LOCATION: MapPickerCoordinates = {
  lat: 10.762622,
  lng: 106.660172,
};
const OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving";

const hasCoordinates = (location?: InitialLocation) =>
  location?.lat != null &&
  location?.lng != null &&
  Number.isFinite(Number(location.lat)) &&
  Number.isFinite(Number(location.lng));

const toCoordinates = (
  location?: InitialLocation,
): MapPickerCoordinates | null => {
  if (!hasCoordinates(location)) return null;

  return {
    lat: Number(location?.lat),
    lng: Number(location?.lng),
  };
};

const emptyLocations = (): Record<ActivePin, MapPlace | null> => ({
  single: null,
  start: null,
  end: null,
});

const emptyQueries = (): Record<ActivePin, string> => ({
  single: "",
  start: "",
  end: "",
});

const emptyMarkerCoordinates = (): Record<
  ActivePin,
  MapPickerCoordinates | null
> => ({
  single: null,
  start: null,
  end: null,
});

export const useMapPicker = (
  isOpen: boolean,
  mode: MapPickerMode = "single",
  initialData?: MapPickerInitialData,
) => {
  const [activePin, setActivePin] = useState<ActivePin>(
    mode === "route" ? "start" : "single",
  );
  const activePinRef = useRef<ActivePin>(activePin);
  const [queries, setQueries] =
    useState<Record<ActivePin, string>>(emptyQueries);
  const [locations, setLocations] =
    useState<Record<ActivePin, MapPlace | null>>(emptyLocations);
  const [markerCoordinates, setMarkerCoordinates] = useState<
    Record<ActivePin, MapPickerCoordinates | null>
  >(emptyMarkerCoordinates);
  const [routeCoordinates, setRouteCoordinates] = useState<
    [number, number][]
  >([]);
  const [isRouteFallback, setIsRouteFallback] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [predictions, setPredictions] = useState<MapPrediction[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const mapRef = useRef<MapRef | null>(null);
  const initialDataRef = useRef(initialData);
  const suggestionRequestRef = useRef(0);
  const suggestionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (suggestionTimerRef.current) {
        window.clearTimeout(suggestionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  useEffect(() => {
    activePinRef.current = activePin;
  }, [activePin]);

  const searchPlaceByNameOrAddress = useCallback(async (query: string) => {
    const places = await searchPlaces(query, 1);
    return places[0] || null;
  }, []);

  const moveMapTo = useCallback(
    (coordinates: MapPickerCoordinates, zoom = 15) => {
      mapRef.current?.flyTo({
        center: [coordinates.lng, coordinates.lat],
        zoom,
        duration: 700,
      });
    },
    [],
  );

  const setMarkerPosition = useCallback(
    (pin: ActivePin, coordinates: MapPickerCoordinates) => {
      setMarkerCoordinates((prev) => ({ ...prev, [pin]: coordinates }));
    },
    [],
  );

  const applyPlaceToPin = useCallback(
    (place: MapPlace, pin: ActivePin, shouldCenter = true) => {
      const coordinates = getPlaceCoordinates(place);

      if (shouldCenter) {
        moveMapTo(coordinates);
      }

      setMarkerPosition(pin, coordinates);
      setLocations((prev) => ({ ...prev, [pin]: place }));
      setQueries((prev) => ({
        ...prev,
        [pin]: place.name || place.formatted_address,
      }));
      setSearchError(null);
    },
    [moveMapTo, setMarkerPosition],
  );

  const reverseGeocode = useCallback(
    async (
      coordinates: MapPickerCoordinates,
      pin: ActivePin,
      switchPin = false,
    ) => {
      setIsSearching(true);
      setPredictions([]);

      try {
        const fetchedPlace = await reverseGeocodePlace(coordinates);
        // Overwrite the coordinates of the fetched place with the exact original coordinates
        // so we don't snap to the center of the reverse-geocoded feature.
        const place = {
          ...fetchedPlace,
          geometry: {
            ...fetchedPlace.geometry,
            location: {
              lat: () => coordinates.lat,
              lng: () => coordinates.lng,
            }
          }
        };
        setLocations((prev) => ({ ...prev, [pin]: place }));
        setQueries((prev) => ({
          ...prev,
          [pin]: place.name || place.formatted_address,
        }));
        setSearchError(null);

        if (switchPin && mode === "route") {
          const nextPin = pin === "start" ? "end" : "start";
          activePinRef.current = nextPin;
          setActivePin(nextPin);
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
      fallbackCoordinates: MapPickerCoordinates,
      initial?: InitialLocation,
    ) => {
      const initialCoordinates = toCoordinates(initial);
      const coordinates = initialCoordinates || fallbackCoordinates;
      setMarkerPosition(pin, coordinates);

      if (initial?.address) {
        setQueries((prev) => ({ ...prev, [pin]: initial.address || "" }));
      }

      if (initialCoordinates) {
        if (initial?.address) {
          const place = createFallbackPlace(coordinates, { name: initial.address });
          setLocations((prev) => ({ ...prev, [pin]: place }));
        } else {
          await reverseGeocode(coordinates, pin);
        }
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
    [
      applyPlaceToPin,
      reverseGeocode,
      searchPlaceByNameOrAddress,
      setMarkerPosition,
    ],
  );

  useEffect(() => {
    if (mode !== "route" || !locations.start || !locations.end) return;

    let isCancelled = false;

    const drawRoute = async () => {
      const start = getPlaceCoordinates(locations.start as MapPlace);
      const end = getPlaceCoordinates(locations.end as MapPlace);

      try {
        const apiKey = import.meta.env.VITE_MAPBOX_TOKEN;
        if (!apiKey) throw new Error("Mapbox access token is missing.");

        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&overview=full&access_token=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Route request failed.");
        }

        const data = (await response.json()) as OsrmRouteResponse;
        const coordinates = data.routes?.[0]?.geometry?.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length === 0) {
          throw new Error("Route geometry is empty.");
        }

        if (!isCancelled) {
          setRouteCoordinates(coordinates);
          setIsRouteFallback(false);
        }
      } catch (error) {
        console.error("Route drawing failed, using straight line fallback:", error);
        if (!isCancelled) {
          setRouteCoordinates([
            [start.lng, start.lat],
            [end.lng, end.lat],
          ]);
          setIsRouteFallback(true);
        }
      }
    };

    void drawRoute();

    return () => {
      isCancelled = true;
    };
  }, [locations.end, locations.start, mode]);

  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) return;

      const initial = initialDataRef.current;
      const nextActivePin = mode === "route" ? "start" : "single";
      const startLoc = toCoordinates(initial?.start) || DEFAULT_LOCATION;
      const endLoc = toCoordinates(initial?.end) || {
        lat: DEFAULT_LOCATION.lat,
        lng: DEFAULT_LOCATION.lng + 0.045,
      };
      const singleLoc = toCoordinates(initial?.single) || DEFAULT_LOCATION;

      setQueries(emptyQueries());
      setLocations(emptyLocations());
      setMarkerCoordinates(emptyMarkerCoordinates());
      setRouteCoordinates([]);
      setIsRouteFallback(false);
      setActivePin(nextActivePin);
      activePinRef.current = nextActivePin;
      setPredictions([]);
      setSearchError(null);

      if (mode === "route") {
        void initInitialPin("start", startLoc, initial?.start);
        void initInitialPin("end", endLoc, initial?.end);
      } else {
        void initInitialPin("single", singleLoc, initial?.single);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [initInitialPin, isOpen, mode]);

  useEffect(() => {
    return () => {
      if (suggestionTimerRef.current) {
        window.clearTimeout(suggestionTimerRef.current);
      }
    };
  }, []);

  const handleMapClick = useCallback(
    (coordinates: MapPickerCoordinates) => {
      const currentPin = activePinRef.current;
      setMarkerPosition(currentPin, coordinates);
      void reverseGeocode(coordinates, currentPin, true);
    },
    [reverseGeocode, setMarkerPosition],
  );

  const handleMarkerDragEnd = useCallback(
    (pin: ActivePin, coordinates: MapPickerCoordinates) => {
      setMarkerPosition(pin, coordinates);
      void reverseGeocode(coordinates, pin);
    },
    [reverseGeocode, setMarkerPosition],
  );

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
      alert(tStored("tour.geolocationNotSupported"));
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const currentPin = activePinRef.current;

        moveMapTo(coordinates);
        setMarkerPosition(currentPin, coordinates);
        void reverseGeocode(coordinates, currentPin);
      },
      (error) => {
        console.error("Error getting location", error);
        setIsSearching(false);
        alert(tStored("tour.geolocationFailed"));
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
            setSearchError(
              "Search is temporarily unavailable. Click the map to pick a location.",
            );
          }
        });
    }, 350);
  };

  const handleSelectPrediction = (
    placeId: string,
    description: string,
    pin: ActivePin,
  ) => {
    const selectedPlace = predictions.find(
      (prediction) => prediction.place_id === placeId,
    )?.place;

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

    const coordinates = markerCoordinates[pin];
    if (coordinates) {
      moveMapTo(coordinates, 16);
    }
  };

  return {
    mapRef,
    queries,
    isSearching,
    locations,
    markerCoordinates,
    routeCoordinates,
    isRouteFallback,
    activePin,
    searchError,
    handleMapClick,
    handleMarkerDragEnd,
    handleSearchLocation,
    handleLocateMe,
    predictions,
    handleInputChange,
    handleSelectPrediction,
    handleFocusPin,
  };
};
