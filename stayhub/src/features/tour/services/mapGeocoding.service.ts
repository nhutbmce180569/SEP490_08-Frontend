export type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type MapPlace = {
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
};

export type MapPrediction = {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  place?: MapPlace;
};

export type ExtractedLocation = {
  country: string;
  city: string;
  state?: string;
  address: string;
  lat?: number;
  lng?: number;
  locationName?: string;
};

type Coordinates = { lat: number; lng: number };

type MapboxContextItem = {
  name?: string;
  country_code?: string;
};

type MapboxContext = {
  country?: MapboxContextItem;
  region?: MapboxContextItem;
  district?: MapboxContextItem;
  place?: MapboxContextItem;
  locality?: MapboxContextItem;
  neighborhood?: MapboxContextItem;
  street?: MapboxContextItem;
  address?: MapboxContextItem;
};

type MapboxFeature = {
  id?: string;
  geometry?: { coordinates?: [number, number] };
  properties?: {
    mapbox_id?: string;
    name?: string;
    name_preferred?: string;
    full_address?: string;
    place_formatted?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
    context?: MapboxContext;
  };
};

type MapboxGeocodingResponse = {
  features?: MapboxFeature[];
};

const MAPBOX_GEOCODING_URL = "https://api.mapbox.com/search/geocode/v6";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const GEOCODING_TIMEOUT_MS = 8000;

const createLocation = (coordinates: Coordinates) => ({
  lat: () => coordinates.lat,
  lng: () => coordinates.lng,
});

const splitDisplayName = (displayName: string) => {
  const parts = displayName.split(",").map((part) => part.trim()).filter(Boolean);
  return {
    mainText: parts[0] || displayName,
    secondaryText: parts.slice(1).join(", "),
  };
};

const normalizeCountry = (value?: string) => {
  const normalized = (value || "").trim();
  if (!normalized) return "";
  if (/^(vietnam|viet nam|việt nam|vn)$/i.test(normalized)) return "Vietnam";
  return normalized;
};

const pickCity = (...values: Array<string | undefined>) => {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
};

const normalizeEnglishText = (value?: string) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim();

export const isCoordinateOnlyAddress = (value?: string) => {
  const normalized = (value || "").trim();
  if (!normalized) return true;
  return /^-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?$/.test(normalized);
};

const uniqueAddressParts = (...values: Array<string | undefined>) =>
  Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter(Boolean) as string[],
    ),
  );

const composeReadableAddress = ({
  name,
  street,
  district,
  locality,
  city,
  state,
  country,
}: {
  name?: string;
  street?: string;
  district?: string;
  locality?: string;
  city?: string;
  state?: string;
  country?: string;
}) => {
  const normalizedCountry = normalizeCountry(country);
  const normalizedCity = pickCity(city, locality, district, state);
  const streetLine = street?.trim();
  const placeName = name?.trim();

  const parts = uniqueAddressParts(
    streetLine,
    placeName && placeName !== streetLine ? placeName : undefined,
    district,
    locality,
    normalizedCity,
    state && state !== normalizedCity ? state : undefined,
    normalizedCountry,
  );

  if (parts.length >= 2) return parts.join(", ");
  if (normalizedCity && normalizedCountry) return `${normalizedCity}, ${normalizedCountry}`;
  if (normalizedCity) return normalizedCity;
  if (normalizedCountry) return normalizedCountry;
  if (placeName) return placeName;

  return "";
};

const createAddressComponents = (
  context?: MapboxContext,
): AddressComponent[] => {
  const components: AddressComponent[] = [];
  const country = normalizeCountry(context?.country?.name);
  const city = normalizeEnglishText(
    pickCity(
      context?.place?.name,
      context?.locality?.name,
      context?.district?.name,
      context?.region?.name,
    ),
  );
  const region = normalizeEnglishText(context?.region?.name);

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

  if (region && region !== city) {
    components.push({
      long_name: region,
      short_name: region,
      types: ["administrative_area_level_1"],
    });
  }

  return components;
};

const createPlaceFromMapboxFeature = (feature: MapboxFeature): MapPlace | null => {
  const properties = feature.properties;
  const coordinatesRaw = feature.geometry?.coordinates;
  const longitude =
    properties?.coordinates?.longitude ?? coordinatesRaw?.[0];
  const latitude =
    properties?.coordinates?.latitude ?? coordinatesRaw?.[1];

  if (longitude == null || latitude == null) return null;

  const coordinatesRawNormalized: [number, number] = [longitude, latitude];

  const coordinates = {
    lat: Number(coordinatesRawNormalized[1]),
    lng: Number(coordinatesRawNormalized[0]),
  };

  if (!Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng)) {
    return null;
  }

  const context = properties?.context;
  const name = normalizeEnglishText(
    properties?.name_preferred ||
      properties?.name ||
      context?.address?.name ||
      context?.street?.name,
  );
  const formattedAddress = normalizeEnglishText(
    properties?.full_address ||
      [name, properties?.place_formatted].filter(Boolean).join(", ") ||
      composeReadableAddress({
        name,
        street: context?.street?.name,
        district: context?.district?.name,
        locality: context?.locality?.name,
        city: context?.place?.name,
        state: context?.region?.name,
        country: context?.country?.name,
      }) ||
      `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`,
  );

  return {
    place_id:
      properties?.mapbox_id ||
      feature.id ||
      `mapbox-${coordinates.lat.toFixed(5)}-${coordinates.lng.toFixed(5)}`,
    name: name || splitDisplayName(formattedAddress).mainText,
    formatted_address: formattedAddress,
    address_components: createAddressComponents(context),
    geometry: {
      location: createLocation(coordinates),
    },
  };
};

export const createFallbackPlace = (
  coordinates: Coordinates,
  details?: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    locality?: string;
  },
): MapPlace => {
  const inVietnam =
    coordinates.lat >= 8.0 &&
    coordinates.lat <= 24.5 &&
    coordinates.lng >= 102.0 &&
    coordinates.lng <= 110.0;

  const country = normalizeCountry(details?.country) || (inVietnam ? "Vietnam" : "");
  const city = pickCity(details?.city, details?.locality, details?.state);
  const formattedAddress =
    composeReadableAddress({
      name: details?.name,
      city,
      state: details?.state,
      country,
    }) || `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;

  const components: AddressComponent[] = [];

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

  return {
    place_id: `coords-${coordinates.lat.toFixed(5)}-${coordinates.lng.toFixed(5)}`,
    name: details?.name || city || formattedAddress,
    formatted_address: formattedAddress,
    address_components: components,
    geometry: {
      location: createLocation(coordinates),
    },
  };
};

const parseAddressParts = (formattedAddress: string) => {
  if (isCoordinateOnlyAddress(formattedAddress)) {
    return { country: "", city: "" };
  }

  const parts = formattedAddress.split(",").map((part) => part.trim()).filter(Boolean);
  const country = normalizeCountry(parts[parts.length - 1]);
  const city = parts.length >= 2 ? parts[parts.length - 2] : "";
  return { country, city };
};

export const extractLocationFromPlace = (place: MapPlace | null): ExtractedLocation | null => {
  if (!place) return null;

  let country = "";
  let city = "";
  let street = "";
  const district = "";
  let state = "";

  place.address_components?.forEach((component) => {
    if (component.types.includes("country")) {
      country = normalizeCountry(component.long_name);
    }
    if (component.types.includes("route") || component.types.includes("street_address")) {
      street = component.long_name;
    }
    if (
      component.types.includes("locality") ||
      component.types.includes("administrative_area_level_2")
    ) {
      if (!city) city = component.long_name;
    }
    if (component.types.includes("administrative_area_level_1")) {
      state = component.long_name;
      if (!city) city = component.long_name;
    }
  });

  const parsed = parseAddressParts(place.formatted_address || "");
  if (!country) country = parsed.country;
  if (!city) city = parsed.city;

  country = country || "Vietnam";
  city = normalizeEnglishText(
    city ||
      state ||
      splitDisplayName(place.formatted_address).mainText ||
      "Unknown",
  );

  let address = normalizeEnglishText(place.formatted_address);
  if (isCoordinateOnlyAddress(address)) {
    address = composeReadableAddress({
      name: place.name,
      street,
      district,
      city,
      state,
      country,
    });
  }

  if (!address || isCoordinateOnlyAddress(address)) {
    address = composeReadableAddress({
      name: place.name !== city ? place.name : undefined,
      city,
      state,
      country,
    });
  }

  const latValue = place.geometry?.location?.lat;
  const lngValue = place.geometry?.location?.lng;

  return {
    country,
    city,
    state,
    address,
    lat: typeof latValue === "function" ? latValue() : latValue,
    lng: typeof lngValue === "function" ? lngValue() : lngValue,
    locationName:
      normalizeEnglishText(place.name) || splitDisplayName(address).mainText,
  };
};

const fetchMapbox = async (
  path: "forward" | "reverse",
  params: Record<string, string>,
): Promise<MapboxGeocodingResponse> => {
  if (!MAPBOX_TOKEN) {
    throw new Error("VITE_MAPBOX_TOKEN is missing.");
  }

  const url = new URL(`${MAPBOX_GEOCODING_URL}/${path}`);
  url.searchParams.set("access_token", MAPBOX_TOKEN);
  url.searchParams.set("language", "en");
  url.searchParams.set("country", "vn");
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );

  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    GEOCODING_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Mapbox geocoding request failed (${response.status}).`);
    }
    return response.json() as Promise<MapboxGeocodingResponse>;
  } finally {
    window.clearTimeout(timeout);
  }
};

const searchWithMapbox = async (
  query: string,
  limit = 5,
): Promise<MapPlace[]> => {
  const payload = await fetchMapbox("forward", {
    q: query,
    limit: String(Math.min(Math.max(limit, 1), 10)),
    autocomplete: "true",
    types: "address,street,place,locality,neighborhood,district,region",
  });

  return (payload.features || [])
    .map(createPlaceFromMapboxFeature)
    .filter(Boolean) as MapPlace[];
};

const reverseWithMapbox = async (
  coordinates: Coordinates,
): Promise<MapPlace | null> => {
  const payload = await fetchMapbox("reverse", {
    longitude: String(coordinates.lng),
    latitude: String(coordinates.lat),
  });

  const feature = payload.features?.[0];
  return feature ? createPlaceFromMapboxFeature(feature) : null;
};

const enrichPlaceAddress = (place: MapPlace): MapPlace => {
  const extracted = extractLocationFromPlace(place);
  if (!extracted || !extracted.address || isCoordinateOnlyAddress(extracted.address)) {
    return place;
  }

  return {
    ...place,
    formatted_address: extracted.address,
    name: place.name || extracted.locationName || extracted.city,
  };
};

const MAPBOX_SEARCHBOX_URL = "https://api.mapbox.com/search/searchbox/v1";
const sessionToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

const fetchMapboxSuggestions = async (
  query: string,
  limit = 5,
): Promise<any[]> => {
  if (!MAPBOX_TOKEN) {
    throw new Error("VITE_MAPBOX_TOKEN is missing.");
  }

  const url = new URL(`${MAPBOX_SEARCHBOX_URL}/suggest`);
  url.searchParams.set("q", query);
  url.searchParams.set("access_token", MAPBOX_TOKEN);
  url.searchParams.set("session_token", sessionToken);
  url.searchParams.set("language", "en");
  url.searchParams.set("country", "vn");
  url.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 10)));

  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    GEOCODING_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Mapbox suggest request failed (${response.status}).`);
    }
    const data = await response.json();
    return data.suggestions || [];
  } finally {
    window.clearTimeout(timeout);
  }
};

const fetchMapboxRetrieve = async (
  mapboxId: string,
): Promise<MapPlace> => {
  if (!MAPBOX_TOKEN) {
    throw new Error("VITE_MAPBOX_TOKEN is missing.");
  }

  const url = new URL(`${MAPBOX_SEARCHBOX_URL}/retrieve/${mapboxId}`);
  url.searchParams.set("access_token", MAPBOX_TOKEN);
  url.searchParams.set("session_token", sessionToken);
  url.searchParams.set("language", "en");

  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    GEOCODING_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Mapbox retrieve request failed (${response.status}).`);
    }
    const data = await response.json();
    const feature = data.features?.[0];
    if (!feature) {
      throw new Error("No feature found in retrieve response.");
    }
    const place = createPlaceFromMapboxFeature(feature);
    if (!place) {
      throw new Error("Failed to map retrieved feature to MapPlace.");
    }
    return enrichPlaceAddress(place);
  } finally {
    window.clearTimeout(timeout);
  }
};

export const searchPlaces = async (query: string, limit = 5): Promise<MapPlace[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const suggestions = await fetchMapboxSuggestions(trimmed, limit);
    if (suggestions.length === 0) return [];

    const places = await Promise.all(
      suggestions.map(async (s) => {
        try {
          return await fetchMapboxRetrieve(s.mapbox_id);
        } catch (e) {
          console.warn("Retrieve failed for ID:", s.mapbox_id, e);
          return null;
        }
      })
    );

    return places.filter(Boolean) as MapPlace[];
  } catch (error) {
    console.error("Mapbox Search Box search failed, falling back to geocoding...", error);
    return (await searchWithMapbox(trimmed, limit)).map(enrichPlaceAddress);
  }
};

export const reverseGeocodePlace = async (coordinates: Coordinates): Promise<MapPlace> => {
  try {
    const mapboxPlace = await reverseWithMapbox(coordinates);
    if (mapboxPlace) return enrichPlaceAddress(mapboxPlace);
  } catch (error) {
    console.warn("Mapbox reverse geocoding unavailable", error);
  }

  return createFallbackPlace(coordinates);
};

export const toPrediction = (place: MapPlace): MapPrediction => {
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

export const getPlaceCoordinates = (place: MapPlace): Coordinates => ({
  lat: place.geometry.location.lat(),
  lng: place.geometry.location.lng(),
});
