import React from "react";
import type { TourScoreBreakdown } from "../types/tourAssistant";
import { formatDimensionKey, formatMatchPercent, formatPersonaKey } from "../utils/formatters";
import { useLocale, useTranslation } from "../../../contexts/LocaleContext";

interface Props {
  breakdown: TourScoreBreakdown;
}

export const ScoreBreakdownPanel: React.FC<Props> = ({ breakdown }) => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const dimensions = Object.entries(breakdown.dimensionScores ?? {});
  const personas = Object.entries(breakdown.personaScores ?? {});

  return (
    <div
      className="rounded-2xl p-4 space-y-4 text-sm"
      style={{ background: "rgba(5,7,60,0.02)", border: "1px solid rgba(5,7,60,0.06)" }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Metric label={t("ai.fairnessAdmin")} value={formatMatchPercent(breakdown.fairnessScore)} highlight />
        <Metric label={t("ai.envyGapAdmin")} value={breakdown.envyGap.toFixed(2)} />
        <Metric label={t("ai.minPersonaAdmin")} value={formatMatchPercent(breakdown.minPersonaScore)} />
        <Metric label={t("ai.meanPersonaAdmin")} value={formatMatchPercent(breakdown.meanPersonaScore)} />
      </div>

      {dimensions.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
            {t("ai.scoreByDimension")}
          </p>
          <div className="space-y-2">
            {dimensions.map(([key, score]) => (
              <BarRow key={key} label={formatDimensionKey(key, locale)} value={score} />
            ))}
          </div>
        </div>
      )}

      {personas.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
            {t("ai.personaScores")}
          </p>
          <div className="space-y-2">
            {personas.map(([key, score]) => (
              <BarRow key={key} label={formatPersonaKey(key, locale)} value={score} color="#6366f1" />
            ))}
          </div>
        </div>
      )}

      {breakdown.aggregationFormula && (
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed pt-2 border-t border-slate-100">
          {breakdown.aggregationFormula}
        </p>
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <div
    className="rounded-xl p-3"
    style={{
      background: highlight ? "var(--color-brand-light)" : "#fff",
      border: "1px solid rgba(5,7,60,0.06)",
    }}
  >
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <p
      className="text-lg font-black mt-0.5"
      style={{ color: highlight ? "var(--color-brand)" : "#0f172a" }}
    >
      {value}
    </p>
  </div>
);

const BarRow: React.FC<{ label: string; value: number; color?: string }> = ({
  label,
  value,
  color = "var(--color-brand)",
}) => (
  <div>
    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
      <span>{label}</span>
      <span>{formatMatchPercent(value)}</span>
    </div>
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(5,7,60,0.06)" }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value * 100)}%`, background: color }}
      />
    </div>
  </div>
);
