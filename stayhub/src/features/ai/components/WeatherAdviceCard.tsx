import React from "react";
import { CloudRain, Thermometer, Droplets } from "lucide-react";
import type { WeatherAdvice } from "../types/tourAssistant";

interface Props {
  weather: WeatherAdvice;
}

export const WeatherAdviceCard: React.FC<Props> = ({ weather }) => (
  <div className="glass-card h-full p-5">
    <p className="travel-eyebrow mb-2">Weather forecast</p>
    <h3 className="travel-heading mb-1 text-lg text-navy">{weather.city}</h3>
    <p className="mb-4 text-xs font-medium text-slate-400">
      {weather.periodStart?.slice(0, 10)} → {weather.periodEnd?.slice(0, 10)}{" "}
      · {weather.dataSource}
    </p>

    <div className="mb-4 grid grid-cols-3 gap-3">
      {weather.avgMaxTempC != null && (
        <Stat icon={Thermometer} label="Max" value={`${weather.avgMaxTempC.toFixed(1)}°C`} />
      )}
      {weather.avgMinTempC != null && (
        <Stat icon={Thermometer} label="Min" value={`${weather.avgMinTempC.toFixed(1)}°C`} />
      )}
      {weather.totalRainMm != null && (
        <Stat icon={Droplets} label="Rain" value={`${weather.totalRainMm.toFixed(1)} mm`} />
      )}
    </div>

    <p className="mb-3 text-sm font-bold text-slate-700">{weather.summary}</p>

    <div className="flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 p-3 text-xs font-medium leading-relaxed text-slate-600">
      <CloudRain size={15} className="mt-0.5 shrink-0 text-sky-500" />
      {weather.impactOnTours}
    </div>
  </div>
);

const Stat: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className="rounded-xl bg-slate-50 p-3 text-center">
    <Icon size={15} className="mx-auto mb-1 text-sky-500" />
    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="text-sm font-bold text-slate-800">{value}</p>
  </div>
);
