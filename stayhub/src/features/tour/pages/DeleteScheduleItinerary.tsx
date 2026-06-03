import React from "react";
import { AlertTriangle, ArrowLeft, Trash2, Calendar, MapPin } from "lucide-react";
import { useDeleteScheduleItinerary } from "../hooks/useDeleteScheduleItinerary";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useTranslation } from "../../../contexts/LocaleContext";

export const DeleteScheduleItinerary: React.FC = () => {
  const { t } = useTranslation();
  const { itinerary, isFetching, fetchError, isDeleting, handleConfirmDelete, handleCancel } = useDeleteScheduleItinerary();

  if (isFetching) {
    return <div className="flex justify-center p-10 text-slate-500">{t("tour.loadingItineraryDetailsMgr")}</div>;
  }

  if (fetchError || !itinerary) {
    return <div className="flex justify-center p-10 text-rose-500">{fetchError || t("tour.scheduleItineraryNotFound")}</div>;
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <button
        onClick={handleCancel}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("tour.backToItineraryList")}
      </button>

      <div className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
        <div className="flex items-start gap-4 border-b border-rose-100 bg-rose-50/50 px-6 py-5">
          <div className="mt-0.5 rounded-full bg-rose-100 p-2 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-rose-700">{t("tour.deleteScheduleItineraryConfirm")}</h2>
            <p className="mt-1 text-sm text-rose-600/90">
              {t("tour.deleteItineraryItemWarning")}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 text-sm font-bold text-slate-800">{t("tour.itineraryDetailsToDelete")}</div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Calendar className="h-4 w-4" />
                  {new Date(itinerary.itineraryDate).toLocaleDateString("vi-VN")}
                </div>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  {itinerary.title || t("tour.untitledItinerary")}
                </h3>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm whitespace-nowrap">
                {itinerary.locationName || t("tour.locationLabel")}
              </div>
            </div>

            {itinerary.description && (
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                {itinerary.description}
              </p>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <MapPin className="h-4 w-4" />
                  {t("tour.locationLabel")}
                </div>
                <div className="font-medium text-slate-900">
                  {itinerary.locationName || t("common.na")}
                </div>
                {(itinerary.locationLat != null || itinerary.locationLng != null) && (
                  <div className="mt-2 text-xs text-slate-500">
                    {t("tour.latLng", {
                      lat: itinerary.locationLat ?? t("common.na"),
                      lng: itinerary.locationLng ?? t("common.na"),
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <ActionButton variant="secondary" onClick={handleCancel} className="px-5 py-2.5 text-sm">
            {t("common.cancel")}
          </ActionButton>

          <ActionButton
            variant="warning"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="gap-2 px-5 py-2.5 text-sm !bg-rose-600 !text-white !border-rose-600 hover:!bg-rose-700 hover:!border-rose-700"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? t("tour.deleting") : t("tour.yesDeleteItineraryItem")}
          </ActionButton>
        </div>
      </div>

      <LoadingOverlay isOpen={isDeleting} message={t("tour.deletingItinerary")} />
    </div>
  );
};
