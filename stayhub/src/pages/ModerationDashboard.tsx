import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Trash2,
  Calendar,
  User,
  MessageSquare,
  Image as ImageIcon,
  Mail,
  Clock,
  ChevronRight,
  Ban
} from "lucide-react";
import {
  getPendingReports,
  resolveReport,
  type ContentReport
} from "../features/social/moments/services/momentService";
import { useToast } from "../contexts/ToastContext";
import { useTranslation } from "../contexts/LocaleContext";
import { getImg } from "../config/api/api";
import { ActionButton } from "../components/dashboard/ActionButton";
import { PaginationButton } from "../components/dashboard/PaginationButton";
import { DynamicText } from "../components/DynamicText";

/* ── Reason color map ── */
const REASON_COLOR: Record<string, string> = {
  "Spam":        "bg-yellow-50 text-yellow-800 ring-yellow-400/30 dark:bg-yellow-500/10 dark:text-yellow-300",
  "Hate Speech": "bg-red-50 text-red-800 ring-red-400/30 dark:bg-red-500/10 dark:text-red-300",
  "Harassment":  "bg-orange-50 text-orange-800 ring-orange-400/30 dark:bg-orange-500/10 dark:text-orange-300",
  "Violence":    "bg-rose-50 text-rose-800 ring-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300",
  "Other":       "bg-slate-100 text-slate-700 ring-slate-300/30 dark:bg-slate-700 dark:text-slate-300",
};
const reasonColor = (r: string) => REASON_COLOR[r] ?? REASON_COLOR["Other"];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

/* ── Skeleton row ── */
const SkeletonRow = () => (
  <div className="flex animate-pulse items-center gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
    <div className="h-12 w-12 shrink-0 rounded-lg bg-slate-200 dark:bg-slate-700" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-2.5 w-56 rounded bg-slate-100 dark:bg-slate-800" />
    </div>
    <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
  </div>
);

const ModerationDashboard: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>("All");
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [blurImage, setBlurImage] = useState<boolean>(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleFilterChange = (key: string) => {
    setFilterType(key);
    setCurrentPage(1);
  };

  useEffect(() => {
    setBlurImage(true);
  }, [selectedReport]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getPendingReports();
      setReports(data);
    } catch (err: any) {
      toast.error(t("manager.moderationDashboard.msgFetchFail"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async (reportId: number, action: "Approve" | "Reject" | "Dismiss") => {
    setResolvingId(reportId);
    try {
      await resolveReport(reportId, action);
      if (action === "Approve") toast.success(t("manager.moderationDashboard.msgApproveSuccess"));
      else if (action === "Reject") toast.warning(t("manager.moderationDashboard.msgRejectSuccess"));
      else toast.info(t("manager.moderationDashboard.msgDismissSuccess"));

      setReports((prev) => prev.filter((r) => r.id !== reportId));
      if (selectedReport?.id === reportId) setSelectedReport(null);
    } catch (err: any) {
      toast.error(t("manager.moderationDashboard.msgActionFail"));
    } finally {
      setResolvingId(null);
    }
  };

  const momentCount  = reports.filter(r => r.contentType === "Moment").length;
  const commentCount = reports.filter(r => r.contentType === "Comment").length;

  const filteredReports = reports.filter((r) => {
    if (filterType === "All") return true;
    return r.contentType.toLowerCase() === filterType.toLowerCase();
  });

  const totalPages = Math.ceil(filteredReports.length / pageSize);
  const paginatedReports = filteredReports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {[
            { key: "All",     label: t("manager.moderationDashboard.all"),      count: reports.length },
            { key: "Moment",  label: t("manager.moderationDashboard.moments"), count: momentCount    },
            { key: "Comment", label: t("manager.moderationDashboard.comments"),   count: commentCount   },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                filterType === key
                  ? "bg-brand text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                filterType === key
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none disabled:opacity-60 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {t("manager.moderationDashboard.refresh")}
        </button>
      </div>

      {/* ── Stats ── */}
      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t("manager.moderationDashboard.totalReports"), value: reports.length,  color: "text-brand", bg: "bg-brand/5" },
          { label: t("manager.moderationDashboard.moments"), value: momentCount, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: t("manager.moderationDashboard.comments"), value: commentCount, color: "text-teal-600", bg: "bg-teal-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl border border-slate-200/70 ${bg} p-4`}>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="mt-0.5 text-xs font-medium text-slate-500">{label}</div>
          </div>
        ))}
      </div>



      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* ── Report List (Left 3 cols) ── */}
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800/80">
            {loading ? (
              <div>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
            ) : filteredReports.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                <CheckCircle className="h-12 w-12 text-emerald-500/70" />
                <span className="mt-2 text-sm font-semibold">{t("manager.moderationDashboard.emptyTitle")}</span>
                <span className="text-xs">{t("manager.moderationDashboard.emptyDesc")}</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {paginatedReports.map((report) => {
                  const isMoment    = report.contentType === "Moment";
                  const isSelected  = selectedReport?.id === report.id;
                  const isResolving = resolvingId === report.id;

                  return (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`group flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-all duration-150 ${
                        isSelected
                          ? "border-l-4 border-l-brand bg-brand/5 dark:bg-brand/10"
                          : "border-l-4 border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30"
                      }`}
                    >
                      {/* Thumbnail / Icon */}
                      <div className="relative shrink-0">
                        {isMoment && report.contentImageUrl ? (
                          <div className="h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
                            <img
                              src={getImg(report.contentImageUrl)}
                              alt="thumb"
                              className="h-full w-full object-cover blur-sm transition-all duration-200 group-hover:blur-0"
                            />
                          </div>
                        ) : (
                          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                            isMoment
                              ? "bg-indigo-100 dark:bg-indigo-500/15"
                              : "bg-teal-100 dark:bg-teal-500/15"
                          }`}>
                            {isMoment
                              ? <ImageIcon className="h-6 w-6 text-indigo-500" />
                              : <MessageSquare className="h-6 w-6 text-teal-500" />
                            }
                          </div>
                        )}
                        {/* Content-type mini badge */}
                        <span className={`absolute -bottom-1 -right-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ring-2 ring-white dark:ring-slate-800/90 ${
                          isMoment
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                            : "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300"
                        }`}>
                          {isMoment ? t("manager.moderationDashboard.image") : t("manager.moderationDashboard.cmt")}
                        </span>
                      </div>

                      {/* Main info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {report.contentText
                              ? <span>&quot;<DynamicText text={report.contentText} isHtml={false} />&quot;</span>
                              : (isMoment ? `${t("manager.moderationDashboard.moments")} #${report.targetId}` : `${t("manager.moderationDashboard.comments")} #${report.targetId}`)
                            }
                          </p>
                          <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${
                            isSelected ? "rotate-90 text-brand" : "text-slate-300 group-hover:text-slate-400"
                          }`} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                          {/* Reason badge */}
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${reasonColor(report.reason)}`}>
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {report.reason}
                          </span>
                          {/* Reporter */}
                          <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <User className="h-3 w-3" />
                            {report.reporterName || `#${report.reporterId}`}
                          </span>
                          {/* Date & Time */}
                          <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                            <Clock className="h-3 w-3" />
                            {fmtDate(report.createdAt)} · {fmtTime(report.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Quick-action buttons (visible on hover) */}
                      <div
                        className="flex shrink-0 flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleResolve(report.id, "Approve")}
                          disabled={isResolving}
                          title={t("manager.moderationDashboard.approve")}
                          className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleResolve(report.id, "Reject")}
                          disabled={isResolving}
                          title={t("manager.moderationDashboard.reject")}
                          className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-40 dark:text-rose-400 dark:hover:bg-rose-500/10"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleResolve(report.id, "Dismiss")}
                          disabled={isResolving}
                          title={t("manager.moderationDashboard.dismiss")}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-500 dark:hover:bg-slate-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {!loading && filteredReports.length > 0 && (
              <PaginationButton
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredReports.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>

        {/* ── Detail Panel (Right 2 cols) ── */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800/80">
              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">{t("manager.moderationDashboard.detailTitle")} #{selectedReport.id}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {t("manager.moderationDashboard.detailSubtitle")}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                  selectedReport.contentType === "Moment"
                    ? "bg-indigo-50 text-indigo-700 ring-indigo-300/40 dark:bg-indigo-500/15 dark:text-indigo-300"
                    : "bg-teal-50 text-teal-700 ring-teal-300/40 dark:bg-teal-500/15 dark:text-teal-300"
                }`}>
                  {selectedReport.contentType === "Moment" ? t("manager.moderationDashboard.moments") : t("manager.moderationDashboard.comments")}
                </span>
              </div>

              <div className="flex flex-col gap-4 p-5">
                {/* Content preview */}
                {selectedReport.contentType === "Moment" ? (
                  <div>
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {t("manager.moderationDashboard.imageMoment")} #{selectedReport.targetId}
                    </span>
                    {selectedReport.contentImageUrl ? (
                      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
                        <img
                          src={getImg(selectedReport.contentImageUrl)}
                          alt="Vi phạm"
                          className={`h-52 w-full object-cover transition-all duration-500 ${
                            blurImage ? "scale-110 select-none blur-xl" : "blur-0"
                          }`}
                        />
                        {blurImage && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30">
                            <Eye className="h-8 w-8 text-white/70" />
                            <span className="text-xs font-semibold text-white">{t("manager.moderationDashboard.imageBlurred")}</span>
                          </div>
                        )}
                        <button
                          onClick={() => setBlurImage(!blurImage)}
                          className="absolute bottom-2 right-2 rounded-full bg-black/50 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm hover:bg-black/70"
                        >
                          {blurImage ? t("manager.moderationDashboard.viewImage") : t("manager.moderationDashboard.hideImage")}
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 dark:border-slate-700">
                        {t("manager.moderationDashboard.noImage")}
                      </div>
                    )}
                    {selectedReport.contentText && (
                      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm italic text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        &ldquo;<DynamicText text={selectedReport.contentText} isHtml={false} />&rdquo;
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {t("manager.moderationDashboard.comments")} #{selectedReport.targetId}
                    </span>
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                      <MessageSquare className="mb-2 h-4 w-4 text-teal-400" />
                      <p className="text-sm font-medium italic text-slate-800 dark:text-slate-200">
                        {selectedReport.contentText ? (
                          <span>&ldquo;<DynamicText text={selectedReport.contentText} isHtml={false} />&rdquo;</span>
                        ) : (
                          <span>&ldquo;{t("manager.moderationDashboard.cantLoadComment")}&rdquo;</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Violation reason */}
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {t("manager.moderationDashboard.violationReason")}
                  </span>
                  <div className="flex flex-wrap items-start gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${reasonColor(selectedReport.reason)}`}>
                      <AlertTriangle className="h-3 w-3" />
                      {selectedReport.reason}
                    </span>
                    {selectedReport.details ? (
                      <span className="text-sm text-slate-600 dark:text-slate-300"><DynamicText text={selectedReport.details} isHtml={false} /></span>
                    ) : (
                      <span className="text-xs italic text-slate-400 dark:text-slate-500">{t("manager.moderationDashboard.noDetail")}</span>
                    )}
                  </div>
                </div>

                {/* Reporter info */}
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <span className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {t("manager.moderationDashboard.reporter")}
                  </span>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <User className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="font-medium">
                        {selectedReport.reporterName || `${t("manager.moderationDashboard.user")} #${selectedReport.reporterId}`}
                      </span>
                    </div>
                    {selectedReport.reporterEmail && (
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">{selectedReport.reporterEmail}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{t("manager.moderationDashboard.reportedAt")} {fmtTime(selectedReport.createdAt)} · {fmtDate(selectedReport.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2.5 pt-1">
                  <ActionButton
                    onClick={() => handleResolve(selectedReport.id, "Approve")}
                    variant="primary"
                    className="w-full gap-2 py-2.5"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {t("manager.moderationDashboard.actionApprove")}
                  </ActionButton>
                  <ActionButton
                    onClick={() => handleResolve(selectedReport.id, "Reject")}
                    variant="warning"
                    className="w-full gap-2 py-2.5"
                  >
                    <Ban className="h-4 w-4" />
                    {t("manager.moderationDashboard.actionReject")}
                  </ActionButton>
                  <ActionButton
                    onClick={() => handleResolve(selectedReport.id, "Dismiss")}
                    variant="secondary"
                    className="w-full gap-2 py-2.5"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("manager.moderationDashboard.actionDismiss")}
                  </ActionButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-6 text-slate-400 dark:border-slate-700 dark:text-slate-500">
              <Eye className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <span className="mt-3 text-sm font-semibold">{t("manager.moderationDashboard.selectReport")}</span>
              <span className="mt-1 text-center text-xs">
                {t("manager.moderationDashboard.selectDesc")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModerationDashboard;

