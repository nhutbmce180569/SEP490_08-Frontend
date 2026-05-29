import React, { useState, useMemo, useContext, useEffect, useCallback } from "react";
import { Camera } from "lucide-react";
import { useInfiniteMomentFeed, useToggleReaction } from "../hooks/useMoments"; 
import { CreateMomentForm } from "./CreateMomentForm";
import { MomentsMapFeed } from "./MomentsMapFeed";
import { MomentModal } from "./MomentModal";
import { AuthContext } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";

interface MomentsFeedProps {
  scheduleId: number;
}

export const MomentsFeed: React.FC<MomentsFeedProps> = ({ scheduleId }) => {
  const { data, isLoading, isError } = useInfiniteMomentFeed(scheduleId);
  const { user } = useContext(AuthContext);
  const { warning, error } = useToast();
  const { mutate: toggleReaction } = useToggleReaction();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMomentId, setSelectedMomentId] = useState<number | null>(null);

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
    if (!user || !currentUserId) { warning("Please log in!"); return; }
    
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
    
    toggleReaction({ momentId: selectedMoment.id, userId: Number(currentUserId), isLike: newIsLiked }, {
      onError: () => { 
        setIsLiked(!newIsLiked); 
        setLikeCount(initialLikeCount); 
        error("Failed to react to moment."); 
      }
    });
  }, [selectedMoment, user, currentUserId, isLiked, toggleReaction, initialLikeCount, warning, error]);

  return (
    <div className="relative w-full h-[80vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/50 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#EB662B]"></div>
        </div>
      )}

      {isError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/50 backdrop-blur-sm p-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-medium text-rose-600 shadow-lg">
            The map cannot be loaded at this time. Please try again later.
          </div>
        </div>
      )}

      <MomentsMapFeed scheduleId={scheduleId} onMarkerClick={setSelectedMomentId} />

      {/* FAB - Camera Button */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={() => setIsCreateOpen(true)}
          className="group relative flex items-center justify-center w-16 h-16 bg-[#EB662B] text-white !rounded-full overflow-hidden shadow-[0_8px_32px_rgba(235,102,43,0.5)] border-4 border-white transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <Camera className="w-7 h-7" />
          {/* Zenly style ping effect */}
          <div className="absolute inset-0 rounded-full border-2 border-[#EB662B] animate-ping opacity-40 group-hover:opacity-0 delay-75"></div>
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