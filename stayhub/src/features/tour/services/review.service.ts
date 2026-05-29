import axios from "axios";
import { TOURS_API } from "../../../config/api/tours.api"; // Đổi lại đường dẫn import file TOURS_API của bạn
import type { Review, CreateReviewRequest, UpdateReviewRequest } from "../types/review";

const getAuthConfig = () => {
  const token = localStorage.getItem("accessToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const reviewService = {
  // 1. Lấy tất cả review của 1 tour (Không cần đăng nhập)
  getReviewsByTour: async (tourId: number): Promise<Review[]> => {
    const response = await axios.get(TOURS_API.GET_REVIEWS_BY_TOUR(tourId));
    return response.data;
  },

  // 2. Lấy review CỦA TÔI cho 1 tour cụ thể (Cần Auth)
  getMyReviewByTour: async (tourId: number): Promise<Review | null> => {
    const response = await axios.get(TOURS_API.GET_MY_REVIEW_BY_TOUR(tourId), getAuthConfig());
    return response.data;
  },

  // 3. Lấy TẤT CẢ review CỦA TÔI (Cần Auth)
  getMyReviews: async (): Promise<Review[]> => {
    const response = await axios.get(TOURS_API.GET_MY_REVIEWS, getAuthConfig());
    return response.data;
  },

  // 4. Tạo review mới (Cần Auth)
  createReview: async (data: CreateReviewRequest): Promise<Review> => {
    const response = await axios.post(TOURS_API.CREATE_REVIEW, data, getAuthConfig());
    return response.data;
  },

  // 5. Cập nhật review (Cần Auth - Dùng PATCH theo đúng method BE)
  updateReview: async (reviewId: number, data: UpdateReviewRequest): Promise<Review> => {
    const response = await axios.patch(TOURS_API.UPDATE_REVIEW(reviewId), data, getAuthConfig());
    return response.data;
  },
};