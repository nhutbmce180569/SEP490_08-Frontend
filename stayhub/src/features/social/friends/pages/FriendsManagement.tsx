import React, { useState, useEffect, useContext } from 'react';
import { UserCheck, UserX, Clock, Search, Loader2, MessageCircle, UserPlus, Users } from 'lucide-react';
import { 
  useGetFriendships, 
  useGetPendingRequests, 
  useRespondToRequest, 
  useDeleteFriendship,
  useSendFriendRequest,
  useGetSentRequests,
  useGetPaginatedFriendList,
  useGetSuggestions,
  friendQueryKeys
} from '../hooks/useFriends';
import { useCreateChatRoom } from '../../chat/hooks/useChatSignalR';

import { useSearchUsers } from '../../../users/hooks/useUsers';
import { useToast } from '../../../../contexts/ToastContext';
import * as signalR from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PATH } from '../../../../config/routes/route';
import { useTranslation } from '../../../../contexts/LocaleContext';
import { ConfirmDialog } from '../../../../components/dashboard/ConfirmDialog';
import { AuthContext } from '../../../../contexts/AuthContext';
import { PaginationButton } from '../../../../components/dashboard/PaginationButton';

import { SIGNALR_HUB_BASE } from '../../../../config/api/api';

export const FriendsManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useContext(AuthContext);
  const userRoles = currentUser?.roles 
    ? (Array.isArray(currentUser.roles) ? currentUser.roles : [currentUser.roles]) 
    : [];
  const currentUserIsStaffOrAdmin = userRoles.includes("Admin") || userRoles.includes("Manager") || userRoles.includes("Staff");

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as any;
  const initialTab = ['friends', 'pending', 'sent', 'add', 'suggestions'].includes(tabParam)
    ? tabParam
    : 'friends';

  const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'sent' | 'add' | 'suggestions'>(initialTab);

  useEffect(() => {
    if (tabParam && ['friends', 'pending', 'sent', 'add', 'suggestions'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'friends' | 'pending' | 'sent' | 'add' | 'suggestions') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [friendToUnfriend, setFriendToUnfriend] = useState<number | null>(null);
  const [hiddenSuggestionIds, setHiddenSuggestionIds] = useState<number[]>([]);

  // Phân trang danh sách bạn bè, tìm kiếm, lời mời nhận/gửi
  const [friendsPage, setFriendsPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [sentPage, setSentPage] = useState(1);
  const pageSize = 8; // Đặt kích thước nhỏ hơn để vừa với lưới layout card của Facebook
  
  const { success, error, warning } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: allFriendships = [] } = useGetFriendships();
  const { data: paginatedFriends, isLoading: isLoadingFriends } = useGetPaginatedFriendList(friendsPage, pageSize);
  const friends = paginatedFriends?.data || [];
  const totalFriends = paginatedFriends?.total || 0;
  const totalPages = Math.ceil(totalFriends / pageSize);

  const { data: pendingRequests = [], isLoading: isLoadingPending } = useGetPendingRequests();
  const totalPending = pendingRequests.length;
  const totalPendingPages = Math.ceil(totalPending / pageSize);
  const paginatedPending = pendingRequests.slice((pendingPage - 1) * pageSize, pendingPage * pageSize);

  const { data: sentRequests = [] } = useGetSentRequests();
  const totalSent = sentRequests.length;
  const totalSentPages = Math.ceil(totalSent / pageSize);
  const paginatedSent = sentRequests.slice((sentPage - 1) * pageSize, sentPage * pageSize);

  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useGetSuggestions();
  const filteredSuggestions = suggestions.filter(s => !hiddenSuggestionIds.includes(s.id));

  const { 
    data: searchResult, 
    isLoading: isSearching, 
    isFetching: isFetchingSearch, 
    isError: isSearchError 
  } = useSearchUsers(debouncedQuery, searchPage, pageSize);
  
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
    setSearchPage(1);
  }, [debouncedQuery]);

  useEffect(() => {
    if (pendingPage > 1 && paginatedPending.length === 0) {
      setPendingPage(Math.max(1, totalPendingPages));
    }
  }, [pendingRequests.length, pendingPage, totalPendingPages, paginatedPending.length]);

  useEffect(() => {
    if (sentPage > 1 && paginatedSent.length === 0) {
      setSentPage(Math.max(1, totalSentPages));
    }
  }, [sentRequests.length, sentPage, totalSentPages, paginatedSent.length]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${SIGNALR_HUB_BASE}/friendship`, {
        accessTokenFactory: () => localStorage.getItem('accessToken') || ''
      })
      .configureLogging(signalR.LogLevel.None)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveFriendRequest", () => {
      success(t('social.newFriendRequest'));
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.all });
    });

    connection.on("FriendRequestResponded", (_responderId: number, status: string) => {
      if (status === 'Accepted') {
        success(t('social.requestAccepted'));
        queryClient.invalidateQueries({ queryKey: friendQueryKeys.all });
      } else if (status === 'Declined') {
        queryClient.invalidateQueries({ queryKey: friendQueryKeys.all });
      }
    });

    connection.on("FriendshipDeleted", () => {
      warning(t('social.unfriendedYou'));
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.all });
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

  const handleUnfriendClick = (friendshipId: number) => {
    setFriendToUnfriend(friendshipId);
    setIsConfirmOpen(true);
  };

  const executeUnfriend = () => {
    if (friendToUnfriend !== null) {
      deleteFriend(friendToUnfriend, {
        onSuccess: () => {
          success(t("social.removedFromFriends"));
          setIsConfirmOpen(false);
          setFriendToUnfriend(null);
        },
        onError: () => {
          error(t("social.failedToUnfriend"));
          setIsConfirmOpen(false);
          setFriendToUnfriend(null);
        }
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
        const msg = err.response?.data?.message || err.response?.data || t('social.errorCreatingChatRoom');
        error(typeof msg === 'string' ? msg : t('social.unknownSystemError'));
      },
    });
  };

  return (
    <div className="page-container py-4 md:py-6 animate-fade-in">
      <div className="flex flex-col md:flex-row min-h-[82vh] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
      {/* Sidebar - Cột bên trái */}
      <div className="w-full md:w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 shrink-0 md:h-[82vh] overflow-y-auto custom-scrollbar">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('social.friendsManagement') || 'Friends'}</h1>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">{t('social.friendsSubtitle') || 'Search, connect, and stay in touch'}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => handleTabChange('friends')}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'friends'
                ? 'bg-brand/10 text-brand'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
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
            onClick={() => handleTabChange('pending')}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-brand/10 text-brand'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
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
            onClick={() => handleTabChange('sent')}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-brand/10 text-brand'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
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
            onClick={() => handleTabChange('add')}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'add' || activeTab === 'suggestions'
                ? 'bg-brand/10 text-brand'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <UserPlus className="w-5 h-5" />
              <span>{t('social.findFriends') || 'Find & Suggestions'}</span>
            </div>
            {filteredSuggestions.length > 0 && (
              <span className="text-xs bg-brand/20 px-2 py-0.5 rounded-full text-brand font-bold">
                {filteredSuggestions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Panel - Cột bên phải */}
      <div className="flex-1 p-6 md:p-8 md:h-[82vh] overflow-y-auto custom-scrollbar flex flex-col gap-6">
        
        {/* TAB 1: DANH SÁCH BẠN BÈ */}
        {activeTab === 'friends' && (
          <div className="flex flex-col gap-6 h-full">
            <div>
              <h2 className="text-lg font-black text-slate-900">{t('social.myFriends') || 'My Friends'}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{t('social.myFriendsDesc') || 'People you have connected with on StayHub'}</p>
            </div>

            {isLoadingFriends && (
              <div className="flex justify-center py-16 flex-1 items-center">
                <Loader2 className="animate-spin text-slate-400 w-8 h-8" />
              </div>
            )}

            {!isLoadingFriends && friends.length === 0 && (
              <div className="text-center py-20 text-slate-500 border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col items-center justify-center gap-3 flex-1">
                <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{t('social.noFriendsYet') || 'No friends yet'}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('social.noFriendsSub') || 'Find new friends in the Suggestions or Find Friends tab to start connecting!'}</p>
                </div>
              </div>
            )}

            {friends.length > 0 && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {friends.map(friend => {
                    const fAvatar = friend?.friendAvatarUrl || (friend as any)?.FriendAvatarUrl;
                    return (
                      <div 
                        key={friend?.id} 
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-brand/20 transition-all duration-300 flex flex-col group"
                      >
                        <div 
                          className="relative aspect-square w-full bg-slate-100 cursor-pointer overflow-hidden"
                          onClick={() => navigate(`/social/profile/${friend?.friendId}`)}
                        >
                          {fAvatar ? (
                            <img src={fAvatar} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 text-3xl font-black text-slate-400 group-hover:scale-105 transition-transform duration-300">
                              {(friend?.friendName || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                          <div>
                            <h3 
                              className="font-bold text-slate-900 hover:text-brand transition-colors cursor-pointer line-clamp-1 text-sm"
                              onClick={() => navigate(`/social/profile/${friend?.friendId}`)}
                            >
                              {friend?.friendName || t('auth.unknown')}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 select-all">{friend?.friendEmail || 'friend@stayhub.com'}</p>
                          </div>

                          <div className="flex flex-col gap-1.5 mt-2">
                            <button 
                              onClick={() => handleCreateChat(friend?.friendId)}
                              disabled={isCreatingChat}
                              className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-white bg-[#0068E0] hover:bg-[#0058D0] rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{t('social.message') || 'Message'}</span>
                            </button>
                            <button 
                              onClick={() => handleUnfriendClick(friend?.id)}
                              disabled={isDeleting}
                              className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>{t('social.unfriend') || 'Unfriend'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="mt-4">
                    <PaginationButton
                      currentPage={friendsPage}
                      totalPages={totalPages}
                      totalItems={totalFriends}
                      pageSize={pageSize}
                      onPageChange={(p) => setFriendsPage(p)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LỜI MỜI NHẬN */}
        {activeTab === 'pending' && (
          <div className="flex flex-col gap-6 h-full">
            <div>
              <h2 className="text-lg font-black text-slate-900">{t('social.requests') || 'Received Requests'}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{t('social.requestsDesc') || 'People who want to connect with you'}</p>
            </div>

            {isLoadingPending && (
              <div className="flex justify-center py-16 flex-1 items-center">
                <Loader2 className="animate-spin text-slate-400 w-8 h-8" />
              </div>
            )}

            {!isLoadingPending && pendingRequests.length === 0 && (
              <div className="text-center py-20 text-slate-500 border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col items-center justify-center gap-3 flex-1">
                <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <UserCheck className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{t('social.noPendingRequests') || 'No pending requests'}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('social.noPendingRequestsSub') || 'New friend requests received will appear here.'}</p>
                </div>
              </div>
            )}

            {pendingRequests.length > 0 && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {paginatedPending.map(req => {
                    const pAvatar = req?.senderAvatarUrl || (req as any)?.SenderAvatarUrl;
                    return (
                      <div 
                        key={req?.id} 
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-brand/20 transition-all duration-300 flex flex-col group"
                      >
                        <div 
                          className="relative aspect-square w-full bg-slate-100 cursor-pointer overflow-hidden"
                          onClick={() => navigate(`/social/profile/${req?.senderId}`)}
                        >
                          {pAvatar ? (
                            <img src={pAvatar} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 text-3xl font-black text-slate-400 group-hover:scale-105 transition-transform duration-300">
                              {(req?.senderName || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                          <div>
                            <h3 
                              className="font-bold text-slate-900 hover:text-brand transition-colors cursor-pointer line-clamp-1 text-sm"
                              onClick={() => navigate(`/social/profile/${req?.senderId}`)}
                            >
                              {req?.senderName || t('auth.unknown')}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{req?.createdAt ? new Date(req.createdAt).toLocaleDateString() : t('common.na')}</span>
                            </p>
                          </div>

                          <div className="flex flex-col gap-1.5 mt-2">
                            <button 
                              onClick={() => handleRespond(req?.id, true)}
                              disabled={isResponding}
                              className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-hover rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{t('social.accept') || 'Accept'}</span>
                            </button>
                            <button 
                              onClick={() => handleRespond(req?.id, false)}
                              disabled={isResponding}
                              className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>{t('social.decline') || 'Decline'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPendingPages > 1 && (
                  <div className="mt-4">
                    <PaginationButton
                      currentPage={pendingPage}
                      totalPages={totalPendingPages}
                      totalItems={totalPending}
                      pageSize={pageSize}
                      onPageChange={(p) => setPendingPage(p)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LỜI MỜI ĐÃ GỬI */}
        {activeTab === 'sent' && (
          <div className="flex flex-col gap-6 h-full">
            <div>
              <h2 className="text-lg font-black text-slate-900">{t('social.sentRequests') || 'Sent Requests'}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{t('social.sentRequestsDesc') || 'People you have sent friend requests to'}</p>
            </div>

            {sentRequests.length === 0 && (
              <div className="text-center py-20 text-slate-500 border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col items-center justify-center gap-3 flex-1">
                <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{t('social.noSentRequests') || 'No sent requests'}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('social.noSentRequestsSub') || 'Sent friend requests will appear here.'}</p>
                </div>
              </div>
            )}

            {sentRequests.length > 0 && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {paginatedSent.map(req => {
                    const sAvatar = req?.senderAvatarUrl || (req as any)?.SenderAvatarUrl;
                    return (
                      <div 
                        key={req?.id} 
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-brand/20 transition-all duration-300 flex flex-col group"
                      >
                        <div 
                          className="relative aspect-square w-full bg-slate-100 cursor-pointer overflow-hidden"
                          onClick={() => navigate(`/social/profile/${req?.senderId}`)}
                        >
                          {sAvatar ? (
                            <img src={sAvatar} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 text-3xl font-black text-slate-400 group-hover:scale-105 transition-transform duration-300">
                              {(req?.senderName || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                          <div>
                            <h3 
                              className="font-bold text-slate-900 hover:text-brand transition-colors cursor-pointer line-clamp-1 text-sm"
                              onClick={() => navigate(`/social/profile/${req?.senderId}`)}
                            >
                              {req?.senderName || t('auth.unknown')}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{req?.createdAt ? new Date(req.createdAt).toLocaleDateString() : t('common.na')}</span>
                            </p>
                          </div>

                          <div className="flex flex-col gap-1.5 mt-2">
                            <button 
                              onClick={() => handleUnfriendClick(req?.id)}
                              disabled={isDeleting}
                              className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>{t('social.cancelRequest') || 'Cancel Request'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalSentPages > 1 && (
                  <div className="mt-4">
                    <PaginationButton
                      currentPage={sentPage}
                      totalPages={totalSentPages}
                      totalItems={totalSent}
                      pageSize={pageSize}
                      onPageChange={(p) => setSentPage(p)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4 & 5: TÌM BẠN BÈ & GỢI Ý KẾT BẠN (COMBINED SEARCH + SUGGESTIONS) */}
        {(activeTab === 'add' || activeTab === 'suggestions') && (
          <div className="flex flex-col gap-8">
            {/* Search Box Header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">{t('social.findPeople')}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{t('social.findPeopleDesc')}</p>
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none text-sm bg-white"
                  placeholder={t('social.searchNamesPlaceholder')}
                />
              </div>
            </div>

            {/* Search Results (Visible when search input is typed) */}
            {searchInput.trim() !== '' && (
              <div className="flex flex-col gap-4">
                {(isSearching || isFetchingSearch) && (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-slate-400 w-8 h-8" />
                  </div>
                )}

                {!isSearching && !isFetchingSearch && (!searchResult || !Array.isArray(searchResult.data) || searchResult.data.length === 0) && (
                  <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm">
                    {t('social.noMatchingUsers') || 'No matching users found.'}
                  </div>
                )}

                {!isSearching && !isSearchError && searchResult && Array.isArray(searchResult.data) && searchResult.data.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('social.results', { count: searchResult.total })}</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {searchResult.data
                        .filter(user => user?.id !== currentUser?.id)
                        .map(user => {
                          const sAvatar = user?.avatarUrl || (user as any)?.AvatarUrl || (user as any)?.Picture || null;
                          const isFriend = allFriendships.some((f: any) => (f.friendId || f.FriendId) === user?.id);
                          const isSent = sentRequests.some((r: any) => (r.senderId || r.SenderId) === user?.id);
                          const incomingReq = pendingRequests.find((r: any) => (r.senderId || r.SenderId) === user?.id);
                          const hasIncoming = !!incomingReq;
                          
                          const targetIsStaffOrAdmin = user?.roleNames?.some(
                            (r: string) => ['admin', 'manager', 'staff'].includes(r.toLowerCase())
                          );
                          const canChat = isFriend || targetIsStaffOrAdmin || currentUserIsStaffOrAdmin;

                          return (
                            <div 
                              key={user?.id} 
                              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-brand/20 transition-all duration-300 flex flex-col group"
                            >
                              <div 
                                className="relative aspect-square w-full bg-slate-100 cursor-pointer overflow-hidden"
                                onClick={() => navigate(`/social/profile/${user?.id}`)}
                              >
                                {sAvatar ? (
                                  <img src={sAvatar} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 text-3xl font-black text-slate-400 group-hover:scale-105 transition-transform duration-300">
                                    {(user?.fullName || 'U').charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                                <div>
                                  <div className="flex flex-col gap-1">
                                    <h3 
                                      className="font-bold text-slate-900 hover:text-brand transition-colors cursor-pointer line-clamp-1 text-sm"
                                      onClick={() => navigate(`/social/profile/${user?.id}`)}
                                    >
                                      {user?.fullName || t('auth.unknown')}
                                    </h3>
                                    {isFriend ? (
                                      <span className="text-[9px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full uppercase tracking-wider self-start">
                                        {t('social.friend') || 'Friend'}
                                      </span>
                                    ) : targetIsStaffOrAdmin ? (
                                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider self-start">
                                        System {user?.roleNames?.find((r: string) => r === "Admin" || r === "Manager" || r === "Staff")}
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 select-all">{user?.email}</p>
                                </div>

                                <div className="flex flex-col gap-1.5 mt-2">
                                  {isFriend ? (
                                    <button 
                                      disabled
                                      className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span>{t('social.friend') || 'Friend'}</span>
                                    </button>
                                  ) : isSent ? (
                                    <button
                                      disabled
                                      className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-100 text-slate-400 text-xs font-semibold rounded-lg border border-slate-200 cursor-not-allowed"
                                    >
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>{t('social.requestSent') || 'Request Sent'}</span>
                                    </button>
                                  ) : hasIncoming ? (
                                    <button
                                      onClick={() => handleRespond(incomingReq.id, true)}
                                      disabled={isResponding}
                                      className="flex items-center justify-center gap-1.5 w-full py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span>{t('social.accept') || 'Accept'}</span>
                                    </button>
                                  ) : targetIsStaffOrAdmin ? null : (
                                    <button
                                      onClick={() => handleSendRequest(user?.id)}
                                      disabled={isSending}
                                      className="flex items-center justify-center gap-1.5 w-full py-2 bg-[#0068E0] text-white text-xs font-semibold rounded-lg hover:bg-[#0058D0] transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                      <UserPlus className="w-3.5 h-3.5" />
                                      <span>{t('social.addFriend') || 'Add Friend'}</span>
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => canChat && handleCreateChat(user?.id)}
                                    disabled={isCreatingChat || !canChat}
                                    className={`flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold rounded-lg transition-colors border ${
                                      canChat
                                        ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-brand hover:border-brand/30 cursor-pointer"
                                        : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                                    }`}
                                    title={!canChat ? t('social.chatRestrictionTooltip') || "Direct messaging is restricted to friends, staff, managers, or admins" : ""}
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>{t('social.message') || 'Message'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {searchResult.total > pageSize && (
                      <div className="mt-4">
                        <PaginationButton
                          currentPage={searchPage}
                          totalPages={Math.ceil(searchResult.total / pageSize)}
                          totalItems={searchResult.total}
                          pageSize={pageSize}
                          onPageChange={(p) => setSearchPage(p)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Friend Suggestions Section (Directly underneath the Search bar / Search results) */}
            <div className="flex flex-col gap-6 pt-2 border-t border-slate-200/60">
              <div>
                <h2 className="text-lg font-black text-slate-900">{t('social.friendSuggestions') || 'Friend Suggestions'}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{t('social.suggestionsDesc') || 'People you may know from shared tour schedules or mutual friends'}</p>
              </div>

              {isLoadingSuggestions && (
                <div className="flex justify-center py-16 flex-1 items-center">
                  <Loader2 className="animate-spin text-slate-400 w-8 h-8" />
                </div>
              )}

              {!isLoadingSuggestions && filteredSuggestions.length === 0 && (
                <div className="text-center py-16 text-slate-500 border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <UserPlus className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{t('social.noSuggestions') || 'No suggestions'}</p>
                    <p className="text-xs text-slate-400 mt-1">{t('social.noSuggestionsSub') || 'We will suggest connections when you join new trips or share mutual friends.'}</p>
                  </div>
                </div>
              )}

              {filteredSuggestions.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredSuggestions.map(sug => {
                    return (
                      <div 
                        key={sug?.id} 
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-brand/20 transition-all duration-300 flex flex-col group"
                      >
                        <div 
                          className="relative aspect-square w-full bg-slate-100 cursor-pointer overflow-hidden"
                          onClick={() => navigate(`/social/profile/${sug?.id}`)}
                        >
                          {sug?.avatarUrl ? (
                            <img src={sug.avatarUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 text-3xl font-black text-slate-400 group-hover:scale-105 transition-transform duration-300">
                              {(sug?.fullName || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                          <div>
                            <h3 
                              className="font-bold text-slate-900 hover:text-brand transition-colors cursor-pointer line-clamp-1 text-sm"
                              onClick={() => navigate(`/social/profile/${sug?.id}`)}
                            >
                              {sug?.fullName || t('auth.unknown')}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 select-all">{sug?.email}</p>
                          </div>

                          <div className="flex flex-col gap-1.5 mt-2">
                            <button 
                              onClick={() => handleSendRequest(sug?.id)}
                              disabled={isSending}
                              className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-hover rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>{t('social.addFriend') || 'Add Friend'}</span>
                            </button>
                            <button 
                              onClick={() => setHiddenSuggestionIds(prev => [...prev, sug.id])}
                              className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <span>{t('social.removeSuggestion') || 'Remove'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setFriendToUnfriend(null);
        }}
        onConfirm={executeUnfriend}
        title={t("social.confirmUnfriendTitle") || "Unfriend"}
        message={t("social.confirmUnfriend") || "Are you sure you want to unfriend this user?"}
        variant="warning"
      />
    </div>
  </div>
  );
};
