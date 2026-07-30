import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Flag, Trash2, MoreVertical } from 'lucide-react';
import { AuthContext } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../contexts/ToastContext';
import { useAddComment, useDeleteComment } from '../hooks/useMoments';
import { useTranslation } from '../../../../contexts/LocaleContext';
import { reportContent } from '../services/momentService';
import { ConfirmDialog } from '../../../../components/dashboard/ConfirmDialog';

// Avatar nho cho comment: hien anh, fallback ve chu cai dau.
const CommentAvatar = ({ src, name }: { src?: string | null; name: string }) => {
  const [err, setErr] = useState(false);
  const showImg = src && !err;
  return (
    <div className="h-7 w-7 shrink-0 !rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
      {showImg ? (
        <img
          src={src as string}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setErr(true)}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="font-bold text-[11px] text-slate-500 dark:text-slate-300">
          {(name || 'A').charAt(0)}
        </span>
      )}
    </div>
  );
};

export const CommentSection = ({ momentId, comments }: any) => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { mutate: addComment, isPending } = useAddComment();
  const { mutate: deleteComment } = useDeleteComment();
  const [newComment, setNewComment] = useState('');
  const { warning, success, error } = useToast();

  const [reportingCommentId, setReportingCommentId] = useState<number | null>(null);
  const [openMenuCommentId, setOpenMenuCommentId] = useState<number | null>(null);
  const [commentReason, setCommentReason] = useState('Spam');
  const [commentDetails, setCommentDetails] = useState('');
  const [isSubmittingCommentReport, setIsSubmittingCommentReport] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [commentIdToDelete, setCommentIdToDelete] = useState<number | null>(null);

  const currentUserAvatar =
    (user as any)?.avatarUrl || (user as any)?.AvatarUrl ||
    (user as any)?.avatar || (user as any)?.picture;
  const currentUserId = user ? (user.id || (user as any).Id) : null;

  const requestDeleteComment = (commentId: number) => {
    setCommentIdToDelete(commentId);
    setIsDeleteConfirmOpen(true);
  };

  const executeDeleteComment = () => {
    if (commentIdToDelete === null) return;
    deleteComment(
      { commentId: commentIdToDelete, userId: Number(currentUserId) },
      {
        onSuccess: () => {
          success("Comment deleted successfully");
          setIsDeleteConfirmOpen(false);
          setCommentIdToDelete(null);
        },
        onError: () => {
          error("Failed to delete comment");
          setIsDeleteConfirmOpen(false);
          setCommentIdToDelete(null);
        }
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isPending) return;
    if (!user) { warning("Please log in to comment"); return; }

    addComment(
      { momentId, userId: Number(currentUserId), content: newComment.trim() },
      { 
        onSuccess: () => setNewComment(''),
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || "Failed to submit comment.";
          error(msg);
        }
      }
    );
  };

  const handleSendCommentReport = async () => {
    if (!reportingCommentId) return;
    setIsSubmittingCommentReport(true);
    try {
      await reportContent('Comment', reportingCommentId, commentReason as any, commentDetails.trim() || undefined);
      success("Đã gửi báo cáo thành công. Chúng tôi sẽ xem xét và xử lý trong thời gian sớm nhất.");
      setReportingCommentId(null);
    } catch (err: any) {
      const msg: string = err?.response?.data?.message || err?.message || "Failed to submit report.";
      if (msg.includes("đã báo cáo") || msg.toLowerCase().includes("already reported")) {
        warning("Bạn đã báo cáo bình luận này rồi. Vui lòng chờ kiểm duyệt viên xem xét.");
        setReportingCommentId(null);
      } else {
        error(msg);
      }
    } finally {
      setIsSubmittingCommentReport(false);
    }
  };

  return (
    <div className="flex flex-col px-4 pt-2">
      <div className="flex flex-col gap-2 mb-2">
        {comments
          .map((c: any) => {
            const fullName =
              c.user?.fullName || c.userName || t("common.anonymous");
            const isOwner =
              String(c.userId || c.user?.id) === String(currentUserId);
            const avatar =
              (isOwner && currentUserAvatar) ||
              c.user?.avatarUrl || c.avatarUrl;
            const commentUserId = c.userId || c.user?.id;
            return (
              <div key={c.id} className="flex items-center justify-between gap-2 text-sm group relative">
                <div className="flex items-start gap-2">
                  {commentUserId ? (
                    <Link to={`/social/profile/${commentUserId}`} className="hover:opacity-85 transition-opacity shrink-0">
                      <CommentAvatar src={avatar} name={fullName} />
                    </Link>
                  ) : (
                    <CommentAvatar src={avatar} name={fullName} />
                  )}
                  <div className="leading-relaxed pr-6">
                    {commentUserId ? (
                      <Link to={`/social/profile/${commentUserId}`} className="font-bold mr-2 hover:underline hover:text-brand transition-all text-slate-900 dark:text-white">
                        {fullName}
                      </Link>
                    ) : (
                      <span className="font-bold mr-2 text-slate-900 dark:text-white">{fullName}</span>
                    )}
                    <span className="text-slate-700 dark:text-slate-300">{c.text || c.comment}</span>
                  </div>
                </div>
                
                <div className="relative shrink-0">
                  <button
                    onClick={() => setOpenMenuCommentId(openMenuCommentId === c.id ? null : c.id)}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Options"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  
                  {openMenuCommentId === c.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenMenuCommentId(null)} />
                      <div className="absolute right-0 mt-1 w-28 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-50 text-left animate-in fade-in slide-in-from-top-1 duration-100">
                        {isOwner ? (
                          <button
                            onClick={() => {
                              setOpenMenuCommentId(null);
                              requestDeleteComment(c.id);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setOpenMenuCommentId(null);
                              setCommentReason('Spam');
                              setCommentDetails('');
                              setReportingCommentId(c.id);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                          >
                            <Flag className="w-3 h-3" />
                            Report
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 py-2 border-t border-slate-100 dark:border-slate-800">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t("social.momentWriteComment")}
          className="flex-1 bg-transparent text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        <button 
          type="submit" 
          disabled={!newComment.trim() || isPending} 
          className="flex items-center px-4 py-1.5 rounded-full text-sm font-semibold text-white bg-brand hover:bg-brand-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {t("social.momentPosting")}
            </>
          ) : (
            t("social.momentSubmitComment")
          )}
        </button>
      </form>

      {reportingCommentId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t("social.reportComment", "Report Comment")}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t("social.reportCommentDesc", "Select a reason for reporting this comment for community standards violations.")}</p>
            
            {/* Reported Comment Content & Author Preview */}
            {(() => {
              const reportedComment = comments?.find((c: any) => c.id === reportingCommentId);
              if (!reportedComment) return null;
              const authorName = reportedComment.user?.fullName || reportedComment.userName || t("common.anonymous", "Anonymous");
              const commentText = reportedComment.text || reportedComment.comment || "";
              return (
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3 mb-4 flex items-start gap-2.5 shadow-inner">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                      <span>💬</span> {authorName}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-3 italic">
                      "{commentText}"
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{t("social.reportReason", "Reason")}</label>
                <select 
                  value={commentReason} 
                  onChange={(e) => setCommentReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand"
                >
                  <option value="Spam" className="dark:bg-slate-800">{t("social.reportSpam", "Spam (Garbage / Ads)")}</option>
                  <option value="Hate Speech" className="dark:bg-slate-800">{t("social.reportHateSpeech", "Hate Speech")}</option>
                  <option value="Harassment" className="dark:bg-slate-800">{t("social.reportHarassment", "Harassment / Threat")}</option>
                  <option value="Violence" className="dark:bg-slate-800">{t("social.reportViolence", "Violence / Gore")}</option>
                  <option value="Other" className="dark:bg-slate-800">{t("social.reportOther", "Other Reason")}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{t("social.reportDetails", "Details (Optional)")}</label>
                <textarea
                  value={commentDetails}
                  onChange={(e) => setCommentDetails(e.target.value)}
                  placeholder={t("social.reportDetailsPlaceholder", "Enter more details about the violation...")}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-800 dark:text-slate-100 h-20 focus:outline-none focus:border-brand resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setReportingCommentId(null)}
                disabled={isSubmittingCommentReport}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {t("social.reportCancel", "Cancel")}
              </button>
              <button
                onClick={handleSendCommentReport}
                disabled={isSubmittingCommentReport}
                className="flex-1 bg-brand hover:bg-brand-hover text-white text-sm font-semibold py-2 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingCommentReport ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t("social.reportSending", "Sending...")}
                  </>
                ) : (
                  t("social.reportSubmit", "Submit Report")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setCommentIdToDelete(null);
        }}
        onConfirm={executeDeleteComment}
        title={t("social.momentDeleteCommentTitle")}
        message={t("social.momentConfirmDeleteComment")}
        variant="warning"
      />
    </div>
  );
};
