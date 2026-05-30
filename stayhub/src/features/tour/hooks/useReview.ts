import { useState, useCallback } from "react";
import { reviewService } from "../services/review.service";
import type { Review, CreateReviewRequest, UpdateReviewRequest } from "../types/review";

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
  };
};