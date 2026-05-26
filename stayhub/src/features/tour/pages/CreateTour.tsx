import React, { useState } from "react";
import { FileText, Tag, MapPin, Layers } from "lucide-react";
import {
  DynamicForm,
  type FormField,
} from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCreateTour } from "../hooks/useCreateTour";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { MapPickerModal } from "../components/MapPickerModal";

export const CreateTour: React.FC = () => {
  const {
    handleSubmit,
    handleCancel,
    isSubmitting,
    serverErrors,
    categoryOptions,
  } = useCreateTour();

  // --- STATE MAP SEARCH ---
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [currentSetFormData, setCurrentSetFormData] = useState<React.Dispatch<
    React.SetStateAction<Record<string, any>>
  > | null>(null);
  const [mapInitialData, setMapInitialData] = useState<any>(null);

  const handleConfirmLocation = (locationData: any) => {
    if (currentSetFormData) {
      currentSetFormData((prev) => ({
        ...prev,
        country: locationData.country,
        city: locationData.city,
        address: locationData.address,
      }));
    }
  };

  const tourFields: FormField[] = [
    {
      name: "name",
      label: "Tour Name",
      type: "text",
      placeholder: "e.g. Ha Long Bay Cruise 2 Days 1 Night",
      colSpan: 2,
      required: true,
    },
    {
      name: "categoryId",
      label: "Category",
      type: "select",
      icon: <Layers className="h-4 w-4" />,
      options: categoryOptions,
      required: true,
    },
    {
      name: "status",
      label: "Status",
      type: "custom",
      render: () => (
        <div className="flex flex-col gap-1.5">
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              disabled
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-slate-500 outline-none"
              value="Inactive"
            >
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <span className="text-[11.5px] font-medium text-amber-600">
            Tour is created as "Inactive" by default. Please verify details and
            activate it later in the details page.
          </span>
        </div>
      ),
    },
    {
      name: "address",
      label: "Full Address",
      type: "custom",
      colSpan: 2,
      required: true,
      render: (value, onChange, error, setFormData) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                readOnly
                onClick={() => {
                  setCurrentSetFormData(() => setFormData);
                  setMapInitialData({ single: { address: value || "" } });
                  setIsMapModalOpen(true);
                }}
                className={`w-full cursor-pointer rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 ${error ? "border-rose-500 bg-rose-50/30" : "border-slate-200"}`}
                placeholder="Click to pick on map..."
                value={value || ""}
              />
            </div>
            <ActionButton
              type="button"
              variant="secondary"
              onClick={() => {
                setCurrentSetFormData(() => setFormData);
                setMapInitialData({ single: { address: value || "" } });
                setIsMapModalOpen(true);
              }}
              className="gap-2 px-3 py-2 text-sm font-semibold text-indigo-600 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-200 hover:text-indigo-700"
            >
              <MapPin className="h-4 w-4" /> Pick on Map
            </ActionButton>
          </div>
          {error && (
            <span className="text-xs font-medium text-rose-500">{error}</span>
          )}
        </div>
      ),
    },
    {
      name: "city",
      label: "City",
      type: "text",
      placeholder: "Auto-filled from map...",
      icon: <MapPin className="h-4 w-4" />,
      required: true, readOnly: true
    },
    {
      name: "country",
      label: "Country",
      type: "text",
      placeholder: "Auto-filled from map...",
      icon: <MapPin className="h-4 w-4" />,
      required: true, readOnly: true
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Write a detailed description about the tour...",
      icon: <FileText className="h-4 w-4" />,
      colSpan: 2,
    },
    {
      name: "image",
      label: "Tour Image",
      type: "file",
      colSpan: 2,
    },
  ];

  return (
    <>
      <DynamicForm
        title="Create New Tour"
        description="Fill in the details below to publish a new tour."
        fields={tourFields}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
        initialValues={{ status: "Inactive" }}
        submitText="Save Tour"
        cancelText="Cancel"
      />
      <LoadingOverlay isOpen={isSubmitting} message="Creating tour..." />

      <MapPickerModal
        isOpen={isMapModalOpen}
        initialData={mapInitialData}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={handleConfirmLocation}
      />
    </>
  );
};
