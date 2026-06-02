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
  address: string;
  lat?: number;
  lng?: number;
  locationName?: string;
};

type Coordinates = { lat: number; lng: number };

type PhotonProperties = {
  name?: string;
  country?: string;
  city?: string;
  state?: string;
  county?: string;
  district?: string;
  locality?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  osm_id?: number | string;
  osm_type?: string;
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: PhotonProperties;
};

const PHOTON_BASE_URL = "https://photon.komoot.io";
const VIETNAM_CENTER = { lat: 16.047079, lng: 108.20623 };
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const GOOGLE_SCRIPT_ID = "stayhub-google-maps-script";

let googleMapsLoadPromise: Promise<boolean> | null = null;

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

const buildFormattedAddress = (properties: PhotonProperties, coordinates: Coordinates) => {
  const streetLine = [properties.housenumber, properties.street].filter(Boolean).join(" ");
  const composed = composeReadableAddress({
    name: properties.name,
    street: streetLine,
    district: properties.district,
    locality: properties.locality,
    city: pickCity(properties.city, properties.locality, properties.district, properties.county, properties.state),
    state: properties.state,
    country: properties.country,
  });

  if (composed) return composed;

  return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
};

const createAddressComponents = (properties: PhotonProperties): AddressComponent[] => {
  const components: AddressComponent[] = [];
  const country = normalizeCountry(properties.country);
  const city = pickCity(
    properties.city,
    properties.locality,
    properties.district,
    properties.county,
    properties.state,
  );

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

  if (properties.state && properties.state !== city) {
    components.push({
      long_name: properties.state,
      short_name: properties.state,
      types: ["administrative_area_level_1"],
    });
  }

  return components;
};

const createPlaceFromPhotonFeature = (feature: PhotonFeature): MapPlace | null => {
  const coordinatesRaw = feature.geometry?.coordinates;
  if (!coordinatesRaw || coordinatesRaw.length < 2) return null;

  const coordinates = {
    lat: Number(coordinatesRaw[1]),
    lng: Number(coordinatesRaw[0]),
  };

  if (!Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng)) {
    return null;
  }

  const properties = feature.properties || {};
  const formattedAddress = buildFormattedAddress(properties, coordinates);
  const placeId = [
    properties.osm_id,
    properties.osm_type,
    properties.name,
    coordinates.lat.toFixed(5),
    coordinates.lng.toFixed(5),
  ]
    .filter(Boolean)
    .join("-");

  return {
    place_id: placeId || formattedAddress,
    name: properties.name || splitDisplayName(formattedAddress).mainText,
    formatted_address: formattedAddress,
    address_components: createAddressComponents(properties),
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
  let district = "";
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
  city = city || state || splitDisplayName(place.formatted_address).mainText || "Unknown";

  let address = place.formatted_address || "";
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
    address,
    lat: typeof latValue === "function" ? latValue() : latValue,
    lng: typeof lngValue === "function" ? lngValue() : lngValue,
    locationName: place.name || splitDisplayName(address).mainText,
  };
};

const loadGoogleMaps = async (): Promise<boolean> => {
  if (!GOOGLE_MAPS_KEY) return false;
  if (typeof window !== "undefined" && (window as Window & { google?: { maps?: unknown } }).google?.maps) {
    return true;
  }

  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = new Promise<boolean>((resolve) => {
    const existing = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean((window as Window & { google?: { maps?: unknown } }).google?.maps)), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places&language=vi&region=VN`;
    script.onload = () => resolve(Boolean((window as Window & { google?: { maps?: unknown } }).google?.maps));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
};

const createPlaceFromGoogleGeocoderResult = (
  result: {
    place_id: string;
    formatted_address: string;
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    geometry: {
      location: {
        lat: () => number;
        lng: () => number;
      };
    };
  },
): MapPlace => {
  const coordinates = {
    lat: result.geometry.location.lat(),
    lng: result.geometry.location.lng(),
  };

  const addressComponents: AddressComponent[] = result.address_components.map((component) => ({
    long_name: component.long_name,
    short_name: component.short_name,
    types: [...component.types],
  }));

  return {
    place_id: result.place_id,
    name: result.address_components[0]?.long_name || result.formatted_address,
    formatted_address: result.formatted_address,
    address_components: addressComponents,
    geometry: {
      location: createLocation(coordinates),
    },
  };
};

const searchWithGoogle = async (query: string, limit = 5): Promise<MapPlace[]> => {
  const loaded = await loadGoogleMaps();
  const googleMaps = (window as Window & { google?: { maps?: any } }).google?.maps;
  if (!loaded || !googleMaps?.places) {
    return [];
  }

  const service = new googleMaps.places.AutocompleteService();

  return new Promise((resolve) => {
    service.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: "vn" },
      },
      (predictions: any[] | null, status: string) => {
        if (status !== googleMaps.places.PlacesServiceStatus.OK || !predictions?.length) {
          resolve([]);
          return;
        }

        const geocoder = new googleMaps.Geocoder();
        const limited = predictions.slice(0, limit);

        Promise.all(
          limited.map(
            (prediction) =>
              new Promise<MapPlace | null>((resolvePlace) => {
                geocoder.geocode({ placeId: prediction.place_id }, (results: any[] | null, geoStatus: string) => {
                  if (geoStatus === "OK" && results?.[0]) {
                    resolvePlace(createPlaceFromGoogleGeocoderResult(results[0]));
                    return;
                  }
                  resolvePlace(null);
                });
              }),
          ),
        ).then((places) => resolve(places.filter(Boolean) as MapPlace[]));
      },
    );
  });
};

const reverseWithGoogle = async (coordinates: Coordinates): Promise<MapPlace | null> => {
  const loaded = await loadGoogleMaps();
  const googleMaps = (window as Window & { google?: { maps?: any } }).google?.maps;
  if (!loaded || !googleMaps) {
    return null;
  }

  const geocoder = new googleMaps.Geocoder();

  return new Promise((resolve) => {
    geocoder.geocode({ location: coordinates }, (results: any[] | null, status: string) => {
      if (status === "OK" && results?.[0]) {
        resolve(createPlaceFromGoogleGeocoderResult(results[0]));
        return;
      }
      resolve(null);
    });
  });
};

const fetchPhoton = async (path: string, params: Record<string, string>) => {
  const url = new URL(`${PHOTON_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Photon geocoding request failed.");
  }

  return response.json() as Promise<{ features?: PhotonFeature[] }>;
};

const searchWithPhoton = async (query: string, limit = 5): Promise<MapPlace[]> => {
  const payload = await fetchPhoton("/api/", {
    q: query,
    limit: String(limit),
    lang: "vi",
    lat: String(VIETNAM_CENTER.lat),
    lon: String(VIETNAM_CENTER.lng),
  });

  return (payload.features || [])
    .map(createPlaceFromPhotonFeature)
    .filter(Boolean) as MapPlace[];
};

const reverseWithPhoton = async (coordinates: Coordinates): Promise<MapPlace | null> => {
  const payload = await fetchPhoton("/reverse", {
    lat: String(coordinates.lat),
    lon: String(coordinates.lng),
    lang: "vi",
  });

  const feature = payload.features?.[0];
  return feature ? createPlaceFromPhotonFeature(feature) : null;
};

type BigDataCloudReverseResponse = {
  locality?: string;
  city?: string;
  principalSubdivision?: string;
  countryName?: string;
  plusCode?: string;
  localityInfo?: {
    administrative?: Array<{ name?: string; order?: number }>;
  };
};

const reverseWithBigDataCloud = async (coordinates: Coordinates): Promise<MapPlace | null> => {
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.searchParams.set("latitude", String(coordinates.lat));
  url.searchParams.set("longitude", String(coordinates.lng));
  url.searchParams.set("localityLanguage", "vi");

  const response = await fetch(url.toString());
  if (!response.ok) return null;

  const payload = (await response.json()) as BigDataCloudReverseResponse;
  const adminNames =
    payload.localityInfo?.administrative
      ?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((entry) => entry.name)
      .filter(Boolean) ?? [];

  const city = pickCity(payload.city, payload.locality, adminNames[adminNames.length - 1]);
  const state = payload.principalSubdivision || adminNames[adminNames.length - 2];
  const country = normalizeCountry(payload.countryName);
  const formattedAddress = composeReadableAddress({
    name: payload.locality,
    city,
    state,
    country,
  });

  if (!formattedAddress) return null;

  return createFallbackPlace(coordinates, {
    name: payload.locality,
    city,
    state,
    country,
    locality: payload.locality,
  });
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

export const searchPlaces = async (query: string, limit = 5): Promise<MapPlace[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const googleResults = await searchWithGoogle(trimmed, limit);
    if (googleResults.length > 0) return googleResults.map(enrichPlaceAddress);
  } catch (error) {
    console.warn("Google place search unavailable", error);
  }

  return (await searchWithPhoton(trimmed, limit)).map(enrichPlaceAddress);
};

export const reverseGeocodePlace = async (coordinates: Coordinates): Promise<MapPlace> => {
  try {
    const googlePlace = await reverseWithGoogle(coordinates);
    if (googlePlace) return enrichPlaceAddress(googlePlace);
  } catch (error) {
    console.warn("Google reverse geocoding unavailable", error);
  }

  try {
    const photonPlace = await reverseWithPhoton(coordinates);
    if (photonPlace) return enrichPlaceAddress(photonPlace);
  } catch (error) {
    console.warn("Photon reverse geocoding unavailable", error);
  }

  try {
    const bigDataCloudPlace = await reverseWithBigDataCloud(coordinates);
    if (bigDataCloudPlace) return enrichPlaceAddress(bigDataCloudPlace);
  } catch (error) {
    console.warn("BigDataCloud reverse geocoding unavailable", error);
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
