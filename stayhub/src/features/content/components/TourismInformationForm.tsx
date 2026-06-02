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
  TOURISM_TYPE_LABELS,
} from "../types/tourismInformation";

const typeOptions = TOURISM_INFORMATION_TYPES.map((type) => ({
  label: TOURISM_TYPE_LABELS[type],
  value: type,
}));

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
  submitText = "Save",
  serverErrors,
  requireImage = false,
}) => {
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
        label: "Place Name",
        type: "text",
        placeholder: "e.g. Hoan Kiem Lake",
        icon: <Type className="h-4 w-4" />,
        colSpan: 2,
        required: true,
      },
      {
        name: "type",
        label: "Type",
        type: "select",
        icon: <Tag className="h-4 w-4" />,
        options: typeOptions,
        colSpan: 2,
        required: true,
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        placeholder: "Describe the place, highlights, and travel tips...",
        icon: <AlignLeft className="h-4 w-4" />,
        colSpan: 2,
      },
      {
        name: "address",
        label: "Location",
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
            return "Please pick a location on the map or search by place name.";
          }

          if (!city || !country) {
            return "Could not detect city or country. Try searching again or click directly on the map.";
          }

          if (!hasLat || !hasLng) {
            return "Please drop a pin on the map to save coordinates.";
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
                    placeholder="Click to search and pick on map..."
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
                  <span className="whitespace-nowrap">Pick on Map</span>
                </ActionButton>
              </div>

              {address && (
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
                  <LocationSummaryItem
                    icon={<MapPin className="h-3.5 w-3.5 shrink-0" />}
                    label="City"
                    value={city || "—"}
                  />
                  <LocationSummaryItem
                    icon={<Globe className="h-3.5 w-3.5 shrink-0" />}
                    label="Country"
                    value={country || "—"}
                  />
                  <LocationSummaryItem
                    icon={<Navigation className="h-3.5 w-3.5 shrink-0" />}
                    label="Coordinates"
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
                  Search for a place, click the map, or use your current location — city, country,
                  and coordinates are filled automatically.
                </p>
              )}

              {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
            </div>
          );
        },
      },
      {
        name: "sourceName",
        label: "Source Name",
        type: "text",
        placeholder: "e.g. Google Maps, Official Website",
        icon: <LinkIcon className="h-4 w-4" />,
      },
      {
        name: "sourceUrl",
        label: "Source URL",
        type: "text",
        placeholder: "https://example.com/place",
        icon: <LinkIcon className="h-4 w-4" />,
        validate: (value) => {
          if (!value) return undefined;
          try {
            const url = new URL(String(value));
            if (url.protocol !== "http:" && url.protocol !== "https:") {
              return "Source URL must be a valid HTTP or HTTPS URL.";
            }
          } catch {
            return "Source URL must be a valid HTTP or HTTPS URL.";
          }
          return undefined;
        },
      },
      {
        name: "imageFile",
        label: requireImage ? "Cover Image" : "Cover Image (Leave empty to keep current)",
        type: "file",
        colSpan: 2,
        required: requireImage,
      },
    ],
    [requireImage],
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
        submitText={submitText}
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
