import React, { useState } from "react";
import { FileText, MapPin, Layers, Tag } from "lucide-react";
import {
  DynamicForm,
  type FormField,
} from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useUpdateTour } from "../hooks/useUpdateTour";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { MapPickerModal } from "../components/MapPickerModal";

export const UpdateTour: React.FC = () => {
  // Mọi logic đã nằm gọn trong hook này
  const { 
    id, 
    tour, 
    isFetching, 
    fetchError, 
    isSubmitting, 
    serverErrors, 
    handleSubmit, 
    handleCancel, 
    categoryOptions 
  } = useUpdateTour();

  // --- STATE MAP SEARCH ---
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [currentSetFormData, setCurrentSetFormData] = useState<React.Dispatch<React.SetStateAction<Record<string, any>>> | null>(null);
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

  // Hiển thị Loading/Error khi đang tải dữ liệu ban đầu
  if (isFetching)
    return (
      <div className="flex justify-center p-10 text-slate-500">
        Loading tour details...
      </div>
    );
  if (fetchError)
    return (
      <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>
    );
  if (!tour)
    return (
      <div className="flex justify-center p-10 text-slate-500">
        Tour not found.
      </div>
    );

  // Cấu hình Form (Kèm defaultValue từ API)
  const tourFields: FormField[] = [
    {
      name: "name",
      label: "Tour Name",
      type: "text",
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
      type: "select",
      icon: <Tag className="h-4 w-4" />,
      options: [
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" },
      ],
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
          {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
        </div>
      )
    },
    { 
      name: "city", label: "City", type: "text", 
      placeholder: "Auto-filled from map...", icon: <MapPin className="h-4 w-4" />, required: true, readOnly: true
    },
    { 
      name: "country", label: "Country", type: "text", 
      placeholder: "Auto-filled from map...", icon: <MapPin className="h-4 w-4" />, required: true, readOnly: true
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
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

  const initialFormValues = {
    ...tour,
    image: tour.imageUrl, // Map dữ liệu imageUrl từ BE sang field "image" của Form
  };

  return (
    <>
      <DynamicForm
        title="Update Tour"
        description={`Edit details for tour #${id}`}
        fields={tourFields}
        initialValues={initialFormValues}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        serverErrors={serverErrors}
        submitText="Update Tour"
        cancelText="Cancel"
      />
      <LoadingOverlay isOpen={isSubmitting} message="Updating tour..." />

      <MapPickerModal
        isOpen={isMapModalOpen}
        initialData={mapInitialData}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={handleConfirmLocation}
      />
    </>
  );
};
