export const formatVnd = (amount?: number | null, locale: "en" | "vi" = "vi") => {
  if (amount == null || Number.isNaN(amount)) {
    return locale === "vi" ? "Liên hệ" : "Contact us";
  }
  return `${amount.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} VNĐ`;
};

export const formatMatchPercent = (score: number) =>
  `${Math.round(Math.min(1, Math.max(0, score)) * 100)}%`;

const PERSONA_LABELS_VI: Record<string, string> = {
  primary_traveler: "Du khách chính",
  elderly_companion: "Người cao tuổi",
  child_companion: "Trẻ em",
  international_guest: "Khách quốc tế",
  couple_vibe: "Cặp đôi",
  family_vibe: "Gia đình",
  group_vibe: "Nhóm bạn",
};

const DIMENSION_LABELS_VI: Record<string, string> = {
  interest_semantic: "Sở thích",
  location: "Điểm đến",
  budget: "Ngân sách",
  schedule: "Lịch khởi hành",
  weather: "Thời tiết",
  accessibility: "Dễ đi / an toàn",
  cultural_fit: "Văn hóa địa phương",
};

export const formatPersonaKey = (key: string, locale: "en" | "vi" = "en") => {
  const normalized = key.toLowerCase().replace(/\s+/g, "_");
  if (locale === "vi" && PERSONA_LABELS_VI[normalized]) {
    return PERSONA_LABELS_VI[normalized];
  }
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export const formatDimensionKey = (key: string, locale: "en" | "vi" = "en") => {
  const normalized = key.toLowerCase();
  if (locale === "vi" && DIMENSION_LABELS_VI[normalized]) {
    return DIMENSION_LABELS_VI[normalized];
  }
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};
