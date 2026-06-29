import React, { useEffect, useRef, useState, useMemo } from "react";
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
  Download,
  Upload,
  FileSpreadsheet,
  CircleCheck,
  RotateCcw,
  Pencil,
} from "lucide-react";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCreateScheduleItinerary } from "../hooks/useCreateScheduleItinerary";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { MapPickerModal } from "../components/MapPickerModal";
import { ItineraryFormModal } from "../components/ItineraryFormModal";
import { useToast } from "../../../contexts/ToastContext";
import { TourismInformationSelector } from "../../content/components/TourismInformationSelector";
import { tourismInformationService } from "../../content/services/tourismInformation.service";
import type { TourismInformation } from "../../content/types/tourismInformation";
import { useTranslation } from "../../../contexts/LocaleContext";
import { downloadScheduleItineraryExcelTemplate, parseScheduleItineraryExcel } from "../utils/scheduleItineraryExcel";

export const CreateScheduleItinerary: React.FC = () => {
  const { t } = useTranslation();
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
    invalidItineraryIds,
    newlyAddedId,
    cloneableDayNumbers,
    handleAddItinerary,
    handleRemoveItinerary,
    handleClearItinerary,
    addImportedItineraries,
    updateItinerary,
    patchItinerary,
    handleCloneFromTour,
    handleCloneSingleDayFromTour,
    isCloneVisible,
    isCloning,
    cloningDayIndex,
    setInvalidItineraryIds,
    isTourLoading,
  } = useCreateScheduleItinerary();
  const { success, error: showError } = useToast();
  const [tourismInformationList, setTourismInformationList] = useState<TourismInformation[]>([]);
  const [isTourismInformationLoading, setIsTourismInformationLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{ count: number; fileName: string } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // --- STATE CHO MAP PICKER ---
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [pickingIndex, setPickingIndex] = useState<number | null>(null);

  // --- STATE CHO EDIT MODAL ---
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const isEditModalOpen = editingIndex !== null;

  const isFirstOfDay = useMemo(() => {
    if (editingIndex === null) return false;

    const currentItinerary = itineraries[editingIndex];
    if (!currentItinerary) return false;

    const currentDayNumber = Number(currentItinerary.dayNumber);
    const existsInDb = schedule?.tourScheduleItineraries?.some((i: any) => Number(i.dayNumber) === currentDayNumber);
    const firstIndexInForm = itineraries.findIndex((i: any) => Number(i.dayNumber) === currentDayNumber);

    return !existsInDb && firstIndexInForm === editingIndex;
  }, [editingIndex, itineraries, schedule?.tourScheduleItineraries]);

  useEffect(() => {
    tourismInformationService
      .getActiveList()
      .then(setTourismInformationList)
      .catch(() => setTourismInformationList([]))
      .finally(() => setIsTourismInformationLoading(false));
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
      tourismSearchKeyword: "",
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

    const invalidIds = new Set<number>();
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
        showError(t("tour.error.dayNumberPositive", { item: i + 1 }));
        invalidIds.add(iti.id);
        setInvalidItineraryIds(invalidIds);
        return;
      }

      if (!iti.itineraryDate) {
        showError(t("tour.error.dateRequired", { day: assignedDay }));
        invalidIds.add(iti.id);
        setInvalidItineraryIds(invalidIds);
        return;
      }

      // Kiểm tra xem Ngày này đã bị một DayNumber khác chiếm chưa
      if (dateDayMap.has(iti.itineraryDate)) {
        const mappedDay = dateDayMap.get(iti.itineraryDate);
        if (mappedDay !== undefined && mappedDay !== assignedDay) {
          showError(t("tour.error.dateConflict", { date: iti.itineraryDate, day: mappedDay as number }));
          invalidIds.add(iti.id);
          setInvalidItineraryIds(invalidIds);
          return;
        }
      } else {
        dateDayMap.set(iti.itineraryDate, assignedDay);
      }

      if (String(iti.title ?? "").trim().length < 3) {
        showError(t("tour.error.titleMinLength", { day: assignedDay }));
        invalidIds.add(iti.id);
        setInvalidItineraryIds(invalidIds);
        return;
      }
      if (!iti.startDuration) {
        showError(t("tour.error.startTimeRequired", { day: assignedDay }));
        invalidIds.add(iti.id);
        setInvalidItineraryIds(invalidIds);
        return;
      }
      if (!iti.endDuration) {
        showError(t("tour.error.endTimeRequired", { day: assignedDay }));
        invalidIds.add(iti.id);
        setInvalidItineraryIds(invalidIds);
        return;
      }
      if (iti.startDuration >= iti.endDuration) {
        showError(t("tour.error.endTimeAfterStart", { day: assignedDay, title: iti.title || 'Item' }));
        invalidIds.add(iti.id);
        setInvalidItineraryIds(invalidIds);
        return;
      }
    }

    const dayTimeSet = new Set<string>();
    for (const iti of itineraries) {
      if (iti.startDuration) {
        const key = `${iti.dayNumber}-${iti.startDuration}`;
        if (dayTimeSet.has(key)) {
          showError(t("tour.error.duplicateStartTime", { day: iti.dayNumber, time: iti.startDuration }));
          // Tìm tất cả các item bị trùng để highlight
          itineraries.forEach(item => {
            if (item.dayNumber === iti.dayNumber && item.startDuration === iti.startDuration) {
              invalidIds.add(item.id);
            }
          });
          setInvalidItineraryIds(invalidIds);
          return;
        }
        dayTimeSet.add(key);
      }
    }
    setInvalidItineraryIds(new Set());
    handleSubmitBatch(itineraries);
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadScheduleItineraryExcelTemplate();
    } catch (error: any) {
      showError(error.message || t("tour.downloadTemplateFailed"));
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !scheduleId) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      showError(t("tour.excelFileRequired"));
      return;
    }

    try {
      setIsImporting(true);
      const importedItineraries = await parseScheduleItineraryExcel(
        file,
        Number(scheduleId),
        tourismInformationList,
      );

      // Nếu form chỉ có 1 item và item đó trống thì thay thế, ngược lại thì nối vào
      if (itineraries.length === 1 && !itineraries[0].title?.trim()) {
        // Form mới, chỉ có 1 item trống -> thay thế nó bằng dữ liệu import
        addImportedItineraries(importedItineraries);
      } else {
        // Form đã có dữ liệu -> nối dữ liệu import vào cuối danh sách hiện tại
        addImportedItineraries([...itineraries, ...importedItineraries]);
      }

      setImportSummary({ count: importedItineraries.length, fileName: file.name });
      success(t("tour.importPreviewSuccess", { count: importedItineraries.length }));
    } catch (error: any) {
      showError(error.message || t("tour.importExcelFailed"));
    } finally {
      setIsImporting(false);
    }
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
              {t("tour.addScheduleItineraries")}
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {t("tour.createScheduleItineraryBatchDesc")} #{scheduleId}
              {schedule ? ` (${t("tour.tour")}: ${schedule.tour?.name || `ID ${schedule.tourId}`})` : ""}
            </p>
          </div>          <div className="flex w-full sm:w-auto shrink-0 justify-end gap-3">
            <ActionButton type="button" variant="secondary" onClick={() => handleAddItinerary()} className="gap-2 px-4 py-2 shadow-sm">
              <Plus className="h-4 w-4" />
              {t("tour.addAnotherDay")}
            </ActionButton>
            <ActionButton
              type="button"
              variant="secondary"
              onClick={handleCancel}
              className="gap-2 px-5 py-2 shadow-sm"
            >
              <X className="h-4 w-4" />
              {t("common.cancel")}
            </ActionButton>
            <ActionButton
              type="submit"
              variant="primary"
              onClick={onSubmit}
              disabled={isSubmitting || itineraries.length === 0}
              className="gap-2 px-5 py-2 shadow-sm"
            >
              <Save className="h-4 w-4" />
              {t("tour.saveItineraries")}
            </ActionButton>
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2.5 text-indigo-600 shadow-sm">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{t("tour.excelToolsTitle")}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-600">{t("tour.excelToolsDescription")}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleImportFile}
            />
            <ActionButton type="button" variant="secondary" onClick={handleDownloadTemplate} className="gap-2 px-4 py-2 shadow-sm">
              <Download className="h-4 w-4" />
              {t("tour.downloadExcelTemplate")}
            </ActionButton>
            <ActionButton
              type="button"
              variant="primary"
              onClick={() => importInputRef.current?.click()}
              disabled={isImporting || isTourismInformationLoading}
              className="gap-2 px-4 py-2 shadow-sm"
            >
              <Upload className="h-4 w-4" />
              {isImporting ? t("tour.importingExcel") : t("tour.importExcel")}
            </ActionButton>
          </div>
        </div>
        {isCloneVisible && (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/30 p-4">
            <p className="flex-1 text-sm font-medium text-indigo-800">
              {t("tour.cloneFromTourPrompt")}
            </p>
            <ActionButton
              type="button"
              variant="primary"
              onClick={handleCloneFromTour}
              className="gap-2 px-4 py-2 shadow-sm"
            >
              <Copy className="h-4 w-4" /> {t("tour.cloneFromTour")}
            </ActionButton>
          </div>
        )}
        {importSummary && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">
                {t("tour.importPreviewLoaded", { count: importSummary.count })}
              </p>
              <p className="mt-0.5 text-xs text-emerald-700">
                {t("tour.importPreviewReview", { fileName: importSummary.fileName })}
              </p>
            </div>
          </div>
        )}
        {missingDayNumbers.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mt-4">
            <p className="font-semibold">{t("tour.missingItineraryDaysTitle")}</p>
            <p>
              {t("tour.missingItineraryDaysMsg", { days: missingDayNumbers.join(", Day ") })}
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
        <div className="min-h-[150px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-4 pt-3 pr-3">            
            {itineraries.map((iti, index) => {
              const isNew = iti.id === newlyAddedId;
              const isInvalid = invalidItineraryIds.has(iti.id);
              return (
              <div key={iti.id} className="relative shrink-0">
                <div
                  onClick={() => setEditingIndex(index)}
                  className={`flex h-32 w-52 cursor-pointer flex-col justify-between rounded-2xl border-2 bg-white p-3 shadow-sm transition-all hover:border-indigo-400 hover:shadow-md ${isNew ? "border-indigo-400 animate-flash" : isInvalid ? "border-rose-400 animate-shake" : "border-slate-200"}`}                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">{t("tour.day")}</span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={iti.dayNumber}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateItinerary(index, "dayNumber", e.target.value)}
                        className="w-12 rounded-md border border-slate-200 px-1 py-0.5 text-center font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <ActionButton
                      type="button"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingIndex(index);
                      }}
                      className="h-7 w-7 text-indigo-600"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </ActionButton>
                  </div>
                  <div>
                    <p className="truncate text-sm font-semibold text-slate-700" title={iti.title}>
                      {iti.title || t("tour.untitledItinerary")}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      <span>{iti.itineraryDate ? new Date(iti.itineraryDate).toLocaleDateString('vi-VN') : t('common.na')}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>{iti.startDuration || "--:--"} - {iti.endDuration || "--:--"}</span>
                    </div>
                  </div>
                </div>
                {itineraries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItinerary(index)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-rose-200 bg-rose-100 text-rose-500 transition-colors hover:bg-rose-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              );
            })}
          </div>
        </div>
      </form>

      <LoadingOverlay
        isOpen={isSubmitting || isImporting}
        message={isImporting ? t("tour.importingExcel") : t("tour.savingAllItineraries")}
      />
      <LoadingOverlay isOpen={isCloning} message={t("tour.cloningFetchingCoords")} />

      {isEditModalOpen && editingIndex !== null && (
        <ItineraryFormModal 
          isOpen={isEditModalOpen}
          onClose={() => setEditingIndex(null)}
          itinerary={itineraries[editingIndex]}
          updateItinerary={(field, value) => updateItinerary(editingIndex, field, value)}
          patchItinerary={(patch) => patchItinerary(editingIndex, patch)}
          getError={(field) => getError(editingIndex, field)}
          tourismInformationList={tourismInformationList}
          openMapModal={() => openMapModal(editingIndex)}
          isSchedule={true}
          schedule={schedule}
          isFirstOfDay={isFirstOfDay}
          canClone={cloneableDayNumbers.includes(Number(itineraries[editingIndex].dayNumber))}
          isCloning={cloningDayIndex === editingIndex}
          onClone={() => handleCloneSingleDayFromTour(itineraries[editingIndex].dayNumber, editingIndex)}
        />
      )}

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
