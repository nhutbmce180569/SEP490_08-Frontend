import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Compass, ExternalLink } from "lucide-react";
import type { TourismInsight } from "../types/tourAssistant";

interface Props {
  insights: TourismInsight[];
}

export const RelatedInsightsCarousel: React.FC<Props> = ({ insights }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!insights || insights.length === 0) return null;

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass size={17} className="text-brand" />
          <h3 className="travel-heading text-lg text-navy">Related travel insights</h3>
        </div>
        <div className="flex gap-2">
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => scroll(dir)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white transition-colors hover:border-brand hover:text-brand"
            >
              {dir === -1 ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar"
      >
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="glass-card w-64 shrink-0 p-4"
          >
            {/* type → eyebrow label */}
            {insight.type && (
              <p className="travel-eyebrow mb-2">{insight.type}</p>
            )}

            {/* name → card title */}
            <p className="mb-2 text-sm font-bold leading-snug text-navy">
              {insight.name}
            </p>

            {/* description → body */}
            {insight.description && (
              <p className="text-xs font-medium leading-relaxed text-slate-500">
                {insight.description}
              </p>
            )}

            {/* city + authority */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {insight.city && (
                <span className="rounded-md bg-brand-light px-2 py-0.5 text-[10px] font-semibold text-brand">
                  {insight.city}
                </span>
              )}
              {insight.authorityLevel && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  {insight.authorityLevel}
                </span>
              )}
            </div>

            {/* source link */}
            {insight.sourceUrl ? (
              <a
                href={insight.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:underline"
              >
                {insight.sourceName || "Source"} <ExternalLink size={10} />
              </a>
            ) : insight.sourceName ? (
              <p className="mt-2 text-[11px] font-medium text-slate-400">
                {insight.sourceName}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
};
