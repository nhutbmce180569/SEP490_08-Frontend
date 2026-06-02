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
    <section className="glass-card mt-8 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <Info size={17} className="text-brand" />
          <span className="text-sm font-bold text-navy">
            Why were these tours recommended?
          </span>
        </div>
        {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-100 px-5 pb-5 pt-4">
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            {meta.modelFamily && <MetaItem label="Model" value={meta.modelFamily} />}
            {meta.modelVersion && <MetaItem label="Version" value={meta.modelVersion} />}
            {meta.fairnessAlpha != null && (
              <MetaItem label="Fairness α" value={String(meta.fairnessAlpha)} />
            )}
            {meta.aggregationFormula && (
              <MetaItem label="Formula" value={meta.aggregationFormula} />
            )}
          </div>

          {meta.personaTypesUsed?.length > 0 && (
            <div>
              <p className="travel-eyebrow mb-2">Personas used</p>
              <div className="flex flex-wrap gap-2">
                {meta.personaTypesUsed.map((p) => (
                  <span
                    key={p}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {weights.length > 0 && (
            <div>
              <p className="travel-eyebrow mb-2">Dimension weights</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {weights.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold"
                  >
                    <span className="text-slate-600">{formatDimensionKey(k)}</span>
                    <span className="text-brand">{v.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {meta.knowledgeSources?.length > 0 && (
            <div>
              <p className="travel-eyebrow mb-2">Knowledge sources</p>
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
                      <span className="ml-2 text-xs text-slate-400">({src.authority})</span>
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
  <div className="rounded-xl bg-slate-50 p-3">
    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-0.5 text-sm font-bold text-slate-700">{value}</p>
  </div>
);
