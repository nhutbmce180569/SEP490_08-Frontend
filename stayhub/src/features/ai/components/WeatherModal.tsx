import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { X, CloudRain, Sun, Thermometer, Droplets } from "lucide-react";
import type { WeatherAdvice } from "../types/tourAssistant";
import { useLocale, useTranslation } from "../../../contexts/LocaleContext";
import { detectWeatherCondition, formatDataSource, getWeatherConditionLabel } from "../utils/weatherHelpers";

interface Props {
  weather: WeatherAdvice;
  onClose: () => void;
}

export const WeatherModal: React.FC<Props> = ({ weather, onClose }) => {
  const { t } = useTranslation();
  const { locale } = useLocale();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const condition = detectWeatherCondition(weather);
  const conditionLabel = getWeatherConditionLabel(condition, locale);
  
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  
  const periodLabel = `${formatDate(weather.periodStart)} → ${formatDate(weather.periodEnd)}`;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-slate-100 p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 z-10"
        >
          <X size={18} />
        </button>

        <div className="p-5 sm:p-6">
          <p className="travel-eyebrow mb-2">{t("ai.weatherAdvice")}</p>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="travel-heading text-xl text-navy">{weather.city}</h3>
            <span
              className={[
                "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                condition === "rainy"
                  ? "bg-sky-100 text-sky-700"
                  : condition === "hot"
                    ? "bg-orange-100 text-orange-700"
                    : condition === "cool"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-emerald-100 text-emerald-700",
              ].join(" ")}
            >
              {conditionLabel}
            </span>
          </div>

          <p className="mb-1 text-xs font-semibold text-slate-600">
            {t("ai.weatherDuringTrip")}: <span className="text-slate-800">{periodLabel}</span>
          </p>
          <p className="mb-5 text-[11px] text-slate-400">
            {formatDataSource(weather.dataSource, locale)}
          </p>

          <div className="mb-5 grid grid-cols-3 gap-3">
            {weather.avgMaxTempC != null && (
              <Stat
                icon={Sun}
                label={t("ai.weatherHigh")}
                value={`${weather.avgMaxTempC.toFixed(1)}°C`}
              />
            )}
            {weather.avgMinTempC != null && (
              <Stat
                icon={Thermometer}
                label={t("ai.weatherLow")}
                value={`${weather.avgMinTempC.toFixed(1)}°C`}
              />
            )}
            {weather.totalRainMm != null && (
              <Stat
                icon={Droplets}
                label={t("ai.rain")}
                value={`${weather.totalRainMm.toFixed(1)} mm`}
              />
            )}
          </div>

          <p className="mb-4 text-sm font-medium leading-relaxed text-slate-700">{weather.summary}</p>

          <div className="flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm font-medium leading-relaxed text-slate-600">
            <CloudRain size={18} className="mt-0.5 shrink-0 text-sky-500" />
            <div>
              <p className="mb-1 font-bold text-slate-700">{t("ai.weatherImpactTitle")}</p>
              {weather.impactOnTours}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const Stat: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className="rounded-xl bg-slate-50 p-3 text-center">
    <Icon size={18} className="mx-auto mb-1.5 text-sky-500" />
    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-0.5 text-sm font-bold text-slate-800">{value}</p>
  </div>
);
