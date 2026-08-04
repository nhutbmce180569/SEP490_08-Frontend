import React from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import type { CulturalFact } from "../types/tourAssistant";
import { useTranslation } from "../../../contexts/LocaleContext";
import { DynamicText } from "../../../components/DynamicText";

interface Props {
  facts: CulturalFact[];
}

export const CulturalFactsSidebar: React.FC<Props> = ({ facts }) => {
  const { t } = useTranslation();
  if (facts.length === 0) return null;

  return (
    <aside className="glass-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen size={17} className="text-brand" />
        <h3 className="text-sm font-bold text-navy">{t("ai.localKnowledge")}</h3>
      </div>

      <ul className="space-y-4">
        {facts.map((fact, i) => (
          <li
            key={i}
            className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"
          >
            <p className="mb-2 text-sm font-medium leading-relaxed text-slate-700">
              <DynamicText text={fact.fact} />
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {fact.authorityLevel && (
                <span className="rounded-md bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase text-brand">
                  {fact.authorityLevel}
                </span>
              )}
              {fact.sourceUrl ? (
                <a
                  href={fact.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:underline"
                >
                  {fact.sourceName || t("ai.source")} <ExternalLink size={10} />
                </a>
              ) : (
                fact.sourceName && (
                  <span className="text-[11px] font-medium text-slate-400">
                    {fact.sourceName}
                  </span>
                )
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
};
