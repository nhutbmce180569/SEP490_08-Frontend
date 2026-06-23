import React from "react";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Globe,
  Lock,
  MapPin,
  Pencil,
  Tag,
  Unlock,
} from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useTranslation } from "../../../contexts/LocaleContext";
import { getImg } from "../../../config/api/api";
import { useChangeTourismInformationStatus } from "../hooks/useChangeTourismInformationStatus";
import { useTourismInformationDetail } from "../hooks/useTourismInformationDetail";
import { TOURISM_TYPE_LABELS } from "../types/tourismInformation";

const getTypeLabel = (type: string) =>
  TOURISM_TYPE_LABELS[type as keyof typeof TOURISM_TYPE_LABELS] ?? type;

export const TourismInformationDetail: React.FC = () => {
  const { t } = useTranslation();
  const { tourismInfo, isLoading, error, handleEdit, handleBack, refetch } =
    useTourismInformationDetail();
  const { executeStatusChange, updatingId, isActiveStatus } =
    useChangeTourismInformationStatus(refetch);

  const formatDate = (date?: string | null) => {
    if (!date) return t("common.na");
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return t("common.na");
    return parsed.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-10 text-slate-500">
        {t("content.loadingTourismInfo")}
      </div>
    );
  }

  if (error) {
    return <div className="flex justify-center p-10 text-rose-500">{error}</div>;
  }

  if (!tourismInfo) {
    return (
      <div className="flex justify-center p-10 text-slate-500">
        {t("content.tourismInfoNotFound")}
      </div>
    );
  }

  const active = isActiveStatus(tourismInfo.status);
  const hasCoordinates =
    tourismInfo.latitude !== undefined &&
    tourismInfo.latitude !== null &&
    tourismInfo.longitude !== undefined &&
    tourismInfo.longitude !== null;
  const locationText = [tourismInfo.address, tourismInfo.city, tourismInfo.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-5xl py-2">
      <button
        type="button"
        onClick={handleBack}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> {t("content.backToTourismInfo")}
      </button>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 gap-4">
            {tourismInfo.imageUrl ? (
              <img
                src={getImg(tourismInfo.imageUrl)}
                alt={tourismInfo.name}
                className="h-24 w-36 shrink-0 rounded-xl border border-slate-200 object-cover"
                onError={(event) => {
                  event.currentTarget.src =
                    "https://placehold.co/360x240/f8fafc/94a3b8?text=No+Image";
                }}
              />
            ) : (
              <div className="flex h-24 w-36 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
                {t("content.noImage")}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">{tourismInfo.name}</h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {active ? t("common.active") : t("common.inactive")}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600">
                  <Tag className="h-3 w-3" />
                  {getTypeLabel(tourismInfo.type)}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {tourismInfo.description || t("content.noDescriptionProvided")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionButton
              variant="secondary"
              onClick={() => executeStatusChange(tourismInfo.id, tourismInfo.status)}
              className={`gap-2 px-4 py-2 text-sm ${
                updatingId === tourismInfo.id ? "cursor-wait opacity-50" : ""
              } ${
                active
                  ? "text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  : "text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
              disabled={updatingId === tourismInfo.id}
            >
              {active ? (
                <>
                  <Lock className="h-4 w-4" /> {t("content.deactivate")}
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" /> {t("content.activate")}
                </>
              )}
            </ActionButton>
            <ActionButton variant="primary" onClick={handleEdit} className="gap-2 px-4 py-2 text-sm">
              <Pencil className="h-4 w-4" /> {t("content.edit")}
            </ActionButton>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailCard
            icon={<MapPin className="h-4 w-4" />}
            label={t("content.address")}
            value={tourismInfo.address || t("common.na")}
          />
          <DetailCard
            icon={<Globe className="h-4 w-4" />}
            label={t("content.cityCountry")}
            value={[tourismInfo.city, tourismInfo.country].filter(Boolean).join(", ") || t("common.na")}
          />
          <DetailCard
            icon={<MapPin className="h-4 w-4" />}
            label={t("content.coordinates")}
            value={
              hasCoordinates
                ? `${tourismInfo.latitude}, ${tourismInfo.longitude}`
                : t("content.notSet")
            }
          />
          <DetailCard
            icon={<Calendar className="h-4 w-4" />}
            label={t("content.createdAt")}
            value={formatDate(tourismInfo.createdAt)}
          />
          <DetailCard
            icon={<Calendar className="h-4 w-4" />}
            label={t("content.updatedAt")}
            value={formatDate(tourismInfo.updatedAt)}
          />
          <DetailCard
            icon={<ExternalLink className="h-4 w-4" />}
            label={t("content.source")}
            value={tourismInfo.sourceName || t("common.na")}
            hint={
              tourismInfo.sourceUrl ? (
                <a
                  href={tourismInfo.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-brand hover:underline"
                >
                  {t("content.openSourceLink")} <ExternalLink className="h-3 w-3" />
                </a>
              ) : undefined
            }
          />
        </div>

        {hasCoordinates && (
          <div className="border-t border-slate-100 px-6 py-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-800">{t("content.mapPreview")}</h3>
              <a
                href={`https://www.google.com/maps?q=${tourismInfo.latitude},${tourismInfo.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-brand hover:underline"
              >
                {t("content.openInGoogleMaps")}
              </a>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <iframe
                title={t("content.mapOf", { name: tourismInfo.name })}
                width="100%"
                height="280"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  Number(tourismInfo.longitude) - 0.01
                },${Number(tourismInfo.latitude) - 0.01},${
                  Number(tourismInfo.longitude) + 0.01
                },${Number(tourismInfo.latitude) + 0.01}&layer=mapnik&marker=${
                  tourismInfo.latitude
                },${tourismInfo.longitude}`}
              />
            </div>
            {locationText && <p className="mt-2 text-xs text-slate-500">{locationText}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

const DetailCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: React.ReactNode;
}> = ({ icon, label, value, hint }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {icon}
      {label}
    </div>
    <div className="text-sm font-semibold text-slate-900">{value}</div>
    {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
  </div>
);
