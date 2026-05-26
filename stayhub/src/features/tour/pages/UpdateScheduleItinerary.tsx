import React, { useState } from "react";
import { Calendar, Type, FileText, MapPin, Map, AlertTriangle } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useUpdateScheduleItinerary } from "../hooks/useUpdateScheduleItinerary";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { MapPickerModal } from "../components/MapPickerModal";

export const UpdateScheduleItinerary: React.FC = () => {
  const {
    scheduleId,
    itinerary,
    schedule,
    isScheduleLoading,
    isLoading,
    fetchError,
    handleSubmit,
    handleCancel,
    isSubmitting,
    serverErrors,
  } = useUpdateScheduleItinerary();

  // --- STATE CHO MAP PICKER ---
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [currentSetFormData, setCurrentSetFormData] = useState<React.Dispatch<React.SetStateAction<Record<string, any>>> | null>(null);
  const [mapInitialData, setMapInitialData] = useState<any>(null);

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
      type: "custom", 
      required: true,
      render: (value, onChange, error, setFormData) => (
        <div className="flex flex-col gap-1.5">
          <input
            type="number"
            min="1"
            required
            value={value || ""}
            onChange={(e) => {
              const newDay = Number(e.target.value);
              onChange(newDay);
              
              if (setFormData && schedule?.tourScheduleItineraries) {
                const existingDay = schedule.tourScheduleItineraries.find((i: any) => Number(i.dayNumber) === newDay && i.id !== itinerary?.id);
                if (existingDay && existingDay.itineraryDate) {
                  setFormData((prev: any) => ({ ...prev, itineraryDate: existingDay.itineraryDate.split("T")[0] }));
                }
              }
            }}
            className={`w-full rounded-xl border bg-slate-50 py-2.5 px-4 text-sm text-slate-700 outline-none transition-colors focus:bg-white ${error ? "border-rose-500 focus:border-rose-500 bg-rose-50/30" : "border-slate-200 focus:border-[#4880ff]"}`}
          />
          {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
        </div>
      )
    },
    {
      name: "itineraryDate",
      label: "Itinerary Date",
      type: "custom",
      required: true,
      render: (value, onChange, error, setFormData, formData) => {
        const currentDayNumber = formData?.dayNumber;
        const existingWithSameDay = schedule?.tourScheduleItineraries?.find((i: any) => Number(i.dayNumber) === Number(currentDayNumber) && i.id !== itinerary?.id);
        const isSynced = !!existingWithSameDay;

        let isOutsideRange = false;
        const selectedDateStr = value ? String(value).split("T")[0] : "";
        const departureDateStr = schedule?.departureDate?.split("T")[0];
        const returnDateStr = schedule?.returnDate?.split("T")[0];

        if (selectedDateStr && departureDateStr && returnDateStr) {
          if (selectedDateStr < departureDateStr || selectedDateStr > returnDateStr) {
            isOutsideRange = true;
          }
        }

        return (
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                required
                disabled={isSynced}
                value={selectedDateStr}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors ${isSynced ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200" : error ? "bg-rose-50/30 border-rose-500" : "bg-slate-50 border-slate-200 focus:border-[#4880ff] focus:bg-white"}`}
              />
            </div>
            {isSynced && (
              <p className="mt-1 text-xs font-medium text-slate-500">
                Date is auto-synced with existing items on Day {currentDayNumber}.
              </p>
            )}
            {error && !isSynced && <span className="mt-1 block text-xs font-medium text-rose-500">{error}</span>}
            {departureDateStr &&
              returnDateStr &&
              (() => {
                const [depY, depM, depD] = departureDateStr.split("-").map(Number);
                const [retY, retM, retD] = returnDateStr.split("-").map(Number);
                const depDate = new Date(depY, depM - 1, depD);
                const retDate = new Date(retY, retM - 1, retD);

                return (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Suggested period:</span>
                    <strong className="font-semibold text-slate-600">
                      {depDate.toLocaleDateString()}
                    </strong>{" "}
                    to <strong className="font-semibold text-slate-600">{retDate.toLocaleDateString()}</strong>.
                  </div>
                );
              })()}
            {isOutsideRange && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Warning: This date is outside the original schedule period.</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      name: "title",
      label: "Title",
      type: "text",
      placeholder: "e.g., Morning city tour",
      icon: <Type className="h-4 w-4" />,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Update the itinerary description...",
      icon: <FileText className="h-4 w-4" />,
      colSpan: 2,
    },
    {
      name: "startDuration", 
      label: "Start Time", 
      type: "custom", 
      required: true,
      render: (value, onChange, error) => (
        <div className="flex flex-col gap-1.5">
          <input
            type="time"
            required
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
      required: true,
      render: (value, onChange, error) => (
        <div className="flex flex-col gap-1.5">
          <input
            type="time"
            required
            onChange={(e) => onChange(e.target.value)}
            value={value ? value.substring(0, 5) : ""}
            className={`w-full rounded-xl border bg-slate-50 py-2.5 px-4 text-sm text-slate-700 outline-none transition-colors focus:border-[#4880ff] focus:bg-white ${error ? "border-rose-500 bg-rose-50/30" : "border-slate-200"}`}
          />
          {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
        </div>
      )
    },
    {
      name: "route_picker_heading", 
      label: "Location", 
      type: "custom", 
      colSpan: 2,
      render: (value, onChange, error, setFormData, formData) => (
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
      name: "locationName", 
      label: "Location Name", 
      type: "custom", 
      colSpan: 2,
      validate: (value, formData) => {
        if (!formData.locationLat || !formData.locationLng) return "Please pick a location from map.";
        return undefined;
      },
      render: (value, onChange, error, setFormData, formData) => (
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

  if (!scheduleId) {
    return <div className="p-10 text-center text-rose-500">Schedule ID is missing from URL.</div>;
  }

  if (isScheduleLoading || isLoading) {
    return <div className="p-10 text-center text-slate-500">Loading itinerary details...</div>;
  }

  if (fetchError || !itinerary) {
    return <div className="p-10 text-center text-rose-500">{fetchError || "Schedule itinerary not found."}</div>;
  }

  return (
    <>
      <DynamicForm
        title={`Edit Schedule Itinerary (Day ${itinerary.dayNumber})`}
        description={`Modify itinerary for schedule #${scheduleId}.`}
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
