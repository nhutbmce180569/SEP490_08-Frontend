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
  Smile,
  Mic,
  Image,
  Heart,
  ChevronLeft,
  X,
  Maximize2,
  SquarePen,
  Search,
  CheckCheck,
  MapPin,
  Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../../contexts/AuthContext';
import { useTranslation } from '../../../../contexts/LocaleContext';
import { useToast } from '../../../../contexts/ToastContext';
import { useShareLocation } from '../../tracking/hooks/useLocationTracking';
import { useChatNotification } from './ChatNotificationContext';

export const GlobalChatPopover: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error, warning } = useToast();
  
  const { user } = useContext(AuthContext);
  const currentUserId = user?.id || user?.Id || user?.nameid || user?.sub || 0;

  // Trạng thái popover được quản lý toàn cục qua ChatNotificationContext
  const { 
    isPopoverOpen, 
    setIsPopoverOpen, 
    activeRoomId, 
    setActiveRoomId 
  } = useChatNotification();

  // Trạng thái view nội bộ popover: 'list' (hộp thư), 'chat' (phòng chat), 'search' (tìm bạn tạo chat mới)
  const [viewState, setViewState] = useState<'list' | 'chat' | 'search'>('list');
  const [textValue, setTextValue] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessagesLengthRef = useRef<number>(0);

  // Lắng nghe thay đổi của activeRoomId từ context để đổi view tương ứng
  useEffect(() => {
    if (activeRoomId) {
      setViewState('chat');
    } else {
      setViewState('list');
    }
  }, [activeRoomId]);

  // debounce cho ô tìm kiếm bạn bè
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Query lấy danh sách phòng chat
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: chatService.getChatRooms,
    enabled: !!user && isPopoverOpen,
  });

  // Query tìm kiếm người dùng để tạo chat mới
  const { data: searchResult, isLoading: isSearching } = useSearchUsers(debouncedQuery, 1, 20);

  // Sắp xếp các phòng chat theo thời gian tin nhắn mới nhất
  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a: any, b: any) => {
      const timeA = new Date(a.lastMessageCreatedAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.lastMessageCreatedAt || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });
  }, [rooms]);

  // Query lấy lịch sử tin nhắn của phòng đang active
  const { data: historyMessages = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['chatMessages', activeRoomId],
    queryFn: () => chatService.getChatMessages(activeRoomId!),
    enabled: !!activeRoomId && isPopoverOpen && viewState === 'chat',
  });

  // Hook kết nối SignalR thời gian thực cho phòng chat active
  const { 
    messages: realtimeMessages, 
    sendMessage, 
    isConnected, 
    setMessages: setRealtimeMessages 
  } = useChatSignalR(viewState === 'chat' ? activeRoomId : null);

  const { mutate: shareLocation, isPending: isSharingLocation } = useShareLocation();

  const handleShareLocationInChat = useCallback(() => {
    if (!activeRoomId || !isConnected) return;
    shareLocation(undefined, {
      onSuccess: (token) => {
        const shareContent = `📍 Vị trí hiện tại của tôi: [LocationShare:${JSON.stringify({ token })}]`;
        sendMessage(shareContent);
        success("Đã gửi vị trí của bạn!");
        queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      },
      onError: () => {
        error("Không thể chia sẻ vị trí.");
      }
    });
  }, [activeRoomId, isConnected, shareLocation, sendMessage, success, error, queryClient]);

  // Mutation đánh dấu đã đọc
  const { mutate: mutateMarkAsRead } = useMutation({
    mutationFn: (roomId: number) => chatService.markRoomAsRead(roomId),
  });

  // Mutation tạo phòng chat mới
  const { mutate: mutateCreateRoom, isPending: isCreatingRoom } = useCreateChatRoom();

  // Reset realtime messages khi đổi phòng
  useEffect(() => {
    setRealtimeMessages([]);
  }, [activeRoomId, setRealtimeMessages]);

  // Gộp tin nhắn lịch sử và tin nhắn thời gian thực
  const allMessages = useMemo(() => {
    const raw = [...historyMessages, ...realtimeMessages];
    return Array.from(
      new Map(raw.map((msg) => [msg.id || (msg as any).Id, msg])).values()
    ).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [historyMessages, realtimeMessages]);

  // Tự động cuộn xuống cuối khi có tin nhắn mới hoặc đổi phòng
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      const isRoomChanged = lastMessagesLengthRef.current === 0 || allMessages.length === 0;
      const lastMessage = allMessages[allMessages.length - 1];
      const isMyNewMessage = lastMessage && String(lastMessage.senderId) === String(currentUserId);

      if (isRoomChanged || isAtBottom || isMyNewMessage) {
        container.scrollTop = container.scrollHeight;
      }
    }
    lastMessagesLengthRef.current = allMessages.length;
  }, [allMessages, viewState, currentUserId]);

  // Xử lý khi click chọn phòng chat từ danh sách
  const handleSelectRoom = (roomId: number) => {
    setActiveRoomId(roomId);
    setViewState('chat');
    // Đánh dấu đã đọc trên client cache lập tức
    queryClient.setQueryData(['chatRooms'], (oldRooms: any) => {
      if (!Array.isArray(oldRooms)) return oldRooms;
      return oldRooms.map((r: any) => r.id === roomId ? { ...r, unreadCount: 0 } : r);
    });
    mutateMarkAsRead(roomId);
  };

  // Gửi tin nhắn
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textValue.trim() || !activeRoomId || !isConnected) return;
    try {
      await sendMessage(textValue.trim());
      setTextValue('');
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    } catch (err: any) {
      console.error("Lỗi gửi tin nhắn:", err);
      error(t('social.failedToSendMessage'));
    }
  };

  // Tạo cuộc trò chuyện mới với người dùng
  const handleStartNewChat = (friendId: number) => {
    mutateCreateRoom(friendId, {
      onSuccess: (newRoom: any) => {
        const newRoomId = newRoom?.id || newRoom?.Id || newRoom?.data?.id;
        if (newRoomId) {
          setActiveRoomId(newRoomId);
          setViewState('chat');
          setSearchInput('');
          setDebouncedQuery('');
          queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
        }
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.response?.data || t('social.failedToStartChat');
        error(typeof msg === 'string' ? msg : t('social.unknownSystemError'));
      }
    });
  };

  // Lấy chữ cái đầu làm avatar thay thế
  const getInitials = (name?: string | null) => {
    if (!name || typeof name !== 'string') return 'U';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === activeRoomId);
  }, [rooms, activeRoomId]);

  const getRoomDisplayName = (room: any) => room?.roomName || room?.name || t('social.chat');

  // Đóng popover
  const handleClose = () => {
    setIsPopoverOpen(false);
  };

  // Mở chế độ xem toàn màn hình
  const handleMaximize = () => {
    setIsPopoverOpen(false);
    if (activeRoomId) {
      navigate(`/chat?roomId=${activeRoomId}`);
    } else {
      navigate('/chat');
    }
  };

  if (!user || !isPopoverOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[999] w-[360px] h-[520px] rounded-3xl bg-white border border-slate-200/80 shadow-2xl flex flex-col overflow-hidden animate-fadeIn duration-200">
      
      {/* 1. VIEW STATE: LIST (DANH SÁCH INBOX) */}
      {viewState === 'list' && (
        <div className="flex flex-col h-full relative">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-none bg-white">
            <h2 className="text-base font-extrabold text-slate-800 tracking-tight">{t('social.messages') || 'Messages'}</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleMaximize}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all"
                title="Mở toàn màn hình"
              >
                <Maximize2 size={16} />
              </button>
              <button 
                onClick={handleClose}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Rooms Scroll Area */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar bg-slate-50/30">
            {isLoadingRooms ? (
              <div className="flex flex-col justify-center items-center h-48 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
                <span className="text-xs text-slate-400 font-semibold">Đang tải hộp thư...</span>
              </div>
            ) : sortedRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-600">Chưa có tin nhắn nào</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Hãy bắt đầu trò chuyện với bạn bè ngay hôm nay!</p>
              </div>
            ) : (
              sortedRooms.map((room) => {
                const hasUnread = room.unreadCount > 0;
                return (
                  <button
                    key={room.id}
                    onClick={() => handleSelectRoom(room.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-slate-100/70 border border-transparent text-left cursor-pointer"
                  >
                    <div className="relative flex-none">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden text-slate-700 font-extrabold text-xs shadow-sm border border-slate-200">
                        {room.avatarUrl ? <img src={room.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <span>{getInitials(getRoomDisplayName(room))}</span>}
                      </div>
                      {room.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`text-xs truncate ${hasUnread ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                          {getRoomDisplayName(room)}
                        </span>
                        {room.lastMessageCreatedAt && (
                          <span className="text-[10px] text-slate-400 flex-none font-medium">
                            {new Date(room.lastMessageCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] truncate mt-0.5 ${hasUnread ? 'font-black text-brand' : 'text-slate-400 font-medium'}`}>
                        {room.lastMessage || 'Bắt đầu cuộc hội thoại'}
                      </p>
                    </div>

                    {hasUnread && (
                      <div className="w-2 h-2 rounded-full bg-brand flex-none shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* New message write button at bottom-right (Instagram style) */}
          <button 
            onClick={() => setViewState('search')}
            className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-slate-950 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer z-10"
            title="Cuộc trò chuyện mới"
          >
            <SquarePen size={18} />
          </button>
        </div>
      )}

      {/* 2. VIEW STATE: SEARCH (TÌM BẠN CHAT MỚI) */}
      {viewState === 'search' && (
        <div className="flex flex-col h-full bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 flex-none bg-white">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewState('list')}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-sm font-bold text-slate-850">Cuộc trò chuyện mới</h2>
            </div>
            <button onClick={handleClose} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all">
              <X size={16} />
            </button>
          </div>

          {/* Search box overlay */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={searchInput} 
                onChange={(e) => setSearchInput(e.target.value)} 
                placeholder="Tìm bạn bè qua tên hoặc email..." 
                className="w-full pl-9 pr-4 py-2 border border-slate-200/80 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand text-xs font-semibold placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* User Search Results */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
            {isSearching ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-5 h-5 text-brand animate-spin" />
              </div>
            ) : searchResult && Array.isArray(searchResult.data) && searchResult.data.length > 0 ? (
              searchResult.data.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => handleStartNewChat(item.id)}
                  disabled={isCreatingRoom}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-all border border-transparent text-left cursor-pointer disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-150 flex items-center justify-center shrink-0 overflow-hidden text-slate-700 font-extrabold text-xs shadow-sm border border-slate-200">
                    {item.avatarUrl ? <img src={item.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <span>{getInitials(item.fullName)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs text-slate-800 truncate">{item.fullName || t('common.user')}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{item.email}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center text-slate-400 py-12 text-xs font-medium">
                {searchInput ? 'Không tìm thấy kết quả phù hợp' : 'Nhập từ khóa để tìm bạn bè'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. VIEW STATE: CHAT (PHÒNG CHAT CHI TIẾT) */}
      {viewState === 'chat' && (
        <div className="flex flex-col h-full bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 flex-none bg-white shadow-sm z-10">
            <div className="flex items-center gap-2 min-w-0">
              <button 
                onClick={() => {
                  setActiveRoomId(null);
                  setViewState('list');
                }}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div 
                className="flex items-center gap-2 cursor-pointer min-w-0 group"
                onClick={() => {
                  if (selectedRoom?.otherParticipantId) {
                    setIsPopoverOpen(false);
                    navigate(`/social/profile/${selectedRoom.otherParticipantId}`);
                  }
                }}
              >
                <div className="w-8 h-8 rounded-full bg-slate-150 flex items-center justify-center overflow-hidden text-slate-700 font-extrabold text-[10px] border border-slate-200 shrink-0">
                  {selectedRoom?.avatarUrl ? <img src={selectedRoom.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <span>{getInitials(getRoomDisplayName(selectedRoom))}</span>}
                </div>
                <span className="text-xs font-extrabold text-slate-800 truncate group-hover:text-brand transition-colors">
                  {getRoomDisplayName(selectedRoom)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-none">
              <button 
                onClick={handleMaximize}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all"
                title="Mở rộng chat"
              >
                <Maximize2 size={15} />
              </button>
              <button onClick={handleClose} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-white"
          >
            {isLoadingHistory ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-5 h-5 text-brand animate-spin" />
              </div>
            ) : allMessages.length === 0 ? (
              <div className="text-center text-slate-400 py-12 text-[10px] font-semibold">
                Bắt đầu cuộc trò chuyện. Hãy gửi tin nhắn chào hỏi!
              </div>
            ) : (
              allMessages.map((msg: any, index) => {
                const isMe = String(msg.senderId || msg.SenderId) === String(currentUserId);
                
                // Hiển thị avatar người khác nếu là tin nhắn đầu tiên của khối tin nhắn đến
                const nextMsg = allMessages[index + 1];
                const showAvatar = !isMe && (!nextMsg || String((nextMsg as any).senderId || (nextMsg as any).SenderId) === String(currentUserId));

                return (
                  <div key={msg.id || Math.random()} className={`flex gap-2 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                    {!isMe && (
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 text-[8px] font-extrabold self-end">
                        {showAvatar && (
                          selectedRoom?.avatarUrl ? <img src={selectedRoom.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <span>{getInitials(getRoomDisplayName(selectedRoom))}</span>
                        )}
                      </div>
                    )}
                    <div className="flex flex-col">
                      {msg.content.startsWith('[MomentShare:') ? (() => {
                        try {
                          const jsonStr = msg.content.substring(13, msg.content.length - 1);
                          const { id, imageUrl, caption } = JSON.parse(jsonStr);
                          return (
                            <div 
                              onClick={() => {
                                setIsPopoverOpen(false);
                                navigate(`/social/moments?momentId=${id}`);
                              }}
                              className="flex flex-col rounded-2xl overflow-hidden border border-slate-800 shadow-lg cursor-pointer hover:scale-[1.02] hover:border-brand/40 transition-all max-w-[200px] bg-slate-900 text-white"
                            >
                              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 text-[9px] font-black uppercase tracking-wider text-slate-300">
                                <Camera className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                                <span>Khoảnh khắc</span>
                              </div>
                              <div className="w-full aspect-[4/5] bg-slate-950 overflow-hidden relative">
                                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                              </div>
                              {caption && (
                                <div className="p-2.5 text-[10px] font-bold line-clamp-2 bg-slate-900 text-slate-100 leading-normal">
                                  {caption}
                                </div>
                              )}
                            </div>
                          );
                        } catch (e) {
                          return <div className="text-xs px-3.5 py-2 rounded-2xl bg-slate-100 text-slate-800">{msg.content}</div>;
                        }
                      })() : msg.content.includes('[LocationShare:') ? (() => {
                        try {
                          const match = msg.content.match(/\[LocationShare:({.*?})\]/);
                          if (match) {
                            const { token } = JSON.parse(match[1]);
                            return (
                              <div 
                                onClick={() => window.open(`/track/${token}`, '_blank')}
                                className={`flex flex-col rounded-2xl overflow-hidden border shadow-md cursor-pointer hover:scale-[1.02] transition-all p-3 max-w-[200px] ${
                                  isMe ? 'bg-blue-950 text-white border-blue-900' : 'bg-slate-50 text-slate-800 border-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest">Vị trí trực tiếp</span>
                                </div>
                                <p className="text-[9px] text-slate-400 font-medium leading-relaxed mb-3">Bấm để theo dõi lộ trình di chuyển trực tuyến của tôi.</p>
                                <span className="text-[9px] font-bold py-1.5 bg-brand text-white rounded-xl text-center shadow-sm">Xem vị trí</span>
                              </div>
                            );
                          }
                        } catch (e) {
                          return <div className="text-xs px-3.5 py-2 rounded-2xl bg-slate-100 text-slate-800">{msg.content}</div>;
                        }
                        return <div className="text-xs px-3.5 py-2 rounded-2xl bg-slate-100 text-slate-800">{msg.content}</div>;
                      })() : (
                        <div className={`text-xs px-3.5 py-2 rounded-2xl leading-relaxed whitespace-pre-wrap break-words ${
                          isMe 
                            ? 'bg-brand text-white rounded-br-sm' 
                            : 'bg-slate-100 text-slate-800 rounded-bl-sm border border-slate-100/50'
                        }`}>
                          {msg.content}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Footer Form */}
          <form 
            onSubmit={handleSend}
            className="px-3.5 py-3 border-t border-slate-100 bg-white flex-none flex items-center gap-2"
          >
            <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-full px-4 py-2 bg-slate-50/50">
              <input 
                type="text" 
                value={textValue} 
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Message..." 
                className="flex-1 bg-transparent focus:outline-none text-xs font-semibold placeholder:text-slate-400 text-slate-800"
              />
              <button
                type="button"
                onClick={handleShareLocationInChat}
                disabled={isSharingLocation}
                className="text-slate-400 hover:text-brand transition-colors cursor-pointer flex-none"
                title="Chia sẻ vị trí của tôi"
              >
                {isSharingLocation ? (
                  <Loader2 className="w-3.5 h-3.5 text-brand animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={!textValue.trim() || !isConnected}
              className="text-brand font-black text-xs hover:text-brand-hover active:scale-95 transition-all px-2.5 cursor-pointer disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
