import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Compass } from "lucide-react";
import type { TourismInsight } from "../types/tourAssistant";

interface Props {
  insights: TourismInsight[];
}

export const RelatedInsightsCarousel: React.FC<Props> = ({ insights }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (insights.length === 0) return null;

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Compass size={18} style={{ color: "#EB662B" }} />
          <h3 className="text-lg font-black text-slate-900">Thông tin du lịch liên quan</h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:border-[#EB662B] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:border-[#EB662B] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {insights.map((item) => (
          <article
            key={item.id}
            className="snap-start shrink-0 w-[260px] rounded-2xl p-4 bg-white"
            style={{ border: "1px solid rgba(5,7,60,0.08)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                style={{ background: "#FFF1EB", color: "#EB662B" }}
              >
                {item.type}
              </span>
              {item.city && (
                <span className="text-[10px] font-bold text-slate-400">{item.city}</span>
              )}
            </div>
            <h4 className="text-sm font-black text-slate-800 mb-2 line-clamp-2">{item.name}</h4>
            {item.description && (
              <p className="text-xs text-slate-500 font-medium line-clamp-3 mb-3">
                {item.description}
              </p>
            )}
            {item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-sky-600 hover:underline"
              >
                {item.sourceName ?? "Xem nguồn"}
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};
