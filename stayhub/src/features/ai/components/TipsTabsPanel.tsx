import React, { useState } from "react";
import { Lightbulb } from "lucide-react";

interface Props {
  generalTips: string[];
  foreignVisitorTips: string[];
  elderlyCompanionTips: string[];
  childrenCompanionTips: string[];
}

type TabKey = "general" | "foreign" | "elderly" | "children";

const TABS: { key: TabKey; label: string }[] = [
  { key: "general", label: "Chung" },
  { key: "foreign", label: "Khách quốc tế" },
  { key: "elderly", label: "Người cao tuổi" },
  { key: "children", label: "Trẻ em" },
];

export const TipsTabsPanel: React.FC<Props> = ({
  generalTips,
  foreignVisitorTips,
  elderlyCompanionTips,
  childrenCompanionTips,
}) => {
  const tipsMap: Record<TabKey, string[]> = {
    general: generalTips,
    foreign: foreignVisitorTips,
    elderly: elderlyCompanionTips,
    children: childrenCompanionTips,
  };

  const availableTabs = TABS.filter((t) => tipsMap[t.key].length > 0);
  const [active, setActive] = useState<TabKey>(availableTabs[0]?.key ?? "general");

  if (availableTabs.length === 0) return null;

  const currentTips = tipsMap[active] ?? [];

  return (
    <div
      className="rounded-2xl p-5 h-full flex flex-col"
      style={{
        background: "#fff",
        border: "1px solid rgba(5,7,60,0.08)",
        boxShadow: "0 2px 12px rgba(5,7,60,0.04)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={18} style={{ color: "#EB662B" }} />
        <h3 className="text-sm font-black text-slate-800">Mẹo du lịch</h3>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {availableTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: active === tab.key ? "#EB662B" : "rgba(5,7,60,0.04)",
              color: active === tab.key ? "#fff" : "#64748b",
              border: "1px solid rgba(5,7,60,0.08)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ul className="space-y-3 flex-1 overflow-y-auto max-h-64">
        {currentTips.map((tip, i) => (
          <li
            key={i}
            className="text-sm text-slate-600 font-medium leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full"
            style={{ ["--tw-before-bg" as string]: "#EB662B" }}
          >
            <span
              className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full"
              style={{ background: "#EB662B" }}
            />
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
};
