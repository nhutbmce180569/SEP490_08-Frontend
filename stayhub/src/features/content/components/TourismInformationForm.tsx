import React, { useMemo } from "react";
import {
  AlignLeft,
  Globe,
  Link as LinkIcon,
  MapPin,
  Navigation,
  Tag,
  Type,
} from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { InlineMapPicker } from "./InlineMapPicker";
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
        type: "select",
        colSpan: 2,
        required: true,
        options: typeOptions,
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
        label: t("content.latitude", { defaultValue: "Vĩ độ (Latitude)" }),
        type: "text",
        placeholder: "Ví dụ: 10.0588",
        icon: <Navigation className="h-4 w-4" />,
        colSpan: 1,
      },
      {
        name: "longitude",
        label: t("content.longitude", { defaultValue: "Kinh độ (Longitude)" }),
        type: "text",
        placeholder: "Ví dụ: 104.0355",
        icon: <Navigation className="h-4 w-4" />,
        colSpan: 1,
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
      },
      {
        name: "imageFile",
        label: requireImage ? t("content.coverImageRequired") : t("content.image", { defaultValue: "Image" }),
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
