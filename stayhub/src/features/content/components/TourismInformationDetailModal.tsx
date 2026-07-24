import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import {
  X,
  Calendar,
  ExternalLink,
  Globe,
  MapPin,
  Tag,
} from "lucide-react";
import Map, { Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTranslation } from "../../../contexts/LocaleContext";
import { getImg } from "../../../config/api/api";
import { TOURISM_TYPE_LABELS } from "../types/tourismInformation";
import { useQuery } from "@tanstack/react-query";
import { DynamicText } from "../../../components/DynamicText";
import { tourismInformationService } from "../services/tourismInformation.service";

const getTypeLabel = (type: string, t: any) => {
  return t(`content.tourismType${type}`, {
    defaultValue: TOURISM_TYPE_LABELS[type as keyof typeof TOURISM_TYPE_LABELS] ?? type
  });
};

interface TourismInformationDetailModalProps {
  id: string | null;
  onClose: () => void;
}

export const TourismInformationDetailModal: React.FC<TourismInformationDetailModalProps> = ({
  id,
  onClose,
}) => {
  const { t } = useTranslation();
  
  const { data: tourismInfo, isLoading, error, refetch } = useQuery({
    queryKey: ["tourism-information", id],
    queryFn: () => tourismInformationService.getAdminById(id!),
    enabled: !!id,
  });

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (id) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [id]);

  const formatDate = (date?: string | null) => {
    if (!date) return t("common.na");
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return t("common.na");
    return parsed.toLocaleString();
  };

  if (!id) return null;

  const active = tourismInfo?.status === "Active";
  const hasCoordinates =
    tourismInfo?.latitude !== undefined &&
    tourismInfo?.latitude !== null &&
    tourismInfo?.longitude !== undefined &&
    tourismInfo?.longitude !== null;
  const locationText = tourismInfo
    ? [tourismInfo.address, tourismInfo.city, tourismInfo.country].filter(Boolean).join(", ")
    : "";

  const content = (
    <div
      className={`glass-overlay fixed inset-0 z-[500] flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`glass-modal relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden transition-all duration-300 ${
          isVisible ? "translate-y-0 scale-100" : "translate-y-4 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="icon-btn absolute right-4 top-4 z-10"
          aria-label={t("common.close")}
        >
          <X className="h-5 w-5" />
        </button>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand/30 border-t-brand"></div>
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center text-rose-500">
            {t("common.error")}
          </div>
        ) : !tourismInfo ? (
          <div className="flex h-64 items-center justify-center text-slate-500">
            {t("content.tourismInfoNotFound")}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-5 border-b border-slate-100 bg-white px-6 py-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-1 gap-5">
                <div className="group relative h-28 w-40 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {tourismInfo.imageUrl ? (
                    <>
                      <img
                        src={getImg(tourismInfo.imageUrl)}
                        alt={tourismInfo.name}
                        className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('fallback-image-shown');
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-50 opacity-0 [.fallback-image-shown_&]:opacity-100">
                        <div className="flex flex-col items-center gap-1.5 text-slate-400">
                          <Tag className="h-6 w-6 opacity-50" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider">{t("content.noImage")}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400">
                      <Tag className="h-6 w-6 opacity-50" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">{t("content.noImage")}</span>
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        active 
                          ? "bg-emerald-50 text-emerald-700" 
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {active ? t("common.active") : t("common.inactive")}
                    </span>
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-slate-900"><DynamicText text={tourismInfo.name} /></h2>
                  <p className="text-sm text-slate-500">
                    {tourismInfo.description ? <DynamicText text={tourismInfo.description} isHtml={true} /> : <span className="italic">{t("content.noDescriptionProvided")}</span>}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 bg-slate-50/50 p-6 sm:grid-cols-2">
              <DetailCard
                icon={<Tag className="h-4 w-4" />}
                label={t("content.type")}
                value={
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                    {getTypeLabel(tourismInfo.type, t)}
                  </span>
                }
              />
              <DetailCard
                icon={<Globe className="h-4 w-4" />}
                label={t("content.cityCountry")}
                value={[tourismInfo.city, tourismInfo.country].filter(Boolean).length > 0 ? <DynamicText text={[tourismInfo.city, tourismInfo.country].filter(Boolean).join(", ")} /> : t("common.na")}
              />
              <DetailCard
                icon={<MapPin className="h-4 w-4" />}
                label={t("content.address")}
                value={tourismInfo.address ? <DynamicText text={tourismInfo.address} /> : t("common.na")}
                className="sm:col-span-2"
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
                className="sm:col-span-2"
                hint={
                  tourismInfo.sourceUrl ? (
                    <a
                      href={tourismInfo.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                    >
                      {t("content.openSourceLink")} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : undefined
                }
              />
            </div>

            {hasCoordinates && (
              <div className="border-t border-slate-100 bg-white p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-800">{t("content.mapPreview")}</h3>
                  <a
                    href={`https://www.google.com/maps?q=${tourismInfo.latitude},${tourismInfo.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    Google Maps <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                
                <div className="relative overflow-hidden rounded-xl border border-slate-200">
                  {mapboxToken ? (
                    <Map
                      initialViewState={{
                        latitude: Number(tourismInfo.latitude),
                        longitude: Number(tourismInfo.longitude),
                        zoom: 14,
                      }}
                      mapboxAccessToken={mapboxToken}
                      mapStyle="mapbox://styles/mapbox/streets-v12"
                      language="en"
                      style={{ width: "100%", height: "280px" }}
                      attributionControl={false}
                    >
                      <Marker
                        latitude={Number(tourismInfo.latitude)}
                        longitude={Number(tourismInfo.longitude)}
                        anchor="center"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-indigo-600 shadow-md">
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                      </Marker>
                    </Map>
                  ) : (
                    <div className="flex h-[280px] w-full items-center justify-center bg-slate-50 px-6 text-center text-sm font-medium text-amber-700">
                      VITE_MAPBOX_TOKEN is missing. Add it to the environment to load the map.
                    </div>
                  )}
                  
                  <div className="absolute bottom-3 left-3 rounded border border-white/40 bg-black/50 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                    {tourismInfo.latitude}, {tourismInfo.longitude}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

const DetailCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}> = ({ icon, label, value, hint, className = "" }) => (
  <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
    <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
      <span className="text-slate-400">{icon}</span>
      {label}
    </div>
    <div className="text-sm font-medium text-slate-900">{value}</div>
    {hint && <div className="mt-1">{hint}</div>}
  </div>
);

