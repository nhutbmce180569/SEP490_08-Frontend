import React from "react";
import {
  X,
  Save,
  Calendar,
  Type,
  FileText,
  Clock,
  Map,
  Copy,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { TourismInformationSelector } from "../../content/components/TourismInformationSelector";
import type { TourismInformation } from "../../content/types/tourismInformation";
import { useTranslation } from "../../../contexts/LocaleContext";

interface ItineraryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: any;
  updateItinerary: (field: string, value: any) => void;
  patchItinerary: (patch: Record<string, any>) => void;
  getError: (field: string) => string | null;
  tourismInformationList: TourismInformation[];
  openMapModal: () => void;
  isSchedule: boolean; // Phân biệt giữa Tour Itinerary và Schedule Itinerary
  schedule?: any; // Chỉ truyền khi isSchedule = true
  isFirstOfDay?: boolean; // Chỉ truyền khi isSchedule = true
  onClone?: () => void; // Hàm xử lý clone
  canClone?: boolean; // Điều kiện hiển thị nút clone
  isCloning?: boolean; // Trạng thái đang clone
}

export const ItineraryFormModal: React.FC<ItineraryFormModalProps> = ({
  isOpen,
  onClose,
  itinerary,
  updateItinerary,
  patchItinerary,
  getError,
  tourismInformationList,
  openMapModal,
  isSchedule,
  schedule,
  isFirstOfDay,
  onClone,
  canClone,
  isCloning,
}) => {
  const { t } = useTranslation();

  if (!isOpen || !itinerary) return null;

  const selectedDateStr = itinerary.itineraryDate ? String(itinerary.itineraryDate).split("T")[0] : "";
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
  const handleChangeTourismInfo = (
    selectedTourismInfo: TourismInformation | null,
  ) => {
    patchItinerary({
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

  return (
    <div
      className="fixed inset-0 z-[990] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100/50 text-indigo-600 ring-1 ring-indigo-200">
              <Calendar className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {t("tour.editItineraryDay", { day: itinerary.dayNumber })}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isSchedule && canClone && onClone && (
              <ActionButton
                type="button"
                variant="secondary"
                onClick={onClone}
                disabled={isCloning}
                className="gap-2 px-3 py-2 text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100"
              >
                <Copy className={`h-4 w-4 ${isCloning ? "animate-pulse" : ""}`} />
                {isCloning ? t("tour.cloning") : t("tour.cloneDayFromTour", { day: itinerary.dayNumber })}
              </ActionButton>
            )}
            <ActionButton
              type="button"
              variant="primary"
              onClick={onClose}
              className="gap-2 px-4 py-2"
            >
              <Save className="h-4 w-4" />
              {t("common.done")}
            </ActionButton>
            <ActionButton
              type="button"
              variant="secondary"
              onClick={onClose}
              className="h-9 w-9"
            >
              <X className="h-4 w-4" />
            </ActionButton>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {isSchedule && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Calendar className="h-4 w-4 text-slate-400" /> {t("tour.itineraryDate")} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  disabled={!isFirstOfDay}
                  value={selectedDateStr}
                  onChange={(e) => updateItinerary("itineraryDate", e.target.value)}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${!isFirstOfDay ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200" : getError("itineraryDate") ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50 focus:border-brand focus:bg-white"}`}
                />
                {!isFirstOfDay && (
                  <p className="mt-1.5 text-xs font-medium text-slate-500">
                    {t("tour.dateAutoSynced", { day: itinerary.dayNumber })}
                  </p>
                )}
                {getError("itineraryDate") && <span className="mt-1 block text-xs font-medium text-rose-500">{getError("itineraryDate")}</span>}
                {departureDateStr && returnDateStr && (() => {
                  const [depY, depM, depD] = departureDateStr.split("-").map(Number);
                  const [retY, retM, retD] = returnDateStr.split("-").map(Number);
                  const depDate = new Date(depY, depM - 1, depD);
                  const retDate = new Date(retY, retM - 1, retD);
                  return (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <span>{t("tour.suggestedPeriod")}</span>
                      <strong className="font-semibold text-slate-600">{depDate.toLocaleDateString("vi-VN")}</strong>
                      {t("tour.to")} <strong className="font-semibold text-slate-600">{retDate.toLocaleDateString("vi-VN")}</strong>.
                    </div>
                  );
                })()}
                {isOutsideRange && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{t("tour.dateOutsideScheduleWarning")}</span>
                  </div>
                )}
              </div>
            )}

            {/* Các trường form giống hệt như cũ */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center justify-between text-sm font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Type className="h-4 w-4 text-slate-400" /> {t("tour.title")}{" "}
                  <span className="text-rose-500">*</span>
                </span>
                <span className="text-xs font-normal text-slate-400">
                  {itinerary.title?.length || 0}/100
                </span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={itinerary.title || ""}
                onChange={(e) => updateItinerary("title", e.target.value)}
                placeholder={t("tour.itineraryTitlePlaceholderTour")}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${getError("title") ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50 focus:border-brand focus:bg-white"}`}
              />
              {getError("title") && (
                <span className="mt-1 block text-xs font-medium text-rose-500">
                  {getError("title")}
                </span>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <FileText className="h-4 w-4 text-slate-400" />{" "}
                {t("common.description")}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <div className="prose-sm max-w-none [&>.ql-toolbar]:rounded-t-xl [&>.ql-toolbar]:border-slate-200 [&>.ql-container]:rounded-b-xl [&>.ql-container]:border-slate-200">
                <ReactQuill
                  theme="snow"
                  value={itinerary.description || ""}
                  onChange={(value) => updateItinerary("description", value)}
                  placeholder={t("tour.describeActivities")}
                  className={
                    getError("description")
                      ? "[&>.ql-container]:!border-rose-500"
                      : ""
                  }
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
              {getError("description") && (
                <span className="mt-1 block text-xs font-medium text-rose-500">
                  {getError("description")}
                </span>
              )}
            </div>

            <div className="sm:col-span-1">
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Clock className="h-4 w-4 text-slate-400" /> {t("tour.startTime")}
              </label>
              <input type="time" value={itinerary.startDuration ? itinerary.startDuration.substring(0, 5) : ""} onChange={(e) => updateItinerary("startDuration", e.target.value)} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-brand focus:bg-white ${getError("startDuration") ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50"}`} />
              {getError("startDuration") && <span className="mt-1 block text-xs font-medium text-rose-500">{getError("startDuration")}</span>}
            </div>

            <div className="sm:col-span-1">
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Clock className="h-4 w-4 text-slate-400" /> {t("tour.endTime")}
              </label>
              <input type="time" value={itinerary.endDuration ? itinerary.endDuration.substring(0, 5) : ""} onChange={(e) => updateItinerary("endDuration", e.target.value)} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-brand focus:bg-white ${getError("endDuration") ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50"}`} />
              {getError("endDuration") && <span className="mt-1 block text-xs font-medium text-rose-500">{getError("endDuration")}</span>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                {t("tour.tourismInfo")}
              </label>
              <TourismInformationSelector
                items={tourismInformationList}
                value={itinerary.tourismInfoId ?? null}
                initialKeyword={itinerary.tourismSearchKeyword ?? ""}
                onChange={(item) => handleChangeTourismInfo(item)}
                error={getError("tourismInfoId")}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center justify-between text-sm font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-500" /> {t("tour.locationName")}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-normal text-slate-400">
                    {itinerary.locationName?.length || 0}/255
                  </span>
                  <ActionButton type="button" variant="secondary" onClick={openMapModal} className="gap-2 px-2 py-1 text-xs text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100 h-7 rounded-md">
                    <Map className="h-3.5 w-3.5" /> {t("tour.pickLocationOnMap")}
                  </ActionButton>
                </div>
              </label>
              <input
                type="text"
                maxLength={255}
                value={itinerary.locationName ?? ""}
                onChange={(e) => {
                  const locationName = e.target.value;
                  patchItinerary({
                    locationName,
                    ...(locationName.trim() ? {} : { locationLat: null, locationLng: null }),
                  });
                }}
                placeholder={t("tour.typeNameOrPickMap")}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-brand focus:bg-white ${getError("locationName") || getError("locationLat") || getError("locationLng") ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50"}`}
              />
              {getError("locationName") && <span className="mt-1 block text-xs font-medium text-rose-500">{getError("locationName")}</span>}
              {(getError("locationLat") || getError("locationLng")) && <span className="mt-1 block text-xs font-medium text-rose-500">{getError("locationLat") || getError("locationLng")}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};