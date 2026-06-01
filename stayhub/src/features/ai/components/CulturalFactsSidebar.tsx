import React from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import type { CulturalFact } from "../types/tourAssistant";

interface Props {
  facts: CulturalFact[];
}

export const CulturalFactsSidebar: React.FC<Props> = ({ facts }) => {
  if (facts.length === 0) return null;

  return (
    <aside
      className="rounded-2xl p-5"
      style={{
        background: "#fff",
        border: "1px solid rgba(5,7,60,0.08)",
        boxShadow: "0 2px 12px rgba(5,7,60,0.04)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={18} style={{ color: "#EB662B" }} />
        <h3 className="text-sm font-black text-slate-800">Tri thức địa phương</h3>
      </div>

      <ul className="space-y-4">
        {facts.map((fact, i) => (
          <li
            key={i}
            className="pb-4 last:pb-0 last:border-0"
            style={{ borderBottom: "1px solid rgba(5,7,60,0.06)" }}
          >
            <p className="text-sm text-slate-700 font-medium leading-relaxed mb-2">
              {fact.fact}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {fact.authorityLevel && (
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase"
                  style={{ background: "#FFF1EB", color: "#EB662B" }}
                >
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
                  {fact.sourceName || "Nguồn"} <ExternalLink size={10} />
                </a>
              ) : (
                fact.sourceName && (
                  <span className="text-[11px] text-slate-400 font-medium">
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
