import type { Locale } from "../../../i18n";
import { localizeInterestKey } from "./localizeAiContent";

type ReasonKind =
  | "interest"
  | "elderly_good"
  | "elderly_caution"
  | "child_good"
  | "child_caution"
  | "international"
  | "unknown";

interface ParsedReason {
  kind: ReasonKind;
  text: string;
  tag?: string;
  isPositive: boolean;
}

const stripPersonaPrefix = (raw: string) => raw.replace(/^\[[^\]]+\]\s*/, "").trim();

const stripScores = (text: string) =>
  text
    .replace(/\s*\(điểm [^)]+\)/gi, "")
    .replace(/\s*\([^)]*score[^)]*\)/gi, "")
    .replace(/\s*\(accessibility[^)]*\)/gi, "")
    .replace(/\s*\(family-fit[^)]*\)/gi, "")
    .trim();

function extractInterests(text: string): string[] {
  const colonMatch = text.match(/:\s*([^.\n]+)\.?$/);
  if (colonMatch) {
    return colonMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
  }

  const parenMatch = text.match(/\(([^)]+)\)\.?$/);
  if (!parenMatch) return [];
  return parenMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
}

function parseMatchReason(raw: string, locale: Locale): ParsedReason {
  const cleaned = stripScores(stripPersonaPrefix(raw));
  const lower = cleaned.toLowerCase();

  if (/khớp sở thích|phù hợp sở thích|matches interests|hợp với sở thích|matches what you enjoy/i.test(cleaned)) {
    const interests = extractInterests(cleaned).map((k) => localizeInterestKey(k, locale));
    const joined = interests.join(", ");
    return {
      kind: "interest",
      isPositive: true,
      tag: interests[0] ?? (locale === "vi" ? "Đúng sở thích" : "Your interests"),
      text:
        locale === "vi"
          ? `Phù hợp sở thích của bạn${joined ? `: ${joined}` : ""}.`
          : `Matches what you enjoy${joined ? `: ${joined}` : ""}.`,
    };
  }

  if (/phù hợp người cao tuổi|suits elderly|nhẹ nhàng.*cao tuổi|lịch trình nhẹ/i.test(lower)) {
    return {
      kind: "elderly_good",
      isPositive: true,
      tag: locale === "vi" ? "Tốt cho người già" : "Elderly-friendly",
      text:
        locale === "vi"
          ? "Lịch trình nhẹ nhàng, dễ đi cùng người lớn tuổi."
          : "A relaxed pace that works well with elderly travelers.",
    };
  }

  if (/không tối ưu cho người cao tuổi|not ideal for elderly|cân nhắc.*cao tuổi|hơi mệt cho người cao tuổi/i.test(lower)) {
    return {
      kind: "elderly_caution",
      isPositive: false,
      text:
        locale === "vi"
          ? "Có thể hơi mệt cho người cao tuổi (đi bộ nhiều hoặc hoạt động mạnh)."
          : "May be tiring for elderly travelers (lots of walking or strenuous activities).",
    };
  }

  if (/thân thiện trẻ em|family-friendly|phù hợp.*trẻ em|hoạt động.*trẻ em/i.test(lower)) {
    return {
      kind: "child_good",
      isPositive: true,
      tag: locale === "vi" ? "Vui cho trẻ em" : "Kid-friendly",
      text:
        locale === "vi"
          ? "Có hoạt động phù hợp cho trẻ em đi cùng."
          : "Includes activities that work well for children.",
    };
  }

  if (/cân nhắc với trẻ em|consider carefully with children|trẻ nhỏ/i.test(lower)) {
    return {
      kind: "child_caution",
      isPositive: false,
      text:
        locale === "vi"
          ? "Nên cân nhắc nếu đi cùng trẻ nhỏ (tour dài hoặc mạo hiểm)."
          : "Worth a closer look if traveling with young kids (long days or adventure-heavy).",
    };
  }

  if (/đúng khu vực|in the area you asked|nằm trong ngân sách|within the budget|lịch khởi hành phù hợp|departure date that fits|đánh giá tốt|well rated|nội dung tour khớp|tour content aligns/i.test(lower)) {
    const tag = /ngân sách|budget/i.test(lower)
      ? (locale === "vi" ? "Trong ngân sách" : "Within budget")
      : /khu vực|area/i.test(lower)
        ? (locale === "vi" ? "Đúng điểm đến" : "Right area")
        : /lịch|departure|schedule/i.test(lower)
          ? (locale === "vi" ? "Khớp lịch đi" : "Fits dates")
          : /đánh giá|rated/i.test(lower)
            ? (locale === "vi" ? "Được đánh giá tốt" : "Well rated")
            : (locale === "vi" ? "Phù hợp bạn" : "Good fit");
    return {
      kind: "unknown",
      isPositive: true,
      tag,
      text: cleaned.endsWith(".") ? cleaned : `${cleaned}.`,
    };
  }

  if (/khách quốc tế|international guest/i.test(lower)) {
    return {
      kind: "international",
      isPositive: true,
      tag: locale === "vi" ? "Dễ cho khách nước ngoài" : "Intl. visitors",
      text:
        locale === "vi"
          ? "Dễ tham gia và tìm hiểu văn hóa — phù hợp khách quốc tế."
          : "Easy to follow and explore local culture — good for international visitors.",
    };
  }

  return {
    kind: "unknown",
    isPositive: !/không|not ideal|cân nhắc|consider carefully/i.test(lower),
    text: cleaned.endsWith(".") ? cleaned : `${cleaned}.`,
    tag: cleaned.length > 28 ? `${cleaned.slice(0, 28)}…` : cleaned,
  };
}

function dedupeByKind(parsed: ParsedReason[]): ParsedReason[] {
  const seen = new Set<ReasonKind>();
  const result: ParsedReason[] = [];
  for (const item of parsed) {
    if (item.kind !== "unknown" && seen.has(item.kind)) continue;
    if (item.kind !== "unknown") seen.add(item.kind);
    result.push(item);
  }
  return result;
}

export function getCustomerMatchTags(
  matchReasons: string[],
  locale: Locale,
  max = 3,
): string[] {
  const tags = dedupeByKind(matchReasons.map((r) => parseMatchReason(r, locale)))
    .filter((p) => p.isPositive && p.tag)
    .map((p) => p.tag as string);

  return [...new Set(tags)].slice(0, max);
}

const scheduleTag = (locale: Locale) =>
  locale === "vi" ? "Khớp lịch đi" : "Fits dates";

/** Tags for cards — ưu tiên "Khớp lịch đi" khi tour khớp ngày user chọn. */
export function getDisplayMatchTags(
  matchReasons: string[],
  locale: Locale,
  max = 3,
  matchesPreferredDates?: boolean,
): string[] {
  const tags = getCustomerMatchTags(matchReasons, locale, max + 2);
  const schedule = scheduleTag(locale);

  if (matchesPreferredDates && !tags.includes(schedule)) {
    return [schedule, ...tags].slice(0, max);
  }

  return tags.slice(0, max);
}

export function getCustomerWhyFitContent(matchReasons: string[], locale: Locale) {
  const parsed = dedupeByKind(matchReasons.map((r) => parseMatchReason(r, locale)));
  const positive = parsed.filter((p) => p.isPositive).map((p) => p.text);
  const cautions = parsed.filter((p) => !p.isPositive).map((p) => p.text);

  return { positive, cautions };
}

export function buildWhyFitSummary(matchReasons: string[], locale: Locale): string {
  const { positive } = getCustomerWhyFitContent(matchReasons, locale);
  const highlights = positive.slice(0, 2);

  if (highlights.length === 0) {
    return locale === "vi"
      ? "Tour này được chọn vì phù hợp với thông tin bạn đã cung cấp."
      : "This tour was picked because it fits the details you shared.";
  }

  if (locale === "vi") {
    return highlights.length === 1
      ? `Tour này phù hợp vì ${highlights[0].charAt(0).toLowerCase()}${highlights[0].slice(1)}`
      : `Tour này phù hợp vì ${highlights[0].charAt(0).toLowerCase()}${highlights[0].slice(1)} ${highlights[1].charAt(0).toLowerCase()}${highlights[1].slice(1)}`;
  }

  return highlights.length === 1
    ? `This tour fits you because ${highlights[0].charAt(0).toLowerCase()}${highlights[0].slice(1)}`
    : `This tour fits you because ${highlights[0].charAt(0).toLowerCase()}${highlights[0].slice(1)} Also, ${highlights[1].charAt(0).toLowerCase()}${highlights[1].slice(1)}`;
}

/** Admin / legacy display */
export function formatMatchReasonTechnical(reason: string, locale: Locale): string {
  const cleaned = stripPersonaPrefix(reason);
  if (locale !== "vi") return cleaned;
  return stripScores(cleaned)
    .replace(/Matches interests \(([^)]+)\)/i, (_, raw: string) => {
      const labels = raw.split(",").map((k: string) => localizeInterestKey(k.trim(), locale));
      return `Khớp sở thích (${labels.join(", ")})`;
    });
}
