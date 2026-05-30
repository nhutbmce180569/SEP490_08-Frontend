import { useState, useCallback } from "react";
import { reviewService } from "../services/review.service";
import type { Review, CreateReviewRequest, UpdateReviewRequest } from "../types/review";
import axios from "axios";
import { TOURS_API } from "../../../config/api/tours.api";

export const useReview = () => {
  // States lưu trữ dữ liệu
  const [reviews, setReviews] = useState<Review[]>([]); // Tất cả review của 1 tour (Public)
  const [myReview, setMyReview] = useState<Review | null>(null); // Review của "Tôi" trong 1 tour (Để check xem đã review chưa)
  const [myAllReviews, setMyAllReviews] = useState<Review[]>([]); // Tất cả lịch sử review của "Tôi" (Dùng cho trang cá nhân)
  
  // States trạng thái
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Lấy tất cả đánh giá của 1 Tour (Gọi khi vào xem chi tiết Tour)
  const fetchReviewsByTour = useCallback(async (tourId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reviewService.getReviewsByTour(tourId);
      setReviews(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi khi tải danh sách đánh giá.");
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Lấy đánh giá CỦA TÔI cho 1 Tour (Để xác định xem nên hiện nút "Viết Đánh Giá" hay form "Chỉnh Sửa")
  const fetchMyReviewForTour = useCallback(async (tourId: number) => {
    try {
      const data = await reviewService.getMyReviewByTour(tourId);
      setMyReview(data);
    } catch (err: any) {
      // 404 nghĩa là user chưa review tour này, không phải lỗi hệ thống -> Bỏ qua
      if (err?.response?.status !== 404) {
        console.error("Lỗi khi kiểm tra review của tôi:", err);
      }
      setMyReview(null);
    }
  }, []);

  // 3. Lấy TẤT CẢ lịch sử đánh giá CỦA TÔI (Gọi khi vào trang Profile -> Lịch sử đánh giá)
  const fetchAllMyReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reviewService.getMyReviews();
      setMyAllReviews(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi khi tải lịch sử đánh giá của bạn.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 4. Viết đánh giá mới
  const submitReview = async (data: CreateReviewRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const newReview = await reviewService.createReview(data);
      
      // 💥 Cập nhật UI lập tức: Gắn review vừa tạo vào myReview và chèn lên đầu danh sách chung
      setMyReview(newReview);
      setReviews((prev) => [newReview, ...prev]); 
      
      return newReview;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || "Không thể gửi đánh giá.";
      setError(errMsg);
      // Ném lỗi ra để component giao diện dùng Toast hiện thông báo
      throw new Error(errMsg); 
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Chỉnh sửa đánh giá
  const editReview = async (reviewId: number, data: UpdateReviewRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedReview = await reviewService.updateReview(reviewId, data);
      
      // 💥 Cập nhật UI: Đổi nội dung của myReview và tìm & sửa review đó trong danh sách chung
      setMyReview(updatedReview);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? updatedReview : r))
      );
      
      return updatedReview;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || "Không thể cập nhật đánh giá. (Giới hạn 1 ngày sau khi tạo)";
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // MANAGER / STAFF ACTIONS
  // ==========================================

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
      const errMsg = err?.response?.data?.message || "Lỗi khi gửi phản hồi.";
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
      const errMsg = err?.response?.data?.message || "Lỗi khi sửa phản hồi.";
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const removeReply = async (reviewId: number, replyId: number) => {
    setIsLoading(true);
    try {
      await reviewService.deleteReply(replyId);
      
      // Lọc bỏ cái reply vừa bị xóa ra khỏi UI
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
      const errMsg = err?.response?.data?.message || "Lỗi khi xóa phản hồi.";
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHideReview = async (reviewId: number, isHidden: boolean) => {
    setIsLoading(true);
    try {
      await reviewService.hideReview(reviewId, isHidden);
      
      // Cập nhật lại trạng thái isHidden trên UI (Nếu Type Review của bạn chưa có isHidden thì nhớ bổ sung nhé)
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, isHidden } : r))
      );
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || "Lỗi khi thay đổi trạng thái ẩn/hiện.";
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviewsForAdmin = useCallback(async (tourId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken"); 
      const response = await axios.get(
        TOURS_API.GET_REVIEWS_BY_TOUR_ADMIN(tourId), 
        {
          headers: {
            Authorization: `Bearer ${token}` 
          }
        }
      );
      
      setReviews(response.data);
      return response.data;
    } catch (err: any) {
      console.error("Lỗi khi lấy review cho Admin", err);
      setError(err?.response?.data?.message || "Lỗi khi lấy danh sách đánh giá.");
      setReviews([]); 
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Data
    reviews,
    myReview,
    myAllReviews,
    // Status
    isLoading,
    error,
    // Actions
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