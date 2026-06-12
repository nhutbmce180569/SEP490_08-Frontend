import React, { useContext, useState, useEffect, useCallback } from "react";
import { Heart, MessageCircle, Trash2, Globe, Users, Lock } from "lucide-react";
import { AuthContext } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useTranslation } from "../../../../contexts/LocaleContext";
import { useToggleReaction, useDeleteMoment } from "../hooks/useMoments";
import { MomentModal } from "./MomentModal";
import type { Moment } from "../types/moment.type";

const SafeImage = ({ src, alt, className, fallbackText, fallbackClassName }: any) => {
  const [hasError, setHasError] = useState(false);
  if (hasError || !src) {
    return <div className={fallbackClassName}>{fallbackText}</div>;
  }
  return <img src={src} alt={alt} className={className} onError={() => setHasError(true)} loading="lazy" decoding="async" />;
};

interface MomentCardProps { moment: Moment; }

const MomentCardBase: React.FC<MomentCardProps> = ({ moment }) => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { mutate: toggleReaction, isPending } = useToggleReaction();
  const { mutate: deleteMoment, isPending: isDeleting } = useDeleteMoment();
  const { warning, error, success } = useToast();

  const formatTimeAgo = useCallback((dateString: string) => {
    if (!dateString) return t("social.justNow");
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return t("social.justNow");
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return t("social.minutesAgo", { count: diffInMinutes });
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t("social.hoursAgo", { count: diffInHours });
    return date.toLocaleDateString();
  }, [t]);

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
    if (!user || !currentUserId) { warning(t("social.pleaseLogIn")); return; }
    
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
    
    toggleReaction({ momentId: moment.id, userId: Number(currentUserId), isLike: newIsLiked }, {
      onError: (err: any) => { 
        setIsLiked(!newIsLiked); 
        setLikeCount(reactionList.length); 
        
        const validationErrors = err.response?.data?.errors;
        let errorDetail = "";
        if (validationErrors) {
           errorDetail = Object.values(validationErrors).flat().join(" | ");
        }
        const msg = errorDetail || err.response?.data?.message || t("social.invalidDtoError");
        error(typeof msg === 'string' ? msg : t("social.unknownSystemError")); 
      }
    });
  }, [user, currentUserId, isLiked, moment.id, reactionList.length, toggleReaction, warning, error, t]);

  const handleDeleteMoment = useCallback(() => {
    if (isDeleting) return;
    if (window.confirm(t("social.momentConfirmDelete"))) {
      deleteMoment(
        { momentId: moment.id, userId: Number(currentUserId) },
        {
          onSuccess: () => success(t("social.momentDeleteSuccess")),
          onError: () => error(t("social.momentDeleteFailed"))
        }
      );
    }

  }, [currentUserId, deleteMoment, isDeleting, moment.id, success, error, t]);


  const userFullName = moment.user?.fullName || t("social.anonymous");
  
  const privacy = moment.privacy || (moment as any).Privacy || 'Public';
  const privacyLabel =
    privacy === 'Private'
      ? t("social.private")
      : privacy === 'Friend'
        ? t("social.friendPrivacy")
        : t("social.public");
  const PrivacyIcon = privacy === 'Private' ? Lock : privacy === 'Friend' ? Users : Globe;

  return (
    <>
      <div className="mx-auto w-full max-w-[450px] shrink-0 bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-sm mb-4 pb-3 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 !rounded-full overflow-hidden bg-slate-100 border border-slate-200">
              <SafeImage src={displayAvatar} alt="Avatar" className="h-full w-full object-cover" fallbackClassName="h-full w-full flex items-center justify-center font-bold text-xs bg-slate-100" fallbackText={userFullName.charAt(0)} />
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

          <SafeImage src={moment.imageUrl} alt="Moment" className="w-full h-full object-contain" fallbackClassName="w-full h-full flex items-center justify-center bg-black/5 text-slate-500 font-medium text-sm" fallbackText={t("social.noImage")} />

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
          <div className="text-sm font-bold text-slate-900 mb-1">{t("social.momentLikesCount", { count: likeCount })}</div>
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
              {t("social.momentViewAllComments", { count: commentList.length })}
            </div>
          )}
          
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase mt-2 tracking-tight font-medium">
            <span>{formatTimeAgo(moment.createdAt)}</span>
            <span>•</span>
            <span className="flex items-center gap-1" title={t("social.privacyLabel", { privacy: privacyLabel })}>
              <PrivacyIcon className="w-3 h-3" />
              <span>{privacyLabel}</span>
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
