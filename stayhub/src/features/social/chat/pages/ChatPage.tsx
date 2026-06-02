import React, { useState, useEffect, useRef, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chatService';
import { useChatSignalR, useCreateChatRoom } from '../hooks/useChatSignalR';
import { useSearchUsers } from '../../../users/hooks/useUsers';
import { 
  Send, 
  MessageSquare, 
  Loader2, 
  User,
  UserPlus,
  Pin,
  BellOff,
  MoreVertical,
  CheckCheck,
  SmilePlus,
  LogOut,
  X,
  Search,
  SquarePen
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../../contexts/AuthContext';

// ============ COMPONENT: Add Member Modal ============
interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userIds: number[]) => void;
  isLoading?: boolean;
  isSingleSelect?: boolean;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  isSingleSelect = false,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const { 
    data: searchResult, 
    isLoading: isSearching 
  } = useSearchUsers(debouncedQuery);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleToggleUser = (userId: number) => {
    if (isSingleSelect) {
      setSelectedUserIds(selectedUserIds.includes(userId) ? [] : [userId]);
    } else {
      setSelectedUserIds(prev =>
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const handleConfirm = () => {
    if (selectedUserIds.length === 0) {
      alert('Please select at least one user');
      return;
    }
    onConfirm(selectedUserIds);
    setSearchInput('');
    setDebouncedQuery('');
    setSelectedUserIds([]);
  };

  const handleClose = () => {
    setSearchInput('');
    setDebouncedQuery('');
    setSelectedUserIds([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[500] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">
            {isSingleSelect ? 'Start a Chat' : 'Add Members'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isSearching ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-5 h-5 text-brand animate-spin" />
            </div>
          ) : !debouncedQuery ? (
            <div className="text-center text-slate-400 py-8 text-sm">
              Enter name or email to search
            </div>
          ) : searchResult && Array.isArray(searchResult.data) && searchResult.data.length > 0 ? (
            searchResult.data.map((user: any) => {
              const userAvatar = user?.avatarUrl || user?.AvatarUrl || null;
              const isSelected = selectedUserIds.includes(user.id);
              return (
                <label
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors border border-transparent"
                >
                  <input
                    type={isSingleSelect ? 'radio' : 'checkbox'}
                    name={isSingleSelect ? 'user-select' : undefined}
                    checked={isSelected}
                    onChange={() => handleToggleUser(user.id)}
                    className="w-4 h-4 text-brand rounded cursor-pointer"
                  />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand flex items-center justify-center shrink-0 overflow-hidden text-white font-semibold text-sm">
                    {userAvatar ? (
                      <img src={userAvatar} alt={user.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(user.fullName || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-slate-900 truncate">
                      {user.fullName || 'User'}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </label>
              );
            })
          ) : (
            <div className="text-center text-slate-400 py-8 text-sm">
              No matching users found
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedUserIds.length === 0 || isLoading}
            className="flex-1 px-4 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            Confirm ({selectedUserIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ MAIN COMPONENT: ChatPage ============
export const ChatPage: React.FC = () => {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [textValue, setTextValue] = useState<string>('');
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlRoomId = searchParams.get('roomId');
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);
  const currentUserId = user?.id || user?.Id || user?.nameid || user?.sub || 0;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (urlRoomId) {
      setSelectedRoomId(Number(urlRoomId));
      setSearchParams({}, { replace: true });
    }
  }, [urlRoomId, setSearchParams]);

  // 1. Fetch danh sách phòng chat
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: chatService.getChatRooms,
  });

  // 2. Fetch lịch sử tin nhắn
  const { data: historyMessages = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['chatMessages', selectedRoomId],
    queryFn: () => chatService.getChatMessages(selectedRoomId!),
    enabled: !!selectedRoomId,
  });

  // 3. SignalR Real-time
  const { 
    messages: realtimeMessages, 
    sendMessage, 
    isConnected, 
    setMessages: setRealtimeMessages 
  } = useChatSignalR(selectedRoomId);

  useEffect(() => {
    setRealtimeMessages([]);
  }, [selectedRoomId, setRealtimeMessages]);

  // Gộp mảng và loại bỏ các tin nhắn bị trùng lặp ID (giữ lại tin nhắn duy nhất)
  const rawMessages = [...historyMessages, ...realtimeMessages];
  const allMessages = Array.from(
    new Map(rawMessages.map((msg) => [msg.id, msg])).values()
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // Đảm bảo luôn sort đúng thứ tự thời gian

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [allMessages]);

  // ============ MUTATIONS ============

  const { mutate: mutatePin, isPending: isPinning } = useMutation({
    mutationFn: (roomId: number) => chatService.pinRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      alert('Chat pinned!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to pin chat';
      alert(msg);
    },
  });

  const { mutate: mutateMute, isPending: isMuting } = useMutation({
    mutationFn: (roomId: number) => chatService.muteRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      alert('Chat muted!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to mute chat';
      alert(msg);
    },
  });

  const { mutate: mutateAddMembers, isPending: isAddingMembers } = useMutation({
    mutationFn: ({ roomId, userIds }: { roomId: number; userIds: number[] }) =>
      chatService.addMembers(roomId, userIds),
    onSuccess: (newRoom: any) => {
      const newRoomId = newRoom?.id || newRoom?.Id;
      setShowAddMemberModal(false);
      if (newRoomId) {
        setSelectedRoomId(newRoomId);
        queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
        alert('Members added successfully!');
      } else {
        alert('Members added successfully!');
        queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to add members';
      alert(msg);
    },
  });

  const { mutate: mutateLeaveGroup, isPending: isLeavingGroup } = useMutation({
    mutationFn: (roomId: number) => chatService.leaveGroup(roomId),
    onSuccess: () => {
      setSelectedRoomId(null);
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      alert('You have left the group!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to leave group';
      alert(msg);
    },
  });

  const { mutate: mutateCreateChatRoom, isPending: isCreatingNewChat } = useCreateChatRoom();

  // ============ HANDLERS ============

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textValue.trim() || !selectedRoomId || !isConnected) return;

    try {
      await sendMessage(textValue);
      setTextValue('');
    } catch (error) {
      console.error("Error sending message", error);
      alert("Failed to send message. Please try again!");
    }
  };

  const handlePinRoom = () => {
    if (!selectedRoomId) return;
    mutatePin(selectedRoomId);
  };

  const handleMuteRoom = () => {
    if (!selectedRoomId) return;
    mutateMute(selectedRoomId);
  };

  const handleAddMembers = (userIds: number[]) => {
    if (!selectedRoomId) return;
    mutateAddMembers({ roomId: selectedRoomId, userIds });
  };

  const handleStartNewChat = (userIds: number[]) => {
    if (userIds.length === 0) return;
    mutateCreateChatRoom(userIds[0], {
      onSuccess: (newRoom: any) => {
        const newRoomId = newRoom?.data?.id || newRoom?.data?.Id || newRoom?.id || newRoom?.Id;
        setShowNewChatModal(false);
        if (newRoomId) {
          setSelectedRoomId(newRoomId);
          queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
        }
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || 'Failed to start chat';
        alert(msg);
      },
    });
  };

  const handleLeaveGroup = () => {
    if (!selectedRoomId) return;
    if (window.confirm('Are you sure you want to leave this group?')) {
      mutateLeaveGroup(selectedRoomId);
    }
  };

  // ============ HELPERS ============

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Just now';
      
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name || typeof name !== 'string') return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoomDisplayName = (room: any) => {
    return room?.roomName || room?.name || 'Chat';
  };

  return (
    <>
      <div className="flex h-[80vh] min-h-[600px] w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mt-6">
        
        {/* CỘT TRÁI: Danh sách phòng chat */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-bold text-slate-800">Chats</h2>
            </div>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-800"
              title="New Chat"
            >
              <SquarePen className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingRooms ? (
              <div className="flex justify-center items-center h-20">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center text-slate-500 mt-6 text-sm">No chats available.</div>
            ) : (
              rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all outline-none relative ${
                    selectedRoomId === room.id
                      ? 'bg-brand-light border border-brand/20 text-blue-800 shadow-md'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-brand flex items-center justify-center shrink-0 overflow-hidden border-2 border-slate-200 text-white font-semibold">
                    {room.avatarUrl ? (
                      <img src={room.avatarUrl} alt={getRoomDisplayName(room)} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm">{getInitials(getRoomDisplayName(room))}</span>
                    )}
                  </div>

                  <div className="flex-1 text-left overflow-hidden">
                    <div className="font-semibold truncate text-sm">{getRoomDisplayName(room)}</div>
                    <div className="text-xs text-slate-500 truncate mt-0.5 line-clamp-1">
                      {room.lastMessage || "Start a conversation..."}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {room.isPinned && (
                      <Pin className="w-4 h-4 text-amber-500" />
                    )}
                    {room.isMuted && (
                      <BellOff className="w-4 h-4 text-slate-400" />
                    )}
                    {room.unreadCount > 0 && (
                      <div className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                        {room.unreadCount > 99 ? '99+' : room.unreadCount}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* CỘT PHẢI: Khung hiển thị tin nhắn */}
        <div className="w-2/3 flex flex-col bg-white">
          {!selectedRoomId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare className="w-16 h-16 mb-4 text-slate-200" />
              <h3 className="text-lg font-medium text-slate-600">Select a chat to start messaging</h3>
            </div>
          ) : (
            <>
              {/* Header phòng chat */}
              <div className="h-16 border-b border-slate-100 bg-white flex items-center px-6 z-10 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center overflow-hidden border-2 border-slate-200 text-white font-semibold text-sm">
                    {selectedRoom?.avatarUrl ? (
                      <img src={selectedRoom.avatarUrl} alt={getRoomDisplayName(selectedRoom)} className="w-full h-full object-cover" />
                    ) : (
                      <span>{getInitials(getRoomDisplayName(selectedRoom))}</span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800">{getRoomDisplayName(selectedRoom)}</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs text-slate-500">Active now</span>
                    </div>
                  </div>
                </div>

                {/* Menu tác vụ */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    disabled={isAddingMembers}
                    className="p-2 hover:bg-slate-100 disabled:opacity-50 rounded-lg transition-colors text-slate-600 hover:text-slate-800"
                    title="Add members"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handlePinRoom}
                    disabled={isPinning}
                    className={`p-2 hover:bg-slate-100 disabled:opacity-50 rounded-lg transition-colors ${
                      selectedRoom?.isPinned
                        ? 'text-amber-500'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                    title="Pin"
                  >
                    <Pin className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleMuteRoom}
                    disabled={isMuting}
                    className={`p-2 hover:bg-slate-100 disabled:opacity-50 rounded-lg transition-colors ${
                      selectedRoom?.isMuted
                        ? 'text-slate-400'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                    title="Mute"
                  >
                    <BellOff className="w-5 h-5" />
                  </button>

                  {selectedRoom?.isGroupChat && (
                    <button
                      onClick={handleLeaveGroup}
                      disabled={isLeavingGroup}
                      className="p-2 hover:bg-red-50 disabled:opacity-50 rounded-lg transition-colors text-red-600 hover:text-red-700"
                      title="Leave group"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-800"
                    title="More options"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Nội dung tin nhắn */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50 to-white custom-scrollbar"
              >
                {isLoadingHistory ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-brand" />
                  </div>
                ) : allMessages.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-slate-400">
                    <p className="text-center">Start a conversation</p>
                  </div>
                ) : (
                  allMessages.map((msg, idx) => {
                    const isMe = String(msg.senderId) === String(currentUserId);
                    const avatarToUse = msg.senderAvatarUrl || (!selectedRoom?.isGroupChat ? selectedRoom?.avatarUrl : null);

                    return (
                      <div
                        key={`${msg.id}-${idx}`}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                        onMouseEnter={() => setHoveredMessageId(msg.id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                      >
                        <div className={`flex gap-2 items-end ${isMe ? 'flex-row-reverse' : ''}`}>
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center shrink-0 text-xs font-semibold text-white mb-1 overflow-hidden border border-slate-200">
                              {avatarToUse ? (
                                <img
                                  src={avatarToUse}
                                  alt={msg.senderName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                getInitials(msg.senderName || 'User')
                              )}
                            </div>
                          )}

                          <div
                            className={`relative max-w-[70%] px-4 py-2.5 rounded-2xl text-[15px] shadow-sm transition-shadow ${
                              isMe
                                ? 'bg-brand text-white rounded-br-none'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                            }`}
                          >
                            {!isMe && (
                              <div className="text-[11px] font-bold text-brand mb-1 tracking-wide uppercase">
                                {msg.senderName}
                              </div>
                            )}
                            <p className="leading-relaxed break-words">{msg.content}</p>

                            {hoveredMessageId === msg.id && (
                              <div className="absolute -bottom-8 right-0 flex gap-1 bg-white border border-slate-200 rounded-full p-1 shadow-md">
                                <button className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                                  <SmilePlus className="w-4 h-4 text-slate-600" />
                                </button>
                              </div>
                            )}
                          </div>

                          {isMe && <div className="w-8" />}
                        </div>

                        <div className={`flex items-center gap-1 mt-1.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[10px] font-medium text-slate-400">
                            {formatTime(msg.createdAt)}
                          </span>
                          {isMe && (
                            <CheckCheck className="w-4 h-4 text-brand" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Khung Input */}
              <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-100 border border-transparent rounded-full px-5 py-3 text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800 placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={!textValue.trim() || !isConnected}
                    className="p-3 bg-brand hover:bg-brand-hover disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-full transition-all flex items-center justify-center shrink-0 shadow-md shadow-brand/20 hover:shadow-lg active:scale-95"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onConfirm={handleAddMembers}
        isLoading={isAddingMembers}
        isSingleSelect={false}
      />

      {/* New Chat Modal */}
      <AddMemberModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onConfirm={handleStartNewChat}
        isLoading={isCreatingNewChat}
        isSingleSelect={true}
      />
    </>
  );
};