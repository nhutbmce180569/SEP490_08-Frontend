import React, { useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import type { RecommenderTransparency } from "../types/tourAssistant";
import { formatDimensionKey } from "../utils/formatters";

interface Props {
  meta: RecommenderTransparency;
}

export const RecommenderMetaPanel: React.FC<Props> = ({ meta }) => {
  const [open, setOpen] = useState(false);

  if (!meta.modelVersion && !meta.modelFamily) return null;

  const weights = Object.entries(meta.dimensionWeights ?? {});

  return (
    <section
      className="mt-10 rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(5,7,60,0.08)", background: "#fff" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info size={18} style={{ color: "#EB662B" }} />
          <span className="text-sm font-black text-slate-800">
            Tại sao các tour này được gợi ý?
          </span>
        </div>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {meta.modelFamily && (
              <MetaItem label="Model" value={meta.modelFamily} />
            )}
            {meta.modelVersion && (
              <MetaItem label="Version" value={meta.modelVersion} />
            )}
            {meta.fairnessAlpha != null && (
              <MetaItem label="Fairness α" value={String(meta.fairnessAlpha)} />
            )}
            {meta.aggregationFormula && (
              <MetaItem label="Công thức" value={meta.aggregationFormula} />
            )}
          </div>

          {meta.personaTypesUsed?.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Personas
              </p>
              <div className="flex flex-wrap gap-2">
                {meta.personaTypesUsed.map((p) => (
                  <span
                    key={p}
                    className="px-3 py-1 rounded-lg text-xs font-bold"
                    style={{ background: "rgba(5,7,60,0.04)", color: "#475569" }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {weights.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Trọng số chiều
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {weights.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between text-xs font-bold px-3 py-2 rounded-lg"
                    style={{ background: "rgba(5,7,60,0.03)" }}
                  >
                    <span className="text-slate-600">{formatDimensionKey(k)}</span>
                    <span style={{ color: "#EB662B" }}>{v.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {meta.knowledgeSources?.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Nguồn tri thức
              </p>
              <ul className="space-y-1">
                {meta.knowledgeSources.map((src) => (
                  <li key={src.name}>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-sky-600 hover:underline"
                    >
                      {src.name}
                    </a>
                    {src.authority && (
                      <span className="text-xs text-slate-400 ml-2">({src.authority})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

const MetaItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl p-3" style={{ background: "rgba(5,7,60,0.03)" }}>
    <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
    <p className="text-sm font-bold text-slate-700 mt-0.5">{value}</p>
  </div>
);
