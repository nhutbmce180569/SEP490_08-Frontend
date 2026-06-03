import axios from "axios";
import { TOURS_API } from "../../../config/api/tours.api"; // Đổi lại đường dẫn import file TOURS_API của bạn
import type { Review, CreateReviewRequest, UpdateReviewRequest, CreateReviewReplyRequest, ReadReviewReply, UpdateReviewReplyRequest } from "../types/review";
import { apiClient } from "../../auth/utils/axiosClient";
import { withLanguageHeaders } from "../../../utils/httpLanguage";

const getAuthConfig = () => {
  const token = localStorage.getItem("accessToken");
  return {
    headers: withLanguageHeaders({
      Authorization: `Bearer ${token}`,
    }),
  };
};

const getPublicConfig = () => ({ headers: withLanguageHeaders() });

export const reviewService = {
  // 1. Lấy tất cả review của 1 tour (Không cần đăng nhập)
  getReviewsByTour: async (tourId: number): Promise<Review[]> => {
    const response = await axios.get(TOURS_API.GET_REVIEWS_BY_TOUR(tourId), getPublicConfig());
    return response.data;
  },

  getReviewsByTourAdmin: async (tourId: number): Promise<Review[]> => {
    // Thêm <any> vào đây
    const response = await apiClient.get<any>(TOURS_API.GET_REVIEWS_BY_TOUR_ADMIN(tourId));
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


  // Trả lời đánh giá
  createReply: async (reviewId: number, data: CreateReviewReplyRequest): Promise<ReadReviewReply> => {
    const response = await axios.post(TOURS_API.CREATE_REVIEW_REPLY(reviewId), data, getAuthConfig());
    return response.data;
  },

  // Sửa câu trả lời
  updateReply: async (replyId: number, data: UpdateReviewReplyRequest): Promise<ReadReviewReply> => {
    const response = await axios.put(TOURS_API.UPDATE_REVIEW_REPLY(replyId), data, getAuthConfig());
    return response.data;
  },

  // Xóa câu trả lời
  deleteReply: async (replyId: number): Promise<void> => {
    await axios.delete(TOURS_API.DELETE_REVIEW_REPLY(replyId), getAuthConfig());
  },

  // Ẩn / Hiện đánh giá
  hideReview: async (reviewId: number, hidden: boolean): Promise<void> => {
    await axios.patch(TOURS_API.HIDE_REVIEW(reviewId, hidden), {}, getAuthConfig());
  },
};