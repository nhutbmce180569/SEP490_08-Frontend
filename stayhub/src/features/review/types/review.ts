export interface ReadReviewDTO {
  id: number;
  customerId: number;
  customerName?: string;
  customerAvatar?: string;
  rating?: number;
  comment?: string;
}

export interface CreateReviewDTO {
  customerId: number;
  tourId: number;
  rating: number;
  comment?: string;
}

export interface UpdateReviewDTO {
  customerId: number;
  rating: number;
  comment: string;
}