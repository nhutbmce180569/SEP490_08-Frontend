import React, { useState, useContext } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthContext } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../contexts/ToastContext';
import { useAddComment } from '../hooks/useMoments';
import { useTranslation } from '../../../../contexts/LocaleContext';

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
  const { warning } = useToast();

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
      { onSuccess: () => setNewComment('') }
    );
  };

  return (
    <div className="flex flex-col px-4 pt-2">
      <div className="flex flex-col gap-2 mb-2">
        {comments.map((c: any) => {
          const fullName =
            c.user?.fullName || c.userName || t("common.anonymous");
          const isOwner =
            String(c.userId || c.user?.id) === String(currentUserId);
          const avatar =
            (isOwner && currentUserAvatar) ||
            c.user?.avatarUrl || c.avatarUrl;
          return (
            <div key={c.id} className="flex items-start gap-2 text-sm">
              <CommentAvatar src={avatar} name={fullName} />
              <div className="leading-relaxed">
                <span className="font-bold mr-2">{fullName}</span>
                <span className="text-slate-700">{c.text || c.comment}</span>
              </div>
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
    </div>
  );
};
