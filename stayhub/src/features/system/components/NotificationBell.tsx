import { useState, useRef, useEffect } from "react";
import { Bell, Check, Loader2, X, Heart, MessageCircle, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { useNotificationHub } from "../hooks/useNotificationHub";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useGetPendingRequests, useRespondToRequest } from "../../../features/social/friends/hooks/useFriends";
import { getImg } from "../../../config/api/api";

type NotificationWithMeta = {
  id: number;
  userId: number;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
  avatarUrl?: string | null;
  actionUrl?: string;
};

function NotificationIcon({ type }: { type?: string }) {
  if (type === "moment_like") return <Heart className="h-4 w-4 text-rose-500 shrink-0" />;
  if (type === "moment_comment") return <MessageCircle className="h-4 w-4 text-brand shrink-0" />;
  if (type === "friend_request") return <UserPlus className="h-4 w-4 text-emerald-500 shrink-0" />;
  return <Bell className="h-4 w-4 text-slate-400 shrink-0" />;
}

export default function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    setNotifications,
    isLoading,
    hasLoaded,
    error,
    unreadCount,
    markAsRead,
    deleteNoti,
    refresh,
    hasMore,
    loadMore,
  } = useNotifications();

  // Gọi API lấy các yêu cầu bạn bè đang chờ duyệt
  const { data: pendingRequests } = useGetPendingRequests(!!localStorage.getItem("accessToken"));
  const { mutate: respondToRequest } = useRespondToRequest();
  const pendingRequestsCount = Array.isArray(pendingRequests) ? pendingRequests.length : 0;

  useNotificationHub(setNotifications);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && !hasLoaded && !isLoading) {
      void refresh();
    }
  }, [hasLoaded, isLoading, isOpen, refresh]);

  const handleNotiClick = (noti: NotificationWithMeta) => {
    if (noti.id > 0) {
      markAsRead(noti as any);
    }
    if (noti.actionUrl) {
      setIsOpen(false);
      navigate(noti.actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadSystemNotis = notifications.filter(n => !n.isRead);
    if (unreadSystemNotis.length > 0) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      try {
        await Promise.all(unreadSystemNotis.map(n => markAsRead(n)));
      } catch (err) {
        console.error("Failed to mark all notifications as read:", err);
      }
    }
  };

  // Ánh xạ các lời mời kết bạn từ DB sang dạng hiển thị Notification
  const mappedFriendRequests: NotificationWithMeta[] = (pendingRequests ?? []).map((req: any) => ({
    id: -req.id, // ID âm để tránh trùng lặp
    userId: 0,
    title: "Lời mời kết bạn mới",
    content: `${req.senderName || "Ai đó"} đã gửi lời mời kết bạn cho bạn.`,
    isRead: false,
    createdAt: req.createdAt || new Date().toISOString(),
    type: "friend_request",
    avatarUrl: req.senderAvatarUrl || null,
    actionUrl: `/social/profile/${req.senderId || req.friendId || req.requesterId || 0}`,
  }));

  // Gộp thông báo hệ thống và lời mời kết bạn, sắp xếp mới nhất lên đầu
  const combinedNotifications = [
    ...mappedFriendRequests,
    ...notifications.filter(n => (n as any).type !== "friend_request")
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalUnreadCount = unreadCount + pendingRequestsCount;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`icon-btn relative transition-all border-0 shadow-none ${isOpen ? "!bg-brand-light/40 !text-brand" : "text-slate-600 dark:text-slate-300 hover:bg-brand-light/30 hover:text-brand"}`}
        aria-label={t("dashboard.notifications")}
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {totalUnreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="glass-dropdown absolute right-0 top-full z-50 mt-2 w-96 sm:w-[420px] overflow-hidden rounded-2xl shadow-2xl shadow-brand/10 border border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 bg-white/80 px-5 py-4 backdrop-blur-md">
            <h3 className="text-base font-bold text-slate-900">{t("dashboard.notifications")}</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="group flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand/20 hover:text-brand-hover"
              >
                <Check className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                {t("dashboard.markAllRead")}
              </button>
            )}
          </div>

          <div className="custom-scrollbar max-h-[450px] overflow-y-auto bg-slate-50/50 p-2">
            {isLoading && combinedNotifications.length === 0 ? (
              <div className="flex justify-center py-10 text-brand">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center text-sm font-medium text-rose-500 bg-rose-50 rounded-xl m-2">{error}</div>
            ) : combinedNotifications.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {combinedNotifications.map((noti) => {
                  const n = noti as NotificationWithMeta;
                  return (
                    <div
                      key={noti.id}
                      onClick={() => handleNotiClick(n)}
                      className={`group relative flex cursor-pointer gap-3.5 rounded-xl p-3.5 transition-all ${!noti.isRead ? "bg-white shadow-sm ring-1 ring-slate-100 hover:bg-brand/5 hover:ring-brand/20" : "bg-transparent hover:bg-white hover:shadow-sm"}`}
                    >
                      {!noti.isRead && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-md bg-brand shadow-sm shadow-brand/40" />
                      )}
                      
                      <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden shadow-inner ${!noti.isRead ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-500"}`}>
                        {n.avatarUrl ? (
                          <img src={getImg(n.avatarUrl)} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <NotificationIcon type={n.type} />
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1 pr-6">
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <h4 className={`text-sm leading-snug ${!noti.isRead ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                            {noti.title}
                          </h4>
                        </div>
                        <p className={`line-clamp-2 text-[13px] leading-relaxed ${!noti.isRead ? "font-medium text-slate-700" : "text-slate-500"}`}>
                          {noti.content}
                        </p>
                        <span className="mt-1.5 block text-[11px] font-medium text-slate-400">
                          {new Date(noti.createdAt).toLocaleString(undefined, { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (noti.id > 0) deleteNoti(noti.id);
                          else {
                            const requestId = -noti.id;
                            respondToRequest({ requestId, isAccepted: false });
                          }
                        }}
                        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-100 hover:text-rose-600"
                        title={t("dashboard.deleteNotification")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
                
                {hasMore && (
                  <div className="mt-2 text-center pb-2">
                    <button 
                      type="button" 
                      onClick={loadMore} 
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold text-brand shadow-sm ring-1 ring-slate-100 transition-all hover:bg-brand hover:text-white hover:shadow-md hover:ring-brand disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {t("common.loading") || "Đang tải..."}
                        </>
                      ) : (
                        t("tour.showMore") || "Xem thêm"
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-300 ring-4 ring-slate-50/50">
                  <Bell className="h-7 w-7" />
                </div>
                <p className="text-base font-bold text-slate-800">{t("dashboard.noNotifications")}</p>
                <p className="mt-1 text-sm text-slate-500">{t("dashboard.allCaughtUp")}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
