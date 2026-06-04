import { useState, useCallback } from "react";
import { tStored } from "../../../i18n/tStored";
import { reviewService } from "../services/review.service";
import type { Review, CreateReviewRequest, UpdateReviewRequest, ReviewFilterParams } from "../types/review";

export const buildReviewODataQuery = (params: ReviewFilterParams): string => {
  const queries: string[] = [];
  const skip = (params.page - 1) * params.pageSize;
  queries.push(`$top=${params.pageSize}`);
  queries.push(`$skip=${skip}`);

  if (params.rating) {
    queries.push(`$filter=Rating eq ${params.rating}`);
  }

  const sortDirection = params.sortByDate === "asc" ? "asc" : "desc";
  queries.push(`$orderby=CreatedAt ${sortDirection}`);

  return `?${queries.join("&")}`;
};

export const useReview = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0); 
  const [myReview, setMyReview] = useState<Review | null>(null); 
  const [myAllReviews, setMyAllReviews] = useState<Review[]>([]); 
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 💥 1. Bổ sung tham số odataQuery để nhận chuỗi phân trang/lọc
  const fetchReviewsByTour = useCallback(async (tourId: number, odataQuery: string = "") => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reviewService.getReviewsByTour(tourId, odataQuery);
      setReviews(data.items || []); // Cập nhật mảng review
      setTotalCount(data.totalCount || 0); // Lưu lại tổng số lượng
    } catch (err: any) {
      setError(err?.response?.data?.message || tStored("tour.errorLoadReviews"));
      setReviews([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      setError(err?.response?.data?.message || tStored("tour.errorLoadMyReviews"));
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
      setTotalCount((prev) => prev + 1); // Tăng tổng số lượng lên 1
      return newReview;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || tStored("tour.errorSubmitReview");
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
        prev.map((r) => (r.id === reviewId ? updatedReview : r))
      );
      return updatedReview;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || tStored("tour.errorUpdateReview");
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
        })
      );
      return newReply;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || tStored("tour.errorSubmitReply");
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const editReply = async (reviewId: number, replyId: number, content: string) => {
    setIsLoading(true);
    try {
      const updatedReply = await reviewService.updateReply(replyId, { content });
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id === reviewId) {
            return {
              ...r,
              replies: r.replies?.map((rep) => (rep.id === replyId ? updatedReply : rep)),
            };
          }
          return r;
        })
      );
      return updatedReply;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || tStored("tour.errorEditReply");
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
        })
      );
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || tStored("tour.errorDeleteReply");
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
        prev.map((r) => (r.id === reviewId ? { ...r, isHidden } : r))
      );
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || tStored("tour.errorToggleReviewVisibility");
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // 💥 2. Sửa lại hàm Admin: Dùng ReviewService để đảm bảo chuẩn type (Tránh gọi Axios trực tiếp)
  const fetchReviewsForAdmin = useCallback(async (tourId: number, odataQuery: string = "") => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reviewService.getReviewsByTourAdmin(tourId, odataQuery);
      setReviews(data.items || []); 
      setTotalCount(data.totalCount || 0);
      return data;
    } catch (err: any) {
      console.error("Lỗi khi lấy review cho Admin", err);
      setError(err?.response?.data?.message || tStored("tour.errorLoadAdminReviews"));
      setReviews([]); 
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
  };
};