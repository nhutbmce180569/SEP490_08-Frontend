import React from "react";
import { CalendarClock, CheckCircle2, Info } from "lucide-react";
import type { ScheduleAvailability } from "../types/tourAssistant";
import { useTranslation } from "../../../contexts/LocaleContext";

interface Props {
  schedule: ScheduleAvailability;
  hasNearbyTours: boolean;
}

export const ScheduleNoticeBanner: React.FC<Props> = ({ schedule, hasNearbyTours }) => {
  const { t } = useTranslation();
  const hasExact = schedule.hasToursInPreferredWindow;

  return (
    <div
      className={[
        "mb-6 flex items-start gap-3 rounded-2xl border p-4",
        hasExact
          ? "border-emerald-200 bg-emerald-50"
          : hasNearbyTours
            ? "border-amber-200 bg-amber-50"
            : "border-slate-200 bg-slate-50",
      ].join(" ")}
    >
      {hasExact ? (
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
      ) : (
        <CalendarClock size={20} className="mt-0.5 shrink-0 text-amber-600" />
      )}
      <div>
        <p className="text-sm font-bold text-slate-800">
          {hasExact ? t("ai.scheduleExactTitle") : t("ai.scheduleNearbyTitle")}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          {schedule.customerMessage}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {t("ai.scheduleWindow", {
            from: formatDate(schedule.preferredStartDate),
            to: formatDate(schedule.preferredEndDate),
          })}
        </p>
        {!hasExact && hasNearbyTours && (
          <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-amber-800">
            <Info size={14} className="mt-0.5 shrink-0" />
            {t("ai.scheduleNearbyHint")}
          </p>
        )}
      </div>
    </div>
  );
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
