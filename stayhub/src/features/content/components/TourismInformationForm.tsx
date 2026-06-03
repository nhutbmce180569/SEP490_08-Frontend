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
import { MapPickerModal } from "../../tour/components/MapPickerModal";
import { extractLocationFromPlace, isCoordinateOnlyAddress } from "../../tour/services/mapGeocoding.service";
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
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [currentSetFormData, setCurrentSetFormData] = useState<React.Dispatch<
    React.SetStateAction<Record<string, unknown>>
  > | null>(null);
  const [mapInitialData, setMapInitialData] = useState<{
    single?: { lat?: number; lng?: number; address?: string };
  } | null>(null);

  const openMapPicker = (
    setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>,
    formData: Record<string, unknown>,
  ) => {
    setCurrentSetFormData(() => setFormData);
    setMapInitialData({
      single: {
        address: typeof formData.address === "string" ? formData.address : "",
        lat:
          formData.latitude !== undefined && formData.latitude !== null && formData.latitude !== ""
            ? Number(formData.latitude)
            : undefined,
        lng:
          formData.longitude !== undefined &&
          formData.longitude !== null &&
          formData.longitude !== ""
            ? Number(formData.longitude)
            : undefined,
      },
    });
    setIsMapModalOpen(true);
  };

  const handleConfirmLocation = (
    locationData: ReturnType<typeof extractLocationFromPlace> | { start?: unknown; end?: unknown },
  ) => {
    if (!currentSetFormData || !locationData || "start" in locationData) return;

    currentSetFormData((prev) => ({
      ...prev,
      country: locationData.country?.trim() || TOURISM_DEFAULT_COUNTRY,
      city: locationData.city?.trim() || "",
      address: locationData.address?.trim() || "",
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
        type: "select",
        icon: <Tag className="h-4 w-4" />,
        options: typeOptions,
        colSpan: 2,
        required: true,
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
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start">
                <div className="relative min-w-0 flex-1">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    readOnly
                    onClick={() => setFormData && openMapPicker(setFormData, formData ?? {})}
                    className={`w-full min-w-0 cursor-pointer truncate rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 ${
                      error ? "border-rose-500 bg-rose-50/30" : "border-slate-200"
                    }`}
                    placeholder={t("content.pickOnMapPlaceholder")}
                    value={address}
                  />
                </div>
                <ActionButton
                  type="button"
                  variant="secondary"
                  onClick={() => setFormData && openMapPicker(setFormData, formData ?? {})}
                  className="w-full shrink-0 gap-2 border-indigo-100 bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-600 hover:border-indigo-200 hover:bg-indigo-100 hover:text-indigo-700 sm:w-auto"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="whitespace-nowrap">{t("content.pickOnMapBtn")}</span>
                </ActionButton>
              </div>

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
        label: requireImage ? t("content.coverImageRequired") : t("content.coverImageOptional"),
        type: "file",
        colSpan: 2,
        required: requireImage,
      },
    ],
    [requireImage, t, typeOptions],
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

      <MapPickerModal
        isOpen={isMapModalOpen}
        initialData={mapInitialData ?? undefined}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={handleConfirmLocation}
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
