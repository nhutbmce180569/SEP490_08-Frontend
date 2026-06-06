import axios from "axios";
import { TOURS_API } from "../../../config/api/tours.api";
import { withLanguageHeaders } from "../../../utils/httpLanguage";
import type {
  CreateReviewReplyRequest,
  CreateReviewRequest,
  PagedReviewResult,
  ReadReviewReply,
  Review,
  ReviewFilterParams,
  UpdateReviewReplyRequest,
  UpdateReviewRequest,
} from "../types/review";

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
  // ✅ Public — không cần token
  getReviewsByTour: async (
    tourId: number,
    params: ReviewFilterParams,
  ): Promise<PagedReviewResult> => {
    const response = await axios.get(TOURS_API.GET_REVIEWS_BY_TOUR(tourId), {
      ...getPublicConfig(),
      params,
    });
    return response.data;
  },

  // ✅ FIX: Đổi từ apiClient sang axios + getAuthConfig() để gửi token
  getReviewsByTourAdmin: async (
    tourId: number,
    params: ReviewFilterParams,
  ): Promise<PagedReviewResult> => {
    const response = await axios.get(
      TOURS_API.GET_REVIEWS_BY_TOUR_ADMIN(tourId),
      {
        ...getAuthConfig(), // ✅ spread auth headers trước
        params, // ✅ params sau để không bị ghi đè
      },
    );
    return response.data;
  },

  getReviewsByTourManager: async (
    tourId: number,
    params: ReviewFilterParams,
  ): Promise<PagedReviewResult> => {
    const response = await axios.get(
      TOURS_API.GET_REVIEWS_BY_TOUR_MANAGER(tourId),
      {
        ...getAuthConfig(),
        params,
      },
    );
    return response.data;
  },

  // ✅ Cần Auth
  getMyReviewByTour: async (tourId: number): Promise<Review | null> => {
    const response = await axios.get(
      TOURS_API.GET_MY_REVIEW_BY_TOUR(tourId),
      getAuthConfig(),
    );
    return response.data;
  },

  // ✅ Cần Auth
  getMyReviews: async (): Promise<Review[]> => {
    const response = await axios.get(TOURS_API.GET_MY_REVIEWS, getAuthConfig());
    return response.data;
  },

  // ✅ Cần Auth
  createReview: async (data: CreateReviewRequest): Promise<Review> => {
    const response = await axios.post(
      TOURS_API.CREATE_REVIEW,
      data,
      getAuthConfig(),
    );
    return response.data;
  },

  // ✅ Cần Auth — PATCH theo đúng method BE
  updateReview: async (
    reviewId: number,
    data: UpdateReviewRequest,
  ): Promise<Review> => {
    const response = await axios.patch(
      TOURS_API.UPDATE_REVIEW(reviewId),
      data,
      getAuthConfig(),
    );
    return response.data;
  },

  // ✅ Cần Auth
  createReply: async (
    reviewId: number,
    data: CreateReviewReplyRequest,
  ): Promise<ReadReviewReply> => {
    const response = await axios.post(
      TOURS_API.CREATE_REVIEW_REPLY(reviewId),
      data,
      getAuthConfig(),
    );
    return response.data;
  },

  // ✅ Cần Auth
  updateReply: async (
    replyId: number,
    data: UpdateReviewReplyRequest,
  ): Promise<ReadReviewReply> => {
    const response = await axios.put(
      TOURS_API.UPDATE_REVIEW_REPLY(replyId),
      data,
      getAuthConfig(),
    );
    return response.data;
  },

  // ✅ Cần Auth
  deleteReply: async (replyId: number): Promise<void> => {
    await axios.delete(TOURS_API.DELETE_REVIEW_REPLY(replyId), getAuthConfig());
  },

  // ✅ Cần Auth
  hideReview: async (reviewId: number, hidden: boolean): Promise<void> => {
    await axios.patch(
      TOURS_API.HIDE_REVIEW(reviewId, hidden),
      {},
      getAuthConfig(),
    );
  },
};
