import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useTranslation } from "../../contexts/LocaleContext";

export interface Option {
  label: string;
  value: string | number;
}

interface MultiSelectProps {
  options: Option[];
  selectedValues: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  placeholder?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectProps> = ({ options, selectedValues = [], onChange, placeholder }) => {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("common.selectOptions");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (value: string | number) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const selectedLabels = options.filter(opt => selectedValues.includes(opt.value)).map(opt => opt.label);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Nút bấm để mở popup */}
      <div 
        className="flex min-h-[42px] w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-brand/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1.5">
          {selectedLabels.length > 0 ? (
            selectedLabels.map((label, idx) => (
              <span key={idx} className="rounded bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                {label}
              </span>
            ))
          ) : (
            <span className="text-slate-400">{resolvedPlaceholder}</span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {/* Popup chứa danh sách checkbox */}
      {isOpen && (
        <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-200/50">
          {options && options.length > 0 ? (
            options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <div
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  onClick={() => handleToggle(option.value)}
                >
                  <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${isSelected ? "border-brand bg-brand" : "border-slate-300 bg-white"}`}>
                    {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </div>
                  {option.label}
                </div>
              );
            })
          ) : (
            <div className="px-3 py-4 text-center text-sm text-slate-500">
              {t("common.noData")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};