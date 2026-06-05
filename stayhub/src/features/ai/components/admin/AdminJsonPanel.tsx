import React, { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface Props {
  title: string;
  data: unknown;
  defaultOpen?: boolean;
}

export const AdminJsonPanel: React.FC<Props> = ({ title, data, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  if (data == null) return null;

  const json = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="glass-card overflow-hidden">
      <div className="flex w-full items-center justify-between px-4 py-3 hover:bg-slate-50">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center justify-between text-left"
        >
          <span className="text-sm font-bold text-slate-800">{title}</span>
          <span className="text-slate-400">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="ml-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand"
          aria-label="Copy JSON"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      {open && (
        <pre className="custom-scrollbar max-h-96 overflow-auto border-t border-slate-100 bg-slate-950 p-4 text-xs leading-relaxed text-emerald-300">
          {json}
        </pre>
      )}
    </section>
  );
};
