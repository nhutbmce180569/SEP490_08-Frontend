import React, { useState } from "react";
import { Star, Loader2, MessageSquare } from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useReview } from "../hooks/useReview";
import { useToast } from "../../../contexts/ToastContext";
import { useTranslation } from "../../../contexts/LocaleContext";
import type { Review } from "../types/review";

interface ReviewFormProps {
  tourId: number;
  customerId: number;
  existingReview?: Review | null;
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
  const { t } = useTranslation();
  const { submitReview, editReview } = useReview();
  const { error: showError, success: showSuccess } = useToast();

  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(existingReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isUpdateMode = !!existingReview;

  const ratingLabels: Record<number, string> = {
    1: t("tour.ratingTerrible"),
    2: t("tour.ratingPoor"),
    3: t("tour.ratingAverage"),
    4: t("tour.ratingVeryGood"),
    5: t("tour.ratingExcellent"),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      showError(t("tour.ratingRequired"));
      return;
    }

    if (isUpdateMode && !comment.trim()) {
      showError(t("tour.commentRequiredUpdate"));
      return;
    }

    setIsSubmitting(true);
    try {
      if (isUpdateMode) {
        await editReview(existingReview.id, {
          customerId,
          rating,
          comment: comment.trim(),
        });
        if (showSuccess) showSuccess(t("tour.reviewUpdated"));
      } else {
        await submitReview({
          customerId,
          tourId,
          rating,
          comment: comment.trim() || null,
        });
        if (showSuccess) showSuccess(t("tour.reviewThankYou"));
      }

      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : t("common.error"));
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
            {isUpdateMode ? t("tour.editYourReview") : t("tour.writeReview")}
          </h3>
          <p className="text-sm text-slate-500">{t("tour.shareExperience")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {t("tour.rateTourQuestion")} <span className="text-rose-500">*</span>
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
              {ratingLabels[rating]}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="mb-2 block text-sm font-semibold text-slate-700">
            {t("tour.shareExperienceDetails")}
            {isUpdateMode && <span className="text-rose-500 ml-1">*</span>}
          </label>
          <textarea
            id="comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("tour.reviewPlaceholder")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          ></textarea>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {onCancel && (
            <ActionButton
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm"
            >
              {t("common.cancel")}
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
                {t("tour.processing")}
              </>
            ) : isUpdateMode ? (
              t("common.saveChanges")
            ) : (
              t("tour.submitReview")
            )}
          </ActionButton>
        </div>
      </form>
    </div>
  );
};
