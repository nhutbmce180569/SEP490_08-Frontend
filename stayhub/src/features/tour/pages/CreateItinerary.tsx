import React, { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Type,
  FileText,
  MapPin,
  Map,
  Plus,
  Trash2,
  Save,
  X,
  Clock,
  Download,
  Upload,
  FileSpreadsheet,
  CircleCheck,
  RotateCcw,
  Pencil,
} from "lucide-react";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCreateItinerary } from "../hooks/useCreateItinerary";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { MapPickerModal } from "../components/MapPickerModal";
import { ItineraryFormModal } from "../components/ItineraryFormModal";
import { useToast } from "../../../contexts/ToastContext";
import { tourismInformationService } from "../../content/services/tourismInformation.service";
import type { TourismInformation } from "../../content/types/tourismInformation";
import { TourismInformationSelector } from "../../content/components/TourismInformationSelector";
import { useTranslation } from "../../../contexts/LocaleContext";
import {
  downloadItineraryExcelTemplate,
  parseItineraryExcel,
} from "../utils/itineraryExcel";

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
    invalidItineraryIds,
    newlyAddedId,
    handleAddDay,
    handleRemoveDay,
    handleClearDay,
    updateItinerary,
    patchItinerary,
    addImportedItineraries,
    setInvalidItineraryIds,
  } = useCreateItinerary();
  const { success, error: showError } = useToast();
  const [tourismInformationList, setTourismInformationList] = useState<
    TourismInformation[]
  >([]);
  const [isTourismInformationLoading, setIsTourismInformationLoading] =
    useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    count: number;
    fileName: string;
  } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // --- STATE CHO MAP PICKER ---
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [pickingIndex, setPickingIndex] = useState<number | null>(null);

  // --- STATE CHO EDIT MODAL ---
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const isEditModalOpen = editingIndex !== null;

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
        patch.locationName = locationData.locationName || locationData.address;
        patch.locationLat = locationData.lat;
        patch.locationLng = locationData.lng;
      }
      patchItinerary(pickingIndex, patch);
    }
  };

  const handleChangeTourismInfo = (
    index: number,
    selectedTourismInfo: TourismInformation | null,
  ) => {
    patchItinerary(index, {
      tourismInfoId: selectedTourismInfo?.id ?? null,
      tourismSearchKeyword: "",
      ...(selectedTourismInfo
        ? {
            locationName:
              selectedTourismInfo.address || selectedTourismInfo.name,
            locationLat: selectedTourismInfo.latitude ?? undefined,
            locationLng: selectedTourismInfo.longitude ?? undefined,
          }
        : {}),
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const invalidIds = new Set<number>();
    const dayTimeSet = new Set<string>();

    for (let i = 0; i < itineraries.length; i++) {
      const iti = itineraries[i];
      const assignedDay = iti.dayNumber;

      if (!assignedDay || assignedDay <= 0) {
        showError(t("tour.error.dayNumberPositive", { item: i + 1 }));
        invalidIds.add(iti.id);
        setInvalidItineraryIds(invalidIds);
        return;
      }

      if (String(iti.title ?? "").trim().length < 3) {
        showError(t("tour.error.titleMinLength", { day: assignedDay }));
        invalidIds.add(iti.id);
        setInvalidItineraryIds(invalidIds);
        return;
      }

      if (String(iti.description ?? "").trim().length < 10) {
        showError(t("tour.error.descriptionMinLength", { day: assignedDay }));
        invalidIds.add(iti.id);
        setInvalidItineraryIds(invalidIds);
        return;
      }

      if (iti.startDuration && iti.endDuration) {
        if (iti.startDuration >= iti.endDuration) {
          showError(
            t("tour.error.endTimeAfterStart", {
              day: assignedDay,
              title: iti.title || "Item",
            }),
          );
          invalidIds.add(iti.id);
          setInvalidItineraryIds(invalidIds);
          return;
        }
      }

      if (iti.startDuration) {
        const key = `${iti.dayNumber}-${iti.startDuration}`;
        if (dayTimeSet.has(key)) {
          showError(
            t("tour.error.duplicateStartTime", {
              day: iti.dayNumber,
              time: iti.startDuration,
            }),
          );
          // Find all items with the same start time to highlight them
          itineraries.forEach((item) => {
            if (
              item.dayNumber === iti.dayNumber &&
              item.startDuration === iti.startDuration
            ) {
              invalidIds.add(item.id);
            }
          });
          setInvalidItineraryIds(invalidIds);
          return;
        }
        dayTimeSet.add(key);
      }
    }

    setInvalidItineraryIds(new Set()); // Clear errors before submitting
    handleSubmitBatch(itineraries);
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadItineraryExcelTemplate();
    } catch (error: any) {
      showError(error.message || t("tour.downloadTemplateFailed"));
    }
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !tourId) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      showError(t("tour.excelFileRequired"));
      return;
    }

    try {
      setIsImporting(true);
      const importedItineraries = await parseItineraryExcel(
        file,
        Number(tourId),
        tourismInformationList,
      );

      // Nếu form chỉ có 1 item và item đó trống thì thay thế, ngược lại thì nối vào
      if (itineraries.length === 1 && !itineraries[0].title?.trim()) {
        // Form mới, chỉ có 1 ngày trống -> thay thế nó bằng dữ liệu import
        addImportedItineraries(importedItineraries);
      } else {
        // Form đã có dữ liệu -> nối dữ liệu import vào cuối danh sách hiện tại
        addImportedItineraries([...itineraries, ...importedItineraries]);
      }

      setImportSummary({
        count: importedItineraries.length,
        fileName: file.name,
      });
      success(
        t("tour.importPreviewSuccess", { count: importedItineraries.length }),
      );
    } catch (error: any) {
      showError(error.message || t("tour.importExcelFailed"));
    } finally {
      setIsImporting(false);
    }
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
    return (
      <div className="p-10 text-center text-rose-500">
        {t("tour.tourOrItineraryIdMissing")}
      </div>
    );
  }

  if (isTourLoading) {
    return (
      <div className="p-10 text-center text-slate-500">
        {t("tour.loadingTourDetailsMgr")}
      </div>
    );
  }

  if (tour && !tour.canEdit) {
    return (
      <div className="p-10 text-center text-rose-500">
        {t("tour.noEditPermission")}
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
              {t("tour.createItinerary")}
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {t("tour.createItineraryBatchDesc")} (
              {tour?.name || `Tour #${tourId}`})
            </p>
          </div>
          <div className="flex w-full sm:w-auto shrink-0 justify-end gap-3">
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
              <p className="text-sm font-bold text-slate-900">
                {t("tour.excelToolsTitle")}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-slate-600">
                {t("tour.excelToolsDescription")}
              </p>
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
            <ActionButton
              type="button"
              variant="secondary"
              onClick={handleDownloadTemplate}
              className="gap-2 px-4 py-2 shadow-sm"
            >
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
        {importSummary && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">
                {t("tour.importPreviewLoaded", { count: importSummary.count })}
              </p>
              <p className="mt-0.5 text-xs text-emerald-700">
                {t("tour.importPreviewReview", {
                  fileName: importSummary.fileName,
                })}
              </p>
            </div>
          </div>
        )}
        {missingDayNumbers && missingDayNumbers.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mt-4">
            <p className="font-semibold">
              {t("tour.missingItineraryDaysTitle")}
            </p>
            <p>
              {t("tour.missingItineraryDaysTourMsg", {
                days: missingDayNumbers.join(", Day "),
              })}
            </p>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className="min-h-[150px] rounded-2xl border border-slate-200 bg-slate-50 p-6">
          {itineraries.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {itineraries.map((iti, index) => {
                const isNew = iti.id === newlyAddedId;
                const isInvalid = invalidItineraryIds.has(iti.id);
                return (
                  <div key={iti.id} className="relative shrink-0">
                    <div
                      onClick={() => setEditingIndex(index)}
                      className={`flex h-32 cursor-pointer flex-col justify-between rounded-2xl border-2 bg-white p-3 shadow-sm transition-all hover:border-indigo-400 hover:shadow-md ${isNew ? "border-indigo-400 animate-flash" : isInvalid ? "border-rose-400 animate-shake" : "border-slate-200"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">
                            {t("tour.day")}
                          </span>
                          <input
                            type="number"
                            min="1"
                            required
                            value={iti.dayNumber}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              updateItinerary(index, "dayNumber", e.target.value)
                            }
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
                        <p
                          className="truncate text-sm font-semibold text-slate-700"
                          title={iti.title}
                        >
                          {iti.title || t("tour.untitledItinerary")}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            {iti.startDuration || "--:--"} -{" "}
                            {iti.endDuration || "--:--"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDay(index)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-rose-200 bg-rose-100 text-rose-500 transition-colors hover:bg-rose-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">{t("tour.noItinerariesYet")}</p>
          )}
        </div>
        <div className="flex justify-center">
          <ActionButton
            type="button"
            variant="secondary"
            onClick={() => handleAddDay()}
            className="gap-2 px-4 py-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {t("tour.addAnotherDay")}
          </ActionButton>
        </div>
      </form>

      <LoadingOverlay
        isOpen={isSubmitting || isImporting}
        message={
          isImporting
            ? t("tour.importingExcel")
            : t("tour.savingAllItineraries")
        }
      />

      {isEditModalOpen && editingIndex !== null && (
        <ItineraryFormModal
          isOpen={isEditModalOpen}
          onClose={() => setEditingIndex(null)}
          itinerary={itineraries[editingIndex]}
          updateItinerary={(field, value) =>
            updateItinerary(editingIndex, field, value)
          }
          patchItinerary={(patch) => patchItinerary(editingIndex, patch)}
          getError={(field) => getError(editingIndex, field)}
          tourismInformationList={tourismInformationList}
          openMapModal={() => openMapModal(editingIndex)}
          isSchedule={false}
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
