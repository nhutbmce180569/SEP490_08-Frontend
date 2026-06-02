import React, { useEffect, useState } from "react";
import {
  Calendar,
  Type,
  FileText,
  MapPin,
  Map as MapIcon,
  Plus,
  Trash2,
  Save,
  X,
  Copy,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCreateScheduleItinerary } from "../hooks/useCreateScheduleItinerary";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { MapPickerModal } from "../components/MapPickerModal";
import { useToast } from "../../../contexts/ToastContext";
import { TourismInformationSelector } from "../../content/components/TourismInformationSelector";
import { tourismInformationService } from "../../content/services/tourismInformation.service";
import type { TourismInformation } from "../../content/types/tourismInformation";

export const CreateScheduleItinerary: React.FC = () => {
  const {
    scheduleId,
    schedule,
    isScheduleLoading,
    handleSubmitBatch,
    handleCancel,
    isSubmitting,
    serverErrors,
    itineraries,
    missingDayNumbers,
    cloneableDayNumbers,
    handleAddItinerary,
    handleRemoveItinerary,
    updateItinerary,
    patchItinerary,
    handleCloneFromTour,
    handleCloneSingleDayFromTour,
    isCloneVisible,
    isCloning,
    cloningDayIndex,
    isTourLoading,
  } = useCreateScheduleItinerary();
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

    const dateDayMap = new Map<string, number>();

    // Lấp đầy map bằng các ngày đã có trong Database
    if (schedule?.tourScheduleItineraries) {
      for (const dbIti of schedule.tourScheduleItineraries) {
        if (dbIti.itineraryDate) {
          const dateStr = dbIti.itineraryDate.split("T")[0];
          dateDayMap.set(dateStr, Number(dbIti.dayNumber));
        }
      }
    }

    // Validate
    for (let i = 0; i < itineraries.length; i++) {
      const iti = itineraries[i];
      const assignedDay = Number(iti.dayNumber);

      if (!assignedDay || assignedDay <= 0) {
        showError(`Item ${i + 1}: Day number must be greater than 0.`);
        return;
      }

      if (!iti.itineraryDate) {
        showError(`Day ${assignedDay}: Please select an itinerary date.`);
        return;
      }

      // Kiểm tra xem Ngày này đã bị một DayNumber khác chiếm chưa
      if (dateDayMap.has(iti.itineraryDate)) {
        const mappedDay = dateDayMap.get(iti.itineraryDate);
        if (mappedDay !== assignedDay) {
          showError(`Date ${iti.itineraryDate} is already assigned to Day ${mappedDay}. Different days cannot share the same date.`);
          return;
        }
      } else {
        dateDayMap.set(iti.itineraryDate, assignedDay);
      }

      if (!iti.title) {
        showError(`Day ${assignedDay}: Title is required.`);
        return;
      }
      if (!iti.startDuration) {
        showError(`Day ${assignedDay}: Start Time is required.`);
        return;
      }
      if (!iti.endDuration) {
        showError(`Day ${assignedDay}: End Time is required.`);
        return;
      }
      if (iti.startDuration >= iti.endDuration) {
        showError(`Day ${assignedDay} - ${iti.title || 'Item'}: End time must be strictly after start time.`);
        return;
      }
      if (!iti.locationLat || !iti.locationLng) {
        showError(`Day ${assignedDay}: Please pick a location on map.`);
        return;
      }
    }

    const dayTimeSet = new Set<string>();
    for (const iti of itineraries) {
      const key = `${iti.dayNumber}-${iti.startDuration}`;
      if (dayTimeSet.has(key)) {
        showError(`Day ${iti.dayNumber}: Start time ${iti.startDuration} cannot be duplicated.`);
        return;
      }
      dayTimeSet.add(key);
    }

    handleSubmitBatch(itineraries);
  };

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

  if (!scheduleId) {
    return (
      <div className="p-10 text-center text-rose-500">
        Schedule ID is missing from URL.
      </div>
    );
  }

  if (isScheduleLoading || isTourLoading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading schedule details...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-6">
      {/* Header Info */}
      <div className="mb-6 space-y-4 border-b border-slate-200 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="w-6/12">
            <h1 className="text-2xl font-extrabold text-slate-900">
              Add Schedule Itineraries
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Create multiple itinerary items for Schedule #{scheduleId}
              {schedule ? ` (Tour: ${schedule.tour?.name || `ID ${schedule.tourId}`})` : ""}
            </p>
          </div>
          <div className="flex w-4/12 shrink-0 justify-end gap-3">
            <ActionButton
              type="button"
              variant="secondary"
              onClick={handleCancel}
              className="gap-2 px-4 py-2.5 shadow-sm"
            >
              <X className="h-4 w-4" />
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              variant="primary"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="gap-1 px-6 py-2.5 shadow-sm"
            >
              <Save className="h-4 w-4" />
              Save Itineraries
            </ActionButton>
          </div>
        </div>
        {missingDayNumbers.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mt-4">
            <p className="font-semibold">Missing itinerary days detected:</p>
            <p>
              Day {missingDayNumbers.join(", Day ")} is not present in this
              schedule yet.
            </p>
            <p className="mt-1 text-[13px] text-amber-700">
              New itinerary entries will fill the earliest missing day numbers
              first.
            </p>
          </div>
        )}
      </div>

      {/* Itinerary forms list */}
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {isCloneVisible && (
          <ActionButton
            type="button"
            variant="secondary"
            onClick={handleCloneFromTour}
            className="gap-2 px-3 py-1.5 text-xs shadow-sm !text-indigo-600 !bg-indigo-50 hover:!bg-indigo-100 !border-indigo-200 shrink-0"
          >
            <Copy className="h-3.5 w-3.5" />
            Clone from Tour
          </ActionButton>
        )}
        {itineraries.map((iti, index) => {
          const currentDayNumber = Number(iti.dayNumber);
          const canCloneCurrentDay = cloneableDayNumbers.includes(currentDayNumber);

          const existsInDb = schedule?.tourScheduleItineraries?.some((i: any) => Number(i.dayNumber) === Number(currentDayNumber));
          const isFirstInForm = itineraries.findIndex((i) => Number(i.dayNumber) === Number(currentDayNumber)) === index;
          const isFirstOfDay = !existsInDb && isFirstInForm;

          const selectedDateStr = iti.itineraryDate
            ? String(iti.itineraryDate).split("T")[0]
            : "";
          const departureDateStr = schedule?.departureDate?.split("T")[0];
          const returnDateStr = schedule?.returnDate?.split("T")[0];
          let isOutsideRange = false;
          if (selectedDateStr && departureDateStr && returnDateStr) {
            if (
              selectedDateStr < departureDateStr ||
              selectedDateStr > returnDateStr
            ) {
              isOutsideRange = true;
            }
          }

          return (
            <div
              key={iti.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500/20"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100/50 text-indigo-600 ring-1 ring-indigo-200">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[15px] font-bold text-slate-900">Day</label>
                    <input type="number" min="1" required value={iti.dayNumber} onChange={(e) => updateItinerary(index, "dayNumber", e.target.value)} className="w-16 rounded-md border border-slate-200 px-2 py-1 text-center font-bold text-slate-900 focus:border-indigo-500 focus:outline-none" />
                  </div>
                  {canCloneCurrentDay && (
                    <ActionButton
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        handleCloneSingleDayFromTour(currentDayNumber, index)
                      }
                      disabled={cloningDayIndex === index}
                      className="ml-3 gap-2 px-3 py-1.5 text-xs shadow-sm !text-indigo-600 !bg-indigo-50 hover:!bg-indigo-100 !border-indigo-200 shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {cloningDayIndex === index
                        ? "Cloning..."
                        : `Clone Day ${currentDayNumber} from Tour`}
                    </ActionButton>
                  )}
                </div>
                {itineraries.length > 1 && (
                  <ActionButton
                    type="button"
                    variant="warning"
                    onClick={() => handleRemoveItinerary(index)}
                    className="h-8 w-8 !bg-rose-50 !text-rose-500 hover:!bg-rose-100 hover:!text-rose-600 !border-transparent transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </ActionButton>
                )}
              </div>

              <div className="p-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Itinerary Date */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Calendar className="h-4 w-4 text-slate-400" /> Itinerary
                      Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      disabled={!isFirstOfDay}
                      value={iti.itineraryDate}
                      onChange={(e) =>
                        updateItinerary(index, "itineraryDate", e.target.value)
                      }
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${!isFirstOfDay ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200" : getError(index, "itineraryDate") ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50 focus:border-brand focus:bg-white"}`}
                    />
                    {!isFirstOfDay && (
                      <p className="mt-1.5 text-xs font-medium text-slate-500">
                        Date is auto-synced with existing items on Day {currentDayNumber}.
                      </p>
                    )}
                    {getError(index, "itineraryDate") && (
                      <span className="mt-1 block text-xs font-medium text-rose-500">
                        {getError(index, "itineraryDate")}
                      </span>
                    )}
                    {departureDateStr &&
                      returnDateStr &&
                      (() => {
                        const [depY, depM, depD] = departureDateStr
                          .split("-")
                          .map(Number);
                        const [retY, retM, retD] = returnDateStr
                          .split("-")
                          .map(Number);
                        const depDate = new Date(depY, depM - 1, depD);
                        const retDate = new Date(retY, retM - 1, retD);

                        return (
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                            <span>Suggested period:</span>
                            <strong className="font-semibold text-slate-600">
                              {depDate.toLocaleDateString("vi-VN")}
                            </strong>{" "}
                            to{" "}
                            <strong className="font-semibold text-slate-600">
                              {retDate.toLocaleDateString("vi-VN")}
                            </strong>
                            .
                          </div>
                        );
                      })()}
                    {isOutsideRange && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>
                          Warning: This date is outside the original schedule
                          period.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Type className="h-4 w-4 text-slate-400" /> Title{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={iti.title}
                      onChange={(e) =>
                        updateItinerary(index, "title", e.target.value)
                      }
                      placeholder="e.g., Arrival and City Tour"
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${getError(index, "title") ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50 focus:border-brand focus:bg-white"}`}
                    />
                    {getError(index, "title") && (
                      <span className="mt-1 block text-xs font-medium text-rose-500">
                        {getError(index, "title")}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <FileText className="h-4 w-4 text-slate-400" />{" "}
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={iti.description}
                      onChange={(e) =>
                        updateItinerary(index, "description", e.target.value)
                      }
                      placeholder="Describe the activities for this item..."
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${getError(index, "description") ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50 focus:border-brand focus:bg-white"}`}
                    />
                    {getError(index, "description") && (
                      <span className="mt-1 block text-xs font-medium text-rose-500">
                        {getError(index, "description")}
                      </span>
                    )}
                  </div>

                  <div className="sm:col-span-1">
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Clock className="h-4 w-4 text-slate-400" /> Start Time <span className="text-rose-500">*</span>
                    </label>
                    <input type="time" required value={iti.startDuration ? iti.startDuration.substring(0, 5) : ""} onChange={(e) => updateItinerary(index, "startDuration", e.target.value)} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-brand focus:bg-white ${getError(index, "startDuration") ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50"}`} />
                    {getError(index, "startDuration") && <span className="mt-1 block text-xs font-medium text-rose-500">{getError(index, "startDuration")}</span>}
                  </div>

                  <div className="sm:col-span-1">
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Clock className="h-4 w-4 text-slate-400" /> End Time <span className="text-rose-500">*</span>
                    </label>
                    <input type="time" required value={iti.endDuration ? iti.endDuration.substring(0, 5) : ""} onChange={(e) => updateItinerary(index, "endDuration", e.target.value)} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-brand focus:bg-white ${getError(index, "endDuration") ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50"}`} />
                    {getError(index, "endDuration") && <span className="mt-1 block text-xs font-medium text-rose-500">{getError(index, "endDuration")}</span>}
                  </div>

                  {/* Location Picker */}
                  <div className="sm:col-span-2 mt-2 flex items-center justify-between border-b border-slate-100 pb-3">
                    <label className="text-sm font-semibold text-slate-700">
                      Location
                    </label>
                    <ActionButton
                      type="button"
                      variant="secondary"
                      onClick={() => openMapModal(index)}
                      className="gap-2 px-3 py-1.5 text-xs text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100"
                    >
                      <MapIcon className="h-3.5 w-3.5" /> Pick Location on Map
                    </ActionButton>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 sm:col-span-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        Tourism Info
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
                        <MapPin className="h-4 w-4 text-emerald-500" /> Location Name
                      </label>
                      <input
                        type="text"
                        value={iti.locationName}
                        onChange={(e) =>
                          updateItinerary(
                            index,
                            "locationName",
                            e.target.value,
                          )
                        }
                        placeholder="Type name or pick on map..."
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-brand focus:bg-white ${getError(index, "locationName") ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50"}`}
                      />
                      {getError(index, "locationName") && (
                        <span className="mt-1 block text-xs font-medium text-rose-500">
                          {getError(index, "locationName")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add more button */}
        <div className="flex justify-center pt-2 pb-10">
          <button
            type="button"
            onClick={handleAddItinerary}
            className="group flex items-center gap-2 rounded-full border border-dashed border-indigo-300 bg-indigo-50/50 px-6 py-3 text-sm font-semibold text-indigo-600 transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md active:scale-95"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
            Add Another Item
          </button>
        </div>
      </form>

      <LoadingOverlay
        isOpen={isSubmitting}
        message="Saving all itineraries..."
      />
      <LoadingOverlay
        isOpen={isCloning}
        message="Cloning and fetching coordinates..."
      />

      <MapPickerModal
        isOpen={isMapModalOpen}
        mode="single"
        initialData={
          pickingIndex !== null
            ? {
                single: {
                  lat: itineraries[pickingIndex].locationLat,
                  lng: itineraries[pickingIndex].locationLng,
                  address: itineraries[pickingIndex].locationName,
                },
              }
            : undefined
        }
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={handleConfirmLocation}
      />
    </div>
  );
};
