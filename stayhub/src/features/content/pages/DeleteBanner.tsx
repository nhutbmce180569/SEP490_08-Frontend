import React from "react";
import { AlertTriangle, ArrowLeft, Trash2, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useDeleteBanner } from "../hooks/useDeleteBanner";
import { getImg } from "../../../config/api/api";

export const DeleteBannerConfirm: React.FC = () => {
  const { t } = useTranslation();
  const { banner, isFetching, fetchError, isDeleting, handleConfirmDelete, handleCancel } = useDeleteBanner();

  if (isFetching) return <div className="flex justify-center p-10 text-slate-500">{t("content.loadingBannerDetails")}</div>;
  if (fetchError) return <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>;
  if (!banner) return <div className="flex justify-center p-10 text-slate-500">{t("content.bannerNotFound")}</div>;

  return (
    <div className="mx-auto max-w-2xl py-8">
      <button onClick={handleCancel} className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {t("content.backToBanners")}
      </button>

      <div className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
        <div className="flex items-start gap-4 border-b border-rose-100 bg-rose-50/50 px-6 py-5">
          <div className="mt-0.5 rounded-full bg-rose-100 p-2 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-rose-700">{t("content.deleteBannerConfirm")}</h2>
            <p className="mt-1 text-sm text-rose-600/90">{t("content.deleteBannerWarning")}</p>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 text-sm font-bold text-slate-800">{t("content.bannerDetailsToDelete")}</div>
          <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row">
            {banner.imageUrl ? (
              <img src={getImg(banner.imageUrl)} alt={banner.title} className="h-24 w-36 rounded-lg object-cover shadow-sm border border-slate-200" />
            ) : (
              <div className="flex h-24 w-36 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400 shadow-sm"><ImageIcon className="h-8 w-8" /></div>
            )}
            <div className="flex-1 space-y-2.5">
              <h3 className="line-clamp-2 text-base font-bold text-slate-900">{banner.title}</h3>
              <div className="flex flex-col gap-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-slate-400" /> {t("content.targetUrlLabel")} {banner.targetUrl || t("common.na")}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${banner.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>{banner.isActive ? t("common.active") : t("common.inactive")}</span>
                  <span>{t("content.priority")}: {banner.priority ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <ActionButton variant="secondary" onClick={handleCancel} className="px-5 py-2.5 text-sm">{t("common.cancel")}</ActionButton>
          <ActionButton variant="warning" onClick={handleConfirmDelete} className="gap-2 px-5 py-2.5 text-sm !bg-rose-600 !text-white !border-rose-600 hover:!bg-rose-700">
            <Trash2 className="h-4 w-4" /> {t("common.confirm")}
          </ActionButton>
        </div>
      </div>
      <LoadingOverlay isOpen={isDeleting} message={t("content.deletingBanner")} />
    </div>
  );
};
