import React from "react";
import type { QuestionnaireField, QuestionnaireFormValues } from "../types/tourAssistant";

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10";

const inputError = "border-rose-400 bg-rose-50";

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
                    : "border border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand"
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
                    : "border border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand"
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

    case "date":
      return (
        <div>
          <input
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.fieldKey, e.target.value)}
            className={`${inputBase} ${error ? inputError : ""}`}
          />
          {error && <p className="mt-1 text-xs font-bold text-rose-500">{error}</p>}
        </div>
      );

    case "number":
      return (
        <div>
          <input
            type="number"
            min={0}
            step={100000}
            placeholder="e.g. 3500000"
            value={value != null && value !== "" ? String(value) : ""}
            onChange={(e) =>
              onChange(field.fieldKey, e.target.value === "" ? "" : Number(e.target.value))
            }
            className={`${inputBase} ${error ? inputError : ""}`}
          />
          <p className="mt-1 text-[11px] font-medium text-slate-400">Per person · VND</p>
          {error && <p className="mt-1 text-xs font-bold text-rose-500">{error}</p>}
        </div>
      );

    case "boolean":
      return (
        <div className="flex gap-2">
          {[
            { v: true, label: "Yes" },
            { v: false, label: "No" },
          ].map(({ v, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => onChange(field.fieldKey, v)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                value === v
                  ? "bg-brand text-white shadow-sm shadow-brand/25"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand"
              }`}
            >
              {label}
            </button>
          ))}
          {error && <p className="text-xs font-bold text-rose-500">{error}</p>}
        </div>
      );

    case "text":
    default:
      return (
        <div>
          <input
            type="text"
            maxLength={100}
            placeholder="Type here…"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.fieldKey, e.target.value)}
            className={`${inputBase} ${error ? inputError : ""}`}
          />
          {error && <p className="mt-1 text-xs font-bold text-rose-500">{error}</p>}
        </div>
      );
  }
};

export const ExtraCountFields: React.FC<{
  values: QuestionnaireFormValues;
  errors: Record<string, string>;
  onChange: (key: string, value: unknown) => void;
}> = ({ values, errors, onChange }) => (
  <div className="space-y-4">
    {values.hasElderly === true && (
      <div>
        <label className="mb-1.5 block text-sm font-bold text-slate-700">
          Number of elderly travelers
        </label>
        <input
          type="number"
          min={1}
          max={20}
          value={values.elderlyCount != null ? String(values.elderlyCount) : ""}
          onChange={(e) =>
            onChange("elderlyCount", e.target.value === "" ? "" : Number(e.target.value))
          }
          className={`${inputBase} ${errors.elderlyCount ? inputError : ""}`}
        />
        {errors.elderlyCount && (
          <p className="mt-1 text-xs font-bold text-rose-500">{errors.elderlyCount}</p>
        )}
      </div>
    )}

    {values.hasChildren === true && (
      <div>
        <label className="mb-1.5 block text-sm font-bold text-slate-700">
          Number of children
        </label>
        <input
          type="number"
          min={1}
          max={20}
          value={values.childrenCount != null ? String(values.childrenCount) : ""}
          onChange={(e) =>
            onChange("childrenCount", e.target.value === "" ? "" : Number(e.target.value))
          }
          className={`${inputBase} ${errors.childrenCount ? inputError : ""}`}
        />
        {errors.childrenCount && (
          <p className="mt-1 text-xs font-bold text-rose-500">{errors.childrenCount}</p>
        )}
      </div>
    )}

    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-700">
        Max tours to show{" "}
        <span className="font-normal text-slate-400">(default 8)</span>
      </label>
      <input
        type="number"
        min={1}
        max={30}
        placeholder="8"
        value={values.top != null && values.top !== "" ? String(values.top) : ""}
        onChange={(e) =>
          onChange("top", e.target.value === "" ? "" : Number(e.target.value))
        }
        className={`${inputBase} ${errors.top ? inputError : ""}`}
      />
      {errors.top && <p className="mt-1 text-xs font-bold text-rose-500">{errors.top}</p>}
    </div>
  </div>
);
