import {
  TOURISM_INFORMATION_TYPES,
  TOURISM_DEFAULT_COUNTRY,
} from "../types/tourismInformation";
import { isCoordinateOnlyAddress } from "../../tour/services/mapGeocoding.service";

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
  t: (key: string) => string,
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
    errors.name = t("content.nameRequired");
  } else if (name.length > 255) {
    errors.name = t("content.nameTooLong");
  }

  if (!type) {
    errors.type = t("content.typeRequired");
  } else if (type === "Custom") {
    const customType = String(data.customType ?? "").trim();
    if (!customType) {
      errors.customType = t("content.typeRequired");
    } else if (customType.length > 50) {
      errors.customType = t("content.typeTooLong");
    }
  } else if (type.length > 50) {
    errors.type = t("content.typeTooLong");
  }

  if (!address || isCoordinateOnlyAddress(address)) {
    errors.address = t("content.locationPickRequired");
  } else if (address.length > 255) {
    errors.address = t("content.addressTooLong");
  }

  if (!city) {
    errors.address = errors.address || t("content.locationCityCountryRequired");
  } else if (city.length > 100) {
    errors.city = t("content.cityTooLong");
  }

  if (!country) {
    errors.address = errors.address || t("content.locationCityCountryRequired");
  } else if (country.length > 100) {
    errors.country = t("content.countryTooLong");
  }

  if (address && (!hasLatitude || !hasLongitude)) {
    errors.address = errors.address || t("content.locationCoordinatesRequired");
  }

  if (hasLatitude !== hasLongitude) {
    errors.latitude = t("content.latitudeLongitudeMismatch");
    errors.longitude = t("content.latitudeLongitudeMismatch");
  }

  if (hasLatitude && hasLongitude) {
    const latitude = Number(latitudeRaw);
    const longitude = Number(longitudeRaw);

    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      errors.latitude = t("content.latitudeInvalid");
    }

    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      errors.longitude = t("content.longitudeInvalid");
    }
  }

  if (options.requireImage && !(data.imageFile instanceof File)) {
    errors.imageFile = t("content.imageRequired");
  }

  if (sourceName.length > 255) {
    errors.sourceName = t("content.sourceNameTooLong");
  }

  if (sourceUrl && !isValidHttpUrl(sourceUrl)) {
    errors.sourceUrl = t("content.sourceUrlInvalid");
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

  const baseType = String(data.type ?? "").trim();
  const finalType = baseType === "Custom" ? String(data.customType ?? "").trim() : baseType;

  return {
    name: String(data.name ?? "").trim(),
    type: finalType,
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
