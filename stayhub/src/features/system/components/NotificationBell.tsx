import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, Loader2, X } from "lucide-react"; // 💥 Nhớ import thêm icon X
import { useNotifications } from "../hooks/useNotifications";
import { useNotificationHub } from "../hooks/useNotificationHub";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 💥 Lấy hàm deleteNoti ra xài
  const {
    notifications,
    setNotifications,
    isLoading,
    error,
    unreadCount,
    markAsRead,
    deleteNoti,
  } = useNotifications();

  // Truyền setNotifications vào SignalR
  useNotificationHub(setNotifications);

  // Xử lý đóng popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ... (Giữ nguyên phần nút Chuông) ... */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          isOpen
            ? "bg-[#0068E0]/10 text-[#0068E0]"
            : "text-slate-500 hover:bg-[#0068E0]/10 hover:text-[#0068E0]"
        }`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0068E0] opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#0068E0]"></span>
          </span>
        )}
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-slate-900/5 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button className="flex items-center gap-1 text-xs font-semibold text-[#0068E0] transition-colors hover:text-[#0058D0]">
                <Check className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center py-10 text-[#0068E0]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center text-sm font-medium text-rose-500">
                {error}
              </div>
            ) : notifications.length > 0 ? (
              <div className="flex flex-col divide-y divide-slate-100">
                {notifications.map((noti) => (
                  <div
                    key={noti.id}
                    onClick={() => markAsRead(noti)}
                    // 💥 Thêm class 'group' và 'relative' để xử lý hover hiện nút xóa
                    className={`group relative flex cursor-pointer flex-col gap-1.5 p-4 transition-colors hover:bg-slate-50 ${
                      !noti.isRead ? "bg-[#0068E0]/[0.03]" : ""
                    }`}
                  >
                    {/* Thêm pr-6 để chữ không đè lên nút Xóa */}
                    <div className="flex items-start justify-between gap-3 pr-6">
                      <h4
                        className={`text-sm leading-snug ${!noti.isRead ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}
                      >
                        {noti.title}
                      </h4>
                      <span className="shrink-0 text-[10px] font-medium text-slate-400 mt-0.5">
                        {new Date(noti.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p
                      className={`text-xs line-clamp-2 leading-relaxed ${!noti.isRead ? "text-slate-700 font-medium" : "text-slate-500"}`}
                    >
                      {noti.content}
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNoti(noti.id);
                      }}
                      // 💥 Đã sửa đoạn class: thay 'top-3.5' bằng 'top-1/2 -translate-y-1/2'
                      className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors hover:bg-rose-100 hover:text-rose-500"
                      title="Delete notification"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  No notifications
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  You're all caught up!
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50 p-2 text-center">
            <button className="text-xs font-semibold text-slate-500 transition-colors hover:text-[#0068E0]">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
