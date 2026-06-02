import React from "react";
import { CloudRain, Thermometer, Droplets } from "lucide-react";
import type { WeatherAdvice } from "../types/tourAssistant";

interface Props {
  weather: WeatherAdvice;
}

export const WeatherAdviceCard: React.FC<Props> = ({ weather }) => (
  <div
    className="rounded-2xl p-5 h-full"
    style={{
      background: "#fff",
      border: "1px solid rgba(5,7,60,0.08)",
      boxShadow: "0 2px 12px rgba(5,7,60,0.04)",
    }}
  >
    <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-2" style={{ color: "var(--color-brand)" }}>
      Thời tiết dự báo
    </p>
    <h3 className="text-lg font-black text-slate-900 mb-1">{weather.city}</h3>
    <p className="text-xs text-slate-400 font-medium mb-4">
      {weather.periodStart?.slice(0, 10)} → {weather.periodEnd?.slice(0, 10)} · {weather.dataSource}
    </p>

    <div className="grid grid-cols-3 gap-3 mb-4">
      {weather.avgMaxTempC != null && (
        <Stat icon={Thermometer} label="Max" value={`${weather.avgMaxTempC.toFixed(1)}°C`} />
      )}
      {weather.avgMinTempC != null && (
        <Stat icon={Thermometer} label="Min" value={`${weather.avgMinTempC.toFixed(1)}°C`} />
      )}
      {weather.totalRainMm != null && (
        <Stat icon={Droplets} label="Mưa" value={`${weather.totalRainMm.toFixed(1)} mm`} />
      )}
    </div>

    <p className="text-sm font-bold text-slate-700 mb-2">{weather.summary}</p>
    <div
      className="flex gap-2 items-start p-3 rounded-xl text-xs font-medium text-slate-600 leading-relaxed"
      style={{ background: "#F0F9FF", border: "1px solid rgba(14,165,233,0.15)" }}
    >
      <CloudRain size={16} className="text-sky-500 shrink-0 mt-0.5" />
      {weather.impactOnTours}
    </div>
  </div>
);

const Stat: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div
    className="rounded-xl p-3 text-center"
    style={{ background: "rgba(5,7,60,0.03)" }}
  >
    <Icon size={16} className="mx-auto mb-1 text-sky-500" />
    <p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p>
    <p className="text-sm font-black text-slate-800">{value}</p>
  </div>
);
