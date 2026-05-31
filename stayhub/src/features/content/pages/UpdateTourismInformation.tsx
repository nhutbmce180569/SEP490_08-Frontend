import React from "react";
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
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { getImg } from "../../../config/api/api";
import { useUpdateTourismInformation } from "../hooks/useUpdateTourismInformation";
import {
  TOURISM_DEFAULT_COUNTRY,
  TOURISM_INFORMATION_TYPES,
  TOURISM_TYPE_LABELS,
} from "../types/tourismInformation";

const typeOptions = TOURISM_INFORMATION_TYPES.map((type) => ({
  label: TOURISM_TYPE_LABELS[type],
  value: type,
}));

export const UpdateTourismInformation: React.FC = () => {
  const {
    id,
    tourismInfo,
    isFetching,
    fetchError,
    isSubmitting,
    serverErrors,
    handleSubmit,
    handleCancel,
  } = useUpdateTourismInformation();

  if (isFetching) {
    return <div className="flex justify-center p-10 text-slate-500">Loading tourism information...</div>;
  }

  if (fetchError) {
    return <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>;
  }

  if (!tourismInfo) {
    return <div className="flex justify-center p-10 text-slate-500">Tourism information not found.</div>;
  }

  const tourismFields: FormField[] = [
    {
      name: "name",
      label: "Place Name",
      type: "text",
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
      required: true,
    },
    {
      name: "country",
      label: "Country",
      type: "text",
      icon: <Globe className="h-4 w-4" />,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      icon: <AlignLeft className="h-4 w-4" />,
      colSpan: 2,
    },
    {
      name: "address",
      label: "Address",
      type: "text",
      icon: <MapPin className="h-4 w-4" />,
      colSpan: 2,
    },
    {
      name: "city",
      label: "City",
      type: "text",
      icon: <MapPin className="h-4 w-4" />,
    },
    {
      name: "latitude",
      label: "Latitude",
      type: "number",
      icon: <Navigation className="h-4 w-4" />,
      validate: (value, formData) => {
        const hasLat = value !== undefined && value !== null && value !== "";
        const hasLng =
          formData.longitude !== undefined &&
          formData.longitude !== null &&
          formData.longitude !== "";
        if (hasLat !== hasLng) {
          return "Latitude and longitude must both be provided or both be omitted.";
        }
        if (hasLat && (Number(value) < -90 || Number(value) > 90)) {
          return "Latitude must be between -90 and 90.";
        }
        return undefined;
      },
    },
    {
      name: "longitude",
      label: "Longitude",
      type: "number",
      icon: <Navigation className="h-4 w-4" />,
      validate: (value, formData) => {
        const hasLng = value !== undefined && value !== null && value !== "";
        const hasLat =
          formData.latitude !== undefined &&
          formData.latitude !== null &&
          formData.latitude !== "";
        if (hasLat !== hasLng) {
          return "Latitude and longitude must both be provided or both be omitted.";
        }
        if (hasLng && (Number(value) < -180 || Number(value) > 180)) {
          return "Longitude must be between -180 and 180.";
        }
        return undefined;
      },
    },
    {
      name: "sourceName",
      label: "Source Name",
      type: "text",
      icon: <LinkIcon className="h-4 w-4" />,
    },
    {
      name: "sourceUrl",
      label: "Source URL",
      type: "text",
      icon: <LinkIcon className="h-4 w-4" />,
      colSpan: 2,
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
      label: "Cover Image (Leave empty to keep current)",
      type: "file",
      colSpan: 2,
    },
  ];

  return (
    <>
      <DynamicForm
        title="Update Tourism Information"
        description={`Edit details for tourism place #${id}`}
        fields={tourismFields}
        initialValues={{
          ...tourismInfo,
          country: tourismInfo.country || TOURISM_DEFAULT_COUNTRY,
          imageFile: tourismInfo.imageUrl ? getImg(tourismInfo.imageUrl) : undefined,
        }}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
        submitText="Save Changes"
      />
      <LoadingOverlay isOpen={isSubmitting} message="Updating tourism information..." />
    </>
  );
};
