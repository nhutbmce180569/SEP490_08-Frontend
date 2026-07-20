import { mergeLocales } from "./mergeLocales";

import enLegacy from "./locales/en.json";
import viLegacy from "./locales/vi.json";
import enCommon from "./locales/en/common.json";
import viCommon from "./locales/vi/common.json";
import enManager from "./locales/en/manager.json";
import viManager from "./locales/vi/manager.json";
import enAdmin from "./locales/en/admin.json";
import viAdmin from "./locales/vi/admin.json";
import enStaff from "./locales/en/staff.json";
import viStaff from "./locales/vi/staff.json";
import enHome from "./locales/en/home.json";
import viHome from "./locales/vi/home.json";
import enFooter from "./locales/en/footer.json";
import viFooter from "./locales/vi/footer.json";
import enErrors from "./locales/en/errors.json";
import viErrors from "./locales/vi/errors.json";
import enBooking from "./locales/en/booking.json";
import viBooking from "./locales/vi/booking.json";
import enTour from "./locales/en/tour.json";
import viTour from "./locales/vi/tour.json";
import enContent from "./locales/en/content.json";
import viContent from "./locales/vi/content.json";
import enVoucher from "./locales/en/voucher.json";
import viVoucher from "./locales/vi/voucher.json";
import enSocial from "./locales/en/social.json";
import viSocial from "./locales/vi/social.json";
import enAi from "./locales/en/ai.json";
import viAi from "./locales/vi/ai.json";
import enAnalytics from "./locales/en/analytics.json";
import viAnalytics from "./locales/vi/analytics.json";
import enDashboard from "./locales/en/dashboard.json";
import viDashboard from "./locales/vi/dashboard.json";
import enApp from "./locales/en/app.json";
import viApp from "./locales/vi/app.json";
import enLegal from "./locales/en/legal.json";
import viLegal from "./locales/vi/legal.json";

export type Locale = "en" | "vi";

export const DEFAULT_LOCALE: Locale = "en";
export const STORAGE_KEY = "language";

const catalogs: Record<Locale, Record<string, unknown>> = {
  en: mergeLocales(
    enLegacy,
    { common: enCommon, manager: enManager, admin: enAdmin, staff: enStaff, home: enHome, footer: enFooter, errors: enErrors, booking: enBooking, tour: enTour, content: enContent, voucher: enVoucher, social: enSocial, ai: enAi, analytics: enAnalytics, dashboard: enDashboard, app: enApp, legal: enLegal },
  ),
  vi: mergeLocales(
    viLegacy,
    { common: viCommon, manager: viManager, admin: viAdmin, staff: viStaff, home: viHome, footer: viFooter, errors: viErrors, booking: viBooking, tour: viTour, content: viContent, voucher: viVoucher, social: viSocial, ai: viAi, analytics: viAnalytics, dashboard: viDashboard, app: viApp, legal: viLegal },
  ),
};

export const SUPPORTED_LOCALES: { code: Locale; label: string; nativeLabel: string; flag: string }[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "vi", label: "Vietnamese", nativeLabel: "Tiếng Việt", flag: "🇻🇳" },
];

function resolve(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, any> | string,
): string {
  const fallback = typeof params === "string" ? params : (params && typeof params.defaultValue === "string" ? params.defaultValue : key);
  const value =
    resolve(catalogs[locale], key) ??
    resolve(catalogs[DEFAULT_LOCALE], key) ??
    fallback;

  if (!params || typeof params === "string") return value;

  return Object.entries(params).reduce(
    (text, [paramKey, paramValue]) =>
      text.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"), String(paramValue)),
    value,
  );
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  return value.toLowerCase().startsWith("vi") ? "vi" : "en";
}

export function getStoredLocale(): Locale {
  try {
    return normalizeLocale(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  } catch {
    // ignore storage errors
  }
}
