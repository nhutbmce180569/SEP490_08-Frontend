import React, { useMemo, useState } from "react";
import {
  AlignLeft,
  Globe,
  Link as LinkIcon,
  MapPin,
  Navigation,
  Tag,
  Type,
} from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { InlineMapPicker } from "./InlineMapPicker";
import {
  isCoordinateOnlyAddress,
  type ExtractedLocation,
} from "../../tour/services/mapGeocoding.service";
import {
  TOURISM_DEFAULT_COUNTRY,
  TOURISM_INFORMATION_TYPES,
  type TourismInformationType,
} from "../types/tourismInformation";
import { useTranslation } from "../../../contexts/LocaleContext";

const TOURISM_TYPE_I18N: Record<TourismInformationType, string> = {
  Destination: "content.tourismTypeDestination",
  Heritage: "content.tourismTypeHeritage",
  LocalFood: "content.tourismTypeLocalFood",
  Restaurant: "content.tourismTypeRestaurant",
  Activity: "content.tourismTypeActivity",
  Other: "content.tourismTypeOther",
};

const isExtractedLocation = (
  value: ExtractedLocation | { start?: unknown; end?: unknown } | null,
): value is ExtractedLocation => Boolean(value && "address" in value);

interface TourismInformationFormProps {
  title: string;
  description?: string;
  initialValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  submitText?: string;
  serverErrors?: Record<string, string>;
  requireImage?: boolean;
}

export const TourismInformationForm: React.FC<TourismInformationFormProps> = ({
  title,
  description,
  initialValues,
  onSubmit,
  onCancel,
  submitText,
  serverErrors,
  requireImage = false,
}) => {
  const { t } = useTranslation();
  const resolvedSubmitText = submitText ?? t("common.save");
  const typeOptions = useMemo(
    () =>
      TOURISM_INFORMATION_TYPES.map((type) => ({
        label: t(TOURISM_TYPE_I18N[type]),
        value: type,
      })),
    [t],
  );
  const initialType = String(initialValues?.type || "Destination");
  const [isCustomType, setIsCustomType] = useState(
    initialType !== "" && !TOURISM_INFORMATION_TYPES.includes(initialType as any)
  );

  const handleLocationSelect = (
    setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>,
    locationData: any
  ) => {
    if (!locationData) return;
    setFormData((prev) => ({
      ...prev,
      country: locationData.country?.trim() || TOURISM_DEFAULT_COUNTRY,
      city: locationData.city?.trim() || "",
      address: locationData.address?.trim() || locationData.formatted_address || prev.address,
      latitude: locationData.lat,
      longitude: locationData.lng,
    }));
  };

  const tourismFields: FormField[] = useMemo(
    () => [
      {
        name: "name",
        label: t("content.placeName"),
        type: "text",
        placeholder: t("content.placeNamePlaceholder"),
        icon: <Type className="h-4 w-4" />,
        colSpan: 2,
        required: true,
      },
      {
        name: "type",
        label: t("content.type"),
        type: "custom",
        colSpan: 2,
        required: true,
        render: (value, onChange, error) => {
          const stringValue = String(value || "");

          return (
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  className={`w-full appearance-none rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors hover:bg-slate-100 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 ${
                    error ? "border-rose-500 bg-rose-50/30" : "border-slate-200"
                  }`}
                  value={isCustomType ? "CUSTOM_TYPE_OPTION" : stringValue}
                  onChange={(e) => {
                    if (e.target.value === "CUSTOM_TYPE_OPTION") {
                      setIsCustomType(true);
                      onChange("");
                    } else {
                      setIsCustomType(false);
                      onChange(e.target.value);
                    }
                  }}
                >
                  <option value="" disabled>
                    {t("content.type")}
                  </option>
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  <option value="CUSTOM_TYPE_OPTION">
                    {t("content.customOption")}
                  </option>
                </select>
              </div>

              {isCustomType && (
                <div className="relative flex-1">
                  <input
                    type="text"
                    className={`input-field w-full py-2.5 px-4 text-sm ${
                      error ? "!border-rose-500 bg-rose-50/30" : ""
                    }`}
                    placeholder={t("content.enterCustomType")}
                    value={stringValue}
                    onChange={(e) => onChange(e.target.value)}
                  />
                </div>
              )}
            </div>
          );
        },
      },
      {
        name: "description",
        label: t("content.descriptionLabel"),
        type: "textarea",
        placeholder: t("content.describePlacePlaceholder"),
        icon: <AlignLeft className="h-4 w-4" />,
        colSpan: 2,
      },
      {
        name: "address",
        label: t("content.location"),
        type: "custom",
        colSpan: 2,
        required: true,
        validate: (_value, formData) => {
          const address = formData.address ? String(formData.address).trim() : "";
          const city = formData.city ? String(formData.city).trim() : "";
          const country = formData.country ? String(formData.country).trim() : "";
          const hasLat =
            formData.latitude !== undefined &&
            formData.latitude !== null &&
            formData.latitude !== "";
          const hasLng =
            formData.longitude !== undefined &&
            formData.longitude !== null &&
            formData.longitude !== "";

          if (!address || isCoordinateOnlyAddress(address)) {
            return t("content.locationPickRequired");
          }

          if (!city || !country) {
            return t("content.locationCityCountryRequired");
          }

          if (!hasLat || !hasLng) {
            return t("content.locationCoordinatesRequired");
          }

          return undefined;
        },
        render: (value, _onChange, error, setFormData, formData) => {
          const address = String(value || "");
          const city = formData?.city ? String(formData.city) : "";
          const country = formData?.country ? String(formData.country) : "";
          const hasCoordinates =
            formData?.latitude !== undefined &&
            formData?.latitude !== null &&
            formData?.latitude !== "" &&
            formData?.longitude !== undefined &&
            formData?.longitude !== null &&
            formData?.longitude !== "";

          return (
            <div className="flex min-w-0 flex-col gap-2">
              <InlineMapPicker
                initialLat={formData?.latitude ? Number(formData.latitude) : undefined}
                initialLng={formData?.longitude ? Number(formData.longitude) : undefined}
                initialAddress={address}
                onLocationSelect={(loc) => {
                  if (setFormData) {
                    handleLocationSelect(setFormData, loc);
                  }
                }}
              />

              {address && (
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
                  <LocationSummaryItem
                    icon={<MapPin className="h-3.5 w-3.5 shrink-0" />}
                    label={t("tour.city")}
                    value={city || "—"}
                  />
                  <LocationSummaryItem
                    icon={<Globe className="h-3.5 w-3.5 shrink-0" />}
                    label={t("tour.country")}
                    value={country || "—"}
                  />
                  <LocationSummaryItem
                    icon={<Navigation className="h-3.5 w-3.5 shrink-0" />}
                    label={t("content.coordinates")}
                    value={
                      hasCoordinates
                        ? `${formData.latitude}, ${formData.longitude}`
                        : "—"
                    }
                    mono
                  />
                </div>
              )}

              {!address && (
                <p className="text-xs text-slate-500">
                  {t("content.locationHintAutoFill")}
                </p>
              )}

              {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
            </div>
          );
        },
      },
      {
        name: "latitude",
        label: t("content.latitude") || "Vĩ độ (Latitude)",
        type: "text",
        placeholder: "Ví dụ: 10.0588",
        icon: <Navigation className="h-4 w-4" />,
        colSpan: 1,
        validate: (value) => {
          if (value === undefined || value === null || value === "") return undefined;
          const num = Number(value);
          if (Number.isNaN(num) || num < -90 || num > 90) {
            return t("content.latitudeInvalid") || "Vĩ độ phải là số từ -90 đến 90.";
          }
          return undefined;
        }
      },
      {
        name: "longitude",
        label: t("content.longitude") || "Kinh độ (Longitude)",
        type: "text",
        placeholder: "Ví dụ: 104.0355",
        icon: <Navigation className="h-4 w-4" />,
        colSpan: 1,
        validate: (value) => {
          if (value === undefined || value === null || value === "") return undefined;
          const num = Number(value);
          if (Number.isNaN(num) || num < -180 || num > 180) {
            return t("content.longitudeInvalid") || "Kinh độ phải là số từ -180 đến 180.";
          }
          return undefined;
        }
      },
      {
        name: "sourceName",
        label: t("content.sourceName"),
        type: "text",
        placeholder: t("content.sourceNamePlaceholder"),
        icon: <LinkIcon className="h-4 w-4" />,
      },
      {
        name: "sourceUrl",
        label: t("content.sourceUrlLabel"),
        type: "text",
        placeholder: t("content.sourceUrlPlaceholder"),
        icon: <LinkIcon className="h-4 w-4" />,
        validate: (value) => {
          if (!value) return undefined;
          try {
            const url = new URL(String(value));
            if (url.protocol !== "http:" && url.protocol !== "https:") {
              return t("content.sourceUrlInvalid");
            }
          } catch {
            return t("content.sourceUrlInvalid");
          }
          return undefined;
        },
      },
      {
        name: "imageFile",
        label: requireImage ? t("content.coverImageRequired") : t("content.image") || "Image",
        type: "file",
        colSpan: 2,
        required: requireImage,
      },
    ],
    [requireImage, t, typeOptions, isCustomType],
  );

  return (
    <>
      <DynamicForm
        title={title}
        description={description}
        fields={tourismFields}
        initialValues={{
          type: "Destination",
          ...initialValues,
        }}
        onSubmit={onSubmit}
        serverErrors={serverErrors}
        onCancel={onCancel}
        submitText={resolvedSubmitText}
      />
    </>
  );
};

const LocationSummaryItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}> = ({ icon, label, value, mono = false }) => (
  <div className="min-w-0">
    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
      {icon}
      {label}
    </div>
    <div
      className={`break-words text-sm font-medium text-slate-800 ${mono ? "font-mono text-xs leading-relaxed" : ""}`}
    >
      {value}
    </div>
  </div>
);
