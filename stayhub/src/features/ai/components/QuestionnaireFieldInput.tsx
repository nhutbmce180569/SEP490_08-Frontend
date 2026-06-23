import React from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslation } from "../../../contexts/LocaleContext";
import type { QuestionnaireField } from "../types/tourAssistant";

const inputBase =
  "w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-input)] py-3 px-4 text-sm font-medium text-[var(--color-navy)] outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/10";

const inputError = "border-rose-400 bg-rose-50 dark:border-rose-500/50 dark:bg-rose-950/25";

const optionInactive =
  "border border-[var(--border-default)] bg-[var(--surface-input)] text-[var(--text-menu)] hover:border-brand/40 hover:text-brand";

interface Props {
  field: QuestionnaireField;
  value: unknown;
  error?: string;
  onChange: (fieldKey: string, value: unknown) => void;
}

export const QuestionnaireFieldInput: React.FC<Props> = ({
  field,
  value,
  error,
  onChange,
}) => {
  const { t } = useTranslation();

  switch (field.inputType) {
    case "single_select":
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((opt) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(field.fieldKey, opt.value)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "bg-brand text-white shadow-sm shadow-brand/25"
                    : optionInactive
                }`}
              >
                {opt.label}
              </button>
            );
          })}
          {error && <p className="mt-1 w-full text-xs font-bold text-rose-500">{error}</p>}
        </div>
      );

    case "multi_select": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((opt) => {
            const active = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const next = active
                    ? selected.filter((v) => v !== opt.value)
                    : [...selected, opt.value];
                  onChange(field.fieldKey, next);
                }}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "bg-brand-light text-brand ring-1 ring-brand/30"
                    : optionInactive
                }`}
              >
                {opt.label}
              </button>
            );
          })}
          {error && <p className="mt-1 w-full text-xs font-bold text-rose-500">{error}</p>}
        </div>
      );
    }

    case "date": {
      const today = new Date().toISOString().split("T")[0];
      return (
        <div>
          <input
            type="date"
            min={today}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.fieldKey, e.target.value)}
            className={`${inputBase} ${error ? inputError : ""}`}
          />
          {error && <p className="mt-1 text-xs font-bold text-rose-500">{error}</p>}
        </div>
      );
    }

    case "number": {
      const numericValue = typeof value === "number" ? value : 0;
      return (
        <div className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-input)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[var(--text-muted)]">
              {t("ai.perPersonVnd") ?? "Ngân sách tối đa"}
            </span>
            <span className="text-xl font-bold text-brand">
              {numericValue > 0 ? numericValue.toLocaleString("en-US") : "Không giới hạn"}{" "}
              {numericValue > 0 && <span className="text-sm font-medium text-[var(--text-muted)]">VND</span>}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={20000000}
            step={500000}
            value={numericValue}
            onChange={(e) => {
              const val = Number(e.target.value);
              onChange(field.fieldKey, val === 0 ? "" : val);
            }}
            className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--border-subtle)] accent-brand outline-none transition-all focus:ring-2 focus:ring-brand/30"
          />
          <div className="flex justify-between text-[11px] font-medium text-[var(--text-muted)]">
            <span>Không giới hạn</span>
            <span>20,000,000+ VND</span>
          </div>
          {error && <p className="mt-1 text-xs font-bold text-rose-500">{error}</p>}
        </div>
      );
    }

    case "boolean":
      return (
        <div className="flex gap-2">
          {[
            { v: true, label: t("common.yes") },
            { v: false, label: t("common.no") },
          ].map(({ v, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => onChange(field.fieldKey, v)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                value === v
                  ? "bg-brand text-white shadow-sm shadow-brand/25"
                  : optionInactive
              }`}
            >
              {label}
            </button>
          ))}
          {error && <p className="text-xs font-bold text-rose-500">{error}</p>}
        </div>
      );

    case "counter": {
      const numValue = typeof value === "number" ? value : 0;
      return (
        <div className="flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-[var(--surface-input)] px-4 py-2 shadow-sm transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10">
          <button
            type="button"
            onClick={() => onChange(field.fieldKey, Math.max(field.fieldKey === "adultCount" ? 1 : 0, numValue - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[var(--color-navy)] transition-colors hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <Minus size={18} strokeWidth={2.5} />
          </button>
          <div className="flex w-16 flex-col items-center">
            <span className="text-xl font-bold text-[var(--color-navy)]">
              {numValue}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange(field.fieldKey, Math.min(20, numValue + 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand transition-colors hover:bg-brand/20 active:scale-95"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
          {error && <p className="absolute -bottom-5 left-0 text-xs font-bold text-rose-500">{error}</p>}
        </div>
      );
    }

    case "text":
    default:
      return (
        <div>
          <input
            type="text"
            maxLength={100}
            placeholder={t("ai.typeHere")}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.fieldKey, e.target.value)}
            className={`${inputBase} ${error ? inputError : ""}`}
          />
          {error && <p className="mt-1 text-xs font-bold text-rose-500">{error}</p>}
        </div>
      );
  }
};
