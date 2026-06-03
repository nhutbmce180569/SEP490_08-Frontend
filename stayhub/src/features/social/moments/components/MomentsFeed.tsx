import React, { useState, useMemo, useContext, useEffect, useCallback } from "react";
import { Camera, LayoutList, Map, Globe, Users, Lock } from "lucide-react";
import { useInfiniteMomentFeed, useToggleReaction } from "../hooks/useMoments"; 
import { CreateMomentForm } from "./CreateMomentForm";
import { MomentsMapFeed } from "./MomentsMapFeed";
import { MomentModal } from "./MomentModal";
import { AuthContext } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useTranslation } from "../../../../contexts/LocaleContext";

interface MomentsFeedProps {
  scheduleId: number;
}

export const MomentsFeed: React.FC<MomentsFeedProps> = ({ scheduleId }) => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useInfiniteMomentFeed(scheduleId);
  const { user } = useContext(AuthContext);
  const { warning, error } = useToast();
  const { mutate: toggleReaction } = useToggleReaction();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMomentId, setSelectedMomentId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('feed');

  const moments = useMemo(() => data?.pages.flat() || [], [data]);

  const selectedMoment = useMemo(
    () => moments.find((m: any) => m.id === selectedMomentId),
    [moments, selectedMomentId]
  );

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
    <div className="relative w-full h-[80vh] flex flex-col bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header Toggle UI */}
      <div className="relative z-30 flex-none bg-slate-900/80 p-4 backdrop-blur-md flex justify-center border-b border-slate-800">
        <div className="flex items-center rounded-xl bg-slate-800 p-1 shadow-inner">
          <button
            onClick={() => setViewMode('feed')}
            className={`flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold transition-all duration-300 ${
              viewMode === 'feed'
                ? 'bg-brand text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <LayoutList className="h-4 w-4" /> {t("social.feed")}
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold transition-all duration-300 ${
              viewMode === 'map'
                ? 'bg-brand text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <Map className="h-4 w-4" /> {t("social.map")}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-brand"></div>
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-center text-sm font-medium text-rose-400 shadow-lg backdrop-blur-md">
              {t("social.momentsLoadFailed")}
            </div>
          </div>
        )}

        {viewMode === 'feed' ? (
          <div className="h-full w-full overflow-y-auto p-4 custom-scrollbar">
            {moments.length === 0 && !isLoading && !isError ? (
              <div className="flex h-full flex-col items-center justify-center pb-20 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 shadow-inner">
                  <Camera className="h-10 w-10 text-slate-500" />
                </div>
                <p className="text-sm font-semibold text-slate-400">
                  {t("social.noMomentsShare")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-24">
                {moments.map((moment: any) => (
                  <div
                    key={moment.id || moment.Id}
                    onClick={() => setSelectedMomentId(moment.id || moment.Id)}
                    className="group relative overflow-hidden rounded-xl cursor-pointer bg-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <img
                      src={moment.imageUrl || moment.ImageUrl}
                      alt={moment.caption || t("social.travelMoment")}
                      className="h-full w-full object-cover aspect-[4/5] transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute right-3 top-3 z-10">
                      {renderPrivacyBadge(moment.privacy || moment.Privacy)}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 pt-12 transition-opacity">
                      <p className="line-clamp-2 text-sm font-medium leading-relaxed text-white drop-shadow-sm">
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
            <MomentsMapFeed scheduleId={scheduleId} onMarkerClick={setSelectedMomentId} />
          </div>
        )}
      </div>

      {/* FAB - Camera Button */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setIsCreateOpen(true)}
          className="group relative flex items-center justify-center w-16 h-16 bg-brand text-white !rounded-full overflow-hidden shadow-[0_8px_32px_rgba(0,104,224,0.5)] border-4 border-slate-900 transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <Camera className="w-7 h-7" />
          {/* Zenly style ping effect */}
          <div className="absolute inset-0 rounded-full border-2 border-brand animate-ping opacity-40 group-hover:opacity-0 delay-75"></div>
        </button>
      </div>

      {/* Create Moment Modal Overlay */}
      {isCreateOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <CreateMomentForm scheduleId={scheduleId} onClose={() => setIsCreateOpen(false)} />
        </div>
      )}

      {/* Selected Moment Modal */}
      {selectedMoment && (
        <MomentModal
          moment={selectedMoment}
          isOpen={!!selectedMoment}
          onClose={() => setSelectedMomentId(null)}
          isLiked={isLiked}
          likeCount={likeCount}
          onToggleLike={handleToggleLike}
        />
      )}
    </div>
  );
};