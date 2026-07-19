import React, { useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Calendar, User, Globe, Users, Lock, ImageOff, UserCheck, UserX, Clock, MessageCircle, UserPlus, Settings } from 'lucide-react';
import { useGetUserProfile, useGetUserMoments } from '../hooks/useProfile';
import { getImg } from '../../../../config/api/api';
import { useTranslation } from '../../../../contexts/LocaleContext';
import { AuthContext } from '../../../../contexts/AuthContext';
import { useGetFriendshipStatus, useSendFriendRequest, useRespondToRequest, useDeleteFriendship } from '../../friends/hooks/useFriends';
import { useCreateChatRoom } from '../../chat/hooks/useChatSignalR';
import { useToast } from '../../../../contexts/ToastContext';
import { PATH } from '../../../../config/routes/route';
import { ConfirmDialog } from '../../../../components/dashboard/ConfirmDialog';
import { MomentModal } from '../../moments/components/MomentModal';
import { useToggleReaction, useGetMomentById } from '../../moments/hooks/useMoments';
import { useQueryClient } from '@tanstack/react-query';

export const SocialProfile: React.FC = () => {
  const { t, locale } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { user: currentUser } = useContext(AuthContext);
  
  const { 
    data: profile, 
    isLoading: isProfileLoading, 
    error: profileError 
  } = useGetUserProfile(id || '');

  const { 
    data: moments, 
    isLoading: isMomentsLoading, 
    error: momentsError 
  } = useGetUserMoments(id || '');

  const { data: friendshipStatus, isLoading: isStatusLoading } = useGetFriendshipStatus(id);
  const { mutate: sendFriendRequest } = useSendFriendRequest();
  const { mutate: respondToRequest } = useRespondToRequest();
  const { mutate: deleteFriend } = useDeleteFriendship();
  const { mutate: createChat } = useCreateChatRoom();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (id) {
      void queryClient.invalidateQueries({ queryKey: ["friends", "status", String(id)] });
    }
  }, [id, queryClient]);

  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-US';

  const [selectedMomentId, setSelectedMomentId] = useState<number | null>(null);
  const { mutate: toggleReaction } = useToggleReaction();
  const { data: fetchedMoment } = useGetMomentById(selectedMomentId);

  // Progressive lazy loading to handle huge datasets of photos safely in the DOM
  const [visibleCount, setVisibleCount] = useState(12);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    setVisibleCount(12);
  }, [id]);

  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isMomentsLoading) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && moments && visibleCount < moments.length) {
        setVisibleCount(prev => prev + 12);
      }
    });

    if (node) observerRef.current.observe(node);
  }, [isMomentsLoading, visibleCount, moments]);

  const visibleMoments = useMemo(() => {
    return (moments || []).slice(0, visibleCount);
  }, [moments, visibleCount]);

  const currentUserId = currentUser
    ? (currentUser.id || currentUser.Id || currentUser.nameid || currentUser.sub || null)
    : null;
  
  const initialIsLiked = useMemo(() => {
    if (!fetchedMoment || !currentUserId) return false;
    const reactionList = fetchedMoment.reactions || [];
    return reactionList.some((r: any) => 
      (r.isLike === true || r.IsLike === true) && String(r.userId || r.UserId) === String(currentUserId)
    );
  }, [fetchedMoment, currentUserId]);

  const initialLikeCount = useMemo(() => {
    if (!fetchedMoment) return 0;
    const reactionList = fetchedMoment.reactions || [];
    return reactionList.length;
  }, [fetchedMoment]);

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikeCount(initialLikeCount);
  }, [initialIsLiked, initialLikeCount]);

  const handleToggleLike = useCallback(() => {
    if (!fetchedMoment) return;
    if (!currentUser || !currentUserId) { error("Vui lòng đăng nhập."); return; }
    
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount((prev: number) => newIsLiked ? prev + 1 : prev - 1);
    
    toggleReaction({ momentId: Number(fetchedMoment.id), userId: Number(currentUserId), isLike: newIsLiked }, {
      onError: () => { 
        setIsLiked(!newIsLiked); 
        setLikeCount(initialLikeCount); 
        error(t("social.failedReactMoment") || "Lỗi tương tác."); 
      }
    });
  }, [fetchedMoment, currentUser, currentUserId, isLiked, toggleReaction, initialLikeCount, error, t]);

  if (isProfileLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-6 py-4 text-sm font-medium text-rose-500 shadow-sm">
          {t('social.profileLoadError')}
        </div>
      </div>
    );
  }

  const avatarInitial = profile.fullName ? profile.fullName.charAt(0).toUpperCase() : '?';

  const renderPrivacyBadge = (privacy: string) => {
    switch(privacy) {
      case 'Public':
        return <div className="flex items-center gap-1 rounded-full bg-blue-100/90 px-2.5 py-1 text-[10px] font-bold text-brand-hover shadow-sm backdrop-blur-md"><Globe className="h-3 w-3" /> {t('social.public')}</div>;
      case 'Friend':
        return <div className="flex items-center gap-1 rounded-full bg-emerald-100/90 px-2.5 py-1 text-[10px] font-bold text-emerald-700 shadow-sm backdrop-blur-md"><Users className="h-3 w-3" /> {t('social.friendPrivacy')}</div>;
      case 'Private':
        return <div className="flex items-center gap-1 rounded-full bg-slate-100/90 px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-sm backdrop-blur-md"><Lock className="h-3 w-3" /> {t('social.private')}</div>;
      default:
        return null;
    }
  };

  const handleUnfriend = () => {
    if (friendshipStatus?.id) {
      deleteFriend(friendshipStatus.id, {
        onSuccess: () => {
          success(t("social.removedFromFriends"));
          setIsConfirmOpen(false);
        },
        onError: () => {
          error(t("social.failedToUnfriend"));
        }
      });
    }
  };

  const renderProfileActions = () => {
    if (currentUser && currentUserId && String(currentUserId) === String(id)) {
      return (
        <button
          onClick={() => navigate(PATH.CUSTOMER.PROFILE)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <Settings className="h-4 w-4" />
          <span>Chỉnh sửa hồ sơ</span>
        </button>
      );
    }

    if (isStatusLoading) {
      return <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-xl"></div>;
    }

    const rawStatus = friendshipStatus?.status || friendshipStatus?.Status || 'none';
    const status = rawStatus.toLowerCase();
    const requesterId = friendshipStatus?.requesterId ?? friendshipStatus?.RequesterId;
    const friendshipId = friendshipStatus?.id ?? friendshipStatus?.Id;
    
    // Safely check if outgoing by ensuring both IDs are defined
    const isOutgoing = !!requesterId && !!currentUserId && String(requesterId) === String(currentUserId);

    console.log("[SocialProfile] Friendship status check:", {
      status,
      requesterId,
      currentUserId,
      isOutgoing,
      friendshipStatus
    });

    const handleChatClick = () => {
      createChat(Number(id), {
        onSuccess: (newRoom) => {
          const roomId = newRoom?.data?.id || newRoom?.data?.Id || newRoom?.id || newRoom?.Id;
          if (roomId) {
            navigate(`${PATH.CUSTOMER.SOCIAL_CHAT}?roomId=${roomId}`);
          } else {
            error(t('social.couldNotGetChatRoom'));
          }
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.response?.data || t('social.errorCreatingChatRoom');
          error(typeof msg === 'string' ? msg : t('social.unknownSystemError'));
        },
      });
    };

    if (status === 'none' || status === 'declined') {
      // Hide Add Friend button entirely for Staff, Manager, or Admin accounts
      const isRestrictedRole = profile?.roles?.some(
        (r) => ['staff', 'manager', 'admin'].includes(r.toLowerCase())
      );
      if (isRestrictedRole) {
        return null;
      }

      return (
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              sendFriendRequest(
                { receiverId: Number(id) },
                {
                  onSuccess: () => success(t("social.friendRequestSent")),
                  onError: (err: any) => {
                    const msg = err.response?.data?.message || err.response?.data || t("social.failedToSendRequest");
                    error(typeof msg === 'string' ? msg : t("social.unknownSystemError"));
                  }
                }
              );
            }}
            className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover hover:scale-105 active:scale-95 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            {t("social.addFriend")}
          </button>
        </div>
      );
    }

    if (status === 'pending') {
      if (isOutgoing) {
        return (
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              disabled
              className="flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-400 cursor-not-allowed"
            >
              <Clock className="h-4 w-4" />
              {t("social.requestSent") || "Đã gửi lời mời"}
            </button>
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                respondToRequest(
                  { requestId: friendshipId, isAccepted: true },
                  {
                    onSuccess: () => success(t("social.friendRequestAccepted")),
                    onError: (err: any) => {
                      const msg = err.response?.data?.message || err.response?.data || t("social.unknownSystemError");
                      error(typeof msg === 'string' ? msg : t("social.unknownSystemError"));
                    }
                  }
                );
              }}
              className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover hover:scale-105 active:scale-95 transition-all"
            >
              <UserCheck className="h-4 w-4" />
              {t("social.accept")}
            </button>
            <button
              onClick={() => {
                respondToRequest(
                  { requestId: friendshipId, isAccepted: false },
                  {
                    onSuccess: () => success(t("social.friendRequestDeclined")),
                    onError: (err: any) => {
                      const msg = err.response?.data?.message || err.response?.data || t("social.unknownSystemError");
                      error(typeof msg === 'string' ? msg : t("social.unknownSystemError"));
                    }
                  }
                );
              }}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"
            >
              <UserX className="h-4 w-4" />
              {t("social.decline")}
            </button>
          </div>
        );
      }
    }

    if (status === 'accepted') {
      return (
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleChatClick}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover hover:scale-105 active:scale-95 transition-all"
          >
            <MessageCircle className="h-4 w-4" />
            {t("social.message")}
          </button>
          <button
            onClick={() => setIsConfirmOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:scale-105 active:scale-95 transition-all"
          >
            <UserX className="h-4 w-4" />
            {t("social.unfriend")}
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-32 w-full bg-gradient-to-r from-brand-light to-[var(--color-brand)]/20 sm:h-48"></div>
        <div className="relative px-6 pb-8 sm:px-10">
          <div className="relative -mt-16 mb-4 flex items-end sm:-mt-20">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-md sm:h-40 sm:w-40">
              {profile.avatarUrl ? (
                <img 
                  src={getImg(profile.avatarUrl)} 
                  alt={profile.fullName} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-4xl font-black text-slate-400">
                  {avatarInitial}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">{profile.fullName}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-5 text-sm font-medium text-slate-500">
                {profile.gender && (
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-400" />
                    {profile.gender}
                  </div>
                )}
                {profile.createdAt && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {t('social.joinedSince', { date: new Date(profile.createdAt).toLocaleDateString(dateLocale) })}
                  </div>
                )}
              </div>
            </div>
            
            {renderProfileActions()}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-xl font-bold text-slate-900">{t('social.travelMoments')}</h2>
        
        {isMomentsLoading ? (
          <div className="flex h-40 items-center justify-center">
             <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : momentsError ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center text-sm font-medium text-rose-500">
            {t('social.momentsLoadError')}
          </div>
        ) : !moments || moments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <ImageOff className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">{t('social.noMomentsYet')}</p>
            <p className="mt-1 text-xs text-slate-400">{t('social.noMomentsDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {visibleMoments.map((moment, idx) => {
              const isLast = idx === visibleMoments.length - 1;
              return (
                <div 
                  key={moment.id} 
                  ref={isLast ? lastElementRef : undefined}
                  onClick={() => setSelectedMomentId(Number(moment.id))}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                    <img 
                      src={getImg(moment.imageUrl)} 
                      alt={moment.caption || t('social.travelMoment')} 
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute right-3 top-3 z-10">
                      {renderPrivacyBadge(moment.privacy || 'Public')}
                    </div>
                    
                    {moment.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12 transition-opacity">
                        <p className="line-clamp-2 text-sm font-medium leading-relaxed text-white drop-shadow-sm">{moment.caption}</p>
                        {moment.createdAt && (
                          <p className="mt-1.5 text-[11px] font-bold text-white/60">
                            {new Date(moment.createdAt).toLocaleDateString(dateLocale)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {!moment.caption && moment.createdAt && (
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-slate-400">
                        {new Date(moment.createdAt).toLocaleDateString(dateLocale)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleUnfriend}
        title={t("social.unfriend")}
        message={t("social.confirmUnfriend")}
        confirmText={t("common.confirm") || "Xác nhận"}
        cancelText={t("common.cancel") || "Hủy"}
        variant="warning"
      />

      {fetchedMoment && (
        <MomentModal
          moment={fetchedMoment}
          isOpen={!!selectedMomentId}
          onClose={() => setSelectedMomentId(null)}
          isLiked={isLiked}
          likeCount={likeCount}
          onToggleLike={handleToggleLike}
        />
      )}

      {selectedMomentId !== null && !fetchedMoment && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Loading moment...</span>
          </div>
        </div>
      )}
    </div>
  );
};
