import React, { useState } from "react";
import { Star, Loader2, MessageSquare } from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton"; // Chỉnh lại đường dẫn import cho đúng
import { useReview } from "../hooks/useReview"; // Chỉnh lại đường dẫn import
import { useToast } from "../../../contexts/ToastContext"; // Chỉnh lại đường dẫn import
import type { Review } from "../types/review";

interface ReviewFormProps {
  tourId: number;
  customerId: number; // ID của người dùng đang đăng nhập
  existingReview?: Review | null; // Có = Update, Không có = Create
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  tourId,
  customerId,
  existingReview,
  onSuccess,
  onCancel,
}) => {
  const { submitReview, editReview } = useReview();
  const { error: showError, success: showSuccess } = useToast();

  // Khởi tạo state dựa trên dữ liệu cũ (nếu có)
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(existingReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isUpdateMode = !!existingReview;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating < 1 || rating > 5) {
      showError("Please select a rating between 1 and 5 stars.");
      return;
    }

    if (isUpdateMode && !comment.trim()) {
      showError("Comment is required when updating a review.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isUpdateMode) {
        // Gọi hàm Sửa
        await editReview(existingReview.id, {
          customerId,
          rating,
          comment: comment.trim(),
        });
        if (showSuccess) showSuccess("Review updated successfully!");
      } else {
        // Gọi hàm Tạo mới
        await submitReview({
          customerId,
          tourId,
          rating,
          comment: comment.trim() || null, // BE cho phép null khi tạo mới
        });
        if (showSuccess) showSuccess("Thank you for your review!");
      }
      
      // Đóng form hoặc chạy callback thành công
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {isUpdateMode ? "Edit your review" : "Write a review"}
          </h3>
          <p className="text-sm text-slate-500">
            Share your experience to help others.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star Rating Interactive */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            How would you rate this tour? <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= (hoverRating || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-100 text-slate-200"
                  }`}
                />
              </button>
            ))}
            <span className="ml-3 text-sm font-medium text-slate-500">
              {rating === 1 && "Terrible"}
              {rating === 2 && "Poor"}
              {rating === 3 && "Average"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </span>
          </div>
        </div>

        {/* Comment Textarea */}
        <div>
          <label htmlFor="comment" className="mb-2 block text-sm font-semibold text-slate-700">
            Share details of your own experience
            {isUpdateMode && <span className="text-rose-500 ml-1">*</span>}
          </label>
          <textarea
            id="comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like or dislike? How was the tour guide?"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {onCancel && (
            <ActionButton
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm"
            >
              Cancel
            </ActionButton>
          )}
          <ActionButton
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="gap-2 px-6 py-2.5 text-sm min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isUpdateMode ? (
              "Save Changes"
            ) : (
              "Submit Review"
            )}
          </ActionButton>
        </div>
      </form>
    </div>
  );
};