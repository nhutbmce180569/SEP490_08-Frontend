import React from "react";
import { AlertTriangle, ArrowLeft, Trash2, Hash, Tag, FileText, MapPin, ImageIcon } from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useDeleteTour } from "../hooks/useDeleteTour";
import { DynamicText } from "../../../components/DynamicText";

export const DeleteTourConfirm: React.FC = () => {
  const { t } = useTranslation();
  const { tour, categoryName, isFetching, fetchError, isDeleting, handleConfirmDelete, handleCancel } = useDeleteTour();

  const getStatusLabel = (status?: string | null) => {
    if (!status) return t("common.na");
    const lower = status.toLowerCase();
    if (lower === "active") return t("common.active");
    if (lower === "inactive") return t("common.inactive");
    return status;
  };

  const getStatusStyle = (status?: string | null) => {
    if (!status) return "bg-slate-100 text-slate-600";
    const lower = status.toLowerCase();
    if (lower === "active") return "bg-emerald-100 text-emerald-700";
    if (lower === "inactive") return "bg-slate-100 text-slate-600";
    if (lower === "banned") return "bg-rose-100 text-rose-700";
    return "bg-slate-100 text-slate-600";
  };

  if (isFetching) return <div className="flex justify-center p-10 text-slate-500">{t("tour.loadingTourDetailsMgr")}</div>;
  if (fetchError) return <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>;
  if (!tour) return <div className="flex justify-center p-10 text-slate-500">{t("tour.tourNotFound")}</div>;

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
        <div className="flex items-start gap-4 border-b border-rose-100 bg-rose-50/50 px-6 py-5">
          <div className="mt-0.5 rounded-full bg-rose-100 p-2 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-rose-700">{t("tour.deleteTourConfirm")}</h2>
            <p className="mt-1 text-sm text-rose-600/90">{t("tour.deleteTourWarning")}</p>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 text-sm font-bold text-slate-800">{t("tour.tourDetailsToDelete")}</div>
          <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:flex-row">
            {/* Image */}
            <div className="flex h-48 w-48 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-200 shadow-sm border border-slate-200/60">
              {tour.imageUrl ? (
                <img src={tour.imageUrl} alt={tour.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <ImageIcon className="h-10 w-10 opacity-50" />
                  <span className="text-sm font-medium">{t("tour.noImage")}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4 min-w-0">
              <h3 className="text-2xl font-bold text-slate-900 leading-snug"><DynamicText text={tour.name} /></h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{t("tour.category")}: <span className="font-semibold text-slate-700">{categoryName ? <DynamicText text={categoryName} /> : tour.categoryId}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate flex items-center gap-1.5">
                    {t("common.status")}: 
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusStyle(tour.status)}`}>
                      {getStatusLabel(tour.status)}
                    </span>
                  </span>
                </div>
                <div className="flex items-start gap-2 sm:col-span-2">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {[tour.address, tour.city, tour.country].some(Boolean) ? <DynamicText text={[tour.address, tour.city, tour.country].filter(Boolean).join(", ")} /> : t("common.na")}
                  </span>
                </div>
              </div>

              {tour.description && (
                <div className="pt-4 border-t border-slate-200/60">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                    <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed [&_ol]:pl-5 [&_ul]:pl-5">
                      <DynamicText text={tour.description.replace(/&nbsp;/g, " ")} isHtml />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <ActionButton variant="secondary" onClick={handleCancel} className="px-5 py-2.5 text-sm">
            {t("common.cancel")}
          </ActionButton>
          <ActionButton variant="warning" onClick={handleConfirmDelete} className="gap-2 px-5 py-2.5 text-sm !bg-rose-600 !text-white !border-rose-600 hover:!bg-rose-700 hover:!border-rose-700">
            <Trash2 className="h-4 w-4" />
            {t("common.confirm")}
          </ActionButton>
        </div>
      </div>

      <LoadingOverlay isOpen={isDeleting} message={t("tour.deletingTour")} />
    </div>
  );
};
