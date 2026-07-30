import type { Locale } from "../../../i18n";

const INTEREST_LABELS_VI: Record<string, string> = {
  beach: "Biển / đảo",
  culture: "Văn hóa / di sản",
  nature: "Thiên nhiên",
  food: "Ẩm thực",
  adventure: "Mạo hiểm",
  relax: "Nghỉ dưỡng",
  photography: "Chụp ảnh",
  city: "Khám phá thành phố",
  river: "Sông nước / miền Tây",
};

const INTEREST_LABELS_EN: Record<string, string> = {
  beach: "Beach / islands",
  culture: "Culture / heritage",
  nature: "Nature",
  food: "Food",
  adventure: "Adventure",
  relax: "Relaxation",
  photography: "Photography",
  city: "City exploration",
  river: "Rivers / Mekong Delta",
};

const INSIGHT_TYPE_VI: Record<string, string> = {
  knowledge: "Kiến thức địa phương",
  destination: "Điểm đến",
  localfood: "Ẩm thực",
  culture: "Văn hóa",
};

/** Strip [Persona label] prefix for cleaner customer-facing bullets */
export const formatMatchReasonForDisplay = (reason: string, locale: Locale): string => {
  const cleaned = reason.replace(/^\[[^\]]+\]\s*/, "").trim();
  if (locale !== "vi") return cleaned;

  return cleaned
    .replace(/Matches interests \(([^)]+)\)/i, (_, raw: string) => {
      const labels = raw.split(",").map((k: string) => localizeInterestKey(k.trim(), locale));
      return `Khớp sở thích (${labels.join(", ")})`;
    })
    .replace(/Khớp sở thích \(([^)]+)\)/i, (_, raw: string) => {
      const labels = raw.split(",").map((k: string) => localizeInterestKey(k.trim(), locale));
      return `Khớp sở thích (${labels.join(", ")})`;
    });
};

export const localizeInterestKey = (key: string, locale: Locale): string => {
  const normalized = key.toLowerCase().trim();
  const map = locale === "vi" ? INTEREST_LABELS_VI : INTEREST_LABELS_EN;
  return map[normalized] ?? key;
};

export const localizeInsightType = (type: string | undefined, locale: Locale): string | undefined => {
  if (!type) return undefined;
  if (locale !== "vi") return type;
  return INSIGHT_TYPE_VI[type.toLowerCase()] ?? type;
};
