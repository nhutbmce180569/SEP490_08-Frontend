import React, { useEffect, useState } from "react";
import { Calendar, Type, FileText, MapPin, Map, Plus, Trash2, Save, X, Clock } from "lucide-react";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCreateItinerary } from "../hooks/useCreateItinerary";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { MapPickerModal } from "../components/MapPickerModal";
import { useToast } from "../../../contexts/ToastContext";
import { tourismInformationService } from "../../content/services/tourismInformation.service";
import type { TourismInformation } from "../../content/types/tourismInformation";
import { TourismInformationSelector } from "../../content/components/TourismInformationSelector";
import { useTranslation } from "../../../contexts/LocaleContext";

export const CreateItinerary: React.FC = () => {
  const { t } = useTranslation();
  const {
    tourId,
    tour,
    isTourLoading,
    handleSubmitBatch,
    handleCancel,
    isSubmitting,
    serverErrors,
    itineraries,
    missingDayNumbers,
    handleAddDay,
    handleRemoveDay,
    updateItinerary,
    patchItinerary,
  } = useCreateItinerary();
  const { error: showError } = useToast();
  const [tourismInformationList, setTourismInformationList] = useState<TourismInformation[]>([]);

  // --- STATE CHO MAP PICKER ---
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [pickingIndex, setPickingIndex] = useState<number | null>(null);

  useEffect(() => {
    tourismInformationService
      .getActiveList()
      .then(setTourismInformationList)
      .catch(() => setTourismInformationList([]));
  }, []);

  const openMapModal = (index: number) => {
    setPickingIndex(index);
    setIsMapModalOpen(true);
  };

  const handleConfirmLocation = (locationData: any) => {
    if (pickingIndex !== null) {
      const patch: Record<string, any> = {};
      if (locationData) {
        patch.locationName =
          locationData.locationName || locationData.address;
        patch.locationLat = locationData.lat;
        patch.locationLng = locationData.lng;
      }
      patchItinerary(pickingIndex, patch);
    }
  };

  const handleChangeTourismInfo = (index: number, selectedTourismInfo: TourismInformation | null) => {
    patchItinerary(index, {
      tourismInfoId: selectedTourismInfo?.id ?? null,
      ...(selectedTourismInfo
        ? {
            locationName: selectedTourismInfo.address || selectedTourismInfo.name,
            locationLat: selectedTourismInfo.latitude ?? undefined,
            locationLng: selectedTourismInfo.longitude ?? undefined,
          }
        : {}),
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Xác thực: Đảm bảo có toạ độ Bản đồ kể cả khi người dùng tự gõ tay Location Name
    for (let i = 0; i < itineraries.length; i++) {
      const iti = itineraries[i];
      const assignedDay = iti.dayNumber;

      if (!assignedDay || assignedDay <= 0) {
        showError(`Item ${i + 1}: Day number must be greater than 0.`);
        return;
      }

      if (!iti.locationLat || !iti.locationLng) {
        showError(`Day ${assignedDay}: Please pick a location on map.`);
        return;
      }

      if (iti.startDuration && iti.endDuration) {
        if (iti.startDuration >= iti.endDuration) {
          showError(`Day ${assignedDay} - ${iti.title || 'Item'}: End time must be strictly after start time.`);
          return;
        }
      }
    }

    const dayTimeSet = new Set<string>();
    for (const iti of itineraries) {
      if (iti.startDuration) {
        const key = `${iti.dayNumber}-${iti.startDuration}`;
        if (dayTimeSet.has(key)) {
          showError(`Day ${iti.dayNumber}: Start time ${iti.startDuration} cannot be duplicated.`);
          return;
        }
        dayTimeSet.add(key);
      }
    }

    handleSubmitBatch(itineraries);
  };

  // Hàm lấy lỗi từ BE trả về (Bắt định dạng Itineraries[0].Title của C#)
  const getError = (index: number, field: string) => {
    if (!serverErrors) return null;
    const dotNetKey = `Itineraries[${index}].${field.charAt(0).toUpperCase() + field.slice(1)}`;
    const dotNetKeyCamel = `itineraries[${index}].${field}`;
    const errorVal = serverErrors[dotNetKey] || serverErrors[dotNetKeyCamel];
    if (errorVal) {
      return Array.isArray(errorVal) ? errorVal[0] : String(errorVal);
    }
    return null;
  };

  if (!tourId) {
    return <div className="p-10 text-center text-rose-500">{t("tour.tourOrItineraryIdMissing")}</div>;
  }

  if (isTourLoading) {
    return <div className="p-10 text-center text-slate-500">{t("tour.loadingTourDetailsMgr")}</div>;
  }

  return (
    <div className="mx-auto max-w-4xl py-6">
      {/* Header Info */}
      <div className="mb-6 space-y-4 border-b border-slate-200 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="w-6/12">
            <h1 className="text-2xl font-extrabold text-slate-900">{t("tour.createItinerary")}</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {t("tour.createItineraryBatchDesc")} ({tour?.name || `Tour #${tourId}`})
            </p>
          </div>
          <div className="flex w-4/12 shrink-0 justify-end gap-3">
            <ActionButton type="button" variant="secondary" onClick={handleCancel} className="gap-2 px-5 py-2 shadow-sm">
              <X className="h-4 w-4" />
              {t("common.cancel")}
            </ActionButton>
            <ActionButton type="submit" variant="primary" onClick={onSubmit} disabled={isSubmitting} className="gap-2 px-5 py-2 shadow-sm">
              <Save className="h-4 w-4" />
              {t("tour.saveItineraries")}
            </ActionButton>
          </div>
        </div>
        {missingDayNumbers && missingDayNumbers.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mt-4">
            <p className="font-semibold">{t("tour.missingItineraryDaysTitle")}</p>
            <p>{t("tour.missingItineraryDaysTourMsg", { days: missingDayNumbers.join(", Day ") })}</p>
          </div>
        )}
      </div>

      {/* Danh sách các form Itinerary */}
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {itineraries.map((iti, index) => {
          return (
            <div key={iti.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
              
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100/50 text-indigo-600 ring-1 ring-indigo-200">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[15px] font-bold text-slate-900">{t("tour.day")}</label>
                    <input type="number" min="1" required value={iti.dayNumber} onChange={(e) => updateItinerary(index, "dayNumber", e.target.value)} className="w-16 rounded-md border border-slate-200 px-2 py-1 text-center font-bold text-slate-900 focus:border-indigo-500 focus:outline-none" />
                  </div>
                </div>
                {index > 0 && (
                  <ActionButton type="button" variant="warning" onClick={() => handleRemoveDay(index)} className="h-8 w-8 !bg-rose-50 !text-rose-500 hover:!bg-rose-100 hover:!text-rose-600 !border-transparent transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </ActionButton>
                )}
              </div>

              <div className="p-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Type className="h-4 w-4 text-slate-400" /> {t("tour.title")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={iti.title}
                      onChange={(e) => updateItinerary(index, "title", e.target.value)}
                      placeholder={t("tour.itineraryTitlePlaceholderTour")}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${getError(index, "title") ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50 focus:border-brand focus:bg-white"}`}
                    />
                    {getError(index, "title") && <span className="mt-1 block text-xs font-medium text-rose-500">{getError(index, "title")}</span>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <FileText className="h-4 w-4 text-slate-400" /> {t("common.description")} <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={iti.description}
                      onChange={(e) => updateItinerary(index, "description", e.target.value)}
                      placeholder={t("tour.describeActivities")}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${getError(index, "description") ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50 focus:border-brand focus:bg-white"}`}
                    />
                    {getError(index, "description") && <span className="mt-1 block text-xs font-medium text-rose-500">{getError(index, "description")}</span>}
                  </div>

                  <div className="sm:col-span-1">
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Clock className="h-4 w-4 text-slate-400" /> {t("tour.startTime")}
                    </label>
                    <input type="time" value={iti.startDuration ? iti.startDuration.substring(0, 5) : ""} onChange={(e) => updateItinerary(index, "startDuration", e.target.value)} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-brand focus:bg-white ${getError(index, "startDuration") ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50"}`} />
                    {getError(index, "startDuration") && <span className="mt-1 block text-xs font-medium text-rose-500">{getError(index, "startDuration")}</span>}
                  </div>

                  <div className="sm:col-span-1">
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Clock className="h-4 w-4 text-slate-400" /> {t("tour.endTime")}
                    </label>
                    <input type="time" value={iti.endDuration ? iti.endDuration.substring(0, 5) : ""} onChange={(e) => updateItinerary(index, "endDuration", e.target.value)} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-brand focus:bg-white ${getError(index, "endDuration") ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50"}`} />
                    {getError(index, "endDuration") && <span className="mt-1 block text-xs font-medium text-rose-500">{getError(index, "endDuration")}</span>}
                  </div>

                  <div className="sm:col-span-2 mt-2 flex items-center justify-between border-b border-slate-100 pb-3">
                    <label className="text-sm font-semibold text-slate-700">{t("tour.location")}</label>
                    <ActionButton type="button" variant="secondary" onClick={() => openMapModal(index)} className="gap-2 px-3 py-1.5 text-xs text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100">
                      <Map className="h-3.5 w-3.5" /> {t("tour.pickLocationOnMap")}
                    </ActionButton>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 sm:col-span-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        {t("tour.tourismInfo")}
                      </label>
                      <TourismInformationSelector
                        items={tourismInformationList}
                        value={iti.tourismInfoId ?? null}
                        onChange={(item) => handleChangeTourismInfo(index, item)}
                        error={getError(index, "tourismInfoId")}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <MapPin className="h-4 w-4 text-emerald-500" /> {t("tour.locationName")}
                      </label>
                      <div className="flex gap-2">
                        <input type="text" value={iti.locationName} onChange={(e) => updateItinerary(index, "locationName", e.target.value)} placeholder={t("tour.typeNameOrPickMap")} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-brand focus:bg-white ${getError(index, "locationName") ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50"}`} />
                      </div>
                      {getError(index, "locationName") && <span className="mt-1 block text-xs font-medium text-rose-500">{getError(index, "locationName")}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Nút thêm ngày */}
        <div className="flex justify-center pt-2 pb-10">
          <button
            type="button"
            onClick={handleAddDay}
            className="group flex items-center gap-2 rounded-full border border-dashed border-indigo-300 bg-indigo-50/50 px-6 py-3 text-sm font-semibold text-indigo-600 transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md active:scale-95"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" /> 
            {t("tour.addAnotherDay")}
          </button>
        </div>
      </form>

      <LoadingOverlay isOpen={isSubmitting} message={t("tour.savingAllItineraries")} />

      <MapPickerModal
        isOpen={isMapModalOpen}
        mode="single"
        initialData={pickingIndex !== null ? {
          single: { lat: itineraries[pickingIndex].locationLat, lng: itineraries[pickingIndex].locationLng, address: itineraries[pickingIndex].locationName }
        } : undefined}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={handleConfirmLocation}
      />
    </div>
  );
};
