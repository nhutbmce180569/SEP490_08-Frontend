import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chatService';
import { useChatSignalR, useCreateChatRoom } from '../hooks/useChatSignalR';
import { useSearchUsers } from '../../../users/hooks/useUsers';
import { 
  Send, 
  MessageSquare, 
  Loader2, 
  UserPlus,
  Pin,
  BellOff,
  MoreVertical,
  CheckCheck,
  SmilePlus,
  LogOut,
  X,
  Search,
  SquarePen,
  Users
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../../../contexts/AuthContext';
import { useTranslation } from '../../../../contexts/LocaleContext';

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
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const { data: searchResult, isLoading: isSearching } = useSearchUsers(debouncedQuery);

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
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
    }
  };

  const handleConfirm = () => {
    if (selectedUserIds.length === 0) {
      alert(t('social.selectAtLeastOneUser'));
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-[500] p-4">
      <div className="bg-white rounded-[28px] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">
            {isSingleSelect ? t('social.startAChat') : t('social.addMembers')}
          </h2>
          <button onClick={handleClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('social.searchByNameOrEmail')}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isSearching ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-5 h-5 text-brand animate-spin" />
            </div>
          ) : !debouncedQuery ? (
            <div className="text-center text-slate-400 py-8 text-sm">{t('social.enterNameOrEmailToSearch')}</div>
          ) : searchResult && Array.isArray(searchResult.data) && searchResult.data.length > 0 ? (
            searchResult.data.map((user: any) => {
              const userAvatar = user?.avatarUrl || user?.AvatarUrl || null;
              const isSelected = selectedUserIds.includes(user.id);
              return (
                <label key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors border border-transparent">
                  <input
                    type={isSingleSelect ? 'radio' : 'checkbox'}
                    name={isSingleSelect ? 'user-select' : undefined}
                    checked={isSelected}
                    onChange={() => handleToggleUser(user.id)}
                    className="w-4 h-4 text-brand rounded cursor-pointer"
                  />
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand to-brand flex items-center justify-center shrink-0 overflow-hidden text-white font-semibold text-sm shadow-sm">
                    {userAvatar ? <img src={userAvatar} alt={user.fullName} className="w-full h-full object-cover" /> : <span>{(user.fullName || 'U').charAt(0).toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-slate-900 truncate">{user.fullName || t('common.user')}</h4>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </label>
              );
            })
          ) : (
            <div className="text-center text-slate-400 py-8 text-sm">{t('social.noMatchingUsers')}</div>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t border-slate-200 bg-slate-50">
          <button onClick={handleClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors">
            {t('common.close')}
          </button>
          <button onClick={handleConfirm} disabled={selectedUserIds.length === 0 || isLoading} className="flex-1 px-4 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors">
            {t('common.confirm')} ({selectedUserIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ COMPONENT: Room Members Modal ============
interface RoomMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number | null;
}

const RoomMembersModal: React.FC<RoomMembersModalProps> = ({ isOpen, onClose, roomId }) => {
  const { t } = useTranslation();

  const { data: membersResponse, isLoading } = useQuery({
    queryKey: ['roomMembers', roomId],
    queryFn: () => chatService.getRoomMembers(roomId!),
    enabled: !!roomId && isOpen,
  });

  const members = Array.isArray(membersResponse) ? membersResponse : membersResponse?.data || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-[500] p-4">
      <div className="bg-white rounded-[28px] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">{t('social.roomMembers')}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-5 h-5 text-brand animate-spin" />
            </div>
          ) : members.length > 0 ? (
            members.map((user: any) => {
              const userAvatar = user?.avatarUrl || user?.AvatarUrl || null;
              return (
                <div key={user.id || Math.random()} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors border border-transparent">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand to-brand flex items-center justify-center shrink-0 overflow-hidden text-white font-semibold text-sm shadow-sm">
                    {userAvatar ? <img src={userAvatar} alt={user.fullName} className="w-full h-full object-cover" /> : <span>{(user.fullName || 'U').charAt(0).toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-slate-900 truncate">{user.fullName || t('common.user')}</h4>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-slate-400 py-8 text-sm">{t('social.noMembersFound')}</div>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="w-full px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors">
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ MAIN COMPONENT: ChatPage ============
export const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [textValue, setTextValue] = useState<string>('');
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlRoomId = searchParams.get('roomId');

  const { user } = useContext(AuthContext);
  const currentUserId = user?.id || user?.Id || user?.nameid || user?.sub || 0;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (urlRoomId) {
      setSelectedRoomId(Number(urlRoomId));
      setSearchParams({}, { replace: true });
    }
  }, [urlRoomId, setSearchParams]);

  // 1. Fetch danh sách phòng chat từ cache React Query
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: chatService.getChatRooms,
  });

  // 2. Thuật toán sắp xếp ưu tiên phòng chat (Ghim -> Phòng có biến động tin nhắn mới nhất lên đầu)
  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a: any, b: any) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const timeA = new Date(a.lastMessageCreatedAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.lastMessageCreatedAt || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });
  }, [rooms]);

  // 3. Fetch lịch sử tin nhắn
  const { data: historyMessages = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['chatMessages', selectedRoomId],
    queryFn: () => chatService.getChatMessages(selectedRoomId!),
    enabled: !!selectedRoomId,
  });

  // 4. Kết nối Realtime qua cổng SignalR ChatHub
  const { messages: realtimeMessages, sendMessage, isConnected, setMessages: setRealtimeMessages } = useChatSignalR(selectedRoomId);

  // ✨ Cập nhật click chọn phòng chat & dọn dẹp số unread Count mượt mà
  const handleSelectRoom = (roomId: number) => {
    setSelectedRoomId(roomId);
    setSearchParams({ roomId: String(roomId) }); // Cập nhật SearchParams đồng bộ URL toàn cục
    
    // Reset trực tiếp bộ đếm unreadCount về 0 trên cache UI để xóa chấm đỏ tức thì
    queryClient.setQueryData(['chatRooms'], (oldRooms: any) => {
      if (!Array.isArray(oldRooms)) return oldRooms;
      return oldRooms.map((r: any) => r.id === roomId ? { ...r, unreadCount: 0 } : r);
    });
  };

  useEffect(() => {
    setRealtimeMessages([]);
  }, [selectedRoomId, setRealtimeMessages]);

  // Gom cụm và lọc trùng lặp tin nhắn theo dòng thời gian tăng dần
  const rawMessages = [...historyMessages, ...realtimeMessages];
  const allMessages = Array.from(
    new Map(rawMessages.map((msg) => [msg.id, msg])).values()
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [allMessages]);

  // ============ MUTATIONS & ACTIONS ============
  const { mutate: mutatePin, isPending: isPinning } = useMutation({
    mutationFn: (roomId: number) => chatService.pinRoom(roomId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['chatRooms'] }); },
  });

  const { mutate: mutateMute, isPending: isMuting } = useMutation({
    mutationFn: (roomId: number) => chatService.muteRoom(roomId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['chatRooms'] }); },
  });

  const handleAddMembers = (userIds: number[]) => {
    if (!selectedRoomId) return;
    mutateAddMembers({ roomId: selectedRoomId, userIds });
  };

  const { mutate: mutateAddMembers, isPending: isAddingMembers } = useMutation({
    mutationFn: ({ roomId, userIds }: { roomId: number; userIds: number[] }) => chatService.addMembers(roomId, userIds),
    onSuccess: () => {
      setShowAddMemberModal(false);
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
  });

  const { mutate: mutateLeaveGroup, isPending: isLeavingGroup } = useMutation({
    mutationFn: (roomId: number) => chatService.leaveGroup(roomId),
    onSuccess: () => {
      setSelectedRoomId(null);
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
  });

  const { mutate: mutateCreateChatRoom, isPending: isCreatingNewChat } = useCreateChatRoom();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textValue.trim() || !selectedRoomId || !isConnected) return;
    try {
      await sendMessage(textValue.trim());
      setTextValue('');
      // Làm mới danh sách phòng ngay khi gửi để đẩy cuộc trò chuyện của chính mình lên đầu
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    } catch (error) {
      console.error("Lỗi gửi tin nhắn", error);
    }
  };

  const handleStartNewChat = (userIds: number[]) => {
    if (userIds.length === 0) return;
    mutateCreateChatRoom(userIds[0], {
      onSuccess: (newRoom: any) => {
        const newRoomId = newRoom?.id || newRoom?.Id || newRoom?.data?.id;
        setShowNewChatModal(false);
        if (newRoomId) {
          setSelectedRoomId(newRoomId);
          queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
        }
      },
    });
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t('social.justNow');
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return t('social.justNow');
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name || typeof name !== 'string') return 'U';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getRoomDisplayName = (room: any) => room?.roomName || room?.name || t('social.chat');

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-2 animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-slate-900">
              <MessageSquare className="text-brand" size={24} />
              {t('social.messages')}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">{t('social.messagesSubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewChatModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/20 transition-all hover:bg-brand-hover active:scale-95 cursor-pointer"
          >
            <SquarePen className="h-4 w-4" />
            {t('social.newChat')}
          </button>
        </div>

        <div className="flex h-[600px] w-full overflow-hidden rounded-[32px] border border-slate-200/60 bg-white shadow-2xl shadow-slate-200/40">
          
          {/* CỘT TRÁI: DANH SÁCH CUỘC HỘI THOẠI */}
          <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50/40">
            <div className="p-4 border-b border-slate-100/80 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-brand" />
                <h2 className="text-base font-bold text-slate-800">{t('social.conversations')}</h2>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {isLoadingRooms ? (
                <div className="flex justify-center items-center h-20">
                  <Loader2 className="w-6 h-6 animate-spin text-brand" />
                </div>
              ) : sortedRooms.length === 0 ? (
                <div className="text-center text-slate-400 mt-8 text-sm font-medium">{t('social.noChatsAvailable')}</div>
              ) : (
                sortedRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleSelectRoom(room.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all outline-none border border-transparent ${
                      selectedRoomId === room.id
                        ? 'bg-brand/10 text-blue-900 font-bold shadow-sm'
                        : 'hover:bg-slate-100/60 text-slate-700'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand to-blue-600 flex items-center justify-center shrink-0 overflow-hidden text-white font-bold text-xs shadow-sm border border-slate-200">
                      {room.avatarUrl ? <img src={room.avatarUrl} alt={getRoomDisplayName(room)} className="w-full h-full object-cover" /> : <span>{getInitials(getRoomDisplayName(room))}</span>}
                    </div>

                    <div className="flex-1 text-left overflow-hidden">
                      <div className="font-semibold truncate text-sm text-slate-800">{getRoomDisplayName(room)}</div>
                      <div className="text-xs text-slate-400 truncate mt-0.5 font-medium">
                        {room.lastMessage || t('social.startConversation')}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {room.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-current" />}
                      {room.isMuted && <BellOff className="w-3.5 h-3.5 text-slate-400" />}
                      
                      {/* Badge đồn số chưa đọc chuẩn Liquid iOS 26 dồn số 5+ giống Zalo */}
                      {room.unreadCount > 0 && (
                        <div className="min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white text-[10px] font-black flex items-center justify-center shadow-[0_4px_10px_rgba(244,63,94,0.35)] border border-white/20 animate-pulse">
                          {room.unreadCount > 5 ? "5+" : room.unreadCount}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* CỘT PHẢI: KHUNG HIỂN THỊ TIN NHẮN */}
          <div className="w-2/3 flex flex-col bg-white relative">
            {!selectedRoomId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white">
                <MessageSquare className="w-14 h-14 mb-4 text-slate-200" />
                <h3 className="text-base font-bold text-slate-700">{t('social.selectChatToMessage')}</h3>
              </div>
            ) : (
              <>
                {/* Header phòng chat kính mờ Liquid */}
                <div className="h-16 border-b border-slate-200/60 bg-white/75 backdrop-blur-[30px] flex items-center px-6 z-20 justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-brand flex items-center justify-center overflow-hidden border border-slate-200 text-white font-bold text-xs shadow-sm">
                      {selectedRoom?.avatarUrl ? <img src={selectedRoom.avatarUrl} alt={getRoomDisplayName(selectedRoom)} className="w-full h-full object-cover" /> : <span>{getInitials(getRoomDisplayName(selectedRoom))}</span>}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 tracking-wide">{getRoomDisplayName(selectedRoom)}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setShowMembersModal(true)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800" title={t('social.roomMembers')}><Users className="w-4.5 h-4.5" /></button>
                    <button onClick={() => setShowAddMemberModal(true)} disabled={isAddingMembers} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800" title={t('social.addMembers')}><UserPlus className="w-4.5 h-4.5" /></button>
                    <button onClick={() => { if(selectedRoomId) mutatePin(selectedRoomId); }} disabled={isPinning} className={`p-2 rounded-xl transition-colors ${selectedRoom?.isPinned ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-500 hover:bg-slate-100'}`} title={t('social.pin')}><Pin className="w-4.5 h-4.5" /></button>
                    <button onClick={() => { if(selectedRoomId) mutateMute(selectedRoomId); }} disabled={isMuting} className={`p-2 rounded-xl transition-colors ${selectedRoom?.isMuted ? 'text-slate-400 hover:bg-slate-50' : 'text-slate-500 hover:bg-slate-100'}`} title={t('social.mute')}><BellOff className="w-4.5 h-4.5" /></button>
                    {selectedRoom?.isGroupChat && (
                      <button onClick={() => { if(window.confirm(t('social.confirmLeaveGroup'))) mutateLeaveGroup(selectedRoomId); }} disabled={isLeavingGroup} className="p-2 hover:bg-red-50 rounded-xl transition-colors text-red-500" title={t('social.leaveGroup')}><LogOut className="w-4.5 h-4.5" /></button>
                    )}
                  </div>
                </div>

                {/* Khung nội dung hội thoại */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40 custom-scrollbar z-0 relative flex flex-col">
                  {isLoadingHistory ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="w-7 h-7 animate-spin text-brand" /></div>
                  ) : (
                    allMessages.map((msg, idx) => {
                      if (msg.senderName === 'System') {
                        return (
                          <div key={`${msg.id}-${idx}`} className="flex justify-center w-full shrink-0">
                            <span className="bg-slate-200/60 backdrop-blur-sm text-[11px] font-semibold text-slate-500 rounded-full px-4 py-1 my-1 shadow-inner border border-white/40">{msg.content}</span>
                          </div>
                        );
                      }

                      const isMe = String(msg.senderId) === String(currentUserId);
                      const rawAvatar = msg.senderAvatarUrl || (msg as any).SenderAvatarUrl;
                      const avatarToUse = rawAvatar || (!selectedRoom?.isGroupChat ? selectedRoom?.avatarUrl : null);

                      return (
                        <div key={`${msg.id}-${idx}`} className={`w-full flex flex-col ${isMe ? 'items-end' : 'items-start'} group shrink-0`}>
                          <div className={`flex gap-2.5 items-end max-w-[75%] ${isMe ? 'flex-row-reverse' : ''}`}>
                            {!isMe && (
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-[10px] font-bold text-white mb-0.5 overflow-hidden border border-slate-200 shadow-sm">
                                {avatarToUse ? <img src={avatarToUse} alt={msg.senderName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : getInitials(msg.senderName || 'User')}
                              </div>
                            )}

                            <div className={`relative px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm w-auto ${isMe ? 'bg-brand text-white rounded-br-none' : 'bg-white border border-slate-200/60 text-slate-800 rounded-bl-none'}`}>
                              {!isMe && <div className="text-[10px] font-black text-brand mb-0.5 uppercase tracking-wide">{msg.senderName}</div>}
                              <p className="break-words font-medium whitespace-pre-wrap">{msg.content}</p>

                              {hoveredMessageId === msg.id && (
                                <div className="absolute -bottom-8 right-0 flex gap-1 bg-white border border-slate-200 rounded-full p-1 shadow-md z-30">
                                  <button className="p-1 hover:bg-slate-100 rounded-full transition-colors"><SmilePlus className="w-3.5 h-3.5 text-slate-600" /></button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[9px] font-bold text-slate-400 tracking-tight">{formatTime(msg.createdAt)}</span>
                            {isMe && <CheckCheck className="w-3.5 h-3.5 text-brand" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Khung Input nhập tin nhắn */}
                <div className="p-4 bg-white/75 backdrop-blur-[30px] border-t border-slate-200/60 z-20 shadow-lg">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      placeholder={t('social.typeMessage')}
                      className="flex-1 bg-slate-100/80 backdrop-blur-sm border border-transparent rounded-full px-5 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-brand/10 transition-all text-slate-800 placeholder-slate-400 shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={!textValue.trim() || !isConnected}
                      className="p-3 bg-brand hover:bg-brand-hover disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-full transition-all flex items-center justify-center shrink-0 shadow-lg shadow-brand/20 active:scale-95 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AddMemberModal isOpen={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} onConfirm={handleAddMembers} isLoading={isAddingMembers} isSingleSelect={false} />
      <AddMemberModal isOpen={showNewChatModal} onClose={() => setShowNewChatModal(false)} onConfirm={handleStartNewChat} isLoading={isCreatingNewChat} isSingleSelect={true} />
      <RoomMembersModal isOpen={showMembersModal} onClose={() => setShowMembersModal(false)} roomId={selectedRoomId} />
    </>
  );
};