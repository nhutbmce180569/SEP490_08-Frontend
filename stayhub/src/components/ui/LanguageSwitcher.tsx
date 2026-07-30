import { Globe } from "lucide-react";
import { useTranslation } from "../../contexts/LocaleContext";

type LanguageSwitcherProps = {
  variant?: "icon" | "pill" | "select";
  className?: string;
};

export function LanguageSwitcher({ variant = "pill", className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale, toggleLocale, supportedLocales, t } = useTranslation();

  if (variant === "select") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Globe className="h-4 w-4 text-slate-500" aria-hidden />
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as "en" | "vi")}
          className="cursor-pointer bg-transparent text-sm font-semibold text-slate-600 outline-none dark:text-slate-300"
          aria-label={t("common.language")}
        >
          {supportedLocales.map((item) => (
            <option key={item.code} value={item.code}>
              {item.nativeLabel}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleLocale}
        className={`icon-btn flex items-center justify-center leading-none ${className}`}
        title={t("common.language")}
        aria-label={t("common.language")}
      >
        <span className="text-xs sm:text-sm font-bold tracking-tight pt-[1px]">{locale === "vi" ? "VI" : "EN"}</span>
      </button>
    );
  }

  const current = supportedLocales.find((l) => l.code === locale) ?? supportedLocales[0];
  const next = supportedLocales.find((l) => l.code !== locale) ?? supportedLocales[1];

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-brand-light/40 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 ${className}`}
      title={t("common.language")}
      aria-label={`${t("common.language")}: ${current.nativeLabel}`}
    >
      <span aria-hidden>{current.flag}</span>
      <span className="hidden sm:inline">{current.nativeLabel}</span>
      <span className="text-slate-400">→</span>
      <span aria-hidden>{next.flag}</span>
    </button>
  );
}
