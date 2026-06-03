import React, { useState, useEffect, useContext } from "react";
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
  ShieldAlert
} from "lucide-react";
import { useReview } from "../hooks/useReview"; 
import { ActionButton } from "../../../components/dashboard/ActionButton"; 
import { ConfirmDialog } from "../../../components/dashboard/ConfirmDialog";
import { useToast } from "../../../contexts/ToastContext"; 
import { AuthContext } from "../../../contexts/AuthContext";
import type { Review } from "../types/review";
import { getTours } from "../services/tour.service";
import { useTranslation } from "../../../contexts/LocaleContext";


const formatReviewDate = (date?: string | null) =>
  date
    ? new Date(date).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

// ==========================================
// COMPONENT 1: CARD QUẢN LÝ TỪNG REVIEW
// ==========================================
const AdminReviewCard: React.FC<{
  review: Review;
  onReply: (reviewId: number, text: string) => Promise<any>;
  onEditReply: (reviewId: number, replyId: number, text: string) => Promise<any>;
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

  const existingReply = review.replies && review.replies.length > 0 ? review.replies[0] : null;
  
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
    setConfirmDialog({ open: true, action: "toggleHide", nextHideStatus: !review.isHidden });
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
        showSuccess(newStatus ? t("tour.reviewHidden") : t("tour.reviewVisible"));
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsSubmitting(false);
      closeConfirmDialog();
    }
  };

  // Tạo chữ cái đầu tiên của tên để làm Avatar dự phòng
  const reviewerName = review.customerName || t("tour.anonymousCustomer");
  const initials = reviewerName.charAt(0).toUpperCase();

  return (
    <div className={`overflow-hidden rounded-2xl border transition-all ${review.isHidden ? "border-rose-200 bg-rose-50/30" : "border-slate-200 bg-white"}`}>
      <div className="p-5">
        
        {/* HEADER REVIEW CÓ AVATAR VÀ TÊN */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Cục Avatar */}
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg uppercase border border-indigo-200">
              {review.customerAvatar ? (
                <img 
                  src={review.customerAvatar} 
                  alt={reviewerName} 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerText = initials;
                  }}
                />
              ) : (
                initials
              )}
            </div>
            
            {/* Tên và Đánh giá */}
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
                    <Star key={i} className={`h-3.5 w-3.5 ${i < (review.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                  ))}
                </div>
                {review.createdAt && (
                  <span className="text-xs font-medium text-slate-400">• {formatReviewDate(review.createdAt)}</span>
                )}
              </div>
            </div>
          </div>

          <ActionButton 
            variant="secondary" 
            onClick={handleToggleHide} 
            disabled={isSubmitting}
            className={`h-8 w-8 ${review.isHidden ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" : "text-rose-500 hover:bg-rose-50 hover:text-rose-600"}`}
            title={review.isHidden ? t("tour.unhideReview") : t("tour.hideReview")}
          >
            {review.isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
          </ActionButton>
        </div>

        <p className="text-sm leading-relaxed text-slate-700 pl-[56px]">{review.comment}</p>

        {/* KHU VỰC TRẢ LỜI */}
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
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerText = (existingReply.userName || 'S').charAt(0).toUpperCase();
                        }}
                      />
                    ) : (
                      (existingReply.userName || 'S').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-slate-900">
                        {String(existingReply.userId) === String(currentUserId) ? t("tour.yourReply") : existingReply.userName || t("tour.staff")}
                      </h5>
                      {existingReply.createdAt && (
                        <span className="text-xs font-medium text-slate-400">• {formatReviewDate(existingReply.createdAt)}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{t("tour.replyToCustomer")}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-indigo-600" title={t("tour.editReply")}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={handleDeleteReply} className="text-slate-400 hover:text-rose-600" title={t("tour.deleteReply")}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{existingReply.content}</p>
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
                <ActionButton variant="secondary" onClick={() => { setIsReplying(false); setIsEditing(false); setReplyText(existingReply?.content || ""); }} className="px-4 py-1.5 text-xs">
                  {t("common.cancel")}
                </ActionButton>
                <ActionButton variant="primary" onClick={handleSubmitReply} disabled={isSubmitting || !replyText.trim()} className="px-4 py-1.5 text-xs gap-1.5">
                  {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquare size={14} />}
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
        variant={confirmDialog.action === "deleteReply" ? "warning" : "warning"}
      />
    </div>
  );
};


// ==========================================
// COMPONENT 2: TRANG QUẢN LÝ CHÍNH
// ==========================================
export const DashboardReviewManager: React.FC = () => {
  const { t } = useTranslation();
  const [tours, setTours] = useState<any[]>([]);
  const [isToursLoading, setIsToursLoading] = useState(true);
  const [selectedTourId, setSelectedTourId] = useState<number | null>(null);

  const { 
    reviews, 
    isLoading: isReviewsLoading, 
    fetchReviewsForAdmin, 
    replyToReview,
    editReply,
    removeReply,
    toggleHideReview
  } = useReview();

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const res = await getTours(1, 50); 
        const tourList = res.data; 
        setTours(tourList);
        
        if (tourList.length > 0) {
          setSelectedTourId(tourList[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch tours", error);
      } finally {
        setIsToursLoading(false);
      }
    };
    
    fetchTours();
  }, []);

  // Fetch Reviews mỗi khi chọn Tour khác
  useEffect(() => {
    if (selectedTourId) {
      if (fetchReviewsForAdmin) {
        fetchReviewsForAdmin(selectedTourId);
      } else {
        console.error("LỖI: Bạn chưa khai báo hoặc return hàm fetchReviewsForAdmin bên trong file useReview.ts!");
      }
    }
  }, [selectedTourId, fetchReviewsForAdmin]);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 p-6">
      <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-base font-black text-slate-900">{t("tour.selectTourTitle")}</h2>
          <p className="text-xs font-medium text-slate-500 mt-1">{t("tour.manageReviewsByTour")}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          {isToursLoading ? (
            <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
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
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selectedTourId === tour.id ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <Map size={18} />
                    </div>
                    <div className="truncate">
                      <h4 className={`truncate text-sm font-bold ${selectedTourId === tour.id ? "text-indigo-900" : "text-slate-700"}`}>
                        {tour.name}
                      </h4>
                      <p className="text-xs text-slate-500">ID: #{tour.id}</p>
                    </div>
                  </div>
                  {selectedTourId === tour.id && <ChevronRight size={16} className="text-indigo-500 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center p-5 text-sm text-slate-500">{t("tour.noToursFound")}</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">{t("tour.tourReviews")}</h2>
            <p className="text-xs font-medium text-slate-500 mt-1">
              {t("tour.reviewsFound", { count: reviews?.length || 0 })}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30">
          {!selectedTourId ? (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
              <Map className="mb-3 h-12 w-12 opacity-50" />
              <p>{t("tour.selectTourForReviews")}</p>
            </div>
          ) : isReviewsLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : (reviews?.length || 0) > 0 ? (
            <div className="flex flex-col gap-5 max-w-3xl mx-auto">
              {(reviews || []).map((review) => (
                <AdminReviewCard 
                  key={review.id} 
                  review={review}
                  onReply={replyToReview}
                  onEditReply={editReply}
                  onDeleteReply={removeReply}
                  onToggleHide={toggleHideReview}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-slate-400 text-center">
              <MessageSquare className="mb-3 h-12 w-12 opacity-50" />
              <h3 className="text-lg font-bold text-slate-900">{t("tour.noReviewsForTour")}</h3>
              <p className="text-sm mt-1">{t("tour.noReviewsForTourHint")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};