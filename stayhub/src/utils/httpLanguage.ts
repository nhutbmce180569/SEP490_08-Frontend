import type { AxiosHeaders, InternalAxiosRequestConfig } from "axios";
import { getStoredLocale } from "../i18n";

/** Attach StayHub locale header for API localization. */
export function withLanguageHeaders(
  headers: Record<string, string> = {},
): Record<string, string> {
  return { ...headers, "X-Language": getStoredLocale() };
}

export function applyLanguageToAxiosConfig(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const headers = config.headers as AxiosHeaders;
  headers.set("X-Language", getStoredLocale());
  return config;
}
