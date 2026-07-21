import React, { useState, useMemo, useContext, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Camera, LayoutList, Map, Globe, Users, Lock, Sparkles, Filter } from "lucide-react";
import { useInfiniteMomentFeed, useToggleReaction, useGetMomentById } from "../hooks/useMoments"; 
import { useGetEligibleSchedules } from "../hooks/useEligibleSchedules";
import { CreateMomentForm } from "./CreateMomentForm";
import { MomentsMapFeed } from "./MomentsMapFeed";
import { MomentModal } from "./MomentModal";
import { AuthContext } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useTranslation } from "../../../../contexts/LocaleContext";

export const MomentsFeed: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { warning, error } = useToast();
  const { mutate: toggleReaction } = useToggleReaction();

  // Quản lý lọc tour và phân trang trực tiếp trong component
  const [scheduleId, setScheduleId] = useState<number | null>(null);
  const { data: schedules } = useGetEligibleSchedules();

  const { 
    data, 
    isLoading, 
    isError, 
    hasNextPage, 
    fetchNextPage, 
    isFetchingNextPage 
  } = useInfiniteMomentFeed(scheduleId);

  const [searchParams, setSearchParams] = useSearchParams();
  const momentIdParam = searchParams.get("momentId");
  const queryMomentId = momentIdParam ? Number(momentIdParam) : null;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMomentId, setSelectedMomentId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('feed');
  const [isReplayActive, setIsReplayActive] = useState(false);
  const [reportedMomentIds, setReportedMomentIds] = useState<number[]>([]);

  // Tải chi tiết moment từ backend nếu có query param momentId
  const { data: sharedMoment } = useGetMomentById(queryMomentId);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingNextPage) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

  const moments = useMemo(() => data?.pages.flat() || [], [data]);

  const filteredMoments = useMemo(() => {
    return moments.filter((m: any) => !reportedMomentIds.includes(m.id || m.Id));
  }, [moments, reportedMomentIds]);

  const handleReportSuccess = useCallback((momentId: number) => {
    setReportedMomentIds(prev => [...prev, momentId]);
  }, []);

  const selectedMoment = useMemo(() => {
    if (selectedMomentId) {
      return moments.find((m: any) => (m.id || m.Id) === selectedMomentId);
    }
    if (queryMomentId && sharedMoment) {
      return sharedMoment;
    }
    return undefined;
  }, [moments, selectedMomentId, queryMomentId, sharedMoment]);

  const handleCloseModal = useCallback(() => {
    setSelectedMomentId(null);
    if (momentIdParam) {
      setSearchParams({});
    }
  }, [momentIdParam, setSearchParams]);

  // Reaction State Management for selected moment
  const currentUserId = user ? (user.id || (user as any).Id) : null;
  
  const initialIsLiked = useMemo(() => {
    if (!selectedMoment || !currentUserId) return false;
    const reactionList = selectedMoment.reactions || (selectedMoment as any).momentReactions || [];
    return reactionList.some((r: any) => 
      (r.isLike === true || r.IsLike === true) && String(r.userId || r.UserId) === String(currentUserId)
    );
  }, [selectedMoment, currentUserId]);

  const initialLikeCount = useMemo(() => {
    if (!selectedMoment) return 0;
    const reactionList = selectedMoment.reactions || (selectedMoment as any).momentReactions || [];
    return reactionList.length;
  }, [selectedMoment]);

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikeCount(initialLikeCount);
  }, [initialIsLiked, initialLikeCount]);

  useEffect(() => {
    if (viewMode === 'feed') setIsReplayActive(false);
  }, [viewMode]);

  const handleToggleLike = useCallback(() => {
    if (!selectedMoment) return;
    if (!user || !currentUserId) { warning(t("social.pleaseLogIn")); return; }
    
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
    
    toggleReaction({ momentId: selectedMoment.id, userId: Number(currentUserId), isLike: newIsLiked }, {
      onError: () => { 
        setIsLiked(!newIsLiked); 
        setLikeCount(initialLikeCount); 
        error(t("social.failedReactMoment")); 
      }
    });
  }, [selectedMoment, user, currentUserId, isLiked, toggleReaction, initialLikeCount, warning, error, t]);

  const currentMomentIndexInFeed = useMemo(() => {
    if (!selectedMomentId) return -1;
    return filteredMoments.findIndex((m: any) => (m.id || m.Id) === selectedMomentId);
  }, [filteredMoments, selectedMomentId]);

  const handleNextMomentInFeed = useMemo(() => {
    if (currentMomentIndexInFeed !== -1 && currentMomentIndexInFeed < filteredMoments.length - 1) {
      return () => {
        const next = filteredMoments[currentMomentIndexInFeed + 1];
        setSelectedMomentId(next.id || (next as any).Id);
      };
    }
    return undefined;
  }, [filteredMoments, currentMomentIndexInFeed]);

  const handlePrevMomentInFeed = useMemo(() => {
    if (currentMomentIndexInFeed > 0) {
      return () => {
        const prev = filteredMoments[currentMomentIndexInFeed - 1];
        setSelectedMomentId(prev.id || (prev as any).Id);
      };
    }
    return undefined;
  }, [filteredMoments, currentMomentIndexInFeed]);

  // Preload next 5 moments (API pre-fetching + image caching)
  useEffect(() => {
    if (currentMomentIndexInFeed === -1 || !filteredMoments || filteredMoments.length === 0) return;
    
    // 1. If we are within 5 items of the end of the currently loaded list, fetch the next page from the backend
    if (currentMomentIndexInFeed >= filteredMoments.length - 5 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }

    // 2. Programmatically cache the images of the next 5 moments in the browser memory
    const preloadCount = 5;
    for (let i = 1; i <= preloadCount; i++) {
      const targetIndex = currentMomentIndexInFeed + i;
      if (targetIndex < filteredMoments.length) {
        const nextMoment = filteredMoments[targetIndex];
        const imgUrl = nextMoment?.imageUrl || (nextMoment as any)?.ImageUrl;
        if (imgUrl) {
          const img = new Image();
          img.src = imgUrl;
        }
      }
    }
  }, [currentMomentIndexInFeed, filteredMoments, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderPrivacyBadge = (privacy: string) => {
    switch (privacy?.toLowerCase()) {
      case 'private':
        return <div className="flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md shadow-sm"><Lock className="h-3 w-3" /> {t("social.private")}</div>;
      case 'friend':
      case 'friends':
        return <div className="flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md shadow-sm"><Users className="h-3 w-3" /> {t("social.friendPrivacy")}</div>;
      default:
        return <div className="flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md shadow-sm"><Globe className="h-3 w-3" /> {t("social.public")}</div>;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 overflow-hidden select-none relative">
      {/* Sleek Immersive Apple-style Floating Header Bar (Light Theme) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white/80 border border-slate-200/60 backdrop-blur-xl px-3 py-1.5 rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-300 w-auto max-w-[95%] sm:max-w-max h-12">
        {/* Center Switcher Buttons (iOS 26 Liquid Glass Style) */}
        <div className="flex items-center bg-slate-200/60 backdrop-blur-md p-1 rounded-full border border-white/60 h-9.5 shadow-[inner_0_1px_2px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setViewMode('feed')}
            className={`flex items-center gap-1.5 rounded-full h-7 px-4 text-[11px] font-black transition-all duration-300 cursor-pointer ${
              viewMode === 'feed'
                ? 'bg-brand text-white shadow-md shadow-brand/30 scale-102'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <LayoutList className="h-3 w-3" />
            <span>{t("social.feed")}</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 rounded-full h-7 px-4 text-[11px] font-black transition-all duration-300 cursor-pointer ${
              viewMode === 'map'
                ? 'bg-brand text-white shadow-md shadow-brand/30 scale-102'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Map className="h-3 w-3" />
            <span>{t("social.map")}</span>
          </button>
        </div>

        {/* Right Selector Filter Dropdown (iOS 26 Liquid Glass) */}
        <div className="relative h-9 shrink-0 max-w-[95px] xs:max-w-[125px] sm:max-w-[180px] md:max-w-[260px]">
          <select
            className="appearance-none bg-slate-100/80 hover:bg-white/90 border border-slate-200/80 text-slate-800 font-bold text-[11px] h-full pl-3.5 pr-8 rounded-full focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand cursor-pointer transition-all shadow-sm w-full truncate backdrop-blur-md"
            onChange={(e) => setScheduleId(e.target.value ? Number(e.target.value) : null)}
            value={scheduleId || ""}
          >
            <option value="">🌍 {t("app.allTripsGlobal") || "All trips (Global)"}</option>
            {schedules?.map(s => (
              <option key={s.scheduleId} value={s.scheduleId}>
                📍 {s.tourName}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
            <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <div className="relative flex-1 overflow-hidden w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand"></div>
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-medium text-rose-500 shadow-lg backdrop-blur-md">
              {t("social.momentsLoadFailed")}
            </div>
          </div>
        )}

        {viewMode === 'feed' ? (
          <div className="h-full w-full overflow-y-auto pt-28 pb-32 px-6 md:px-8 custom-scrollbar bg-gradient-to-tr from-slate-100 via-slate-50 to-slate-100">
            {moments.length === 0 && !isLoading && !isError ? (
              <div className="flex h-full flex-col items-center justify-center pb-20 text-center animate-in fade-in duration-200">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 shadow-inner">
                  <Camera className="h-10 w-10 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-500">
                  {t("social.noMomentsShare")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredMoments.map((moment: any, idx: number) => {
                  const isLast = idx === filteredMoments.length - 1;
                  return (
                    <div
                      key={moment.id || moment.Id}
                      ref={isLast ? lastElementRef : undefined}
                      onClick={() => setSelectedMomentId(moment.id || moment.Id)}
                      className="group relative overflow-hidden rounded-2xl cursor-pointer bg-white shadow-sm border border-slate-250/20 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-brand/35"
                    >
                      <img
                        src={moment.imageUrl || moment.ImageUrl}
                        alt={moment.caption || t("social.travelMoment")}
                        className="h-full w-full object-cover aspect-[4/5] transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute right-3.5 top-3.5 z-10">
                        {renderPrivacyBadge(moment.privacy || moment.Privacy)}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-4 pt-16 transition-all duration-300 group-hover:via-black/60">
                        {(() => {
                          const authorName = moment.user?.fullName || moment.fullName || t("tour.anonymousCustomer");
                          const authorAvatar = moment.user?.avatarUrl || moment.avatarUrl;
                          return (
                            <>
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className="h-6 w-6 shrink-0 rounded-full overflow-hidden border border-white/20 bg-slate-200">
                                  {authorAvatar ? (
                                    <img src={authorAvatar} alt="Avatar" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center font-bold text-[9px] text-white bg-brand">
                                      {authorName.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[11px] font-black text-slate-100 truncate drop-shadow-sm group-hover:text-white">
                                  {authorName}
                                </span>
                              </div>
                              <p className="line-clamp-2 text-xs leading-relaxed text-slate-200 drop-shadow-sm group-hover:text-white">
                                {moment.caption || moment.Caption || ""}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
                
                {isFetchingNextPage && (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <div key={`feed-skeleton-${i}`} className="animate-pulse relative overflow-hidden rounded-2xl bg-slate-200 aspect-[4/5] border border-slate-250/10">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-300 via-transparent to-transparent"></div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full w-full absolute inset-0">
            <MomentsMapFeed 
              scheduleId={scheduleId as any} 
              onMarkerClick={setSelectedMomentId} 
              onReplayStateChange={setIsReplayActive} 
              onPostMomentClick={() => setIsCreateOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Immersive Floating Post Camera Button (Only visible in list Feed view - Matching Screenshot) */}
      {viewMode === 'feed' && (
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ease-out ${isReplayActive ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
          <div 
            onClick={() => setIsCreateOpen(true)}
            className="group flex flex-col items-center gap-1.5 cursor-pointer select-none transition-transform duration-300 hover:scale-105 active:scale-95"
            title={t("social.postMoment") || "POST MOMENT"}
          >
            {/* Circular Camera Button with White Ring */}
            <div className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-brand text-white border-4 border-white shadow-[0_8px_25px_rgba(0,104,224,0.4)] transition-all duration-300 group-hover:shadow-[0_12px_32px_rgba(0,104,224,0.55)] overflow-hidden">
              <Camera className="w-6 h-6 md:w-7 md:h-7 text-white" />
              <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping opacity-45 group-hover:opacity-0 delay-75"></div>
            </div>
          </div>
        </div>
      )}

      {/* Create Moment Modal Overlay */}
      {isCreateOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <CreateMomentForm scheduleId={scheduleId as any} onClose={() => setIsCreateOpen(false)} />
        </div>
      )}

      {/* Selected Moment Modal */}
      {selectedMoment && (
        <MomentModal
          moment={selectedMoment}
          isOpen={!!selectedMoment}
          onClose={handleCloseModal}
          isLiked={isLiked}
          likeCount={likeCount}
          onToggleLike={handleToggleLike}
          onReportSuccess={handleReportSuccess}
          onNext={handleNextMomentInFeed}
          onPrev={handlePrevMomentInFeed}
        />
      )}
    </div>
  );
};