import React, { useState } from "react";
import { Lightbulb } from "lucide-react";
import { useTranslation } from "../../../contexts/LocaleContext";

interface Props {
  generalTips: string[];
  foreignVisitorTips: string[];
  elderlyCompanionTips: string[];
  childrenCompanionTips: string[];
}

type TabKey = "general" | "foreign" | "elderly" | "children";

export const TipsTabsPanel: React.FC<Props> = ({
  generalTips,
  foreignVisitorTips,
  elderlyCompanionTips,
  childrenCompanionTips,
}) => {
  const { t } = useTranslation();

  const TABS: { key: TabKey; labelKey: string }[] = [
    { key: "general", labelKey: "ai.tipsTabGeneral" },
    { key: "foreign", labelKey: "ai.tipsTabInternational" },
    { key: "elderly", labelKey: "ai.tipsTabElderly" },
    { key: "children", labelKey: "ai.tipsTabFamilies" },
  ];

  const tipsMap: Record<TabKey, string[]> = {
    general: generalTips,
    foreign: foreignVisitorTips,
    elderly: elderlyCompanionTips,
    children: childrenCompanionTips,
  };

  const availableTabs = TABS.filter((tab) => tipsMap[tab.key].length > 0);
  const [active, setActive] = useState<TabKey>(availableTabs[0]?.key ?? "general");

  if (availableTabs.length === 0) return null;

  const currentTips = tipsMap[active] ?? [];

  return (
    <div className="glass-card flex h-full flex-col p-5">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb size={17} className="text-brand" />
        <h3 className="text-sm font-bold text-navy">{t("ai.tips")}</h3>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {availableTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              active === tab.key
                ? "bg-brand text-white"
                : "border border-slate-200 bg-white text-slate-500 hover:border-brand/30 hover:text-brand"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <ul className="max-h-60 flex-1 space-y-2.5 overflow-y-auto pr-1">
        {currentTips.map((tip, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
};
