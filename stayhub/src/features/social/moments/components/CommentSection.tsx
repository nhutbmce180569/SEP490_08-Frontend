import React, { useState, useContext } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthContext } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../contexts/ToastContext';
import { useAddComment } from '../hooks/useMoments';

export const CommentSection = ({ momentId, comments }: any) => {
  const { user } = useContext(AuthContext);
  const { mutate: addComment, isPending } = useAddComment();
  const [newComment, setNewComment] = useState('');
  const { warning } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isPending) return;
    if (!user) { warning("Please log in to continue"); return; }

    const currentUserId = user.id || (user as any).Id;
    addComment(
      { momentId, userId: Number(currentUserId), content: newComment.trim() },
      { onSuccess: () => setNewComment('') }
    );
  };

  return (
    <div className="flex flex-col px-4 pt-2">
      <div className="flex flex-col gap-1.5 mb-2">
        {comments.map((c: any) => (
          <div key={c.id} className="text-sm">
            <span className="font-bold mr-2">{c.user?.fullName || "Anonymous"}</span>
            <span className="text-slate-700">{c.text || c.comment}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 py-2 border-t border-slate-100">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        <button 
          type="submit" 
          disabled={!newComment.trim() || isPending} 
          className="flex items-center px-4 py-1.5 rounded-full text-sm font-semibold text-white bg-[#EB662B] hover:bg-[#d55821] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
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
  );
};