import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatService } from '../services/chatService';
import { X, Search, Loader2, Send } from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import { useToast } from '../../../../contexts/ToastContext';
import { useTranslation } from '../../../../contexts/LocaleContext';

interface ShareTargetModalProps {
  onClose: () => void;
  shareContent: string; // Nội dung tin nhắn đặc biệt để gửi (ví dụ: [MomentShare:...] hoặc [LocationShare:...])
  successMessage?: string;
}

export const ShareTargetModal: React.FC<ShareTargetModalProps> = ({ 
  onClose, 
  shareContent,
  successMessage = "Chia sẻ thành công!"
}) => {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [sharingRoomId, setSharingRoomId] = useState<number | null>(null);

  // Lấy danh sách phòng chat active
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: chatService.getChatRooms,
  });

  // Lọc phòng chat theo ô tìm kiếm
  const filteredRooms = useMemo(() => {
    return rooms.filter((r: any) => {
      const name = r.roomName || r.name || '';
      return name.toLowerCase().includes(searchInput.toLowerCase());
    });
  }, [rooms, searchInput]);

  // Gửi tin nhắn qua SignalR trực tiếp
  const handleShareToRoom = async (roomId: number) => {
    setSharingRoomId(roomId);
    try {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl('https://localhost:7010/hubs/chat', {
          accessTokenFactory: () => localStorage.getItem('accessToken') || localStorage.getItem('access_token') || '',
        })
        .configureLogging(signalR.LogLevel.None)
        .build();

      await connection.start();
      await connection.invoke('JoinRoom', roomId);
      await connection.invoke('SendMessage', roomId, shareContent);
      await connection.stop();
      
      success(successMessage);
      onClose();
    } catch (err) {
      console.error("Lỗi chia sẻ:", err);
      error("Chia sẻ thất bại. Vui lòng thử lại!");
    } finally {
      setSharingRoomId(null);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name || typeof name !== 'string') return 'U';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[28px] shadow-2xl max-w-sm w-full max-h-[80vh] flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white flex-none">
          <h3 className="text-base font-extrabold text-slate-900">Gửi đến cuộc trò chuyện</h3>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex-none">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchInput} 
              onChange={(e) => setSearchInput(e.target.value)} 
              placeholder="Tìm kiếm cuộc trò chuyện..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand text-xs font-semibold placeholder:text-slate-400 text-slate-800"
            />
          </div>
        </div>

        {/* Scroll list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar bg-white min-h-[250px]">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-48 gap-2">
              <Loader2 className="w-5 h-5 text-brand animate-spin" />
              <span className="text-[10px] text-slate-400 font-semibold">Đang tải phòng chat...</span>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center text-slate-400 py-12 text-xs font-semibold">
              Không tìm thấy cuộc trò chuyện nào
            </div>
          ) : (
            filteredRooms.map((room: any) => (
              <div 
                key={room.id}
                className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50/80 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden text-slate-700 font-extrabold text-xs border border-slate-200 flex-none">
                    {room.avatarUrl ? <img src={room.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <span>{getInitials(room.roomName || room.name)}</span>}
                  </div>
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {room.roomName || room.name || t('social.chat')}
                  </span>
                </div>

                <button
                  onClick={() => handleShareToRoom(room.id)}
                  disabled={sharingRoomId !== null}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-[11px] font-bold rounded-xl hover:bg-brand-hover active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex-none"
                >
                  {sharingRoomId === room.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 -rotate-45" />
                  )}
                  <span>Gửi</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex-none">
          <button 
            onClick={onClose}
            className="w-full py-2.5 border border-slate-200 text-slate-700 font-bold text-xs bg-white rounded-xl hover:bg-slate-50 transition-colors"
          >
            Hủy bỏ
          </button>
        </div>

      </div>
    </div>
  );
};
