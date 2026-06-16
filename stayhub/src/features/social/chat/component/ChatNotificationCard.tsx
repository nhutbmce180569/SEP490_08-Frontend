import React from "react";
import { motion } from "framer-motion";

export interface ChatNotificationCardProps {
  roomName: string;
  senderName?: string;
  message: string;
  avatarUrl?: string;
  unreadCount?: number;
  onClose: () => void;
  onClick: () => void;
}

export const ChatNotificationCard: React.FC<ChatNotificationCardProps> = ({
  roomName,
  senderName,
  message,
  avatarUrl,
  unreadCount = 0,
  onClose,
  onClick,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.015 }}
      whileActive={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      drag="y"
      dragConstraints={{ top: -100, bottom: 0 }}
      dragElastic={{ top: 0.2, bottom: 0 }}
      onDragEnd={(e, info) => {
        // Động tác vuốt hất ngược lên phía trên chuẩn trải nghiệm iOS để ẩn nhanh thông báo
        if (info.offset.y < -30) {
          onClose();
        }
      }}
      onClick={onClick}
      className="cursor-pointer w-full p-4 rounded-[32px] bg-white/75 backdrop-blur-[45px] border border-white/40 shadow-[0_16px_48px_rgba(0,0,0,0.1)] flex items-center gap-3.5 relative overflow-hidden select-none"
    >
      {/* Vòng tròn Avatar mượt mà kèm viền bóng mờ */}
      <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 shadow-sm bg-gradient-to-tr from-brand to-blue-400 flex items-center justify-center text-white font-bold text-sm ring-1 ring-black/5">
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover pointer-events-none" />
        ) : (
          <span>{roomName.charAt(0).toUpperCase()}</span>
        )}
      </div>
      
      {/* Khối hiển thị nội dung tin nhắn rút gọn */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-baseline mb-0.5">
          <h4 className="text-[14.5px] font-bold text-slate-900 truncate">
            {roomName}
          </h4>
          <span className="text-[11px] font-bold text-slate-400 shrink-0 ml-2">Bây giờ</span>
        </div>
        <p className="text-[13px] text-slate-600 truncate leading-snug font-medium">
          {senderName && senderName !== roomName && (
            <span className="font-bold text-slate-700">{senderName}: </span>
          )}
          {message}
        </p>
        
        {/* Số lượng tin nhắn chưa đọc bo cong giọt nước Liquid dồn số dạng 5+ giống Zalo */}
        {unreadCount > 1 && (
          <div className="flex items-center gap-1.5 mt-1">
            <div className="min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white text-[9px] font-black flex items-center justify-center border border-white/20 shadow-[0_2px_6px_rgba(244,63,94,0.3)] animate-pulse">
              {unreadCount > 5 ? "5+" : unreadCount}
            </div>
            <span className="text-[10px] font-bold text-rose-500">
              tin nhắn mới chưa đọc
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};