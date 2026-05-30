// Interface phụ cho Reply (nếu sau này bạn làm chức năng Admin/Guide trả lời review)
export interface ReadReviewReply {
  id: number;
  reviewId: number;
  content: string;
  repliedBy?: string;
  createdAt?: string;
}

// Map theo ReadReviewDTO
export interface Review {
  id: number;
  customerId: number;
  tourId: number;
  tourName?: string | null;
  customerName?: string | null;
  customerAvatar?: string | null;
  rating?: number | null;
  comment?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  isHidden?: boolean;
  replies?: ReadReviewReply[] | null;
}

// Map theo CreateReviewDTO
export interface CreateReviewRequest {
  customerId: number;
  tourId: number;
  rating: number; // Yêu cầu từ 1-5
  comment?: string | null;
}

// Map theo UpdateReviewDTO
export interface UpdateReviewRequest {
  customerId: number;
  rating: number; // Yêu cầu từ 1-5
  comment: string; // Bắt buộc ở BE (không được null)
}


export interface ReadReviewReply {
  id: number;
  reviewId: number;
  content: string;
  repliedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReviewReplyRequest {
  content: string;
}

export interface UpdateReviewReplyRequest {
  content: string;
}