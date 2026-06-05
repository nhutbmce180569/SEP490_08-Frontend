export type SystemFaqCategoryKey =
  | "platform"
  | "booking"
  | "payment"
  | "ai"
  | "account"
  | "social"
  | "support";

export type SystemFaqQuestionKey =
  | "platformOverview"
  | "architecture"
  | "bookingFlow"
  | "cancellationRefund"
  | "paymentMethods"
  | "voucherUsage"
  | "aiAssistant"
  | "aiQuestionnaire"
  | "accountAuth"
  | "wishlist"
  | "socialFeatures"
  | "reviewsRatings"
  | "operatorRole"
  | "supportHelp";

export interface SystemFaqCategory {
  categoryKey: SystemFaqCategoryKey;
  questionKeys: SystemFaqQuestionKey[];
}

export const SYSTEM_FAQ_CATALOG: SystemFaqCategory[] = [
  {
    categoryKey: "platform",
    questionKeys: ["platformOverview", "architecture"],
  },
  {
    categoryKey: "booking",
    questionKeys: ["bookingFlow", "cancellationRefund"],
  },
  {
    categoryKey: "payment",
    questionKeys: ["paymentMethods", "voucherUsage"],
  },
  {
    categoryKey: "ai",
    questionKeys: ["aiAssistant", "aiQuestionnaire"],
  },
  {
    categoryKey: "account",
    questionKeys: ["accountAuth", "wishlist"],
  },
  {
    categoryKey: "social",
    questionKeys: ["socialFeatures", "reviewsRatings"],
  },
  {
    categoryKey: "support",
    questionKeys: ["operatorRole", "supportHelp"],
  },
];
