import React, { useState, useContext, useEffect, useRef } from 'react';
import { Heart, MessageCircle, X, Loader2, Flag, Send } from 'lucide-react';
import { AuthContext } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../contexts/ToastContext';
import { useAddComment, useUpdateComment, useDeleteComment } from '../hooks/useMoments';
import type { Moment } from '../types/moment.type';
import { useTranslation } from '../../../../contexts/LocaleContext';
import { reportContent } from '../services/momentService';
import { ShareTargetModal } from '../../chat/component/ShareTargetModal';

const SafeImage = ({ src, alt, className, fallbackText, fallbackClassName }: any) => {
  const [hasError, setHasError] = useState(false);
  if (hasError || !src) {
    return <div className={fallbackClassName}>{fallbackText}</div>;
  }
  return <img src={src} alt={alt} className={className} onError={() => setHasError(true)} loading="lazy" decoding="async" />;
};

interface MomentModalProps {
  moment: Moment;
  isOpen: boolean;
  onClose: () => void;
  isLiked: boolean;
  likeCount: number;
  onToggleLike: () => void;
  onReportSuccess?: (momentId: number) => void;
}

export const MomentModal: React.FC<MomentModalProps> = ({ 
  moment, isOpen, onClose, isLiked, likeCount, onToggleLike, onReportSuccess
}) => {
  const { user } = useContext(AuthContext);
  const { mutate: addComment, isPending: isAdding } = useAddComment();
  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment();
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment();
  const { warning, error, success } = useToast();
  const { t } = useTranslation();
  
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleSendReport = async () => {
    setIsSubmittingReport(true);
    try {
      await reportContent('Moment', moment.id, reportReason as any, reportDetails.trim() || undefined);
      success("Đã gửi báo cáo vi phạm thành công");
      setIsReportModalOpen(false);
      onReportSuccess?.(moment.id);
      onClose(); // đóng modal chi tiết để bài ẩn đi
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Gửi báo cáo thất bại.";
      error(msg);
    } finally {
      setIsSubmittingReport(false);
    }
  };
  
  const allComments = moment.comments || (moment as any).momentComments || [];
  const [visibleCount, setVisibleCount] = useState(10);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.id || user?.Id || user?.nameid || user?.sub || null;
  const momentUserId = (moment as any).userId ?? (moment as any).UserId ?? moment.user?.id ?? (moment as any).User?.id ?? (moment as any).User?.Id;
  const isOwner = currentUserId !== null && momentUserId !== undefined && String(momentUserId) === String(currentUserId);
  
  // Aggressively check all possible avatar properties from AuthContext
  const currentUserAvatar = user?.avatarUrl || user?.AvatarUrl || (user as any)?.avatar || (user as any)?.picture;
  const momentUserAvatar = moment.user?.avatarUrl ?? (moment.user as any)?.AvatarUrl ?? (moment as any).User?.avatarUrl ?? (moment as any).User?.AvatarUrl;
  const displayAvatar = isOwner ? (currentUserAvatar || momentUserAvatar) : momentUserAvatar;

  useEffect(() => {
    if (!isOpen) {
      setVisibleCount(10);
      setEditingCommentId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isAdding) return;
    if (!user) { warning(t("social.pleaseLogInToContinue")); return; }

    addComment(
      { momentId: moment.id, userId: Number(currentUserId), content: newComment.trim() },
      { 
        onSuccess: () => {
          setNewComment('');
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || "Không thể gửi bình luận.";
          error(msg);
        }
      }
    );
  };

  const handleSaveEdit = (commentId: number) => {
    if (!editCommentText.trim() || isUpdating) return;
    updateComment(
      { commentId, userId: Number(currentUserId), content: editCommentText.trim() },
      { 
        onSuccess: () => {
          setEditingCommentId(null);
        },
        onError: () => error(t("social.momentUpdateCommentFailed"))
      }
    );
  };

  const handleDeleteComment = (commentId: number) => {
    if (isDeleting) return;
    if (window.confirm(t("social.momentConfirmDeleteComment"))) {
      deleteComment(
        { commentId, userId: Number(currentUserId) },
        {
          onError: () => error(t("social.momentDeleteCommentFailed"))
        }
      );
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollHeight - scrollTop - clientHeight < 50) {
        if (visibleCount < allComments.length) {
          setVisibleCount(prev => prev + 10);
        }
      }
    }
  };

  const userFullName = moment.user?.fullName ?? (moment as any).User?.fullName ?? (moment as any).User?.FullName ?? t("tour.anonymousCustomer");
  const visibleComments = allComments.slice(0, visibleCount);

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8"
      onClick={(e) => {
        // Đóng modal khi click ra ngoài vùng xám (backdrop)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 z-[10000] flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/75 hover:text-slate-200 p-2.5 border border-white/10 shadow-lg transition-all active:scale-95 cursor-pointer"
        title="Đóng"
      >
        <X className="h-6 w-6" />
      </button>
 
      <div className="flex flex-col md:flex-row w-full max-w-5xl h-[90vh] md:h-[80vh] bg-white rounded-md overflow-hidden shadow-2xl">
        <div className="flex-1 bg-black flex items-center justify-center h-64 md:h-full border-r border-slate-200">
          <img 
            src={moment.imageUrl} 
            alt={t("social.momentImageAlt")} 
            loading="lazy" 
            decoding="async"
            className="w-full h-full object-contain" 
          />
        </div>
 
        <div className="w-full md:w-[400px] flex flex-col h-full bg-white">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 !rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                <SafeImage src={displayAvatar} alt="Avatar" className="h-full w-full object-cover" fallbackClassName="h-full w-full flex items-center justify-center font-bold text-xs" fallbackText={userFullName.charAt(0)} />
              </div>
              <span className="text-sm font-bold text-slate-900">{userFullName}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              {!isOwner && (
                <button 
                  onClick={() => {
                    setReportReason('Spam');
                    setReportDetails('');
                    setIsReportModalOpen(true);
                  }} 
                  className="text-slate-400 hover:text-amber-500 transition-colors p-2 cursor-pointer" 
                  title="Báo cáo vi phạm"
                >
                  <Flag className="h-5 w-5" />
                </button>
              )}
              {/* Nút đóng phụ trực quan ngay trong header */}
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 transition-colors p-2 cursor-pointer"
                title="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 custom-scrollbar"
          >
            {moment.caption && (
               <div className="flex gap-3 mb-4 text-sm">
               <div className="h-8 w-8 shrink-0 !rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                   <SafeImage src={displayAvatar} alt="Avatar" className="h-full w-full object-cover" fallbackClassName="h-full w-full flex items-center justify-center font-bold text-xs" fallbackText={userFullName.charAt(0)} />
                 </div>
                 <div className="leading-relaxed">
                   <span className="font-bold mr-2">{userFullName}</span>
                   <span className="text-slate-800">{moment.caption}</span>
                 </div>
               </div>
            )}

            <div className="flex flex-col gap-4 mt-2">
              {visibleComments.map((c: any) => {
                const isOwner = String(c.userId || c.user?.id) === String(currentUserId);
                const cAvatar = (isOwner && currentUserAvatar) ? currentUserAvatar : c.user?.avatarUrl;
                
                return (
                  <div key={c.id} className="flex gap-3 text-sm">
                    <div className="h-8 w-8 shrink-0 !rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <SafeImage src={cAvatar} alt="Avatar" className="h-full w-full object-cover" fallbackClassName="h-full w-full flex items-center justify-center font-bold text-xs bg-slate-200" fallbackText={(c.user?.fullName || "A").charAt(0)} />
                    </div>
                    <div className="flex-1 leading-relaxed">
                      <span className="font-bold mr-2">{c.user?.fullName || t("tour.anonymousCustomer")}</span>
                      
                      {editingCommentId === c.id ? (
                        <div className="mt-1 flex flex-col gap-2">
                          <input 
                            type="text" 
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="w-full border-b border-slate-300 outline-none text-sm py-1"
                            autoFocus
                          />
                          <div className="flex items-center gap-3">
                            <button disabled={isUpdating} onClick={() => handleSaveEdit(c.id)} className="text-xs font-semibold text-brand hover:text-brand-hover">{t("social.momentSave")}</button>
                            <button disabled={isUpdating} onClick={() => setEditingCommentId(null)} className="text-xs text-slate-500 hover:text-slate-700">{t("common.cancel")}</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="text-slate-700">{c.text || c.comment}</span>
                          {isOwner && (
                            <div className="flex items-center gap-3 mt-1">
                              <button 
                                onClick={() => {
                                  setEditingCommentId(c.id);
                                  setEditCommentText(c.text || c.comment);
                                }}
                                className="text-[11px] font-semibold text-slate-400 hover:text-brand"
                              >
                                {t("social.momentEdit")}
                              </button>
                              <button 
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-[11px] font-semibold text-slate-400 hover:text-red-500"
                              >
                                {t("social.momentDelete")}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {visibleCount < allComments.length && (
                <div className="text-center text-xs text-slate-400 py-2 font-medium cursor-pointer" onClick={() => setVisibleCount(prev => prev + 10)}>
                  {t("social.momentLoadMoreComments")}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 shrink-0">
            <div className="p-4">
              <div className="flex items-center gap-4 mb-2">
                <button onClick={onToggleLike}>
                  <Heart className={`h-7 w-7 transition-transform active:scale-75 ${isLiked ? "fill-rose-500 text-rose-500" : "text-slate-900"}`} />
                </button>
                <MessageCircle className="h-7 w-7 text-slate-900" />
                <button 
                  onClick={() => setShowShareModal(true)} 
                  className="text-slate-900 hover:text-brand transition-colors cursor-pointer"
                  title="Chia sẻ qua Tin nhắn"
                >
                  <Send className="h-6 w-6 -rotate-45" />
                </button>
              </div>
              <div className="text-sm font-bold text-slate-900">{t("social.momentLikesCount", { count: likeCount })}</div>
            </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3 border-t border-slate-100">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t("social.momentWriteComment")}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              <button 
                type="submit" 
                disabled={!newComment.trim() || isAdding}
                className="flex items-center px-4 py-1.5 rounded-full text-sm font-semibold text-white bg-brand hover:bg-brand-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t("social.momentPosting")}
                  </>
                ) : (
                  t("social.momentPostBtn")
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Báo cáo Khoảnh khắc</h3>
            <p className="text-xs text-slate-500 mb-4">Chọn lý do báo cáo vi phạm tiêu chuẩn cộng đồng.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Lý do</label>
                <select 
                  value={reportReason} 
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-brand"
                >
                  <option value="Spam">Spam (Rác / Quảng cáo)</option>
                  <option value="Hate Speech">Ngôn từ kích động thù hận</option>
                  <option value="Harassment">Quấy rối / Đe dọa</option>
                  <option value="Violence">Bạo lực / Máu me</option>
                  <option value="Other">Lý do khác</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chi tiết (Không bắt buộc)</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Nhập thêm chi tiết vi phạm..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-800 h-20 focus:outline-none focus:border-brand resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsReportModalOpen(false)}
                disabled={isSubmittingReport}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSendReport}
                disabled={isSubmittingReport}
                className="flex-1 bg-brand hover:bg-brand-hover text-white text-sm font-semibold py-2 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmittingReport ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Gửi...
                  </>
                ) : (
                  "Gửi báo cáo"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <ShareTargetModal
          onClose={() => setShowShareModal(false)}
          shareContent={`[MomentShare:${JSON.stringify({ id: moment.id, imageUrl: moment.imageUrl, caption: moment.caption })}]`}
          successMessage="Đã chia sẻ khoảnh khắc qua tin nhắn!"
        />
      )}
    </div>
  );
};