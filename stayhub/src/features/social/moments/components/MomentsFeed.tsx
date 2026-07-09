import React, { useState, useMemo, useContext, useEffect, useCallback } from "react";
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

  const { data, isLoading, isError } = useInfiniteMomentFeed(scheduleId);

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
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* Sleek Immersive Header Bar */}
      <div className="relative z-30 flex-none bg-slate-900/90 border-b border-slate-800/60 px-6 py-3.5 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        {/* Left Title details */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-wider uppercase flex items-center gap-1.5">
              <span>{t("app.momentsCommunityTitle") || "StayHub Community"}</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
            </h1>
            <p className="text-[10px] font-semibold text-slate-400">
              {t("app.momentsCommunitySubtitle") || "Discover moments from everywhere"}
            </p>
          </div>
        </div>

        {/* Center Switcher Buttons */}
        <div className="flex items-center rounded-xl bg-slate-950 p-1 shadow-inner border border-slate-800/80">
          <button
            onClick={() => setViewMode('feed')}
            className={`flex items-center gap-2 rounded-lg px-6 py-2 text-xs font-bold transition-all duration-300 cursor-pointer ${
              viewMode === 'feed'
                ? 'bg-brand text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" /> {t("social.feed")}
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 rounded-lg px-6 py-2 text-xs font-bold transition-all duration-300 cursor-pointer ${
              viewMode === 'map'
                ? 'bg-brand text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Map className="h-3.5 w-3.5" /> {t("social.map")}
          </button>
        </div>

        {/* Right Selector Filter Dropdown */}
        <div className="relative self-end sm:self-auto shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <select
            className="appearance-none bg-slate-950 border border-slate-800/80 text-slate-300 font-semibold text-xs py-2.5 pl-10 pr-10 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand cursor-pointer hover:bg-slate-900 transition-colors shadow-sm"
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
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
            <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <div className="relative flex-1 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-brand"></div>
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-center text-sm font-medium text-rose-400 shadow-lg backdrop-blur-md">
              {t("social.momentsLoadFailed")}
            </div>
          </div>
        )}

        {viewMode === 'feed' ? (
          <div className="h-full w-full overflow-y-auto p-6 md:p-8 custom-scrollbar">
            {moments.length === 0 && !isLoading && !isError ? (
              <div className="flex h-full flex-col items-center justify-center pb-20 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 shadow-inner">
                  <Camera className="h-10 w-10 text-slate-500" />
                </div>
                <p className="text-sm font-semibold text-slate-400">
                  {t("social.noMomentsShare")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-32">
                {filteredMoments.map((moment: any) => (
                  <div
                    key={moment.id || moment.Id}
                    onClick={() => setSelectedMomentId(moment.id || moment.Id)}
                    className="group relative overflow-hidden rounded-2xl cursor-pointer bg-slate-900 shadow-lg border border-slate-850/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-brand/35"
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
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent p-4 pt-16 transition-opacity">
                      <p className="line-clamp-2 text-xs font-bold leading-relaxed text-slate-100 drop-shadow-sm group-hover:text-white">
                        {moment.caption || moment.Caption || ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full w-full">
            <MomentsMapFeed scheduleId={scheduleId as any} onMarkerClick={setSelectedMomentId} onReplayStateChange={setIsReplayActive} />
          </div>
        )}
      </div>

      {/* Immersive FAB - Post Camera Button */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ease-out flex flex-col items-center gap-2 ${isReplayActive ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="group relative flex items-center justify-center w-16 h-16 bg-brand text-white !rounded-full overflow-hidden shadow-[0_8px_32px_rgba(0,104,224,0.6)] border-4 border-slate-950 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
        >
          <Camera className="w-7 h-7" />
          <div className="absolute inset-0 rounded-full border-2 border-brand animate-ping opacity-45 group-hover:opacity-0 delay-75"></div>
        </button>
        <span className="whitespace-nowrap text-[10px] font-black tracking-wider uppercase text-slate-300 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-lg backdrop-blur-md shadow-lg">
          Post Moment
        </span>
      </div>

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
        />
      )}
    </div>
  );
};