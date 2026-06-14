import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Clock, Search, Loader2, MessageCircle, UserPlus } from 'lucide-react';
import { 
  useGetFriendships, 
  useGetPendingRequests, 
  useRespondToRequest, 
  useDeleteFriendship,
  useSendFriendRequest,
  friendQueryKeys
} from '../hooks/useFriends';
import { useCreateChatRoom } from '../../chat/hooks/useChatSignalR';

import { useSearchUsers } from '../../../users/hooks/useUsers';
import { useToast } from '../../../../contexts/ToastContext';
import * as signalR from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PATH } from '../../../../config/routes/route';
import { useTranslation } from '../../../../contexts/LocaleContext';

export const FriendsManagement: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'add'>('friends');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const { success, error, warning } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: friends = [], isLoading: isLoadingFriends } = useGetFriendships();
  const { data: pendingRequests = [], isLoading: isLoadingPending } = useGetPendingRequests();
  const { 
    data: searchResult, 
    isLoading: isSearching, 
    isFetching: isFetchingSearch, 
    isError: isSearchError 
  } = useSearchUsers(debouncedQuery);
  
  const { mutate: respondRequest, isPending: isResponding } = useRespondToRequest();
  const { mutate: deleteFriend, isPending: isDeleting } = useDeleteFriendship();
  const { mutate: sendRequest, isPending: isSending } = useSendFriendRequest();
  const { mutate: createChat, isPending: isCreatingChat } = useCreateChatRoom();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7010/hubs/friendship", {
        accessTokenFactory: () => localStorage.getItem('accessToken') || ''
      })
      .configureLogging(signalR.LogLevel.None)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveFriendRequest", () => {
      success(t('social.newFriendRequest'));
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.pending() });
    });

    connection.on("FriendRequestResponded", (_responderId: number, status: string) => {
      if (status === 'Accepted') {
        success(t('social.requestAccepted'));
        queryClient.invalidateQueries({ queryKey: friendQueryKeys.pending() });
        queryClient.invalidateQueries({ queryKey: friendQueryKeys.lists() });
      } else if (status === 'Declined') {
        queryClient.invalidateQueries({ queryKey: friendQueryKeys.pending() });
      }
    });

    connection.on("FriendshipDeleted", () => {
      warning(t('social.unfriendedYou'));
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.lists() });
    });

    connection.start().catch((err) => {
      if (err.name === 'AbortError' || err.message.includes('negotiation')) {
        console.warn("SignalR: Negotiation cancelled due to React Strict Mode re-mount (Ignorable).");
      } else {
        console.error("SignalR Connection Error: ", err);
      }
    });

    return () => {
      connection.stop();
    };

  }, [queryClient, success, warning, t]);

  const handleRespond = (requestId: number, isAccepted: boolean) => {
    respondRequest(
      { requestId, isAccepted },
      {
        onSuccess: () => success(isAccepted ? t("social.friendRequestAccepted") : t("social.friendRequestDeclined")),
        onError: (err: any) => {
          console.error("ERROR ACCEPT/DECLINE:", err.response?.data);
          
          const validationErrors = err.response?.data?.errors;
          let errorDetail = "";
          if (validationErrors) {
             errorDetail = Object.values(validationErrors).flat().join(" | ");
          }
          
          const msg = errorDetail || err.response?.data?.message || err.response?.data || t("social.invalidDtoError");
          error(typeof msg === 'string' ? msg : t("social.unknownSystemError"));
        }
      }
    );
  };

  const handleUnfriend = (friendshipId: number) => {
    if (window.confirm(t("social.confirmUnfriend"))) {
      deleteFriend(friendshipId, {
        onSuccess: () => success(t("social.removedFromFriends")),
        onError: () => error(t("social.failedToUnfriend"))
      });
    }
  };

  const handleSendRequest = (receiverId: number) => {
    sendRequest(
      { receiverId },
      {
        onSuccess: () => success(t("social.friendRequestSent")),
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.response?.data || t("social.failedToSendRequest");
          error(typeof msg === 'string' ? msg : t("social.unknownSystemError"));
        }
      }
    );
  };

  const handleCreateChat = (friendId: number) => {
    createChat(friendId, {
      onSuccess: (newRoom) => {
        const roomId = newRoom?.data?.id || newRoom?.data?.Id || newRoom?.id || newRoom?.Id;

        if (roomId) {
          navigate(`${PATH.CUSTOMER.SOCIAL_CHAT}?roomId=${roomId}`);
        } else {
          error(t('social.couldNotGetChatRoom'));
        }
      },
      onError: (err: any) => {
        const msg =
          err.response?.data?.message ||
          err.response?.data ||
          t('social.errorCreatingChatRoom');
        error(typeof msg === 'string' ? msg : t('social.unknownSystemError'));
      },
    });
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{t('social.friendsManagement')}</h1>

      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('friends')}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'friends' ? 'text-brand' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {t('social.myFriends')} ({Array.isArray(friends) ? friends.length : 0})
          {activeTab === 'friends' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-md" />}
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'pending' ? 'text-brand' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {t('social.requests')} ({Array.isArray(pendingRequests) ? pendingRequests.length : 0})
          {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-md" />}
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'add' ? 'text-brand' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Search className="w-4 h-4" />
          {t('social.findFriends')}
          {activeTab === 'add' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-md" />}
        </button>
      </div>

      {activeTab === 'friends' && (
        <div className="flex flex-col gap-4">
          {isLoadingFriends && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-400" /></div>}
          {!isLoadingFriends && Array.isArray(friends) && friends.length === 0 && (
            <div className="text-center py-10 text-slate-500 border border-dashed border-slate-200 rounded-lg">
              {t('social.noFriendsYet')}
            </div>
          )}
          {Array.isArray(friends) && friends.map(friend => {
            const fAvatar = friend?.friendAvatarUrl || (friend as any)?.FriendAvatarUrl;
            return (
            <div key={friend?.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate(`/social/profile/${friend?.friendId}`)}
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                  {fAvatar ? <img src={fAvatar} alt="" className="w-full h-full object-cover" /> : (friend?.friendName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:underline">{friend?.friendName || t('auth.unknown')}</h3>
                  <p className="text-xs text-slate-500 capitalize">{friend?.status || t('social.friend')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleCreateChat(friend?.friendId)}
                  disabled={isCreatingChat}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-brand rounded-md hover:bg-brand-hover transition-colors disabled:opacity-50"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('social.message')}
                </button>
                <button 
                  onClick={() => handleUnfriend(friend?.id)}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  <UserX className="w-4 h-4" />
                  {t('social.unfriend')}
                </button>
              </div>
            </div>
          )})}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="flex flex-col gap-4">
          {isLoadingPending && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-400" /></div>}
          {!isLoadingPending && Array.isArray(pendingRequests) && pendingRequests.length === 0 && (
            <div className="text-center py-10 text-slate-500 border border-dashed border-slate-200 rounded-lg">
              {t('social.noPendingRequests')}
            </div>
          )}
          {Array.isArray(pendingRequests) && pendingRequests.map(req => {
            const pAvatar = req?.senderAvatarUrl || (req as any)?.SenderAvatarUrl;
            return (
            <div key={req?.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate(`/social/profile/${req?.senderId}`)}
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                  {pAvatar ? <img src={pAvatar} alt="" className="w-full h-full object-cover" /> : (req?.senderName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:underline">{req?.senderName || t('auth.unknown')}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{req?.createdAt ? new Date(req.createdAt).toLocaleDateString() : t('common.na')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleRespond(req?.id, true)}
                  disabled={isResponding}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-brand rounded-md hover:bg-brand-hover transition-colors disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  {t('social.accept')}
                </button>
                <button 
                  onClick={() => handleRespond(req?.id, false)}
                  disabled={isResponding}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  <UserX className="w-4 h-4" />
                  {t('social.decline')}
                </button>
              </div>
            </div>
          )})}
        </div>
      )}

      {activeTab === 'add' && (
        <div className="flex flex-col gap-6">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <h2 className="text-base font-semibold text-slate-900 mb-2">{t('social.findPeople')}</h2>
            <p className="text-sm text-slate-500 mb-4">
              {t('social.findPeopleDesc')}
            </p>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none text-sm"
                placeholder={t('social.searchNamesPlaceholder')}
              />
            </div>
          </div>

          {(isSearching || isFetchingSearch) && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-brand animate-spin" />
            </div>
          )}

          {isSearchError && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-100">
              {t('social.connectionError')}
            </div>
          )}

          {!isSearching && !isSearchError && debouncedQuery && searchResult && Array.isArray(searchResult.data) && searchResult.data.length === 0 && (
            <div className="text-center py-10 text-slate-500 border border-dashed border-slate-200 rounded-lg">
              {t('social.noUsersMatching', { query: debouncedQuery })}
            </div>
          )}

          {!isSearching && !isSearchError && searchResult && Array.isArray(searchResult.data) && searchResult.data.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">{t('social.results', { count: searchResult.total })}</h3>
              {searchResult.data.map(user => {
                const sAvatar = user?.avatarUrl || (user as any)?.AvatarUrl || (user as any)?.Picture || null;
                return (
                <div key={user?.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div 
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => navigate(`/social/profile/${user?.id}`)}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                      {sAvatar ? <img src={sAvatar} alt="" className="w-full h-full object-cover" /> : (user?.fullName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:underline">{user?.fullName || t('auth.unknown')}</h3>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendRequest(user?.id)}
                      disabled={isSending}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#0068E0] text-white text-xs font-semibold rounded-lg hover:bg-[#0058D0] transition-colors disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      {t('social.addFriend')}
                    </button>
                    <button
                      onClick={() => handleCreateChat(user?.id)}
                      disabled={isCreatingChat}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {t('social.message')}
                    </button>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
