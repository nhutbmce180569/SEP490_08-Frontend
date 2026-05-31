import {
  TOURISM_INFORMATION_TYPES,
  TOURISM_DEFAULT_COUNTRY,
} from "../types/tourismInformation";

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const validateTourismInformationForm = (
  data: Record<string, unknown>,
  options: { requireImage?: boolean } = {},
) => {
  const errors: Record<string, string> = {};
  const name = String(data.name ?? "").trim();
  const type = String(data.type ?? "").trim();
  const address = data.address ? String(data.address).trim() : "";
  const city = data.city ? String(data.city).trim() : "";
  const country = data.country ? String(data.country).trim() : "";
  const sourceName = data.sourceName ? String(data.sourceName).trim() : "";
  const sourceUrl = data.sourceUrl ? String(data.sourceUrl).trim() : "";
  const latitudeRaw = data.latitude;
  const longitudeRaw = data.longitude;
  const hasLatitude =
    latitudeRaw !== undefined && latitudeRaw !== null && latitudeRaw !== "";
  const hasLongitude =
    longitudeRaw !== undefined && longitudeRaw !== null && longitudeRaw !== "";

  if (!name) {
    errors.name = "Name is required.";
  } else if (name.length > 255) {
    errors.name = "Name cannot exceed 255 characters.";
  }

  if (!type) {
    errors.type = "Type is required.";
  } else if (!TOURISM_INFORMATION_TYPES.includes(type as (typeof TOURISM_INFORMATION_TYPES)[number])) {
    errors.type = `Invalid type. Allowed values: ${TOURISM_INFORMATION_TYPES.join(", ")}.`;
  }

  if (address.length > 255) {
    errors.address = "Address cannot exceed 255 characters.";
  }

  if (city.length > 100) {
    errors.city = "City cannot exceed 100 characters.";
  }

  if (country.length > 100) {
    errors.country = "Country cannot exceed 100 characters.";
  }

  if (hasLatitude !== hasLongitude) {
    errors.latitude = "Latitude and longitude must both be provided or both be omitted.";
    errors.longitude = "Latitude and longitude must both be provided or both be omitted.";
  }

  if (hasLatitude && hasLongitude) {
    const latitude = Number(latitudeRaw);
    const longitude = Number(longitudeRaw);

    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      errors.latitude = "Latitude must be between -90 and 90.";
    }

    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      errors.longitude = "Longitude must be between -180 and 180.";
    }
  }

  if (options.requireImage && !(data.imageFile instanceof File)) {
    errors.imageFile = "Image is required.";
  }

  if (sourceName.length > 255) {
    errors.sourceName = "Source name cannot exceed 255 characters.";
  }

  if (sourceUrl && !isValidHttpUrl(sourceUrl)) {
    errors.sourceUrl = "Source URL must be a valid HTTP or HTTPS URL.";
  }

  return errors;
};

export const mapTourismFormToPayload = (data: Record<string, unknown>) => {
  const latitudeRaw = data.latitude;
  const longitudeRaw = data.longitude;
  const hasLatitude =
    latitudeRaw !== undefined && latitudeRaw !== null && latitudeRaw !== "";
  const hasLongitude =
    longitudeRaw !== undefined && longitudeRaw !== null && longitudeRaw !== "";

  return {
    name: String(data.name ?? "").trim(),
    type: String(data.type ?? "").trim(),
    description: data.description ? String(data.description).trim() : undefined,
    address: data.address ? String(data.address).trim() : undefined,
    city: data.city ? String(data.city).trim() : undefined,
    country: data.country ? String(data.country).trim() : TOURISM_DEFAULT_COUNTRY,
    latitude: hasLatitude ? Number(latitudeRaw) : undefined,
    longitude: hasLongitude ? Number(longitudeRaw) : undefined,
    sourceName: data.sourceName ? String(data.sourceName).trim() : undefined,
    sourceUrl: data.sourceUrl ? String(data.sourceUrl).trim() : undefined,
  };
};
