import React from "react";
import type { QuestionnaireField, QuestionnaireFormValues } from "../types/tourAssistant";

const inputStyle = {
  background: "rgba(5,7,60,0.03)",
  border: "1px solid rgba(5,7,60,0.08)",
};

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
  const baseInput =
    "w-full rounded-xl py-3 px-4 text-sm text-slate-700 outline-none transition-colors font-medium focus:border-brand";

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
                className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: active ? "var(--color-brand)" : "rgba(5,7,60,0.04)",
                  color: active ? "#fff" : "#64748b",
                  border: active
                    ? "1px solid var(--color-brand)"
                    : "1px solid rgba(5,7,60,0.08)",
                }}
              >
                {opt.label}
              </button>
            );
          })}
          {error && <p className="w-full text-xs font-bold text-rose-500 mt-1">{error}</p>}
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
                className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: active ? "var(--color-brand-light)" : "rgba(5,7,60,0.04)",
                  color: active ? "var(--color-brand)" : "#64748b",
                  border: active
                    ? "1px solid rgba(235,102,43,0.35)"
                    : "1px solid rgba(5,7,60,0.08)",
                }}
              >
                {opt.label}
              </button>
            );
          })}
          {error && <p className="w-full text-xs font-bold text-rose-500 mt-1">{error}</p>}
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
            className={baseInput}
            style={{
              ...inputStyle,
              borderColor: error ? "#f43f5e" : inputStyle.border,
            }}
          />
          {error && <p className="text-xs font-bold text-rose-500 mt-1">{error}</p>}
        </div>
      );

    case "number":
      return (
        <div>
          <input
            type="number"
            min={0}
            step={100000}
            placeholder="VD: 3500000"
            value={value != null && value !== "" ? String(value) : ""}
            onChange={(e) =>
              onChange(field.fieldKey, e.target.value === "" ? "" : Number(e.target.value))
            }
            className={baseInput}
            style={{
              ...inputStyle,
              borderColor: error ? "#f43f5e" : inputStyle.border,
            }}
          />
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Đơn vị VND / người</p>
          {error && <p className="text-xs font-bold text-rose-500 mt-1">{error}</p>}
        </div>
      );

    case "boolean":
      return (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange(field.fieldKey, true)}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: value === true ? "var(--color-brand)" : "rgba(5,7,60,0.04)",
              color: value === true ? "#fff" : "#64748b",
              border: "1px solid rgba(5,7,60,0.08)",
            }}
          >
            Có
          </button>
          <button
            type="button"
            onClick={() => onChange(field.fieldKey, false)}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: value === false ? "var(--color-brand)" : "rgba(5,7,60,0.04)",
              color: value === false ? "#fff" : "#64748b",
              border: "1px solid rgba(5,7,60,0.08)",
            }}
          >
            Không
          </button>
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
            placeholder="Nhập thông tin..."
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.fieldKey, e.target.value)}
            className={baseInput}
            style={{
              ...inputStyle,
              borderColor: error ? "#f43f5e" : inputStyle.border,
            }}
          />
          {error && <p className="text-xs font-bold text-rose-500 mt-1">{error}</p>}
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
        <label className="text-sm font-bold text-slate-700 mb-2 block">
          Số người cao tuổi
        </label>
        <input
          type="number"
          min={1}
          max={20}
          value={values.elderlyCount != null ? String(values.elderlyCount) : ""}
          onChange={(e) =>
            onChange("elderlyCount", e.target.value === "" ? "" : Number(e.target.value))
          }
          className="w-full rounded-xl py-3 px-4 text-sm outline-none"
          style={inputStyle}
        />
        {errors.elderlyCount && (
          <p className="text-xs font-bold text-rose-500 mt-1">{errors.elderlyCount}</p>
        )}
      </div>
    )}
    {values.hasChildren === true && (
      <div>
        <label className="text-sm font-bold text-slate-700 mb-2 block">
          Số trẻ em
        </label>
        <input
          type="number"
          min={1}
          max={20}
          value={values.childrenCount != null ? String(values.childrenCount) : ""}
          onChange={(e) =>
            onChange("childrenCount", e.target.value === "" ? "" : Number(e.target.value))
          }
          className="w-full rounded-xl py-3 px-4 text-sm outline-none"
          style={inputStyle}
        />
        {errors.childrenCount && (
          <p className="text-xs font-bold text-rose-500 mt-1">{errors.childrenCount}</p>
        )}
      </div>
    )}
    <div>
      <label className="text-sm font-bold text-slate-700 mb-2 block">
        Số tour gợi ý (tùy chọn, mặc định 8)
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
        className="w-full rounded-xl py-3 px-4 text-sm outline-none"
        style={inputStyle}
      />
      {errors.top && (
        <p className="text-xs font-bold text-rose-500 mt-1">{errors.top}</p>
      )}
    </div>
  </div>
);
