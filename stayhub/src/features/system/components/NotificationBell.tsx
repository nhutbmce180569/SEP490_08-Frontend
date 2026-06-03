import { useState, useRef, useEffect } from "react";
import { Bell, Check, Loader2, X } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { useNotificationHub } from "../hooks/useNotificationHub";
import { useTranslation } from "../../../contexts/LocaleContext";

export default function NotificationBell() {
  const { t } = useTranslation();
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
  } = useNotifications();

  useNotificationHub(setNotifications);

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

  useEffect(() => {
    if (isOpen && !hasLoaded && !isLoading) {
      void refresh();
    }
  }, [hasLoaded, isLoading, isOpen, refresh]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`icon-btn relative ${isOpen ? "!bg-brand-light !text-brand" : ""}`}
        aria-label={t("dashboard.notifications")}
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand ring-2 ring-white" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="glass-dropdown absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100/80 bg-slate-50/60 px-4 py-3">
            <h3 className="text-sm font-bold text-navy">{t("dashboard.notifications")}</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-semibold text-brand transition-colors hover:text-brand-hover"
              >
                <Check className="h-3.5 w-3.5" />
                {t("dashboard.markAllRead")}
              </button>
            )}
          </div>

          <div className="custom-scrollbar max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-10 text-brand">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center text-sm font-medium text-rose-500">
                {error}
              </div>
            ) : notifications.length > 0 ? (
              <div className="flex flex-col divide-y divide-slate-100/80">
                {notifications.map((noti) => (
                  <div
                    key={noti.id}
                    onClick={() => markAsRead(noti)}
                    className={`group relative flex cursor-pointer flex-col gap-1.5 p-4 transition-colors hover:bg-brand-light/30 ${
                      !noti.isRead ? "bg-brand/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 pr-6">
                      <h4
                        className={`text-sm leading-snug ${!noti.isRead ? "font-bold text-navy" : "font-semibold text-slate-700"}`}
                      >
                        {noti.title}
                      </h4>
                      <span className="mt-0.5 shrink-0 text-[10px] font-medium text-slate-400">
                        {new Date(noti.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p
                      className={`line-clamp-2 text-xs leading-relaxed ${!noti.isRead ? "font-medium text-slate-700" : "text-slate-500"}`}
                    >
                      {noti.content}
                    </p>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNoti(noti.id);
                      }}
                      className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors hover:bg-rose-100 hover:text-rose-500"
                      title={t("dashboard.deleteNotification")}
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
                <p className="text-sm font-semibold text-navy">{t("dashboard.noNotifications")}</p>
                <p className="mt-1 text-xs text-slate-500">{t("dashboard.allCaughtUp")}</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100/80 bg-slate-50/50 p-2 text-center">
            <button
              type="button"
              className="text-xs font-semibold text-slate-500 transition-colors hover:text-brand"
            >
              {t("dashboard.viewAllNotifications")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
