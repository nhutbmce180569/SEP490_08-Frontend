import { getStoredLocale, translate } from "./index";

/** Translate using the locale persisted in localStorage (for non-React hooks). */
export function tStored(key: string, params?: Record<string, string | number>): string {
  return translate(getStoredLocale(), key, params);
}
