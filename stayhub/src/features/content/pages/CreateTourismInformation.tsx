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
import { useCreateTourismInformation } from "../hooks/useCreateTourismInformation";
import {
  TOURISM_DEFAULT_COUNTRY,
  TOURISM_INFORMATION_TYPES,
  TOURISM_TYPE_LABELS,
} from "../types/tourismInformation";

const typeOptions = TOURISM_INFORMATION_TYPES.map((type) => ({
  label: TOURISM_TYPE_LABELS[type],
  value: type,
}));

export const CreateTourismInformation: React.FC = () => {
  const { handleSubmit, handleCancel, isSubmitting, serverErrors } = useCreateTourismInformation();

  const tourismFields: FormField[] = [
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
      required: true,
    },
    {
      name: "country",
      label: "Country",
      type: "text",
      placeholder: TOURISM_DEFAULT_COUNTRY,
      icon: <Globe className="h-4 w-4" />,
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
      label: "Address",
      type: "text",
      placeholder: "Street address",
      icon: <MapPin className="h-4 w-4" />,
      colSpan: 2,
    },
    {
      name: "city",
      label: "City",
      type: "text",
      placeholder: "e.g. Hanoi",
      icon: <MapPin className="h-4 w-4" />,
    },
    {
      name: "latitude",
      label: "Latitude",
      type: "number",
      placeholder: "e.g. 21.028511",
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
      placeholder: "e.g. 105.854444",
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
      placeholder: "e.g. Google Maps, Official Website",
      icon: <LinkIcon className="h-4 w-4" />,
    },
    {
      name: "sourceUrl",
      label: "Source URL",
      type: "text",
      placeholder: "https://example.com/place",
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
      label: "Cover Image",
      type: "file",
      colSpan: 2,
      required: true,
    },
  ];

  return (
    <>
      <DynamicForm
        title="Create Tourism Information"
        description="Add a new tourism place for tour itineraries and customer discovery."
        fields={tourismFields}
        initialValues={{ country: TOURISM_DEFAULT_COUNTRY, type: "Destination" }}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
        submitText="Create"
      />
      <LoadingOverlay isOpen={isSubmitting} message="Creating tourism information..." />
    </>
  );
};
