import { Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "../../contexts/ThemeContext";
import { useTranslation } from "../../contexts/LocaleContext";

type ThemeToggleProps = {
  variant?: "button" | "menu";
  className?: string;
};

export function ThemeToggle({ variant = "button", className = "" }: ThemeToggleProps) {
  const { t } = useTranslation();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  const options: { value: ThemePreference; labelKey: string; icon: typeof Sun }[] = [
    { value: "light", labelKey: "common.themeLight", icon: Sun },
    { value: "dark", labelKey: "common.themeDark", icon: Moon },
  ];

  if (variant === "menu") {
    return (
      <div className={`flex gap-1 rounded-lg bg-slate-100/90 p-0.5 dark:bg-slate-800/80 ${className}`}>
        {options.map(({ value, labelKey, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
              theme === value
                ? "bg-white text-slate-900 font-bold shadow-xs dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
            aria-pressed={theme === value}
            aria-label={t(labelKey)}
          >
            <Icon className="h-3 w-3 flex-none" />
            <span>{t(labelKey)}</span>
          </button>
        ))}
      </div>
    );
  }

  const Icon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`icon-btn flex items-center justify-center leading-none ${className}`}
      aria-label={resolvedTheme === "dark" ? t("common.themeSwitchToLight") : t("common.themeSwitchToDark")}
      title={resolvedTheme === "dark" ? t("common.themeLight") : t("common.themeDark")}
    >
      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
    </button>
  );
}
