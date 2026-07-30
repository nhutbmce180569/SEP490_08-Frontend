import React, { useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Loader2, Calendar, User, Globe, Users, Lock, ImageOff, UserCheck, UserX, Clock, MessageCircle, UserPlus, Settings } from 'lucide-react';
import { useGetUserProfile, useGetUserMoments } from '../hooks/useProfile';
import { useTranslation } from "../../../../contexts/LocaleContext";
import { DynamicText } from "../../../../components/DynamicText";
import { AuthContext } from '../../../../contexts/AuthContext';
import { useGetFriendshipStatus, useSendFriendRequest, useRespondToRequest, useDeleteFriendship, useGetFriendships, useGetPendingRequests, useGetSentRequests } from '../../friends/hooks/useFriends';
import { useCreateChatRoom } from '../../chat/hooks/useChatSignalR';
import { useToast } from '../../../../contexts/ToastContext';
import { PATH } from '../../../../config/routes/route';
import { ConfirmDialog } from '../../../../components/dashboard/ConfirmDialog';
import { MomentModal } from '../../moments/components/MomentModal';
import { useToggleReaction, useGetMomentById } from '../../moments/hooks/useMoments';
import { useQueryClient } from '@tanstack/react-query';
import { getImg } from '../../../../config/api/api';

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
  
  const { data: allFriendships = [] } = useGetFriendships();
  const { data: pendingRequests = [] } = useGetPendingRequests();
  const { data: sentRequests = [] } = useGetSentRequests();

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
  
  const selectedMomentLocal = useMemo(() => {
    if (!selectedMomentId || !moments) return null;
    return moments.find((m: any) => (m.id || m.Id) === selectedMomentId) || null;
  }, [moments, selectedMomentId]);

  const activeMoment = selectedMomentLocal || fetchedMoment;
  
  const initialIsLiked = useMemo(() => {
    if (!activeMoment || !currentUserId) return false;
    const reactionList = activeMoment.reactions || [];
    return reactionList.some((r: any) => 
      (r.isLike === true || r.IsLike === true) && String(r.userId || r.UserId) === String(currentUserId)
    );
  }, [activeMoment, currentUserId]);

  const initialLikeCount = useMemo(() => {
    if (!activeMoment) return 0;
    const reactionList = activeMoment.reactions || [];
    return reactionList.length;
  }, [activeMoment]);

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikeCount(initialLikeCount);
  }, [initialIsLiked, initialLikeCount]);

  const handleToggleLike = useCallback(() => {
    if (!activeMoment) return;
    if (!currentUser || !currentUserId) { error("Vui lòng đăng nhập."); return; }
    
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount((prev: number) => newIsLiked ? prev + 1 : prev - 1);
    
    toggleReaction({ momentId: Number(activeMoment.id), userId: Number(currentUserId), isLike: newIsLiked }, {
      onError: () => { 
        setIsLiked(!newIsLiked); 
        setLikeCount(initialLikeCount); 
        error(t("social.failedReactMoment") || "Lỗi tương tác."); 
      }
    });
  }, [activeMoment, currentUser, currentUserId, isLiked, toggleReaction, initialLikeCount, error, t]);

  const currentMomentIndexInProfile = useMemo(() => {
    if (!selectedMomentId || !moments) return -1;
    return moments.findIndex((m: any) => (m.id || m.Id) === selectedMomentId);
  }, [moments, selectedMomentId]);

  const handleNextMomentInProfile = useMemo(() => {
    if (currentMomentIndexInProfile !== -1 && moments && currentMomentIndexInProfile < moments.length - 1) {
      return () => {
        const next = moments[currentMomentIndexInProfile + 1];
        setSelectedMomentId(next.id || (next as any).Id);
      };
    }
    return undefined;
  }, [moments, currentMomentIndexInProfile]);

  const handlePrevMomentInProfile = useMemo(() => {
    if (currentMomentIndexInProfile > 0 && moments) {
      return () => {
        const prev = moments[currentMomentIndexInProfile - 1];
        setSelectedMomentId(prev.id || (prev as any).Id);
      };
    }
    return undefined;
  }, [moments, currentMomentIndexInProfile]);

  // Preload next 5 moments for SocialProfile (increase visibleCount and cache images)
  useEffect(() => {
    if (currentMomentIndexInProfile === -1 || !moments || moments.length === 0) return;

    // 1. If we are within 5 items of the end of visible count, increase visible count to reveal more
    if (currentMomentIndexInProfile >= visibleCount - 5 && visibleCount < moments.length) {
      setVisibleCount(prev => Math.min(prev + 12, moments.length));
    }

    // 2. Programmatically cache the images of the next 5 moments in the browser memory
    const preloadCount = 5;
    for (let i = 1; i <= preloadCount; i++) {
      const targetIndex = currentMomentIndexInProfile + i;
      if (targetIndex < moments.length) {
        const nextMoment = moments[targetIndex];
        const imgUrl = nextMoment?.imageUrl || (nextMoment as any)?.ImageUrl;
        if (imgUrl) {
          const img = new Image();
          img.src = imgUrl;
        }
      }
    }
  }, [currentMomentIndexInProfile, moments, visibleCount]);

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
          <span>{t('social.editProfile') || 'Edit Profile'}</span>
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
    <div className="page-container py-4 md:py-6 animate-fade-in">
      <div className="flex flex-col md:flex-row min-h-[82vh] bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
      {/* Sidebar - Cột bên trái */}
      <div className="w-full md:w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 shrink-0 md:h-[82vh] overflow-y-auto custom-scrollbar">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('social.friendsManagement') || 'Friends'}</h1>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">{t('social.friendsSubtitle') || 'Search, connect, and stay in touch'}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => navigate(`${PATH.CUSTOMER.SOCIAL_FRIENDS}?tab=friends`)}
            className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              <span>{t('social.myFriends') || 'My Friends'}</span>
            </div>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold">
              {allFriendships.length}
            </span>
          </button>

          <button
            onClick={() => navigate(`${PATH.CUSTOMER.SOCIAL_FRIENDS}?tab=pending`)}
            className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5" />
              <span>{t('social.requests') || 'Received Requests'}</span>
            </div>
            {pendingRequests.length > 0 && (
              <span className="text-xs bg-red-100 px-2 py-0.5 rounded-full text-red-600 font-bold animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate(`${PATH.CUSTOMER.SOCIAL_FRIENDS}?tab=sent`)}
            className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5" />
              <span>{t('social.sentRequests') || 'Sent Requests'}</span>
            </div>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold">
              {sentRequests.length}
            </span>
          </button>

          <button
            onClick={() => navigate(`${PATH.CUSTOMER.SOCIAL_FRIENDS}?tab=add`)}
            className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5" />
              <span>{t('social.findFriends') || 'Find Friends'}</span>
            </div>
          </button>

          <button
            onClick={() => navigate(`${PATH.CUSTOMER.SOCIAL_FRIENDS}?tab=suggestions`)}
            className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <div className="flex items-center gap-3">
              <UserPlus className="w-5 h-5" />
              <span>{t('social.friendSuggestions') || 'Friend Suggestions'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-8 md:h-[82vh] overflow-y-auto custom-scrollbar">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
          {/* Avatar Column (Left side) */}
          <div className="flex h-36 w-36 sm:h-40 sm:w-40 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-slate-100 bg-slate-50 shadow-sm relative group">
            {profile.avatarUrl ? (
              <img 
                src={getImg(profile.avatarUrl)} 
                alt={profile.fullName} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 text-5xl font-black text-slate-400">
                {avatarInitial}
              </div>
            )}
          </div>

          {/* Details Column (Right side) */}
          <div className="flex-1 flex flex-col gap-5 text-center md:text-left w-full">
            {/* Row 1: Name and Profile Actions */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">{profile.fullName}</h1>
              <div className="flex items-center gap-3 shrink-0">
                {renderProfileActions()}
              </div>
            </div>

            {/* Row 2: Profile stats */}
            <div className="flex items-center justify-center md:justify-start gap-8 py-1 border-y border-slate-100 md:border-none">
              <div className="flex items-baseline gap-1.5">
                <span className="font-extrabold text-slate-900 text-lg">{moments?.length || 0}</span>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{t('social.moments') || 'Moments'}</span>
              </div>
            </div>

            {/* Row 3: Bio and Metadata */}
            <div className="flex flex-col gap-2 font-medium text-slate-500 text-sm">
              <p className="text-slate-700 font-bold select-all">{profile.email}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-1.5 text-xs font-semibold text-slate-400 mt-1">
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-300" />
                  <span className="capitalize">{profile.gender || t('auth.unknown')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-300" />
                  <span>
                    {profile.createdAt ? t('social.joinedSince', { date: new Date(profile.createdAt).toLocaleDateString(dateLocale) }) : t('common.na')}
                  </span>
                </div>
              </div>
            </div>
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
                      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                        <p className="line-clamp-2 text-sm font-medium leading-relaxed text-white drop-shadow-sm"><DynamicText text={moment.caption} /></p>
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

      {activeMoment && (
        <MomentModal
          moment={activeMoment}
          isOpen={!!selectedMomentId}
          onClose={() => setSelectedMomentId(null)}
          isLiked={isLiked}
          likeCount={likeCount}
          onToggleLike={handleToggleLike}
          onNext={handleNextMomentInProfile}
          onPrev={handlePrevMomentInProfile}
        />
      )}

      {selectedMomentId !== null && !activeMoment && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Loading moment...</span>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  </div>
  );
};
