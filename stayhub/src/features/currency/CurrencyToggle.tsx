import React from "react";
import { DollarSign } from "lucide-react";
import { useCurrency } from "./CurrencyContext";

export const CurrencyToggle: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { mode, setMode, isRateUnavailable } = useCurrency();

  return (
    <div
      className={`items-center rounded-full border border-slate-200 bg-white/80 p-0.5 shadow-sm backdrop-blur ${className ? className : "hidden sm:inline-flex"}`}
      aria-label="Currency display"
      title={isRateUnavailable ? "USD rate unavailable, showing VND" : "Currency display"}
    >
      <button
        type="button"
        onClick={() => setMode("VND")}
        className={`rounded-full px-2.5 py-1 text-[11px] font-black transition-colors ${
          mode === "VND" ? "bg-brand text-white" : "text-slate-500 hover:text-brand"
        }`}
        aria-pressed={mode === "VND"}
      >
        VND
      </button>
      <button
        type="button"
        onClick={() => setMode("USD")}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black transition-colors ${
          mode === "USD" ? "bg-brand text-white" : "text-slate-500 hover:text-brand"
        }`}
        aria-pressed={mode === "USD"}
      >
        <DollarSign className="h-3 w-3" />
        USD
      </button>
    </div>
  );
};
