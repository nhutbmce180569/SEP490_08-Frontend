import React from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { useLocale, useTranslation } from "../../../contexts/LocaleContext";
import {
  buildWhyFitSummary,
  formatMatchReasonTechnical,
  getCustomerWhyFitContent,
} from "../utils/customerMatchReasons";

interface Props {
  reason?: string;
  matchReasons: string[];
  customerMode?: boolean;
}

export const TourWhyFitPanel: React.FC<Props> = ({
  reason,
  matchReasons,
  customerMode = true,
}) => {
  const { t } = useTranslation();
  const { locale } = useLocale();

  if (customerMode) {
    const reasons = matchReasons.length > 0 ? matchReasons : reason ? [reason] : [];
    const { positive, cautions } = getCustomerWhyFitContent(reasons, locale);
    const summary = buildWhyFitSummary(reasons, locale);

    return (
      <div className="mt-3 rounded-xl border border-brand/15 bg-brand-light/30 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-brand">
          <Sparkles size={14} />
          {t("ai.whyThisTour")}
        </p>
        <p className="mb-2 text-xs font-semibold leading-relaxed text-slate-800">{summary}</p>

        {positive.length > 0 && (
          <ul className="space-y-1.5">
            {positive.map((item) => (
              <li key={item} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                {item}
              </li>
            ))}
          </ul>
        )}

        {cautions.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
            <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
              <AlertTriangle size={12} />
              {t("ai.thingsToNote")}
            </p>
            <ul className="space-y-1">
              {cautions.map((item) => (
                <li key={item} className="text-xs leading-relaxed text-amber-900">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const bullets = matchReasons
    .map((r) => formatMatchReasonTechnical(r, locale))
    .filter(Boolean);

  if (!reason && bullets.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl bg-slate-50 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
        <Sparkles size={14} className="text-brand" />
        {t("ai.whyThisTourTechnical")}
      </p>
      {reason && (
        <p className="mb-2 text-xs font-medium leading-relaxed text-slate-600">{reason}</p>
      )}
      {bullets.length > 0 && (
        <ul className="space-y-1.5">
          {bullets.map((item) => (
            <li key={item} className="flex gap-2 text-xs leading-relaxed text-slate-600">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
