import React, { useRef, useState, useEffect } from "react";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { AiTourRecommendationCard } from "./AiTourRecommendationCard";
import { useSimilarTours } from "../hooks/useSimilarTours";
import { useLogAiInteraction } from "../hooks/useLogAiInteraction";
import { useTranslation } from "../../../contexts/LocaleContext";

interface Props {
  tourId: string | number;
  top?: number;
}

export const SimilarToursSection: React.FC<Props> = ({ tourId, top = 5 }) => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useSimilarTours(tourId, top);
  const logInteraction = useLogAiInteraction();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const tours = Array.isArray(data) ? data : [];

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [tours]);

  if (isError || (!isLoading && tours.length === 0)) return null;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 284; // Card width (260px) + gap (24px)
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="mt-16 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles size={20} style={{ color: "var(--color-brand)" }} />
          <h2
            className="text-2xl font-black text-slate-900"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {t("ai.similarTours")}
          </h2>
        </div>
        
        {!isLoading && tours.length > 0 && (canScrollLeft || canScrollRight) && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className={`p-2 rounded-full border transition-colors ${
                canScrollLeft 
                  ? "border-slate-200 text-slate-600 hover:text-brand hover:border-brand hover:bg-brand/5" 
                  : "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed opacity-50"
              }`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className={`p-2 rounded-full border transition-colors ${
                canScrollRight 
                  ? "border-slate-200 text-slate-600 hover:text-brand hover:border-brand hover:bg-brand/5" 
                  : "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed opacity-50"
              }`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-6 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[260px] rounded-3xl overflow-hidden animate-pulse">
              <div className="bg-slate-200 aspect-[4/3]" />
              <div className="p-5 space-y-3 bg-white">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-6 overflow-x-auto thin-scrollbar pb-4 snap-x snap-mandatory"
        >
          {tours.map((tour) => (
            <div key={tour.tourId} className="min-w-[260px] max-w-[260px] snap-start self-stretch">
              <AiTourRecommendationCard
                tour={tour}
                showWhyFit={false}
                showCustomerBreakdown={false}
                onTourClick={(id) => logInteraction(id, "click")}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
