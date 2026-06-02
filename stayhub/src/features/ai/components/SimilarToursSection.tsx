import React from "react";
import { Sparkles } from "lucide-react";
import { AiTourRecommendationCard } from "./AiTourRecommendationCard";
import { useSimilarTours } from "../hooks/useSimilarTours";
import { useLogAiInteraction } from "../hooks/useLogAiInteraction";

interface Props {
  tourId: string | number;
  top?: number;
}

export const SimilarToursSection: React.FC<Props> = ({ tourId, top = 5 }) => {
  const { data, isLoading, isError } = useSimilarTours(tourId, top);
  const logInteraction = useLogAiInteraction();

  const tours = Array.isArray(data) ? data : [];

  if (isError || (!isLoading && tours.length === 0)) return null;

  return (
    <section className="mt-16">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles size={20} style={{ color: "var(--color-brand)" }} />
        <h2
          className="text-2xl font-black text-slate-900"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          Similar tours (AI)
        </h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl overflow-hidden animate-pulse">
              <div className="bg-slate-200 aspect-[4/3]" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => (
            <AiTourRecommendationCard
              key={tour.tourId}
              tour={tour}
              onTourClick={(id) => logInteraction(id, "click")}
            />
          ))}
        </div>
      )}
    </section>
  );
};
