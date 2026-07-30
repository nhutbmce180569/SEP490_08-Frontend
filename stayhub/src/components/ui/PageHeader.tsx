import React from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  light?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  actions,
  light,
}) => (
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow && (
        <span className={`travel-eyebrow mb-2 ${light ? "text-white/90" : ""}`}>
          {eyebrow}
        </span>
      )}
      <h1
        className={`travel-heading text-2xl md:text-3xl ${light ? "text-white" : ""}`}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className={`mt-2 max-w-2xl text-sm font-medium leading-relaxed ${light ? "text-white/75" : "text-slate-500"}`}
        >
          {subtitle}
        </p>
      )}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
