import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Type, FileText, MapPin, Map, AlertTriangle } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useUpdateScheduleItinerary } from "../hooks/useUpdateScheduleItinerary";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { MapPickerModal } from "../components/MapPickerModal";
import { TourismInformationSelector } from "../../content/components/TourismInformationSelector";
import { tourismInformationService } from "../../content/services/tourismInformation.service";
import type { TourismInformation } from "../../content/types/tourismInformation";
import { useTranslation } from "../../../contexts/LocaleContext";

export const UpdateScheduleItinerary: React.FC = () => {
  const { t } = useTranslation();
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
        locationLat: locationData.lat ?? prev.locationLat,
        locationLng: locationData.lng ?? prev.locationLng,
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

  const itineraryFields: FormField[] = useMemo(() => [
    { 
      name: "dayNumber", 
      label: t("tour.dayNumber"), 
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
            className={`w-full rounded-xl border bg-slate-50 py-2.5 px-4 text-sm text-slate-700 outline-none transition-colors focus:bg-white ${error ? "border-rose-500 focus:border-rose-500 bg-rose-50/30" : "border-slate-200 focus:border-brand"}`}
          />
          {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
        </div>
      )
    },
    {
      name: "itineraryDate",
      label: t("tour.itineraryDate"),
      type: "custom",
      required: true,
      render: (value, onChange, error, _setFormData, formData) => {
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
                className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors ${isSynced ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200" : error ? "bg-rose-50/30 border-rose-500" : "bg-slate-50 border-slate-200 focus:border-brand focus:bg-white"}`}
              />
            </div>
            {isSynced && (
              <p className="mt-1 text-xs font-medium text-slate-500">
                {t("tour.dateAutoSynced", { day: currentDayNumber })}
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
                    <span>{t("tour.suggestedPeriod")}</span>
                    <strong className="font-semibold text-slate-600">
                      {depDate.toLocaleDateString("vi-VN")}
                    </strong>{" "}
                    {t("tour.to")} <strong className="font-semibold text-slate-600">{retDate.toLocaleDateString("vi-VN")}</strong>.
                  </div>
                );
              })()}
            {isOutsideRange && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{t("tour.dateOutsideScheduleWarning")}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      name: "title",
      label: t("tour.title"),
      type: "text",
      placeholder: t("tour.itineraryTitlePlaceholder"),
      icon: <Type className="h-4 w-4" />,
      colSpan: 2,
    },
    {
      name: "description",
      label: t("common.description"),
      type: "custom",
      icon: <FileText className="h-4 w-4" />,
      colSpan: 2,
      render: (value, onChange, error) => (
        <div className="flex flex-col gap-1.5">
          <div className="prose-sm max-w-none [&>.ql-toolbar]:rounded-t-xl [&>.ql-toolbar]:border-slate-200 [&>.ql-container]:rounded-b-xl [&>.ql-container]:border-slate-200">
            <ReactQuill
              theme="snow"
              value={value || ""}
              onChange={onChange}
              placeholder={t("tour.updateItineraryDesc")}
              className={error ? "[&>.ql-container]:!border-rose-500" : ""}
            />
          </div>
          {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
        </div>
      ),
    },
    {
      name: "startDuration", 
      label: t("tour.startTime"), 
      type: "custom", 
      required: true,
      render: (value, onChange, error) => (
        <div className="flex flex-col gap-1.5">
          <input
            type="time"
            required
            onChange={(e) => onChange(e.target.value)}
            value={value ? value.substring(0, 5) : ""}
            className={`w-full rounded-xl border bg-slate-50 py-2.5 px-4 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white ${error ? "border-rose-500 bg-rose-50/30" : "border-slate-200"}`}
          />
          {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
        </div>
      )
    },
    {
      name: "endDuration", 
      label: t("tour.endTime"), 
      type: "custom", 
      required: true,
      render: (value, onChange, error) => (
        <div className="flex flex-col gap-1.5">
          <input
            type="time"
            required
            onChange={(e) => onChange(e.target.value)}
            value={value ? value.substring(0, 5) : ""}
            className={`w-full rounded-xl border bg-slate-50 py-2.5 px-4 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white ${error ? "border-rose-500 bg-rose-50/30" : "border-slate-200"}`}
          />
          {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
        </div>
      )
    },
    {
      name: "route_picker_heading", 
      label: t("tour.location"), 
      type: "custom", 
      colSpan: 2,
      render: (_value, _onChange, _error, setFormData, formData) => (
        <div className="flex items-center justify-end border-b border-slate-100 pb-3">
          <ActionButton 
            type="button" variant="secondary" onClick={() => setFormData && formData && openMapModal(setFormData, formData)} 
            className="gap-2 px-3 py-1.5 text-xs text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100"
          >
            <Map className="h-3.5 w-3.5" /> {t("tour.pickLocationOnMap")}
          </ActionButton>
        </div>
      )
    },
    {
      name: "tourismInfoId",
      label: t("tour.tourismInfo"),
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
      label: t("tour.locationName"), 
      type: "custom", 
      colSpan: 2,
      render: (value, onChange, error, setFormData) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
              <input
                type="text"
                onChange={(e) => {
                  const locationName = e.target.value;
                  onChange(locationName);
                  if (!locationName.trim() && setFormData) {
                    setFormData((prev) => ({
                      ...prev,
                      locationName: null,
                      locationLat: null,
                      locationLng: null,
                    }));
                  }
                }}
                className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white ${error ? "border-rose-500 bg-rose-50/30" : "border-slate-200"}`}
                placeholder={t("tour.typeNameOrPickMap")}
                value={value || ""}
              />
            </div>
          </div>
          {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
        </div>
      )
    },
  ], [t, schedule, itinerary, tourismInformationList]);

  if (!scheduleId) {
    return <div className="p-10 text-center text-rose-500">{t("tour.scheduleIdMissing")}</div>;
  }

  if (isScheduleLoading || isLoading) {
    return <div className="p-10 text-center text-slate-500">{t("tour.loadingItineraryDetailsMgr")}</div>;
  }

  if (fetchError || !itinerary) {
    return <div className="p-10 text-center text-rose-500">{fetchError || t("tour.scheduleItineraryNotFound")}</div>;
  }

  return (
    <>
      <DynamicForm
        title={t("tour.editScheduleItinerary", { day: itinerary.dayNumber })}
        description={t("tour.modifyScheduleItinerary", { id: scheduleId })}
        fields={itineraryFields}
        initialData={itinerary}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        serverErrors={serverErrors}
        submitText={t("tour.updateItinerary")}
      />
      <LoadingOverlay isOpen={isSubmitting} message={t("tour.updatingItinerary")} />

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
