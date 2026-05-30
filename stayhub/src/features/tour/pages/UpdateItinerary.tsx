import React, { useEffect, useState } from "react";
import { Type, FileText, MapPin, Map } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useUpdateItinerary } from "../hooks/useUpdateItinerary";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { MapPickerModal } from "../components/MapPickerModal";
import { tourismInformationService } from "../../content/services/tourismInformation.service";
import type { TourismInformation } from "../../content/types/tourismInformation";
import { TourismInformationSelector } from "../../content/components/TourismInformationSelector";

export const UpdateItinerary: React.FC = () => {
  const { tourId, itineraryId, itinerary, tour, isTourLoading, isLoading, fetchError, handleSubmit, handleCancel, isSubmitting, serverErrors } = useUpdateItinerary();
  const [tourismInformationList, setTourismInformationList] = useState<TourismInformation[]>([]);

  // --- STATE CHO MAP PICKER ---
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [currentSetFormData, setCurrentSetFormData] = useState<React.Dispatch<React.SetStateAction<Record<string, any>>> | null>(null);
  const [mapInitialData, setMapInitialData] = useState<any>(null);

  useEffect(() => {
    tourismInformationService
      .getActiveList()
      .then(setTourismInformationList)
      .catch(() => setTourismInformationList([]));
  }, []);

  const handleConfirmLocation = (locationData: any) => {
    if (currentSetFormData) {
      currentSetFormData((prev) => ({
        ...prev,
        locationName: locationData.locationName || locationData.address || prev.locationName,
        locationLat: locationData.lat || prev.locationLat,
        locationLng: locationData.lng || prev.locationLng,
      }));
    }
  };

  const openMapModal = (setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>, formData: Record<string, any>) => {
    setCurrentSetFormData(() => setFormData);
    setMapInitialData({
      single: { lat: formData.locationLat, lng: formData.locationLng, address: formData.locationName }
    });
    setIsMapModalOpen(true);
  };

  const itineraryFields: FormField[] = [
    { 
      name: "dayNumber", 
      label: "Day Number", 
      type: "number", 
      required: true
    },
    { 
      name: "title", 
      label: "Title", 
      type: "text", 
      placeholder: "e.g., Arrival and City Tour",
      icon: <Type className="h-4 w-4" />
    },
    { 
      name: "description", 
      label: "Description", 
      type: "textarea", 
      placeholder: "Describe the activities for this day...",
      icon: <FileText className="h-4 w-4" />, 
      colSpan: 2 
    },
    { 
      name: "startDuration", 
      label: "Start Time", 
      type: "custom", 
      render: (value, onChange, error) => (
        <div className="flex flex-col gap-1.5">
          <input
            type="time"
            onChange={(e) => onChange(e.target.value)}
            value={value ? value.substring(0, 5) : ""}
            className={`w-full rounded-xl border bg-slate-50 py-2.5 px-4 text-sm text-slate-700 outline-none transition-colors focus:border-[#4880ff] focus:bg-white ${error ? "border-rose-500 bg-rose-50/30" : "border-slate-200"}`}
          />
          {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
        </div>
      )
    },
    { 
      name: "endDuration", 
      label: "End Time", 
      type: "custom", 
      render: (value, onChange, error) => (
        <div className="flex flex-col gap-1.5">
          <input
            type="time"
            onChange={(e) => onChange(e.target.value)}
            value={value ? value.substring(0, 5) : ""}
            className={`w-full rounded-xl border bg-slate-50 py-2.5 px-4 text-sm text-slate-700 outline-none transition-colors focus:border-[#4880ff] focus:bg-white ${error ? "border-rose-500 bg-rose-50/30" : "border-slate-200"}`}
          />
          {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
        </div>
      )
    },
    { 
      name: "location_picker_heading", 
      label: "Location", 
      type: "custom", 
      colSpan: 2,
      render: (_value, _onChange, _error, setFormData, formData) => (
        <div className="flex items-center justify-end border-b border-slate-100 pb-3">
          <ActionButton 
            type="button" variant="secondary" onClick={() => setFormData && formData && openMapModal(setFormData, formData)} 
            className="gap-2 px-3 py-1.5 text-xs text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100"
          >
            <Map className="h-3.5 w-3.5" /> Pick Location on Map
          </ActionButton>
        </div>
      )
    },
    {
      name: "tourismInfoId",
      label: "Tourism Info",
      type: "custom",
      colSpan: 2,
      render: (value, onChange, error, setFormData) => (
        <TourismInformationSelector
          items={tourismInformationList}
          value={value === "" || value === null || value === undefined ? null : Number(value)}
          error={error}
          onChange={(selectedTourismInfo) => {
            const nextValue = selectedTourismInfo?.id ?? null;
            onChange(nextValue);

            if (setFormData && selectedTourismInfo) {
              setFormData((prev) => ({
                ...prev,
                tourismInfoId: nextValue,
                locationName: selectedTourismInfo.address || selectedTourismInfo.name,
                locationLat: selectedTourismInfo.latitude ?? prev.locationLat,
                locationLng: selectedTourismInfo.longitude ?? prev.locationLng,
              }));
            }
          }}
        />
      ),
    },
    { 
      name: "locationName", 
      label: "Location Name", 
      type: "custom", 
      colSpan: 2,
      validate: (_value, formData) => {
        if (!formData.locationLat || !formData.locationLng) return "Please pick a location from map.";
        return undefined;
      },
      render: (value, onChange, error, _setFormData, _formData) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
              <input
                type="text"
                onChange={(e) => onChange(e.target.value)}
                className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-[#4880ff] focus:bg-white ${error ? "border-rose-500 bg-rose-50/30" : "border-slate-200"}`}
                placeholder="Type name or pick on map..."
                value={value || ""}
              />
            </div>
          </div>
          {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
        </div>
      )
    },
  ];

  if (!tourId || !itineraryId) {
    return <div className="p-10 text-center text-rose-500">Tour ID or Itinerary ID is missing from URL.</div>;
  }

  if (isLoading || isTourLoading) {
    return <div className="p-10 text-center text-slate-500">Loading itinerary details...</div>;
  }

  if (fetchError || !itinerary) {
    return <div className="p-10 text-center text-rose-500">{fetchError || "Itinerary not found."}</div>;
  }

  return (
    <>
      <DynamicForm
        title={`Edit Itinerary (Day ${itinerary.dayNumber})`}
        description={`Update the itinerary for ${tour?.name || `Tour #${tourId}`}.`}
        fields={itineraryFields}
        initialData={itinerary}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        serverErrors={serverErrors}
        submitText="Update Itinerary"
      />
      <LoadingOverlay isOpen={isSubmitting} message="Updating itinerary..." />

      <MapPickerModal
        isOpen={isMapModalOpen}
        mode="single"
        initialData={mapInitialData}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={handleConfirmLocation}
      />
    </>
  );
};
