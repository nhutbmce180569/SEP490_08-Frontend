import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Clock, Search, Send, Loader2, MessageCircle } from 'lucide-react';
import { 
  useGetFriendships, 
  useGetPendingRequests, 
  useRespondToRequest, 
  useDeleteFriendship,
  useSendFriendRequest,
  friendQueryKeys
} from '../hooks/useFriends';
import { useCreateChatRoom } from '../../chat/hooks/useChats';

import { useSearchUsers } from '../../../users/hooks/useUsers';
import { useToast } from '../../../../contexts/ToastContext';
import * as signalR from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export const FriendsManagement: React.FC = () => {
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
      // 1. Sửa cổng 7004 thành 7010 để đi qua API Gateway
      .withUrl("https://localhost:7010/hubs/friendship", {
        accessTokenFactory: () => localStorage.getItem('accessToken') || ''
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveFriendRequest", (payload: any) => {
      success('Bạn có lời mời kết bạn mới!');
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.pending() });
    });

    connection.on("FriendRequestResponded", (responderId: number, status: string) => {
      if (status === 'Accepted') {
        success('Một lời mời kết bạn đã được chấp nhận!');
        queryClient.invalidateQueries({ queryKey: friendQueryKeys.pending() });
        queryClient.invalidateQueries({ queryKey: friendQueryKeys.lists() });
      } else if (status === 'Declined') {
        queryClient.invalidateQueries({ queryKey: friendQueryKeys.pending() });
      }
    });

    connection.on("FriendshipDeleted", (deletedFriendId: number) => {
      warning('Một người bạn đã hủy kết bạn.');
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.lists() });
    });

    connection.start().catch((err) => console.error("SignalR Connection Error: ", err));

    return () => {
      connection.stop();
    };

  }, [queryClient]);

  const handleRespond = (requestId: number, isAccepted: boolean) => {
    respondRequest(
      { requestId, isAccepted },
      {
        onSuccess: () => success(isAccepted ? "Friend request accepted!" : "Friend request declined!"),
        onError: (err: any) => {

          console.error("LỖI ACCEPT/DECLINE:", err.response?.data);
          
 
          const validationErrors = err.response?.data?.errors;
          let errorDetail = "";
          if (validationErrors) {
             errorDetail = Object.values(validationErrors).flat().join(" | ");
          }
          
          const msg = errorDetail || err.response?.data?.message || err.response?.data || "Lỗi 400: Sai định dạng dữ liệu DTO.";
          error(typeof msg === 'string' ? msg : "Lỗi hệ thống không xác định");
        }
      }
    );
  };

  const handleUnfriend = (friendshipId: number) => {
    if (window.confirm("Are you sure you want to unfriend this user?")) {
      deleteFriend(friendshipId, {
        onSuccess: () => success("Removed from friends list."),
        onError: () => error("Failed to unfriend.")
      });
    }
  };

  const handleSendRequest = (receiverId: number) => {
    sendRequest(
      { receiverId },
      {
        onSuccess: () => success("Friend request sent!"),
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.response?.data || "Failed to send request.";
          error(typeof msg === 'string' ? msg : "An error occurred");
        }
      }
    );
  };

  return (
<div className="w-full bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Friends Management</h1>

      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('friends')}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'friends' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          My Friends ({Array.isArray(friends) ? friends.length : 0})
          {activeTab === 'friends' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-md" />}
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'pending' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Requests ({Array.isArray(pendingRequests) ? pendingRequests.length : 0})
          {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-md" />}
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'add' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Search className="w-4 h-4" />
          Find Friends
          {activeTab === 'add' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-md" />}
        </button>
      </div>

      {activeTab === 'friends' && (
        <div className="flex flex-col gap-4">
          {isLoadingFriends && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-400" /></div>}
          {!isLoadingFriends && Array.isArray(friends) && friends.length === 0 && (
            <div className="text-center py-10 text-slate-500 border border-dashed border-slate-200 rounded-lg">
              You haven't added any friends yet.
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
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:underline">{friend?.friendName || 'Unknown'}</h3>
                  <p className="text-xs text-slate-500 capitalize">{friend?.status || 'Friend'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => createChat(friend?.friendId, { onSuccess: () => navigate('/social/chat') })}
                  disabled={isCreatingChat}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-[#0068E0] rounded-md hover:bg-[#0058D0] transition-colors disabled:opacity-50"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
                <button 
                  onClick={() => handleUnfriend(friend?.id)}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  <UserX className="w-4 h-4" />
                  Unfriend
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
              No pending friend requests.
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
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:underline">{req?.senderName || 'Unknown'}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{req?.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleRespond(req?.id, true)}
                  disabled={isResponding}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  Accept
                </button>
                <button 
                  onClick={() => handleRespond(req?.id, false)}
                  disabled={isResponding}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  <UserX className="w-4 h-4" />
                  Decline
                </button>
              </div>
            </div>
          )})}
        </div>
      )}

      {activeTab === 'add' && (
        <div className="flex flex-col gap-6">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <h2 className="text-base font-semibold text-slate-900 mb-2">Find People</h2>
            <p className="text-sm text-slate-500 mb-4">
              Search by name or email to find and connect with others.
            </p>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                placeholder="Search names (e.g. Stephen Chow)"
              />
            </div>
          </div>

          {(isSearching || isFetchingSearch) && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          )}

          {isSearchError && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-100">
              Connection error. Please check your network or API Gateway.
            </div>
          )}

          {!isSearching && !isSearchError && debouncedQuery && searchResult && Array.isArray(searchResult.data) && searchResult.data.length === 0 && (
            <div className="text-center py-10 text-slate-500 border border-dashed border-slate-200 rounded-lg">
              No users found matching "{debouncedQuery}".
            </div>
          )}

          {!isSearching && !isSearchError && searchResult && Array.isArray(searchResult.data) && searchResult.data.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Results ({searchResult.total})</h3>
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
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:underline">{user?.fullName || 'Unknown'}</h3>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendRequest(user?.id)}
                    disabled={isSending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0068E0] text-white text-xs font-semibold rounded-lg hover:bg-[#0058D0] transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    Send Request
                  </button>
                </div>
              )})}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
