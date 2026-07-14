import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Star,
  MessageSquare,
  Map,
  EyeOff,
  Eye,
  Trash2,
  Pencil,
  CornerDownRight,
  MessageSquarePlus,
  Loader2,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Wand2,
} from "lucide-react";
import { useReview } from "../hooks/useReview";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { ConfirmDialog } from "../../../components/dashboard/ConfirmDialog";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { useToast } from "../../../contexts/ToastContext";
import { AuthContext } from "../../../contexts/AuthContext";
import type { Review } from "../types/review";
import { getToursByManager } from "../services/tour.service";
import { useTranslation } from "../../../contexts/LocaleContext";

const formatReviewDate = (date?: string | null) =>
  date
    ? new Date(date).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

const AdminReviewCard: React.FC<{
  review: Review;
  onReply: (reviewId: number, text: string) => Promise<any>;
  onEditReply: (
    reviewId: number,
    replyId: number,
    text: string,
  ) => Promise<any>;
  onDeleteReply: (reviewId: number, replyId: number) => Promise<void>;
  onToggleHide: (reviewId: number, isHidden: boolean) => Promise<void>;
}> = ({ review, onReply, onEditReply, onDeleteReply, onToggleHide }) => {
  const { t } = useTranslation();
  const { success: showSuccess, error: showError } = useToast();
  const { user } = useContext(AuthContext);
  const currentUserId = user?.id;

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "deleteReply" | "toggleHide";
    nextHideStatus?: boolean;
  }>({ open: false, action: "deleteReply" });

  const existingReply =
    review.replies && review.replies.length > 0 ? review.replies[0] : null;

  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState(existingReply?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      if (isEditing && existingReply) {
        await onEditReply(review.id, existingReply.id, replyText);
        showSuccess(t("tour.replyUpdated"));
        setIsEditing(false);
      } else {
        await onReply(review.id, replyText);
        showSuccess(t("tour.replySent"));
        setIsReplying(false);
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReply = () => {
    if (!existingReply) return;
    setConfirmDialog({ open: true, action: "deleteReply" });
  };

  const handleToggleHide = () => {
    setConfirmDialog({
      open: true,
      action: "toggleHide",
      nextHideStatus: !review.isHidden,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, action: "deleteReply" });
  };

  const handleConfirmDialog = async () => {
    if (!confirmDialog.open) return;

    setIsSubmitting(true);
    try {
      if (confirmDialog.action === "deleteReply") {
        if (!existingReply) return;
        await onDeleteReply(review.id, existingReply.id);
        showSuccess(t("tour.replyDeleted"));
        setReplyText("");
      } else {
        const newStatus = confirmDialog.nextHideStatus ?? !review.isHidden;
        await onToggleHide(review.id, newStatus);
        showSuccess(
          newStatus ? t("tour.reviewHidden") : t("tour.reviewVisible"),
        );
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsSubmitting(false);
      closeConfirmDialog();
    }
  };

  const reviewerName = review.customerName || t("tour.anonymousCustomer");
  const initials = reviewerName.charAt(0).toUpperCase();

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all ${review.isHidden ? "border-rose-200 bg-rose-50/30" : "border-slate-200 bg-white"}`}
    >
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg uppercase border border-indigo-200">
              {review.customerAvatar ? (
                <img
                  src={review.customerAvatar}
                  alt={reviewerName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement!.innerText = initials;
                  }}
                />
              ) : (
                initials
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900">{reviewerName}</h4>
                {review.isHidden && (
                  <span className="flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    <EyeOff size={12} /> {t("tour.hidden")}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < (review.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                </div>
                {review.createdAt && (
                  <span className="text-xs font-medium text-slate-400">
                    • {formatReviewDate(review.createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">

            <ActionButton
              variant="secondary"
              onClick={handleToggleHide}
              disabled={isSubmitting}
              className={`h-8 w-8 ${review.isHidden ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" : "text-rose-500 hover:bg-rose-50 hover:text-rose-600"}`}
              title={
                review.isHidden ? t("tour.unhideReview") : t("tour.hideReview")
              }
            >
              {review.isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
            </ActionButton>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-slate-700 pl-[56px]">
          {review.comment}
        </p>

        <div className="mt-4 border-t border-slate-100 pt-4 pl-[56px]">
          {existingReply && !isEditing ? (
            <div className="relative rounded-xl bg-slate-50 p-4 border border-slate-100">
              <CornerDownRight className="absolute -left-6 top-4 h-5 w-5 text-slate-300" />
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm uppercase border border-indigo-200">
                    {existingReply.userAvatar ? (
                      <img
                        src={existingReply.userAvatar}
                        alt={existingReply.userName || t("tour.staff")}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.innerText = (
                            existingReply.userName || "S"
                          )
                            .charAt(0)
                            .toUpperCase();
                        }}
                      />
                    ) : (
                      (existingReply.userName || "S").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-slate-900">
                        {String(existingReply.userId) === String(currentUserId)
                          ? t("tour.yourReply")
                          : existingReply.userName || t("tour.staff")}
                      </h5>
                      {existingReply.createdAt && (
                        <span className="text-xs font-medium text-slate-400">
                          • {formatReviewDate(existingReply.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t("tour.replyToCustomer")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-slate-400 hover:text-indigo-600"
                    title={t("tour.editReply")}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={handleDeleteReply}
                    className="text-slate-400 hover:text-rose-600"
                    title={t("tour.deleteReply")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {existingReply.content}
              </p>
            </div>
          ) : isReplying || isEditing ? (
            <div className="relative animate-in fade-in zoom-in-95 duration-200">
              <CornerDownRight className="absolute -left-6 top-2 h-5 w-5 text-slate-300" />
              <textarea
                autoFocus
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t("tour.writeReplyPlaceholder")}
                className="w-full rounded-xl border border-indigo-200 bg-indigo-50/30 p-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="mt-2 flex justify-end gap-2">
                <ActionButton
                  variant="secondary"
                  onClick={() => {
                    setIsReplying(false);
                    setIsEditing(false);
                    setReplyText(existingReply?.content || "");
                  }}
                  className="px-4 py-1.5 text-xs"
                >
                  {t("common.cancel")}
                </ActionButton>
                <ActionButton
                  variant="primary"
                  onClick={handleSubmitReply}
                  disabled={isSubmitting || !replyText.trim()}
                  className="px-4 py-1.5 text-xs gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <MessageSquare size={14} />
                  )}
                  {isEditing ? t("common.update") : t("tour.sendReply")}
                </ActionButton>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsReplying(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <MessageSquarePlus size={16} /> {t("tour.writeReply")}
            </button>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirmDialog}
        title={
          confirmDialog.action === "deleteReply"
            ? t("tour.confirmDeleteReply")
            : confirmDialog.nextHideStatus
              ? t("tour.confirmHideReview")
              : t("tour.confirmUnhideReview")
        }
        message={
          confirmDialog.action === "deleteReply"
            ? t("tour.confirmDeleteReplyMsg")
            : confirmDialog.nextHideStatus
              ? t("tour.confirmHideReviewMsg")
              : t("tour.confirmUnhideReviewMsg")
        }
        confirmText={
          confirmDialog.action === "deleteReply"
            ? t("tour.delete")
            : confirmDialog.nextHideStatus
              ? t("tour.hide")
              : t("tour.unhide")
        }
        variant="warning"
      />
    </div>
  );
};

const TourSentimentBadge: React.FC<{ tourId: number }> = ({ tourId }) => {
  const { t } = useTranslation();
  const { analyzeReview } = useReview();
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<{ sentiment: string; confidence: number; reason: string } | null>(null);

  const handleAnalyzeTour = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === "loading") return;

    setStatus("loading");
    try {
      const { reviewService } = await import("../services/review.service");
      const res = await reviewService.getReviewsByTourAdmin(tourId, { page: 1, pageSize: 50 });
      const reviews = res.data || [];

      if (reviews.length === 0) {
        setStatus("done");
        setResult({ sentiment: "Neutral", confidence: 1, reason: t("tour.noReviewToAnalyze") || "Tour chưa có đánh giá nào." });
        return;
      }

      const comments = reviews.filter(r => r.comment).map(r => `- ${r.rating} sao: ${r.comment}`).join("\n");
      const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length;

      if (!comments.trim()) {
        setStatus("done");
        setResult({ sentiment: avgRating >= 4 ? "Good" : avgRating <= 2 ? "Bad" : "Neutral", confidence: 1, reason: t("tour.reasonByAverageStar") || "Dựa vào số sao trung bình (không có chữ)." });
        return;
      }

      const aiResult = await analyzeReview(comments, Math.round(avgRating));
      setResult(aiResult);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setStatus("idle");
    }
  };

  useEffect(() => {
    setStatus("idle");
    setResult(null);
  }, [tourId]);

  if (status === "idle") {
    return (
      <div className="w-full">
        <button 
          onClick={handleAnalyzeTour}
          className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 hover:from-indigo-100 hover:to-violet-100 transition-all border-b border-indigo-100/50"
          title={t("tour.analyzeTourOverall") || "Phân tích chất lượng tổng thể của Tour"}
        >
          <Wand2 size={16} className="text-indigo-500" />
          <span className="text-sm font-semibold">{t("tour.analyzeTourOverall") || "Phân tích toàn bộ đánh giá Tour bằng AI"}</span>
        </button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-slate-50 text-slate-500 border-b border-slate-200">
        <Loader2 size={16} className="animate-spin" /> 
        <span className="text-sm font-medium">{t("tour.analyzingTour") || "Đang tổng hợp và phân tích đánh giá..."}</span>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className={`w-full px-5 py-4 border-b flex flex-col gap-2 ${
      result.sentiment === "Good" ? "bg-emerald-50/50 border-emerald-100" :
      result.sentiment === "Neutral" ? "bg-amber-50/50 border-amber-100" :
      "bg-rose-50/50 border-rose-100"
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
          <Wand2 size={14} className="text-indigo-400" /> {t("tour.aiJudgment") || "AI Nhận định:"}
        </span>
        <span className={`text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
          result.sentiment === "Good" ? "bg-emerald-100 text-emerald-700" :
          result.sentiment === "Neutral" ? "bg-amber-100 text-amber-700" :
          "bg-rose-100 text-rose-700"
        }`}>
          {result.sentiment === "Good" ? <Star size={14} className="fill-current" /> :
           result.sentiment === "Bad" ? <X size={14} strokeWidth={3} /> : null}
          {result.sentiment}
        </span>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed mt-1">
        {result.reason}
      </p>
    </div>
  );
};

export const DashboardReviewManager: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [tours, setTours] = useState<any[]>([]);
  const [isToursLoading, setIsToursLoading] = useState(true);
  const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
  
  const [tourPage, setTourPage] = useState(1);
  const [hasMoreTours, setHasMoreTours] = useState(true);

  const [reviewPage, setReviewPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [dateSortOrder, setDateSortOrder] = useState<"newest" | "oldest">(
    "newest",
  );
  const [localReviews, setLocalReviews] = useState<Review[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    reviews,
    totalCount,
    isLoading: isReviewsLoading,
    fetchReviewsForManager,
    replyToReview,
    editReply,
    removeReply,
    toggleHideReview,
  } = useReview();

  const [tourSearch, setTourSearch] = useState("");
  const [debouncedTourSearch, setDebouncedTourSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTourSearch(tourSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [tourSearch]);

  // Reset page when search changes
  useEffect(() => {
    setTourPage(1);
  }, [debouncedTourSearch]);

  // 1. Tải danh sách Tour
  useEffect(() => {
    const fetchTours = async () => {
      if (tourPage === 1) setIsToursLoading(true);
      try {
        const res = await getToursByManager(
          tourPage,
          50,
          debouncedTourSearch || undefined,
        );
        const tourList = res.data || [];
        const roles = Array.isArray(user?.roles)
          ? user.roles
          : user?.roles
            ? [user.roles]
            : [];
        const canUseAssignedTours =
          roles.includes("Admin") || roles.includes("Staff");
        const manageableTours = canUseAssignedTours
          ? tourList
          : tourList.filter((tour: any) => tour.canEdit);

        if (tourPage === 1) {
          setTours(manageableTours);
          if (manageableTours.length > 0 && !selectedTourId) {
            setSelectedTourId(manageableTours[0].id);
          }
        } else {
          setTours((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const newTours = manageableTours.filter(
              (t: any) => !existingIds.has(t.id),
            );
            return [...prev, ...newTours];
          });
        }

        setHasMoreTours(tourList.length === 50);
      } catch (error) {
        console.error("Failed to fetch tours", error);
      } finally {
        setIsToursLoading(false);
      }
    };
    fetchTours();
  }, [debouncedTourSearch, user?.roles, tourPage]);

  // 2. Reset Filter và Danh sách Review khi đổi TourId
  useEffect(() => {
    if (selectedTourId) {
      setReviewPage(1);
      setRatingFilter(null);
      setDateSortOrder("newest");
      setLocalReviews([]);
    }
  }, [selectedTourId]);

  // 3. Kích hoạt gọi API mỗi khi State lọc / phân trang thay đổi
  useEffect(() => {
    if (selectedTourId) {
      fetchReviewsForManager(selectedTourId, {
        page: reviewPage,
        pageSize: 5,
        rating: ratingFilter,
        sortOrder: dateSortOrder,
      });
    }
  }, [
    selectedTourId,
    reviewPage,
    ratingFilter,
    dateSortOrder,
    fetchReviewsForManager,
  ]);

  // 4. Cập nhật dữ liệu vào localReviews để hiển thị (Nối mảng khi scroll)
  useEffect(() => {
    if (reviewPage === 1) {
      setLocalReviews(reviews || []);
    } else {
      setLocalReviews((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const newItems = (reviews || []).filter((r) => !existingIds.has(r.id));
        return [...prev, ...newItems];
      });
    }
  }, [reviews, reviewPage]);

  // 5. Tính năng Infinite Scroll (Tự động kéo trang)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isReviewsLoading &&
          localReviews.length < (totalCount || 0)
        ) {
          setReviewPage((p) => p + 1);
        }
      },
      { threshold: 1.0 },
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [isReviewsLoading, localReviews.length, totalCount]);

  // --- WRAPPER CHO CÁC HÀM CẬP NHẬT GIAO DIỆN TỨC THÌ (OPTIMISTIC UI) ---
  const handleReplyWrapper = async (reviewId: number, text: string) => {
    const newReply = await replyToReview(reviewId, text);
    setLocalReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, replies: [...(r.replies || []), newReply] }
          : r,
      ),
    );
    return newReply;
  };

  const handleEditReplyWrapper = async (
    reviewId: number,
    replyId: number,
    text: string,
  ) => {
    const updated = await editReply(reviewId, replyId, text);
    setLocalReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              replies: r.replies?.map((rep) =>
                rep.id === replyId ? updated : rep,
              ),
            }
          : r,
      ),
    );
    return updated;
  };

  const handleRemoveReplyWrapper = async (
    reviewId: number,
    replyId: number,
  ) => {
    await removeReply(reviewId, replyId);
    setLocalReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, replies: r.replies?.filter((rep) => rep.id !== replyId) }
          : r,
      ),
    );
  };

  const handleToggleHideWrapper = async (
    reviewId: number,
    isHidden: boolean,
  ) => {
    await toggleHideReview(reviewId, isHidden);
    setLocalReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, isHidden } : r)),
    );
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 p-6">
      {/* CỘT TRÁI: DANH SÁCH TOUR */}
      <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-base font-black text-slate-900">
            {t("tour.selectTourTitle")}
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-1">
            {t("tour.manageReviewsByTour")}
          </p>
        </div>

        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={tourSearch}
              onChange={(e) => setTourSearch(e.target.value)}
              placeholder={t("tour.searchTour")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-colors"
            />
            {tourSearch && (
              <button
                onClick={() => setTourSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          {isToursLoading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : tours.length > 0 ? (
            <div className="flex flex-col gap-2">
              {tours.map((tour) => (
                <button
                  key={tour.id}
                  onClick={() => setSelectedTourId(tour.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    selectedTourId === tour.id
                      ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500/20"
                      : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-start gap-3 overflow-hidden w-full">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selectedTourId === tour.id ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      <Map size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`truncate text-sm font-bold ${selectedTourId === tour.id ? "text-indigo-900" : "text-slate-700"}`}
                      >
                        {tour.name}
                      </h4>
                      <p className="text-xs text-slate-500">ID: #{tour.id}</p>
                    </div>
                  </div>
                  {selectedTourId === tour.id && (
                    <ChevronRight
                      size={16}
                      className="text-indigo-500 shrink-0 ml-2"
                    />
                  )}
                </button>
              ))}

              {hasMoreTours && !isToursLoading && (
                <button
                  onClick={() => setTourPage((p) => p + 1)}
                  className="w-full mt-2 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                >
                  {t("common.loadMore") || "Tải thêm"}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center p-5 text-sm text-slate-500">
              {t("tour.noToursFound")}
            </div>
          )}
        </div>
      </div>

      {/* CỘT PHẢI: QUẢN LÝ REVIEW */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-slate-900">
              {t("tour.tourReviews")}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">
              {t("tour.reviewsFound", { count: totalCount || 0 })}
            </p>
          </div>

          {/* 💥 BỘ LỌC SAO VÀ NGÀY */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={ratingFilter === null ? "" : ratingFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setReviewPage(1);
                  setLocalReviews([]);
                  setRatingFilter(val === "" ? null : Number(val));
                }}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none transition-colors hover:border-brand/50 cursor-pointer"
              >
                <option value="">
                  {t("common.all")} {t("tour.rating")}
                </option>
                <option value="5">5 {t("tour.stars") || "Stars"}</option>
                <option value="4">4 {t("tour.stars") || "Stars"}</option>
                <option value="3">3 {t("tour.stars") || "Stars"}</option>
                <option value="2">2 {t("tour.stars") || "Stars"}</option>
                <option value="1">1 {t("tour.star") || "Star"}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={dateSortOrder}
                onChange={(e) => {
                  setReviewPage(1);
                  setLocalReviews([]);
                  setDateSortOrder(e.target.value as "newest" | "oldest");
                }}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none transition-colors hover:border-brand/50 cursor-pointer"
              >
                <option value="newest">
                  {t("tour.newestFirst") || "Newest"}
                </option>
                <option value="oldest">
                  {t("tour.oldestFirst") || "Oldest"}
                </option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {selectedTourId && <TourSentimentBadge tourId={selectedTourId} />}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30 relative">
          {!selectedTourId ? (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
              <Map className="mb-3 h-12 w-12 opacity-50" />
              <p>{t("tour.selectTourForReviews")}</p>
            </div>
          ) : localReviews.length > 0 ? (
            <div className="flex flex-col gap-5 max-w-3xl mx-auto">
              {localReviews.map((review) => (
                <AdminReviewCard
                  key={review.id}
                  review={review}
                  onReply={handleReplyWrapper}
                  onEditReply={handleEditReplyWrapper}
                  onDeleteReply={handleRemoveReplyWrapper}
                  onToggleHide={handleToggleHideWrapper}
                />
              ))}

              {/* KHỐI NEO ĐỂ CUỘN TRANG */}
              <div ref={observerTarget} className="h-4 w-full" />

              {isReviewsLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              )}
            </div>
          ) : isReviewsLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-slate-400 text-center">
              <MessageSquare className="mb-3 h-12 w-12 opacity-50" />
              <h3 className="text-lg font-bold text-slate-900">
                {t("tour.noReviewsForTour")}
              </h3>
              <p className="text-sm mt-1">{t("tour.noReviewsForTourHint")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
