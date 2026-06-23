import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  Trash2,
  ArrowLeft,
  Loader2,
  Filter,
  CheckCheck,
} from "lucide-react";
import { notificationService } from "../services/notification.service";
import { useTranslation } from "../../../contexts/LocaleContext";
import type { Notification } from "../types/notification";

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterTab = "all" | "unread" | "read";

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ filter }: { filter: FilterTab }) {
  const { t } = useTranslation();
  const messages: Record<FilterTab, { title: string; sub: string }> = {
    all: {
      title: t("common.emptyAll"),
      sub: t("common.emptyAllSub"),
    },
    unread: {
      title: t("common.emptyUnread"),
      sub: t("common.emptyUnreadSub"),
    },
    read: {
      title: t("common.emptyRead"),
      sub: t("common.emptyReadSub"),
    },
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300">
        <Bell className="h-8 w-8" />
      </div>
      <p className="text-base font-semibold text-navy">
        {messages[filter].title}
      </p>
      <p className="mt-1.5 max-w-xs text-sm text-slate-500">
        {messages[filter].sub}
      </p>
    </div>
  );
}

// ─── notifications Row ─────────────────────────────────────────────────────────
function NotificationRow({
  noti,
  onRead,
  onDelete,
}: {
  noti: Notification;
  onRead: (noti: Notification) => void;
  onDelete: (id: number) => void;
}) {
  const { t } = useTranslation();

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("common.justNow");
    if (mins < 60) return t("common.minutesAgo", { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("common.hoursAgo", { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return t("common.daysAgo", { count: days });
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div
      onClick={() => onRead(noti)}
      className={`group relative flex cursor-pointer gap-4 px-6 py-5 transition-colors hover:bg-brand-light/20 ${
        !noti.isRead ? "bg-brand/5" : ""
      }`}
    >
      {/* Unread dot */}
      <div className="mt-1 flex w-3 shrink-0 items-start justify-center pt-1">
        {!noti.isRead && (
          <span className="h-2 w-2 rounded-full bg-brand ring-2 ring-brand/20" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h4
            className={`text-sm leading-snug ${
              !noti.isRead
                ? "font-bold text-navy"
                : "font-medium text-slate-600"
            }`}
          >
            {noti.title}
          </h4>
          <span className="mt-0.5 shrink-0 text-xs text-slate-400">
            {timeAgo(noti.createdAt)}
          </span>
        </div>
        <p
          className={`mt-1 text-sm leading-relaxed ${
            !noti.isRead ? "text-slate-700" : "text-slate-500"
          }`}
        >
          {noti.content}
        </p>

        {/* Mark as read inline action */}
        {!noti.isRead && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRead(noti);
            }}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100 hover:text-brand-hover"
          >
            <Check className="h-3 w-3" />
            {t("common.markRead")}
          </button>
        )}
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(noti.id);
        }}
        title={t("dashboard.deleteNotification")}
        className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-400"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NotificationListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // ── Infinite scroll ────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 20;

  const fetchPage = useCallback(
    async (pageNum: number, replace = false) => {
      try {
        const data = await notificationService.getUserNotifications();
        // TODO: khi backend hỗ trợ pagination thì truyền { page: pageNum, pageSize: PAGE_SIZE }
        // Hiện tại lấy all rồi slice phía client
        const sliced = data.slice(0, pageNum * PAGE_SIZE);
        setHasMore(sliced.length < data.length);
        setNotifications(replace ? sliced : sliced);
      } catch {
        setError(t("common.loadError"));
      }
    },
    [t],
  );

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    fetchPage(1, true).finally(() => setIsLoading(false));
  }, [fetchPage]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingMore) {
          setIsFetchingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPage(nextPage).finally(() => setIsFetchingMore(false));
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, page, fetchPage]);

  // ── Filtered view ──────────────────────────────────────────────────────────
  const filtered = notifications.filter((n) => {
    if (activeFilter === "unread") return !n.isRead;
    if (activeFilter === "read") return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleMarkAsRead = async (noti: Notification) => {
    if (noti.isRead) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === noti.id ? { ...n, isRead: true } : n)),
    );
    try {
      await notificationService.markAsRead(noti.id);
    } catch {
      // optimistic rollback
      setNotifications((prev) =>
        prev.map((n) => (n.id === noti.id ? { ...n, isRead: false } : n)),
      );
    }
  };

  const handleDelete = async (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationService.deleteNotification(id);
    } catch {
      // optimistic — không rollback vì UX tốt hơn
      console.error("Delete failed silently");
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      // TODO: gọi endpoint bulk mark-all-read khi backend hỗ trợ
      // await notificationService.markAllAsRead();
      // Tạm thời gọi từng cái
      const unread = notifications.filter((n) => !n.isRead);
      await Promise.all(unread.map((n) => notificationService.markAsRead(n.id)));
    } catch {
      console.error("Mark all read failed");
    } finally {
      setIsMarkingAll(false);
    }
  };

  // ─── Filter Tabs ───────────────────────────────────────────────────────────
  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: t("common.tabAll"), count: notifications.length },
    { key: "unread", label: t("common.tabUnread"), count: unreadCount },
    { key: "read", label: t("common.tabRead") },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="icon-btn"
          aria-label={t("common.back")}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-navy">
            {t("dashboard.notifications")}
          </h1>
          {unreadCount > 0 && (
            <p className="mt-0.5 text-sm text-slate-500">
              {t("common.unreadSummary", { count: unreadCount })}
            </p>
          )}
        </div>

        {/* Mark all read */}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            className="btn-secondary flex items-center gap-1.5 text-sm"
          >
            {isMarkingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            {t("dashboard.markAllRead")}
          </button>
        )}
      </div>

      {/* Card */}
      <div className="glass-card overflow-hidden">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 border-b border-slate-100/80 bg-slate-50/60 px-4">
          <Filter className="mr-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                activeFilter === tab.key
                  ? "border-brand text-brand"
                  : "border-transparent text-slate-500 hover:text-navy"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                    activeFilter === tab.key
                      ? "bg-brand text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-brand" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm font-medium text-rose-500">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsLoading(true);
                fetchPage(1, true).finally(() => setIsLoading(false));
              }}
              className="btn-secondary text-sm"
            >
              {t("common.retry")}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={activeFilter} />
        ) : (
          <div className="divide-y divide-slate-100/80">
            {filtered.map((noti) => (
              <NotificationRow
                key={noti.id}
                noti={noti}
                onRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}

            {/* Infinite scroll loader */}
            <div ref={loaderRef} className="flex justify-center py-4">
              {isFetchingMore && (
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              )}
              {!hasMore && filtered.length > 0 && (
                <p className="text-xs text-slate-400">
                  {t("common.allLoaded")}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}