import React, { useEffect, useMemo, useState } from "react";
import { Type, FileText, MapPin, Map } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useUpdateItinerary } from "../hooks/useUpdateItinerary";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { MapPickerModal } from "../components/MapPickerModal";
import { tourismInformationService } from "../../content/services/tourismInformation.service";
import type { TourismInformation } from "../../content/types/tourismInformation";
import { TourismInformationSelector } from "../../content/components/TourismInformationSelector";
import { useTranslation } from "../../../contexts/LocaleContext";

export const UpdateItinerary: React.FC = () => {
  const { t } = useTranslation();
  const { tourId, itineraryId, itinerary, tour, isTourLoading, isLoading, fetchError, handleSubmit, handleCancel, isSubmitting, serverErrors } = useUpdateItinerary();
  const [tourismInformationList, setTourismInformationList] = useState<TourismInformation[]>([]);

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

  const itineraryFields: FormField[] = useMemo(
    () => [
      {
        name: "title",
        label: t("tour.title"),
        type: "text",
        maxLength: 100,
        placeholder: t("tour.itineraryTitlePlaceholderTour"),
        icon: <Type className="h-4 w-4" />,
      },
      {
        name: "dayNumber",
        label: t("tour.dayNumber"),
        type: "number",
        required: true,
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
                placeholder={t("tour.describeActivities")}
                className={error ? "[&>.ql-container]:!border-rose-500" : ""}
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                    [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                    ['link'],
                    [{ 'color': [] }, { 'background': [] }],
                    ['clean']
                  ],
                }}
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
        render: (value, onChange, error) => (
          <div className="flex flex-col gap-1.5">
            <input
              type="time"
              onChange={(e) => onChange(e.target.value)}
              value={value ? value.substring(0, 5) : ""}
              className={`w-full rounded-xl border bg-slate-50 py-2.5 px-4 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white ${error ? "border-rose-500 bg-rose-50/30" : "border-slate-200"}`}
            />
            {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
          </div>
        ),
      },
      {
        name: "endDuration",
        label: t("tour.endTime"),
        type: "custom",
        render: (value, onChange, error) => (
          <div className="flex flex-col gap-1.5">
            <input
              type="time"
              onChange={(e) => onChange(e.target.value)}
              value={value ? value.substring(0, 5) : ""}
              className={`w-full rounded-xl border bg-slate-50 py-2.5 px-4 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white ${error ? "border-rose-500 bg-rose-50/30" : "border-slate-200"}`}
            />
            {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
          </div>
        ),
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
        maxLength: 255,
        render: (value, onChange, error, setFormData, formData) => (
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
                  className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white ${(error || formData?.serverErrors?.locationLat || formData?.serverErrors?.locationLng || formData?.serverErrors?.LocationLat || formData?.serverErrors?.LocationLng) ? "border-rose-500 bg-rose-50/30" : "border-slate-200"}`}
                  placeholder={t("tour.typeNameOrPickMap")}
                  value={value || ""}
                />
              </div>
              <ActionButton
                type="button"
                variant="secondary"
                onClick={() => setFormData && formData && openMapModal(setFormData, formData)}
                className="gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100 shrink-0"
              >
                <Map className="h-4 w-4" /> {t("tour.pickLocationOnMap")}
              </ActionButton>
            </div>
            {(error || formData?.serverErrors?.locationLat || formData?.serverErrors?.locationLng || formData?.serverErrors?.LocationLat || formData?.serverErrors?.LocationLng) && <span className="text-xs font-medium text-rose-500">{error || formData?.serverErrors?.locationLat || formData?.serverErrors?.locationLng || formData?.serverErrors?.LocationLat || formData?.serverErrors?.LocationLng}</span>}
          </div>
        ),
      },
    ],
    [t, tourismInformationList],
  );

  if (!tourId || !itineraryId) {
    return <div className="p-10 text-center text-rose-500">{t("tour.tourOrItineraryIdMissing")}</div>;
  }

  if (isLoading || isTourLoading) {
    return <div className="p-10 text-center text-slate-500">{t("tour.loadingItineraryDetailsMgr")}</div>;
  }

  if (fetchError || !itinerary) {
    return <div className="p-10 text-center text-rose-500">{fetchError || t("tour.itineraryNotFound")}</div>;
  }

  return (
    <>
      <DynamicForm
        title={t("tour.editItineraryDay", { day: itinerary.dayNumber })}
        description={t("tour.updateItineraryFor", { name: tour?.name || `Tour #${tourId}` })}
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
