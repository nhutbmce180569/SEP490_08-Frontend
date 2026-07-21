import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useTranslation } from "../../contexts/LocaleContext";
import { useCurrency, type CurrencyMode } from "../../features/currency/CurrencyContext";
import { type Locale } from "../../i18n";

interface LanguageCurrencySelectorProps {
  className?: string;
}

export const LanguageCurrencySelector: React.FC<LanguageCurrencySelectorProps> = ({ className = "" }) => {
  const { locale, setLocale, t } = useTranslation();
  const { mode, setMode } = useCurrency();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLanguage = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  const handleSelectCurrency = (newCurrency: CurrencyMode) => {
    setMode(newCurrency);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Header Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all select-none border-0 shadow-none ${
          isOpen
            ? "bg-brand-light/40 text-brand"
            : "text-slate-600 hover:bg-brand-light/30 hover:text-brand dark:text-slate-300 dark:hover:bg-slate-800"
        }`}
        aria-expanded={isOpen}
        aria-label="Language and Currency Selector"
      >
        <Globe className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300 shrink-0" />
        <span className="font-bold text-slate-800 dark:text-slate-100">{mode}</span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Popover Dropdown Card (Vietravel style) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[calc(100vw-2rem)] sm:w-[500px] max-w-[500px] rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150 select-none">
          <div className="flex flex-col sm:flex-row gap-6 relative">
            {/* Column Divider line */}
            <div className="hidden sm:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-100 dark:bg-slate-800 -translate-x-1/2" />

            {/* Left Column: Language */}
            <div className="flex-1 sm:pr-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 whitespace-nowrap">
                {t("common.language")}
              </h3>
              <div className="space-y-3">
                {/* Tiếng Việt */}
                <button
                  type="button"
                  onClick={() => handleSelectLanguage("vi")}
                  className="flex items-center gap-3 w-full text-left py-2 px-2.5 rounded-xl transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <svg className="w-5 h-3.5 rounded-[2px] shadow-sm shrink-0 object-cover" viewBox="0 0 30 20">
                    <rect width="30" height="20" fill="#da251d"/>
                    <polygon points="15,4 16.47,8.53 21.24,8.53 17.38,11.33 18.85,15.86 15,13.06 11.15,15.86 12.62,11.33 8.76,8.53 13.53,8.53" fill="#ffff00"/>
                  </svg>
                  <span className={`text-sm whitespace-nowrap ${locale === "vi" ? "font-bold text-blue-600 dark:text-blue-400" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                    Tiếng Việt (Vietnam)
                  </span>
                </button>

                {/* English */}
                <button
                  type="button"
                  onClick={() => handleSelectLanguage("en")}
                  className="flex items-center gap-3 w-full text-left py-2 px-2.5 rounded-xl transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <Globe className={`h-5 w-5 shrink-0 ${locale === "en" ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`} />
                  <span className={`text-sm whitespace-nowrap ${locale === "en" ? "font-bold text-blue-600 dark:text-blue-400" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                    English (International)
                  </span>
                </button>
              </div>
            </div>

            {/* Right Column: Currency */}
            <div className="flex-1 sm:pl-4 border-t border-slate-100 pt-4 sm:border-t-0 sm:pt-0 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 whitespace-nowrap">
                {t("common.currency")}
              </h3>
              <div className="space-y-3">
                {/* VND */}
                <button
                  type="button"
                  onClick={() => handleSelectCurrency("VND")}
                  className="flex items-center gap-3 w-full text-left py-2 px-2.5 rounded-xl transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 w-10 shrink-0">VND</span>
                  <span className={`text-sm whitespace-nowrap ${mode === "VND" ? "font-bold text-blue-600 dark:text-blue-400" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                    Vietnam Dong
                  </span>
                </button>

                {/* USD */}
                <button
                  type="button"
                  onClick={() => handleSelectCurrency("USD")}
                  className="flex items-center gap-3 w-full text-left py-2 px-2.5 rounded-xl transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 w-10 shrink-0">USD</span>
                  <span className={`text-sm whitespace-nowrap ${mode === "USD" ? "font-bold text-blue-600 dark:text-blue-400" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                    US Dollar
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Confirm Button */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold px-7 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all"
            >
              {t("common.confirm")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
