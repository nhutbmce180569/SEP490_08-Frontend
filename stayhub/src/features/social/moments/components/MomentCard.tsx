import React, { useContext, useState, useEffect, useCallback } from "react";
import { Heart, MessageCircle, Trash2, Globe, Users, Lock } from "lucide-react";
import { AuthContext } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useToggleReaction, useDeleteMoment } from "../hooks/useMoments";
import { MomentModal } from "./MomentModal";
import type { Moment } from "../types/moment.type";

interface MomentCardProps { moment: Moment; }

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  return date.toLocaleDateString('en-US');
};

const MomentCardBase: React.FC<MomentCardProps> = ({ moment }) => {
  const { user } = useContext(AuthContext);
  const { mutate: toggleReaction, isPending } = useToggleReaction();
  const { mutate: deleteMoment, isPending: isDeleting } = useDeleteMoment();
  const { warning, error, success } = useToast();

  const reactionList = moment.reactions || (moment as any).momentReactions || [];
  const commentList = moment.comments || (moment as any).momentComments || [];

  const currentUserId = user ? (user.id || (user as any).Id) : null;
  const initialIsLiked = Boolean(
    user && reactionList.some((r: any) => 
      (r.isLike === true || r.IsLike === true) && String(r.userId || r.UserId) === String(currentUserId)
    )
  );

  const momentUserId = (moment as any).userId || moment.user?.id || (moment as any).User?.Id;
  const isOwner = String(momentUserId) === String(currentUserId);
  
  // Aggressively check all possible avatar properties from AuthContext
  const currentUserAvatar = (user as any)?.avatarUrl || (user as any)?.AvatarUrl || (user as any)?.avatar || (user as any)?.picture;
  const momentUserAvatar = moment.user?.avatarUrl || (moment.user as any)?.AvatarUrl;
  
  const displayAvatar = isOwner ? (currentUserAvatar || momentUserAvatar) : momentUserAvatar;

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(reactionList.length);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikeCount(reactionList.length);
  }, [initialIsLiked, reactionList.length]);

  const handleLike = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!user || !currentUserId) { warning("Please log in!"); return; }
    
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
    
    toggleReaction({ momentId: moment.id, userId: Number(currentUserId), isLike: newIsLiked }, {
      onError: (err: any) => { 
        setIsLiked(!newIsLiked); 
        setLikeCount(reactionList.length); 
        
        // ✨ ĐÂY LÀ RADAR BẮT LỖI 400 TỪ C#
        console.error("LỖI REACTION 400 TỪ BACKEND:", err.response?.data);
        
        // Cố gắng bóc tách lỗi và hiển thị lên Toast đỏ
        const validationErrors = err.response?.data?.errors;
        let errorDetail = "";
        if (validationErrors) {
           errorDetail = Object.values(validationErrors).flat().join(" | ");
        }
        const msg = errorDetail || err.response?.data?.message || err.response?.data || "Lỗi 400: Dữ liệu gửi lên C# bị sai cấu trúc.";
        error(typeof msg === 'string' ? msg : "System error!"); 
      }
    });
  }, [user, currentUserId, isLiked, moment.id, reactionList.length, toggleReaction, warning, error]);

  const handleDeleteMoment = useCallback(() => {
    if (isDeleting) return;
    if (window.confirm("Are you sure you want to delete this moment? This action cannot be undone.")) {
      deleteMoment(
        { momentId: moment.id, userId: Number(currentUserId) },
        {
          onSuccess: () => success("Moment deleted successfully."),
          onError: () => error("Failed to delete moment.")
        }
      );
    }

  }, [currentUserId, deleteMoment, isDeleting, moment.id, success, error]);


  const userFullName = moment.user?.fullName || "Anonymous";
  
  const privacy = moment.privacy || (moment as any).Privacy || 'Public';
  const PrivacyIcon = privacy === 'Private' ? Lock : privacy === 'Friend' ? Users : Globe;

  return (
    <>
      <div className="mx-auto w-full max-w-[450px] shrink-0 bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-sm mb-4 pb-3 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 !rounded-full overflow-hidden bg-slate-100 border border-slate-200">
              {displayAvatar ? (
                <img src={displayAvatar} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center font-bold text-xs">
                  {userFullName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900 leading-tight">{userFullName}</span>
              {moment.locationName && <span className="text-[11px] text-slate-500 leading-tight mt-0.5">{moment.locationName}</span>}
            </div>
          </div>
          
          {isOwner && (
            <button onClick={handleDeleteMoment} disabled={isDeleting} className="text-slate-400 hover:text-red-500 transition-colors p-2">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <div 
          className="w-full h-[350px] sm:h-[450px] bg-black/5 flex items-center justify-center overflow-hidden cursor-pointer"
          onDoubleClick={handleLike}
        >

          <img src={moment.imageUrl} loading="lazy" decoding="async" className="w-full h-full object-contain" />

        </div>

        <div className="flex items-center gap-4 px-4 pt-2 pb-1">
          <button onClick={handleLike} disabled={isPending}>
            <Heart className={`h-7 w-7 transition-all active:scale-125 ${isLiked ? "fill-rose-500 text-rose-500" : "text-slate-900"}`} />
          </button>
          <button onClick={() => setIsModalOpen(true)}>
            <MessageCircle className="h-7 w-7 text-slate-900 hover:text-slate-600 transition-colors" />
          </button>
        </div>

        <div className="px-4 mt-1">
          <div className="text-sm font-bold text-slate-900 mb-1">{likeCount} likes</div>
          {moment.caption && (
            <div className="text-sm text-slate-800 leading-relaxed">
              <span className="font-bold mr-2">{userFullName}</span>{moment.caption}
            </div>
          )}
          
          {commentList.length > 0 && (
            <div 
              className="text-sm text-slate-500 mt-1 cursor-pointer hover:text-slate-700"
              onClick={() => setIsModalOpen(true)}
            >
              View all {commentList.length} comments
            </div>
          )}
          
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase mt-2 tracking-tight font-medium">
            <span>{formatTimeAgo(moment.createdAt)}</span>
            <span>•</span>
            <span className="flex items-center gap-1" title={`Privacy: ${privacy}`}>
              <PrivacyIcon className="w-3 h-3" />
              <span>{privacy}</span>
            </span>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <MomentModal 
          moment={moment} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          isLiked={isLiked}
          likeCount={likeCount}
          onToggleLike={handleLike}
        />
      )}
    </>
  );
};


export const MomentCard = React.memo(MomentCardBase, (prevProps, nextProps) => {
  return prevProps.moment.id === nextProps.moment.id && 
         prevProps.moment.reactions?.length === nextProps.moment.reactions?.length &&
         prevProps.moment.comments?.length === nextProps.moment.comments?.length;
});