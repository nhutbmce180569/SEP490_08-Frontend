import { useState, useCallback } from "react";
import { tStored } from "../../../i18n/tStored";
import { reviewService } from "../services/review.service";
import type {
  CreateReviewRequest,
  Review,
  ReviewFilterParams,
  UpdateReviewRequest,
} from "../types/review";

// 💥 Hàm buildReviewODataQuery đã bị XÓA vì không còn cần thiết nữa.

export const useReview = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [myAllReviews, setMyAllReviews] = useState<Review[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 💥 Sửa lại để nhận tham số object params
  const fetchReviewsByTour = useCallback(
    async (tourId: number, params: ReviewFilterParams) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await reviewService.getReviewsByTour(tourId, params);
        setReviews(response.data || []); // Lấy mảng từ biến 'data' thay vì 'items'
        setTotalCount(response.total || 0); // Lấy biến 'total' thay vì 'totalCount'
      } catch (err: any) {
        setError(
          err?.response?.data?.message || tStored("tour.errorLoadReviews"),
        );
        setReviews([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const fetchReviewsForManager = useCallback(
    async (tourId: number, params: ReviewFilterParams) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await reviewService.getReviewsByTourManager(
          tourId,
          params,
        );

        setReviews(response.data || []);
        setTotalCount(response.total || 0);

        return response;
      } catch (err: any) {
        console.error("Lỗi khi lấy review cho Manager", err);
        setError(
          err?.response?.data?.message ||
            tStored("tour.errorLoadManagerReviews"),
        );
        setReviews([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const fetchMyReviewForTour = useCallback(async (tourId: number) => {
    try {
      const data = await reviewService.getMyReviewByTour(tourId);
      setMyReview(data);
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        console.error("Lỗi khi kiểm tra review của tôi:", err);
      }
      setMyReview(null);
    }
  }, []);

  const fetchAllMyReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reviewService.getMyReviews();
      setMyAllReviews(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || tStored("tour.errorLoadMyReviews"),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitReview = async (data: CreateReviewRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const newReview = await reviewService.createReview(data);
      setMyReview(newReview);
      setReviews((prev) => [newReview, ...prev]);
      setTotalCount((prev) => prev + 1);
      return newReview;
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || tStored("tour.errorSubmitReview");
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const editReview = async (reviewId: number, data: UpdateReviewRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedReview = await reviewService.updateReview(reviewId, data);
      setMyReview(updatedReview);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? updatedReview : r)),
      );
      return updatedReview;
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || tStored("tour.errorUpdateReview");
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const replyToReview = async (reviewId: number, content: string) => {
    setIsLoading(true);
    try {
      const newReply = await reviewService.createReply(reviewId, { content });
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id === reviewId) {
            return { ...r, replies: [...(r.replies || []), newReply] };
          }
          return r;
        }),
      );
      return newReply;
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || tStored("tour.errorSubmitReply");
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const editReply = async (
    reviewId: number,
    replyId: number,
    content: string,
  ) => {
    setIsLoading(true);
    try {
      const updatedReply = await reviewService.updateReply(replyId, {
        content,
      });
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id === reviewId) {
            return {
              ...r,
              replies: r.replies?.map((rep) =>
                rep.id === replyId ? updatedReply : rep,
              ),
            };
          }
          return r;
        }),
      );
      return updatedReply;
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || tStored("tour.errorEditReply");
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const removeReply = async (reviewId: number, replyId: number) => {
    setIsLoading(true);
    try {
      await reviewService.deleteReply(replyId);
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id === reviewId) {
            return {
              ...r,
              replies: r.replies?.filter((rep) => rep.id !== replyId),
            };
          }
          return r;
        }),
      );
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || tStored("tour.errorDeleteReply");
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHideReview = async (reviewId: number, isHidden: boolean) => {
    setIsLoading(true);
    try {
      await reviewService.hideReview(reviewId, isHidden);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, isHidden } : r)),
      );
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        tStored("tour.errorToggleReviewVisibility");
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // 💥 3. Đổi tham số nhận object params
  const fetchReviewsForAdmin = useCallback(
    async (tourId: number, params: ReviewFilterParams) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await reviewService.getReviewsByTourAdmin(
          tourId,
          params,
        );
        setReviews(response.data || []);
        setTotalCount(response.total || 0);
        return response;
      } catch (err: any) {
        console.error("Lỗi khi lấy review cho Admin", err);
        setError(
          err?.response?.data?.message || tStored("tour.errorLoadAdminReviews"),
        );
        setReviews([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const analyzeReview = async (reviewText: string, starRating: number) => {
    try {
      return await reviewService.analyzeReview(reviewText, starRating);
    } catch (err: any) {
      console.error("Error analyzing review:", err);
      throw err;
    }
  };

  return {
    reviews,
    totalCount,
    myReview,
    myAllReviews,
    isLoading,
    error,
    fetchReviewsByTour,
    fetchMyReviewForTour,
    fetchAllMyReviews,
    submitReview,
    editReview,
    replyToReview,
    editReply,
    removeReply,
    toggleHideReview,
    fetchReviewsForAdmin,
    fetchReviewsForManager,
    analyzeReview,
  };
};
