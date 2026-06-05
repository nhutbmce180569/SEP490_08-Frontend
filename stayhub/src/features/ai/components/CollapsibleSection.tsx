import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleSection: React.FC<Props> = ({
  title,
  subtitle,
  defaultOpen = false,
  children,
  className = "",
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`glass-card overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/80"
      >
        <div className="min-w-0">
          <p className="text-sm font-bold text-navy">{title}</p>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        {open ? (
          <ChevronUp size={16} className="shrink-0 text-slate-400" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-slate-400" />
        )}
      </button>
      {open && <div className="border-t border-slate-100 px-4 py-3">{children}</div>}
    </section>
  );
};
