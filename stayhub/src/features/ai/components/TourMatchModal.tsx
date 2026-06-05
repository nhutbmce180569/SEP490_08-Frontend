import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Sparkles } from "lucide-react";
import type { TourRecommendationItem } from "../types/tourAssistant";
import { CustomerScoreBreakdownPanel } from "./CustomerScoreBreakdownPanel";
import { TourWhyFitPanel } from "./TourWhyFitPanel";
import { formatMatchPercent } from "../utils/formatters";
import { useTranslation } from "../../../contexts/LocaleContext";

interface Props {
  tour: TourRecommendationItem | null;
  onClose: () => void;
}

export const TourMatchModal: React.FC<Props> = ({ tour, onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!tour) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [tour, onClose]);

  if (!tour) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t("ai.matchModalTitle")}
    >
      <div className="flex max-h-[min(88vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-bold text-brand">
              <Sparkles size={14} />
              {t("ai.matchLabel", { percent: formatMatchPercent(tour.score) })}
            </p>
            <h3 className="mt-1 line-clamp-2 text-base font-black text-navy">{tour.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn !h-9 !w-9 shrink-0 rounded-xl"
            aria-label={t("ai.close")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <TourWhyFitPanel
            reason={tour.reason}
            matchReasons={tour.matchReasons}
            customerMode
          />
          {tour.scoreBreakdown && (
            <CustomerScoreBreakdownPanel breakdown={tour.scoreBreakdown} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
