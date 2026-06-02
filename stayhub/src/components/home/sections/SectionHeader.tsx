import React from "react";
import { ArrowRight } from "lucide-react";

export const SectionHeader: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  showSeeAll?: boolean;
  onSeeAll?: () => void;
  light?: boolean;
  centered?: boolean;
  compact?: boolean;
}> = ({
  eyebrow,
  title,
  subtitle,
  showSeeAll,
  onSeeAll,
  light,
  centered,
  compact,
}) => (
  <div
    className={`flex flex-col gap-4 ${
      compact ? "mb-6 md:mb-7" : "mb-10 md:mb-12"
    } ${
      centered
        ? "items-center text-center"
        : "md:flex-row md:items-end md:justify-between"
    }`}
  >
    <div className={centered ? "max-w-2xl" : "max-w-xl"}>
      {eyebrow && <span className="travel-eyebrow mb-3 inline-block">{eyebrow}</span>}
      <h2
        className={`travel-heading text-3xl leading-[1.1] md:text-4xl lg:text-[2.75rem] ${
          light ? "text-white" : ""
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-3 text-sm font-medium leading-relaxed md:text-base ${
            light ? "text-white/75" : "text-slate-500"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
    {showSeeAll && (
      <button
        type="button"
        onClick={onSeeAll}
        className="group inline-flex shrink-0 items-center gap-2.5 text-xs font-bold uppercase tracking-widest text-brand transition-colors hover:text-brand-hover"
      >
        View all
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand/30 bg-brand-light/50 text-brand transition-all group-hover:border-brand group-hover:bg-brand group-hover:text-white">
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </button>
    )}
  </div>
);
