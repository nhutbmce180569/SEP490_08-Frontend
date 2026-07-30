import React from "react";
import { Compass, Map } from "lucide-react";
import { useTranslation } from "../../../contexts/LocaleContext";

export type ResultsViewTab = "tours" | "trip";

interface Props {
  active: ResultsViewTab;
  onChange: (tab: ResultsViewTab) => void;
  tourCount: number;
}

export const AiResultsViewTabs: React.FC<Props> = ({ active, onChange, tourCount }) => {
  const { t } = useTranslation();

  const tabs: { id: ResultsViewTab; label: string; icon: React.ElementType }[] = [
    { id: "tours", label: t("ai.tabTours", { count: tourCount }), icon: Map },
    { id: "trip", label: t("ai.tabTripInfo"), icon: Compass },
  ];

  return (
    <div
      className="mb-5 flex gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1"
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={[
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all",
              isActive
                ? "bg-white text-brand shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            <tab.icon size={16} />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
