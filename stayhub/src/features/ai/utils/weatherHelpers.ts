import type { WeatherAdvice } from "../types/tourAssistant";
import type { Locale } from "../../../i18n";

export type WeatherCondition = "rainy" | "hot" | "cool" | "mild";

export function detectWeatherCondition(weather: WeatherAdvice): WeatherCondition {
  const rain = weather.totalRainMm ?? 0;
  const max = weather.avgMaxTempC ?? 28;
  const min = weather.avgMinTempC ?? 22;

  if (rain >= 30) return "rainy";
  if (max >= 32) return "hot";
  if (max <= 22 && min <= 18) return "cool";
  return "mild";
}

export function getWeatherConditionLabel(condition: WeatherCondition, locale: Locale): string {
  const vi: Record<WeatherCondition, string> = {
    rainy: "Nhiều mưa",
    hot: "Nắng nóng",
    cool: "Mát / se lạnh",
    mild: "Ổn định, dễ đi tour",
  };
  const en: Record<WeatherCondition, string> = {
    rainy: "Rainy",
    hot: "Hot",
    cool: "Cool",
    mild: "Mild & pleasant",
  };
  return locale === "vi" ? vi[condition] : en[condition];
}

export function formatDataSource(source: string, locale: Locale): string {
  if (locale !== "vi") return source;
  if (source.toLowerCase().includes("forecast")) return "Dự báo thời tiết (Open-Meteo)";
  if (source.toLowerCase().includes("historical")) return "Thống kê thời tiết cùng kỳ năm trước";
  return source;
}
