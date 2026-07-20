export interface Promotion {
  id: number;
  code: string;
  name: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

export interface PromotionFormData {
  code: string;
  name: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  maxDiscountAmount?: number | null;
  startDate: string;
  endDate: string;
  status?: string;
}

export interface PaginatedPromotions {
  data: Promotion[];
  total: number;
  page: number;
  pageSize: number;
}
