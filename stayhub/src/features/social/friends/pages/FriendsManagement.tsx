import React, { useState, useEffect, useContext } from 'react';
import { UserCheck, UserX, Clock, Search, Loader2, MessageCircle, UserPlus } from 'lucide-react';
import { 
  useGetFriendships, 
  useGetPendingRequests, 
  useRespondToRequest, 
  useDeleteFriendship,
  useSendFriendRequest,
  useGetSentRequests,
  useGetPaginatedFriendList,
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

  const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'sent' | 'add'>('friends');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [friendToUnfriend, setFriendToUnfriend] = useState<number | null>(null);

  // Phân trang danh sách bạn bè, tìm kiếm, lời mời nhận/gửi
  const [friendsPage, setFriendsPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [sentPage, setSentPage] = useState(1);
  const pageSize = 10;
  
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
          {t('social.requests') || 'Lời mời nhận'} ({Array.isArray(pendingRequests) ? pendingRequests.length : 0})
          {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-md" />}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'sent' ? 'text-brand' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {t('social.sentRequests') || 'Lời mời đã gửi'} ({Array.isArray(sentRequests) ? sentRequests.length : 0})
          {activeTab === 'sent' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-md" />}
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
          {isLoadingFriends && (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-slate-400 w-8 h-8" />
            </div>
          )}
          {!isLoadingFriends && Array.isArray(friends) && friends.length === 0 && (
            <div className="text-center py-16 text-slate-500 border border-dashed border-slate-200 rounded-xl bg-white shadow-sm flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{t('social.noFriendsYet')}</p>
                <p className="text-xs text-slate-400 mt-1">Tìm kiếm bạn bè mới ở tab "Tìm bạn bè" để bắt đầu kết nối!</p>
              </div>
            </div>
          )}
          {Array.isArray(friends) && friends.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3">
                {friends.map(friend => {
                  const fAvatar = friend?.friendAvatarUrl || (friend as any)?.FriendAvatarUrl;
                  return (
                    <div 
                      key={friend?.id} 
                      className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm hover:shadow-md hover:border-brand/20 transition-all duration-300 group"
                    >
                      <div 
                        className="flex items-center gap-4 cursor-pointer"
                        onClick={() => navigate(`/social/profile/${friend?.friendId}`)}
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-500 border border-slate-200 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                          {fAvatar ? <img src={fAvatar} alt="" className="w-full h-full object-cover" /> : (friend?.friendName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand transition-colors">
                              {friend?.friendName || t('auth.unknown')}
                            </h3>
                            <span className="text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {t('social.friend') || 'Bạn bè'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 select-all">
                            {friend?.friendEmail || 'friend@stayhub.com'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleCreateChat(friend?.friendId)}
                          disabled={isCreatingChat}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0068E0] hover:bg-[#0058D0] rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                          {t('social.message') || 'Nhắn tin'}
                        </button>
                        <button 
                          onClick={() => handleUnfriendClick(friend?.id)}
                          disabled={isDeleting}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:text-red-600 hover:border-red-200 hover:bg-red-50/30 transition-colors disabled:opacity-50 cursor-pointer"
                          title={t('social.unfriend')}
                        >
                          <UserX className="w-4 h-4" />
                          <span>{t('social.unfriend') || 'Hủy kết bạn'}</span>
                        </button>
                      </div>
                    </div>
                  )
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

      {activeTab === 'pending' && (
        <div className="flex flex-col gap-4">
          {isLoadingPending && (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-slate-400 w-8 h-8" />
            </div>
          )}
          {!isLoadingPending && Array.isArray(pendingRequests) && pendingRequests.length === 0 && (
            <div className="text-center py-16 text-slate-500 border border-dashed border-slate-200 rounded-xl bg-white shadow-sm flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{t('social.noPendingRequests')}</p>
                <p className="text-xs text-slate-400 mt-1">Các lời mời kết bạn mới nhận được sẽ xuất hiện tại đây.</p>
              </div>
            </div>
          )}
          {Array.isArray(pendingRequests) && pendingRequests.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3">
                {paginatedPending.map(req => {
                  const pAvatar = req?.senderAvatarUrl || (req as any)?.SenderAvatarUrl;
                  return (
                    <div 
                      key={req?.id} 
                      className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm hover:shadow-md hover:border-brand/20 transition-all duration-300 group"
                    >
                      <div 
                        className="flex items-center gap-4 cursor-pointer"
                        onClick={() => navigate(`/social/profile/${req?.senderId}`)}
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-500 border border-slate-200 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                          {pAvatar ? <img src={pAvatar} alt="" className="w-full h-full object-cover" /> : (req?.senderName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand transition-colors">
                              {req?.senderName || t('auth.unknown')}
                            </h3>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <Clock className="w-3 h-3 animate-pulse" />
                              {t('social.requests') || 'Lời mời nhận'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{req?.createdAt ? new Date(req.createdAt).toLocaleDateString() : t('common.na')}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleRespond(req?.id, true)}
                          disabled={isResponding}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-hover rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4" />
                          {t('social.accept') || 'Chấp nhận'}
                        </button>
                        <button 
                          onClick={() => handleRespond(req?.id, false)}
                          disabled={isResponding}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:text-red-600 hover:border-red-200 hover:bg-red-50/30 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <UserX className="w-4 h-4" />
                          {t('social.decline') || 'Từ chối'}
                        </button>
                      </div>
                    </div>
                  )
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

      {activeTab === 'sent' && (
        <div className="flex flex-col gap-4">
          {Array.isArray(sentRequests) && sentRequests.length === 0 && (
            <div className="text-center py-16 text-slate-500 border border-dashed border-slate-200 rounded-xl bg-white shadow-sm flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{t('social.noSentRequests') || 'Chưa gửi lời mời nào'}</p>
                <p className="text-xs text-slate-400 mt-1">Các yêu cầu kết bạn bạn đã gửi đi sẽ xuất hiện tại đây.</p>
              </div>
            </div>
          )}
          {Array.isArray(sentRequests) && sentRequests.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3">
                {paginatedSent.map(req => {
                  const sAvatar = req?.senderAvatarUrl || (req as any)?.SenderAvatarUrl;
                  return (
                    <div 
                      key={req?.id} 
                      className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm hover:shadow-md hover:border-brand/20 transition-all duration-300 group"
                    >
                      <div 
                        className="flex items-center gap-4 cursor-pointer"
                        onClick={() => navigate(`/social/profile/${req?.senderId}`)}
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-500 border border-slate-200 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                          {sAvatar ? <img src={sAvatar} alt="" className="w-full h-full object-cover" /> : (req?.senderName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand transition-colors">
                              {req?.senderName || t('auth.unknown')}
                            </h3>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {t('social.requestSent') || 'Đã gửi'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{req?.createdAt ? new Date(req.createdAt).toLocaleDateString() : t('common.na')}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleUnfriendClick(req?.id)}
                          disabled={isDeleting}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <UserX className="w-4 h-4" />
                          {t('social.cancelRequest') || 'Hủy yêu cầu'}
                        </button>
                      </div>
                    </div>
                  )
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
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none text-sm bg-white"
                placeholder={t('social.searchNamesPlaceholder')}
              />
            </div>
          </div>

          {searchInput.trim() !== '' && (isSearching || isFetchingSearch) && (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-slate-400 w-8 h-8" />
            </div>
          )}

          {!isSearching && !isFetchingSearch && searchInput.trim() !== '' && (!searchResult || !Array.isArray(searchResult.data) || searchResult.data.length === 0) && (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 rounded-xl bg-white shadow-sm">
              {t('social.noMatchingUsers') || 'Không tìm thấy người dùng phù hợp.'}
            </div>
          )}

          {!isSearching && !isSearchError && searchResult && Array.isArray(searchResult.data) && searchResult.data.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">{t('social.results', { count: searchResult.total })}</h3>
              <div className="flex flex-col gap-3">
                {searchResult.data
                  .filter(user => user?.id !== currentUser?.id) // Lọc bỏ chính bản thân khỏi kết quả tìm kiếm
                  .map(user => {
                    const sAvatar = user?.avatarUrl || (user as any)?.AvatarUrl || (user as any)?.Picture || null;
                    
                    // Xác định trạng thái quan hệ
                    const isFriend = allFriendships.some((f: any) => (f.friendId || f.FriendId) === user?.id);
                    const isSent = sentRequests.some((r: any) => (r.senderId || r.SenderId) === user?.id);
                    const incomingReq = pendingRequests.find((r: any) => (r.senderId || r.SenderId) === user?.id);
                    const hasIncoming = !!incomingReq;
                    
                    const targetIsStaffOrAdmin = user?.roleNames?.includes("Admin") || user?.roleNames?.includes("Manager") || user?.roleNames?.includes("Staff");
                    const canChat = isFriend || targetIsStaffOrAdmin || currentUserIsStaffOrAdmin;

                    return (
                      <div 
                        key={user?.id} 
                        className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm hover:shadow-md hover:border-brand/20 transition-all duration-300 group"
                      >
                        <div 
                          className="flex items-center gap-4 cursor-pointer"
                          onClick={() => navigate(`/social/profile/${user?.id}`)}
                        >
                          <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-500 border border-slate-200 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                            {sAvatar ? <img src={sAvatar} alt="" className="w-full h-full object-cover" /> : (user?.fullName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand transition-colors">
                                {user?.fullName || t('auth.unknown')}
                              </h3>
                              {isFriend ? (
                                <span className="text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {t('social.friend') || 'Bạn bè'}
                                </span>
                              ) : targetIsStaffOrAdmin ? (
                                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  System {user?.roleNames?.find((r: string) => r === "Admin" || r === "Manager" || r === "Staff")}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 select-all">
                              {user?.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isFriend ? (
                            <button 
                              disabled
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
                            >
                              <UserCheck className="w-4 h-4" />
                              {t('social.friend') || 'Bạn bè'}
                            </button>
                          ) : isSent ? (
                            <button
                              disabled
                              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-400 text-xs font-semibold rounded-lg border border-slate-200 cursor-not-allowed"
                            >
                              <Clock className="w-4 h-4" />
                              {t('social.requestSent') || 'Đã gửi'}
                            </button>
                          ) : hasIncoming ? (
                            <button
                              onClick={() => handleRespond(incomingReq.id, true)}
                              disabled={isResponding}
                              className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <UserCheck className="w-4 h-4" />
                              {t('social.accept') || 'Duyệt nhận'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSendRequest(user?.id)}
                              disabled={isSending}
                              className="flex items-center gap-1.5 px-4 py-2 bg-[#0068E0] text-white text-xs font-semibold rounded-lg hover:bg-[#0058D0] transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <UserPlus className="w-4 h-4" />
                              {t('social.addFriend')}
                            </button>
                          )}
                          
                          <button
                            onClick={() => canChat && handleCreateChat(user?.id)}
                            disabled={isCreatingChat || !canChat}
                            className={`flex items-center justify-center p-2 text-xs font-semibold rounded-lg transition-colors border ${
                              canChat
                                ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-brand hover:border-brand/30"
                                : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                            }`}
                            title={!canChat ? "Chỉ được nhắn tin với bạn bè, Staff, Manager hoặc Admin" : ""}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
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

      <ConfirmDialog
        open={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setFriendToUnfriend(null);
        }}
        onConfirm={executeUnfriend}
        title={t("social.confirmUnfriendTitle") || "Hủy kết bạn"}
        message={t("social.confirmUnfriend") || "Bạn có chắc chắn muốn hủy kết bạn với người này không?"}
        variant="warning"
      />
    </div>
  );
};
