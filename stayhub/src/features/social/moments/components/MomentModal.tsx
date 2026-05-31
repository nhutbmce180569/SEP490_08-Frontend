import React, { useState, useContext, useEffect, useRef } from 'react';
import { Heart, MessageCircle, X, Loader2 } from 'lucide-react';
import { AuthContext } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../contexts/ToastContext';
import { useAddComment, useUpdateComment, useDeleteComment } from '../hooks/useMoments';
import type { Moment } from '../types/moment.type';

interface MomentModalProps {
  moment: Moment;
  isOpen: boolean;
  onClose: () => void;
  isLiked: boolean;
  likeCount: number;
  onToggleLike: () => void;
}

export const MomentModal: React.FC<MomentModalProps> = ({ 
  moment, isOpen, onClose, isLiked, likeCount, onToggleLike 
}) => {
  const { user } = useContext(AuthContext);
  const { mutate: addComment, isPending: isAdding } = useAddComment();
  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment();
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment();
  const { warning, success, error } = useToast();
  
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  
  const allComments = moment.comments || (moment as any).momentComments || [];
  const [visibleCount, setVisibleCount] = useState(10);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentUserId = user ? (user.id || (user as any).Id) : null;
  const momentUserId = (moment as any).userId || moment.user?.id || (moment as any).User?.Id;
  const isOwner = String(momentUserId) === String(currentUserId);
  
  // Aggressively check all possible avatar properties from AuthContext
  const currentUserAvatar = (user as any)?.avatarUrl || (user as any)?.AvatarUrl || (user as any)?.avatar || (user as any)?.picture;
  const momentUserAvatar = moment.user?.avatarUrl || (moment.user as any)?.AvatarUrl;
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
    if (!user) { warning("Please log in to continue"); return; }

    addComment(
      { momentId: moment.id, userId: Number(currentUserId), content: newComment.trim() },
      { onSuccess: () => {
          setNewComment('');
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }}
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
        onError: () => error("Failed to update comment.")
      }
    );
  };

  const handleDeleteComment = (commentId: number) => {
    if (isDeleting) return;
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteComment(
        { commentId, userId: Number(currentUserId) },
        {
          onError: () => error("Failed to delete comment.")
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

  const userFullName = moment.user?.fullName || "Anonymous";
  const visibleComments = allComments.slice(0, visibleCount);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <button onClick={onClose} className="absolute top-6 right-6 z-[10000] text-white hover:text-slate-300 p-2">
        <X className="h-8 w-8" />
      </button>

      <div className="flex flex-col md:flex-row w-full max-w-5xl h-[90vh] md:h-[80vh] bg-white rounded-md overflow-hidden shadow-2xl">
        <div className="flex-1 bg-black flex items-center justify-center h-64 md:h-full border-r border-slate-200">
          <img 
            src={moment.imageUrl} 
            alt="Moment" 
            loading="lazy" 
            decoding="async"
            className="w-full h-full object-contain" 
          />
        </div>

        <div className="w-full md:w-[400px] flex flex-col h-full bg-white">
          <div className="flex items-center gap-3 p-4 border-b border-slate-100 shrink-0">
            <div className="h-8 w-8 !rounded-full overflow-hidden bg-slate-100 border border-slate-200">
              {displayAvatar ? (
                <img src={displayAvatar} alt="Avatar" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center font-bold text-xs">{userFullName.charAt(0)}</div>
              )}
            </div>
            <span className="text-sm font-bold text-slate-900">{userFullName}</span>
          </div>

          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 custom-scrollbar"
          >
            {moment.caption && (
               <div className="flex gap-3 mb-4 text-sm">
               <div className="h-8 w-8 shrink-0 !rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                   {displayAvatar ? <img src={displayAvatar} alt="Avatar" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : null}
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
                      {cAvatar ? <img src={cAvatar} alt="Avatar" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center font-bold text-xs bg-slate-200">{(c.user?.fullName || "A").charAt(0)}</div>}
                    </div>
                    <div className="flex-1 leading-relaxed">
                      <span className="font-bold mr-2">{c.user?.fullName || "Anonymous"}</span>
                      
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
                            <button disabled={isUpdating} onClick={() => handleSaveEdit(c.id)} className="text-xs font-semibold text-blue-500 hover:text-blue-700">Save</button>
                            <button disabled={isUpdating} onClick={() => setEditingCommentId(null)} className="text-xs text-slate-500 hover:text-slate-700">Cancel</button>
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
                                className="text-[11px] font-semibold text-slate-400 hover:text-blue-500"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-[11px] font-semibold text-slate-400 hover:text-red-500"
                              >
                                Delete
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
                  Load more comments...
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
              </div>
              <div className="text-sm font-bold text-slate-900">{likeCount} likes</div>
            </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3 border-t border-slate-100">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              <button 
                type="submit" 
                disabled={!newComment.trim() || isAdding}
                className="flex items-center px-4 py-1.5 rounded-full text-sm font-semibold text-white bg-[#0068E0] hover:bg-[#0058D0] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};