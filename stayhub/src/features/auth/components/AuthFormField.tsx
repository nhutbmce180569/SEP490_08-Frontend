import type { InputHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "../../../contexts/LocaleContext";

type AuthFormFieldProps = {
  label: string;
  labelExtra?: ReactNode;
  icon: LucideIcon;
  error?: string;
  showToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
} & InputHTMLAttributes<HTMLInputElement>;

export function authInputClass(hasError?: boolean, readOnly?: boolean, withToggle?: boolean) {
  return [
    "input-field h-[50px] pl-12",
    withToggle ? "pr-12" : "pr-4",
    hasError ? "border-rose-500 focus:border-rose-500" : "",
    readOnly ? "cursor-not-allowed bg-slate-100 text-slate-500" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function AuthFormField({
  label,
  labelExtra,
  icon: Icon,
  error,
  showToggle,
  showPassword,
  onTogglePassword,
  className,
  readOnly,
  ...inputProps
}: AuthFormFieldProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <div className={`flex items-center ${labelExtra ? "justify-between" : ""}`}>
        <label className="block text-sm font-semibold text-slate-700">{label}</label>
        {labelExtra}
      </div>

      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          className={`${authInputClass(Boolean(error), readOnly, showToggle)} ${className ?? ""}`}
          readOnly={readOnly}
          {...inputProps}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-slate-400 outline-none transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>

      {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
    </div>
  );
}
