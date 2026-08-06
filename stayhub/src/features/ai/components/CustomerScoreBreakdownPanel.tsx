import React from "react";
import type { TourScoreBreakdown } from "../types/tourAssistant";
import { formatDimensionKey, formatMatchPercent } from "../utils/formatters";
import { useLocale, useTranslation } from "../../../contexts/LocaleContext";
import { DynamicText } from "../../../components/DynamicText";

interface Props {
  breakdown: TourScoreBreakdown;
}

export const CustomerScoreBreakdownPanel: React.FC<Props> = ({ breakdown }) => {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const explanations =
    breakdown.dimensionExplanations && breakdown.dimensionExplanations.length > 0
      ? breakdown.dimensionExplanations
      : Object.entries(breakdown.dimensionScores ?? {}).map(([key, score]) => ({
          dimensionKey: key,
          label: formatDimensionKey(key, locale),
          score,
          weight: 0,
          explanation: "",
        }));

  return (
    <div className="space-y-3 text-sm">
      <div
        className="rounded-xl p-3"
        style={{ background: "var(--color-brand-light)", border: "1px solid rgba(235,102,43,0.15)" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {t("ai.overallMatchScore")}
        </p>
        <p className="text-xl font-black mt-0.5" style={{ color: "var(--color-brand)" }}>
          {formatMatchPercent(breakdown.fairnessScore)}
        </p>
        {breakdown.overallExplanation && (
          <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">
            <DynamicText text={breakdown.overallExplanation} />
          </p>
        )}
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
          {t("ai.scoreByCriteria")}
        </p>
        <div className="space-y-3">
          {explanations.map((item) => (
            <DimensionRow
              key={item.dimensionKey}
              label={item.label}
              score={item.score}
              weight={item.weight}
              explanation={item.explanation}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const DimensionRow: React.FC<{
  label: string;
  score: number;
  weight: number;
  explanation: string;
}> = ({ label, score, weight, explanation }) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl bg-white p-3" style={{ border: "1px solid rgba(5,7,60,0.06)" }}>
      <div className="flex justify-between items-start gap-2 mb-1">
        <span className="text-xs font-bold text-slate-700"><DynamicText text={label} /></span>
        <div className="text-right shrink-0">
          <span className="text-xs font-black" style={{ color: "var(--color-brand)" }}>
            {formatMatchPercent(score)}
          </span>
          {weight > 0 && (
            <p className="text-[9px] font-semibold text-slate-400 mt-0.5">
              {t("ai.criteriaWeight", { percent: Math.round(weight * 100) })}
            </p>
          )}
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "rgba(5,7,60,0.06)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, score * 100)}%`, background: "var(--color-brand)" }}
        />
      </div>
      {explanation && (
        <p className="text-[11px] font-medium leading-relaxed text-slate-500"><DynamicText text={explanation} /></p>
      )}
    </div>
  );
};
