import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  getStoredLocale,
  persistLocale,
  SUPPORTED_LOCALES,
  translate,
  type Locale,
} from "../i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, params?: Record<string, any> | string) => string;
  supportedLocales: typeof SUPPORTED_LOCALES;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getStoredLocale());

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
    window.dispatchEvent(new CustomEvent("localeChanged", { detail: next }));
    window.location.reload();
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "vi" ? DEFAULT_LOCALE : "vi");
  }, [locale, setLocale]);

  const t = useCallback(
    (key: string, params?: Record<string, any> | string) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t, supportedLocales: SUPPORTED_LOCALES }),
    [locale, setLocale, toggleLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useTranslation() {
  const { t, locale, setLocale, toggleLocale, supportedLocales } = useLocale();
  return { t, locale, setLocale, toggleLocale, supportedLocales };
}
