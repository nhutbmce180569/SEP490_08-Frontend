export const formatVnd = (amount?: number | null) => {
  if (amount == null || Number.isNaN(amount)) return "Liên hệ";
  return `${amount.toLocaleString("vi-VN")} đ`;
};

export const formatMatchPercent = (score: number) =>
  `${Math.round(Math.min(1, Math.max(0, score)) * 100)}%`;

export const formatPersonaKey = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const formatDimensionKey = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
