import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "../../contexts/ThemeContext";

type ThemeToggleProps = {
  /** Compact icon-only button (default) or show a small dropdown */
  variant?: "button" | "menu";
  className?: string;
};

const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Sáng", icon: Sun },
  { value: "dark", label: "Tối", icon: Moon },
  { value: "system", label: "Hệ thống", icon: Monitor },
];

export function ThemeToggle({ variant = "button", className = "" }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (variant === "menu") {
    return (
      <div className={`flex gap-1 rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/60 ${className}`}>
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
              theme === value
                ? "bg-white text-brand shadow-sm dark:bg-slate-700 dark:text-brand-light"
                : "text-slate-500 hover:text-navy dark:text-slate-400 dark:hover:text-slate-200"
            }`}
            aria-pressed={theme === value}
            aria-label={`Chế độ ${label}`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
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
      className={`icon-btn ${className}`}
      aria-label={resolvedTheme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      title={resolvedTheme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
