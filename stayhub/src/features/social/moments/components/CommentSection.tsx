import React, { useState, useContext } from 'react';
import { Loader2, Flag } from 'lucide-react';
import { AuthContext } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../contexts/ToastContext';
import { useAddComment } from '../hooks/useMoments';
import { useTranslation } from '../../../../contexts/LocaleContext';
import { reportContent } from '../services/momentService';

// Avatar nho cho comment: hien anh, fallback ve chu cai dau.
const CommentAvatar = ({ src, name }: { src?: string | null; name: string }) => {
  const [err, setErr] = useState(false);
  const showImg = src && !err;
  return (
    <div className="h-7 w-7 shrink-0 !rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
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
        <span className="font-bold text-[11px] text-slate-500">
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
  const [newComment, setNewComment] = useState('');
  const { warning, success, error } = useToast();

  const [hiddenCommentIds, setHiddenCommentIds] = useState<number[]>([]);
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(null);
  const [commentReason, setCommentReason] = useState('Spam');
  const [commentDetails, setCommentDetails] = useState('');
  const [isSubmittingCommentReport, setIsSubmittingCommentReport] = useState(false);

  const currentUserAvatar =
    (user as any)?.avatarUrl || (user as any)?.AvatarUrl ||
    (user as any)?.avatar || (user as any)?.picture;
  const currentUserId = user ? (user.id || (user as any).Id) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isPending) return;
    if (!user) { warning(t("social.pleaseLogIn")); return; }

    addComment(
      { momentId, userId: Number(currentUserId), content: newComment.trim() },
      { 
        onSuccess: () => setNewComment(''),
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || "Không thể gửi bình luận.";
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
      success("Đã gửi báo cáo vi phạm bình luận thành công");
      setHiddenCommentIds(prev => [...prev, reportingCommentId]);
      setReportingCommentId(null);
    } catch (err: any) {
      error(err.message || "Gửi báo cáo thất bại.");
    } finally {
      setIsSubmittingCommentReport(false);
    }
  };

  return (
    <div className="flex flex-col px-4 pt-2">
      <div className="flex flex-col gap-2 mb-2">
        {comments
          .filter((c: any) => !hiddenCommentIds.includes(c.id))
          .map((c: any) => {
            const fullName =
              c.user?.fullName || c.userName || t("common.anonymous");
            const isOwner =
              String(c.userId || c.user?.id) === String(currentUserId);
            const avatar =
              (isOwner && currentUserAvatar) ||
              c.user?.avatarUrl || c.avatarUrl;
            return (
              <div key={c.id} className="flex items-center justify-between gap-2 text-sm group">
                <div className="flex items-start gap-2">
                  <CommentAvatar src={avatar} name={fullName} />
                  <div className="leading-relaxed">
                    <span className="font-bold mr-2">{fullName}</span>
                    <span className="text-slate-700">{c.text || c.comment}</span>
                  </div>
                </div>
                {!isOwner && (
                  <button
                    onClick={() => {
                      setCommentReason('Spam');
                      setCommentDetails('');
                      setReportingCommentId(c.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-500 transition-all p-1"
                    title="Báo cáo vi phạm"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 py-2 border-t border-slate-100">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t("social.momentWriteComment")}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
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
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Báo cáo bình luận</h3>
            <p className="text-xs text-slate-500 mb-4">Chọn lý do báo cáo vi phạm tiêu chuẩn cộng đồng.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Lý do</label>
                <select 
                  value={commentReason} 
                  onChange={(e) => setCommentReason(e.target.value)}
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
                  value={commentDetails}
                  onChange={(e) => setCommentDetails(e.target.value)}
                  placeholder="Nhập thêm chi tiết vi phạm..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-800 h-20 focus:outline-none focus:border-brand resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setReportingCommentId(null)}
                disabled={isSubmittingCommentReport}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSendCommentReport}
                disabled={isSubmittingCommentReport}
                className="flex-1 bg-brand hover:bg-brand-hover text-white text-sm font-semibold py-2 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmittingCommentReport ? (
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
    </div>
  );
};
