import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
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
  CheckCheck,
  SmilePlus,
  X,
  Search,
  SquarePen,
  Users,
  Camera,
  MapPin
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../../contexts/AuthContext';
import { useTranslation } from '../../../../contexts/LocaleContext';
import { useToast } from '../../../../contexts/ToastContext';
import { createPortal } from 'react-dom';
import { useShareLocation } from '../../tracking/hooks/useLocationTracking';
import { DynamicText } from '../../../../components/DynamicText';

// ============ COMPONENT: Add Member Modal ============
interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userIds: number[]) => void;
  isLoading?: boolean;
  isSingleSelect?: boolean;
  roomId?: number | null;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onConfirm, isLoading = false, isSingleSelect = false, roomId = null }) => {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const { data: searchResult, isLoading: isSearching } = useSearchUsers(debouncedQuery);

  const { data: membersResponse } = useQuery({
    queryKey: ['roomMembers', roomId],
    queryFn: () => chatService.getRoomMembers(roomId!),
    enabled: !!roomId && isOpen,
  });

  const existingMemberIds = useMemo(() => {
    return membersResponse?.map((m: any) => m.id || m.userId) || [];
  }, [membersResponse]);

  const filteredUsers = useMemo(() => {
    if (!searchResult || !Array.isArray(searchResult.data)) return [];
    if (isSingleSelect || existingMemberIds.length === 0) return searchResult.data;
    return searchResult.data.filter((u: any) => !existingMemberIds.includes(u.id));
  }, [searchResult, isSingleSelect, existingMemberIds]);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedQuery(searchInput.trim()); }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleToggleUser = (userId: number) => {
    if (isSingleSelect) { setSelectedUserIds([userId]); }
    else { setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]); }
  };

  const handleConfirm = () => {
    if (selectedUserIds.length === 0) { alert(t('social.selectAtLeastOneUser')); return; }
    onConfirm(selectedUserIds);
    setSearchInput(''); setDebouncedQuery(''); setSelectedUserIds([]);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed top-0 left-0 w-screen h-screen bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-[28px] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">{isSingleSelect ? t('social.startAChat') : t('social.addMembers')}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={t('social.searchByNameOrEmail')} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isSearching ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="w-5 h-5 text-brand animate-spin" /></div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user: any) => (
              <label key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors border border-transparent">
                <input type={isSingleSelect ? 'radio' : 'checkbox'} checked={selectedUserIds.includes(user.id)} onChange={() => handleToggleUser(user.id)} className="w-4 h-4 text-brand rounded cursor-pointer" />
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand to-brand flex items-center justify-center shrink-0 overflow-hidden text-white font-semibold text-sm shadow-sm">
                  {user?.avatarUrl ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <span>{(user.fullName || 'U').charAt(0).toUpperCase()}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-slate-900 truncate">{user.fullName || t('common.user')}</h4>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </label>
            ))
          ) : <div className="text-center text-slate-400 py-8 text-sm">{t('social.noMatchingUsers')}</div>}
        </div>
        <div className="flex gap-2 p-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors">{t('common.close')}</button>
          <button onClick={handleConfirm} disabled={selectedUserIds.length === 0 || isLoading} className="flex-1 px-4 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors">{t('common.confirm')} ({selectedUserIds.length})</button>
        </div>
      </div>
    </div>,
    document.body
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
  const members = membersResponse ?? [];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed top-0 left-0 w-screen h-screen bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-[28px] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">{t('social.roomMembers')}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="w-5 h-5 text-brand animate-spin" /></div>
          ) : members.length > 0 ? (
            members.map((user: any) => (
              <div key={user.id || Math.random()} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors border border-transparent">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand to-brand flex items-center justify-center shrink-0 overflow-hidden text-white font-semibold text-sm shadow-sm">
                  {user?.avatarUrl ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <span>{(user.fullName || 'U').charAt(0).toUpperCase()}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-slate-900 truncate">{user.fullName || t('common.user')}</h4>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
            ))
          ) : <div className="text-center text-slate-400 py-8 text-sm">{t('social.noMembersFound')}</div>}
        </div>
        <div className="flex gap-2 p-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="w-full px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors">{t('common.close')}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ============ HELPERS ============
const getInitials = (name?: string | null) => {
  if (!name || typeof name !== 'string') return 'U';
  return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
};

const getRoomDisplayName = (room: any) => {
  const name = room?.roomName || room?.name || 'Chat';
  return typeof name === 'string' ? name : 'Chat';
};

// ============ MAIN COMPONENT: ChatPage ============
export interface ChatPageProps {
  isEmbedded?: boolean;
}

export const ChatPage: React.FC<ChatPageProps> = ({ isEmbedded = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success, error, warning } = useToast();
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
  const userRoles = Array.isArray(user?.roles) ? user.roles : typeof user?.roles === "string" ? [user.roles] : [];
  const isStaffOrAdmin = userRoles.some((r: string) => ["admin", "manager", "staff"].includes(r.toLowerCase()));
  const queryClient = useQueryClient();

  useEffect(() => {
    if (urlRoomId) {
      setSelectedRoomId(Number(urlRoomId));
      setSearchParams({}, { replace: true });
    }
  }, [urlRoomId, setSearchParams]);

  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: chatService.getChatRooms,
  });

  const [roomSearchQuery, setRoomSearchQuery] = useState('');

  const sortedRooms = useMemo(() => {
    const roomsArray = Array.isArray(rooms) ? rooms : [];
    return [...roomsArray].sort((a: any, b: any) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = new Date(a.lastMessageCreatedAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.lastMessageCreatedAt || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return sortedRooms.filter(room => 
      getRoomDisplayName(room).toLowerCase().includes(roomSearchQuery.toLowerCase())
    );
  }, [sortedRooms, roomSearchQuery]);

  const { data: historyMessages = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['chatMessages', selectedRoomId],
    queryFn: () => chatService.getChatMessages(selectedRoomId!),
    enabled: !!selectedRoomId,
  });

  const { messages: realtimeMessages, sendMessage, isConnected, setMessages: setRealtimeMessages } = useChatSignalR(selectedRoomId);

  const { mutate: shareLocation, isPending: isSharingLocation } = useShareLocation();

  const handleShareLocationInChat = useCallback(() => {
    if (!selectedRoomId || !isConnected) return;
    const isAlreadyEnabled = localStorage.getItem("share_my_location") === "true";
    localStorage.setItem("share_my_location", "true");
    if (!isAlreadyEnabled) {
      warning(
        t("social.shareLocationWarnTurnOn") ||
          "Đã tự động bật chia sẻ vị trí của bạn trên bản đồ để liên kết hoạt động chính xác!"
      );
    }
    shareLocation(undefined, {
      onSuccess: (token) => {
        const shareContent = `📍 ${t('social.myCurrentLocation') || 'My current location'}: [LocationShare:${JSON.stringify({ token })}]`;
        sendMessage(shareContent);
        success(t('social.locationSent') || 'Location sent successfully!');
        queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      },
      onError: () => {
        error(t('social.unableToShareLocation') || 'Unable to share location.');
      }
    });
  }, [selectedRoomId, isConnected, shareLocation, sendMessage, success, error, warning, t, queryClient]);

  const handleSelectRoom = (roomId: number) => {
    setSelectedRoomId(roomId);
    setSearchParams({ roomId: String(roomId) });
  
    queryClient.setQueryData(['chatRooms'], (oldRooms: any) => {
      if (!Array.isArray(oldRooms)) return oldRooms;
      return oldRooms.map((r: any) => r.id === roomId ? { ...r, unreadCount: 0 } : r);
    });

    mutateMarkAsRead(roomId);
  };

  useEffect(() => {
    setRealtimeMessages([]);
  }, [selectedRoomId, setRealtimeMessages]);

  const allMessages = useMemo(() => {
    const rawMessages = [...(historyMessages || []), ...(realtimeMessages || [])];
    return Array.from(
      new Map(rawMessages.map((msg: any) => [msg?.id ?? msg?.Id ?? Math.random(), msg])).values()
    ).sort((a: any, b: any) => {
      const timeA = new Date(a?.createdAt || a?.CreatedAt || 0).getTime();
      const timeB = new Date(b?.createdAt || b?.CreatedAt || 0).getTime();
      return timeA - timeB;
    });
  }, [historyMessages, realtimeMessages]);

  const lastMessageIdRef = useRef<any>(null);
  const lastRoomIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!chatContainerRef.current) return;
    
    const container = chatContainerRef.current;
    const lastMsg = allMessages[allMessages.length - 1];
    const lastMsgId = lastMsg?.id ?? lastMsg?.Id;
    
    // 1. Switched rooms -> scroll to bottom immediately
    if (selectedRoomId !== lastRoomIdRef.current) {
      container.scrollTop = container.scrollHeight;
      lastRoomIdRef.current = selectedRoomId;
      lastMessageIdRef.current = lastMsgId;
      return;
    }

    // 2. New message arrived -> scroll to bottom ONLY if the user is already near bottom OR if they sent the message themselves
    if (lastMsgId !== lastMessageIdRef.current) {
      const isMe = String(lastMsg?.senderId ?? lastMsg?.SenderId ?? '') === String(currentUserId);
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 250;
      
      if (isMe || isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
      lastMessageIdRef.current = lastMsgId;
    }
  }, [allMessages, selectedRoomId, currentUserId]);

  // ============ MUTATIONS & ACTIONS ============
  const { mutate: mutatePin, isPending: isPinning } = useMutation({
    mutationFn: (roomId: number) => chatService.pinRoom(roomId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['chatRooms'] }); },
  });
const { mutate: mutateMarkAsRead } = useMutation({
    mutationFn: (roomId: number) => chatService.markRoomAsRead(roomId),
  });
  const { mutate: mutateMute, isPending: isMuting } = useMutation({
    mutationFn: (roomId: number) => chatService.muteRoom(roomId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['chatRooms'] }); },
  });

  const { mutate: mutateAddMembersAPI, isPending: isAddingMembers } = useMutation({
    mutationFn: ({ roomId, userIds }: { roomId: number; userIds: number[] }) => chatService.addMembers(roomId, userIds),
    onSuccess: () => {
      setShowAddMemberModal(false);
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
  });

  const handleAddMembers = (userIds: number[]) => {
    if (!selectedRoomId) return;
    mutateAddMembersAPI({ roomId: selectedRoomId, userIds });
  };

  const { mutate: mutateCreateChatRoom, isPending: isCreatingNewChat } = useCreateChatRoom();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textValue.trim() || !selectedRoomId || !isConnected) return;
    try {
      await sendMessage(textValue.trim());
      setTextValue('');
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    } catch (err: any) {
      console.error("Error sending message", err);
      const msg = err?.message || err || t('social.failedToSendMessage');
      error(typeof msg === 'string' ? msg : t('social.unknownSystemError'));
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
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.response?.data || t('social.failedToStartChat');
        error(typeof msg === 'string' ? msg : t('social.unknownSystemError'));
      }
    });
  };

  const selectedRoom = (Array.isArray(rooms) ? rooms : []).find(r => r.id === selectedRoomId);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t('social.justNow');
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch { return t('social.justNow'); }
  };



  return (
    <>
      <div className={
        isEmbedded 
          ? "animate-fade-in text-slate-800 dark:text-slate-100 h-[calc(100vh-120px)] w-full"
          : "page-container py-4 md:py-6 animate-fade-in text-slate-800 dark:text-slate-100"
      }>
        <div className={`flex w-full overflow-hidden bg-white dark:bg-slate-900 ${
          isEmbedded 
            ? "h-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md"
            : "h-[86vh] min-h-[600px] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl"
        }`}>
          
          {/* LEFT COLUMN: CONVERSATION LIST */}
          <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 shrink-0">
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('social.conversations') || 'Chats'}</h2>
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(true)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-full transition-all text-slate-500 dark:text-slate-400 hover:text-brand cursor-pointer"
                  title={t('social.newChat') || 'New Chat'}
                >
                  <SquarePen className="w-5 h-5" />
                </button>
              </div>
              {/* Search bar inside conversations list */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                  placeholder={t('social.searchByNameOrEmail') || 'Search chats...'}
                  className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-slate-200 dark:focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                />
                {roomSearchQuery && (
                  <button onClick={() => setRoomSearchQuery('')} className="absolute right-3 top-2.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-bold">Clear</button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 custom-scrollbar">
              {isLoadingRooms ? (
                <div className="flex justify-center items-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
              ) : filteredRooms.length === 0 ? (
                <div className="text-center text-slate-400 dark:text-slate-500 mt-10 text-xs font-semibold">{t('social.noChatsAvailable') || 'No chats found'}</div>
              ) : (
                filteredRooms.map((room) => {
                  if (!room) return null;
                  const hasUnread = (room.unreadCount || 0) > 0;
                  const isSelected = selectedRoomId === room.id;
                  return (
                    <button
                      key={room.id}
                      onClick={() => handleSelectRoom(room.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all outline-none border border-transparent ${
                        isSelected 
                          ? 'bg-slate-100/90 dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-sm' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden text-white font-black text-sm border border-slate-100/50 dark:border-slate-700/50 shadow-sm relative">
                        {room.avatarUrl ? <img src={room.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-brand-light to-brand text-white font-bold"><span>{getInitials(getRoomDisplayName(room))}</span></div>}
                      </div>
 
                      <div className="flex-1 text-left overflow-hidden">
                        <div className={`truncate text-sm tracking-tight transition-colors ${hasUnread ? 'font-black text-slate-950 dark:text-white' : 'font-bold text-slate-800 dark:text-slate-200'}`}>
                          {room.scheduleId != null ? <DynamicText text={getRoomDisplayName(room)} /> : getRoomDisplayName(room)}
                        </div>
                        <div className={`truncate text-xs mt-0.5 transition-colors ${hasUnread ? 'font-black text-brand' : 'font-medium text-slate-400 dark:text-slate-500'}`}>
                          {room.lastMessage || t('social.startConversation') || 'Say hi!'}
                        </div>
                      </div>
 
                      <div className="flex items-center gap-1.5 shrink-0">
                        {room.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-current" />}
                        {room.isMuted && <BellOff className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />}
                        
                        {hasUnread && (
                          <div className="min-w-[18px] h-4.5 px-1 rounded-full bg-brand text-white text-[9px] font-black flex items-center justify-center shadow-md">
                            {room.unreadCount > 5 ? "5+" : room.unreadCount}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
 
          {/* RIGHT COLUMN: MESSAGE DISPLAY PANE */}
          <div className="flex-1 flex flex-col bg-[#F0F2F5] dark:bg-slate-950 relative">
            {!selectedRoomId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900">
                <MessageSquare className="w-16 h-16 mb-4 text-slate-100 dark:text-slate-800" />
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-wide">{t('social.selectChatToMessage') || 'Select a chat to start messaging'}</h3>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="h-16 border-b border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center px-6 z-20 justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200/50 dark:border-slate-700/50 text-white font-bold text-xs shadow-sm">
                      {selectedRoom?.avatarUrl ? <img src={selectedRoom.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-brand-light to-brand text-white font-bold"><span>{getInitials(getRoomDisplayName(selectedRoom))}</span></div>}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-wide">
                        {selectedRoom?.scheduleId != null ? <DynamicText text={getRoomDisplayName(selectedRoom)} /> : getRoomDisplayName(selectedRoom)}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setShowMembersModal(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"><Users className="w-4.5 h-4.5" /></button>
                    {isStaffOrAdmin && (
                      <button onClick={() => setShowAddMemberModal(true)} disabled={isAddingMembers} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"><UserPlus className="w-4.5 h-4.5" /></button>
                    )}
                    <button onClick={() => { if(selectedRoomId) mutatePin(selectedRoomId); }} disabled={isPinning} className={`p-2 rounded-xl transition-colors ${selectedRoom?.isPinned ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><Pin className="w-4.5 h-4.5" /></button>
                    <button onClick={() => { if(selectedRoomId) mutateMute(selectedRoomId); }} disabled={isMuting} className={`p-2 rounded-xl transition-colors ${selectedRoom?.isMuted ? 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/30' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><BellOff className="w-4.5 h-4.5" /></button>
                  </div>
                </div>
 
                {/* Scrollable messages viewport */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar z-0 relative flex flex-col bg-[#F2F4F7] dark:bg-slate-900/40">
                  {isLoadingHistory ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="w-7 h-7 animate-spin text-brand" /></div>
                  ) : (
                    allMessages.map((msg: any, idx) => {
                      const senderName = msg.senderName ?? msg.SenderName ?? '';
                      const content = msg.content ?? msg.Content ?? '';
                      const senderId = msg.senderId ?? msg.SenderId;
                      const msgId = msg.id ?? msg.Id ?? Math.random();
                      const createdAt = msg.createdAt ?? msg.CreatedAt;

                      if (senderName === 'System') {
                        try {
                          if (content.startsWith('{')) {
                            const parsed = JSON.parse(content);
                            if (parsed.action === 'MEMBER_ADDED' && Array.isArray(parsed.users)) {
                              return (
                                <div key={`${msgId}-${idx}`} className="flex flex-col items-center justify-center w-full shrink-0 my-3 gap-1">
                                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide">{t('social.memberAdded') || 'Members added to the group:'}</span>
                                  <div className="flex flex-wrap items-center justify-center gap-2 mt-0.5">
                                    {parsed.users.map((u: any) => (
                                      <a key={u.id} href={`/social/profile/${u.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-full shadow-sm hover:shadow-md transition-all border border-slate-200 dark:border-slate-700 hover:border-brand/30 group cursor-pointer no-underline">
                                        <div className="w-5 h-5 rounded-full overflow-hidden bg-brand shrink-0 flex items-center justify-center text-white text-[9px] font-bold">
                                          {u.avatarUrl ? <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" /> : (u.fullName?.charAt(0)?.toUpperCase() || 'U')}
                                        </div>
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-brand">{u.fullName || 'User'}</span>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                          }
                        } catch (e) {
                          // ignore JSON parse error, fallback
                        }
                        
                        return (
                          <div key={`${msgId}-${idx}`} className="flex justify-center w-full shrink-0">
                            <span className="bg-slate-200/80 dark:bg-slate-800/80 backdrop-blur-sm text-[10px] font-black text-slate-500 dark:text-slate-400 rounded-full px-4 py-1 my-1 shadow-inner border border-white/20 dark:border-slate-700/30 uppercase tracking-wider">{content}</span>
                          </div>
                        );
                      }
                      const isMe = String(senderId ?? '') === String(currentUserId);
                      
                      const nextMsg = allMessages[idx + 1];
                      const prevMsg = allMessages[idx - 1];
                      const nextSenderId = nextMsg?.senderId ?? nextMsg?.SenderId;
                      const prevSenderId = prevMsg?.senderId ?? prevMsg?.SenderId;
                      const isNextSystem = nextMsg?.senderName === 'System' || nextMsg?.SenderName === 'System';
                      const isPrevSystem = prevMsg?.senderName === 'System' || prevMsg?.SenderName === 'System';

                      const isLastInGroup = !nextMsg || isNextSystem || String(nextSenderId ?? '') !== String(senderId ?? '');
                      const isFirstInGroup = !prevMsg || isPrevSystem || String(prevSenderId ?? '') !== String(senderId ?? '');

                      const rawAvatar = msg.senderAvatarUrl || msg.SenderAvatarUrl || msg.senderAvatar || msg.SenderAvatar || (msg as any).senderAvatarUrl || (msg as any).SenderAvatarUrl || (msg as any).senderAvatar || (msg as any).SenderAvatar;
                      const avatarToUse = rawAvatar || (!selectedRoom?.isGroupChat ? selectedRoom?.avatarUrl : null);

                      return (
                        <div
                          key={`${msgId}-${idx}`}
                          onMouseEnter={() => setHoveredMessageId(msgId)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                          className={`w-full flex flex-col ${isMe ? 'items-end' : 'items-start'} group shrink-0 ${isFirstInGroup ? 'mt-3' : 'mt-1'}`}
                        >
                          <div className={`flex gap-3 items-end max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
                            {!isMe && (
                              isLastInGroup ? (
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 text-[10px] font-black text-slate-650 dark:text-slate-200 mb-0.5 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                                  {avatarToUse && (
                                    <img 
                                      src={avatarToUse} 
                                      alt="avatar" 
                                      className="w-full h-full object-cover" 
                                      onError={(e) => { 
                                        e.currentTarget.style.display = 'none'; 
                                        const sibling = e.currentTarget.nextSibling as HTMLElement;
                                        if (sibling) sibling.style.display = 'flex';
                                      }}
                                    />
                                  )}
                                  <span 
                                    style={{ display: avatarToUse ? 'none' : 'flex' }} 
                                    className="w-full h-full items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-750 dark:text-slate-250"
                                  >
                                    {getInitials(senderName || 'User')}
                                  </span>
                                </div>
                              ) : (
                                <div className="w-8 h-8 shrink-0" />
                              )
                            )}
                            <div className="relative flex flex-col">
                              {!isMe && isFirstInGroup && selectedRoom?.isGroupChat && (
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1 px-1 tracking-wide uppercase">
                                  {senderName}
                                </span>
                              )}
                              <div className={`relative px-4 py-2.5 rounded-[18px] text-[14px] leading-relaxed shadow-sm w-auto ${
                                isMe 
                                  ? 'bg-[#0084FF] text-white rounded-br-[4px]' 
                                  : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-[4px]'
                              }`}>
                                
                                {content.startsWith('[MomentShare:') ? (() => {
                                  try {
                                    const jsonStr = content.substring(13, content.length - 1);
                                    const { id, imageUrl, caption } = JSON.parse(jsonStr);
                                    return (
                                      <div 
                                        onClick={() => navigate(`/social/moments?momentId=${id}`)}
                                        className="flex flex-col rounded-2xl overflow-hidden border border-slate-850 shadow-lg cursor-pointer hover:scale-[1.02] hover:border-brand/40 transition-all max-w-[240px] bg-slate-900 text-white mt-1"
                                      >
                                        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 text-[10px] font-black uppercase tracking-wider text-slate-300">
                                          <Camera className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                                          <span>{t('social.moment') || 'Moment'}</span>
                                        </div>
                                        <div className="w-full aspect-[4/5] bg-slate-950 overflow-hidden relative">
                                          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        {caption && (
                                          <div className="p-3 text-[11px] font-bold line-clamp-2 bg-slate-900 text-slate-100 leading-normal">
                                            {caption}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  } catch (e) {
                                    return <p className="break-words font-medium whitespace-pre-wrap">{content}</p>;
                                  }
                                })() : content.includes('[LocationShare:') ? (() => {
                                  try {
                                    const match = content.match(/\[LocationShare:({.*?})\]/);
                                    if (match) {
                                      const { token } = JSON.parse(match[1]);
                                      return (
                                        <div 
                                          onClick={() => window.open(`/track/${token}`, '_blank')}
                                          className={`flex flex-col rounded-2xl overflow-hidden border shadow-md cursor-pointer hover:scale-[1.02] transition-all p-3.5 max-w-[240px] mt-1 ${
                                            isMe ? 'bg-blue-950 text-white border-blue-900' : 'bg-slate-50 text-slate-800 border-slate-200'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className="relative flex h-3 w-3">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{t('social.liveLocation') || 'Live Location'}</span>
                                          </div>
                                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-3">{t('social.clickToTrackLiveRoute') || 'Click to track my live route.'}</p>
                                          <span className="text-[10px] font-bold py-1.5 bg-brand text-white rounded-xl text-center shadow-sm">{t('social.viewLocation') || 'View Location'}</span>
                                        </div>
                                      );
                                    }
                                  } catch (e) {
                                    return <p className="break-words font-medium whitespace-pre-wrap">{content}</p>;
                                  }
                                  return <p className="break-words font-medium whitespace-pre-wrap">{content}</p>;
                                })() : (
                                  <p className="break-words font-medium whitespace-pre-wrap">{content}</p>
                                )}
                                {hoveredMessageId === msgId && (
                                  <div className="absolute -bottom-8 right-0 flex gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-md z-30">
                                    <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-full transition-colors"><SmilePlus className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /></button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-tight">{formatTime(createdAt)}</span>
                            {isMe && <CheckCheck className="w-3.5 h-3.5 text-brand" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
 
                {/* Message input */}
                <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleShareLocationInChat}
                    disabled={isSharingLocation}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand rounded-full transition-colors flex-none"
                    title="Chia sẻ vị trí"
                  >
                    {isSharingLocation ? (
                      <Loader2 className="w-5 h-5 text-brand animate-spin" />
                    ) : (
                      <MapPin className="w-5 h-5" />
                    )}
                  </button>
                  
                  <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-3">
                    <div className="flex-1 flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-1.5 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-brand/20 transition-all border border-transparent focus-within:border-slate-200 dark:focus-within:border-slate-700">
                      <input 
                        type="text" 
                        value={textValue} 
                        onChange={(e) => setTextValue(e.target.value)} 
                        placeholder={t('social.typeMessage') || 'Type a message...'} 
                        className="flex-1 bg-transparent py-1.5 text-sm focus:outline-none text-slate-800 dark:text-slate-150 placeholder-slate-400 dark:placeholder-slate-500" 
                      />
                    </div>
                    <button type="submit" disabled={!textValue.trim() || !isConnected} className="p-2.5 bg-brand text-white hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-all flex items-center justify-center shrink-0 shadow-sm active:scale-95 cursor-pointer"><Send className="w-4 h-4" /></button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AddMemberModal isOpen={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} onConfirm={handleAddMembers} isLoading={isAddingMembers} isSingleSelect={false} roomId={selectedRoomId} />
      <AddMemberModal isOpen={showNewChatModal} onClose={() => setShowNewChatModal(false)} onConfirm={handleStartNewChat} isLoading={isCreatingNewChat} isSingleSelect={true} roomId={null} />
      <RoomMembersModal isOpen={showMembersModal} onClose={() => setShowMembersModal(false)} roomId={selectedRoomId} />
    </>
  );
};
