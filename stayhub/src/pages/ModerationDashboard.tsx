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
  Image as ImageIcon
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

const ModerationDashboard: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>("All");
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [blurImage, setBlurImage] = useState<boolean>(true);

  useEffect(() => {
    setBlurImage(true);
  }, [selectedReport]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getPendingReports();
      setReports(data);
    } catch (err: any) {
      toast.error("Không thể tải danh sách báo cáo vi phạm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async (reportId: number, action: "Approve" | "Reject" | "Dismiss") => {
    try {
      await resolveReport(reportId, action);
      
      let message = "Báo cáo đã được xử lý.";
      if (action === "Approve") {
        message = "Nội dung đã được duyệt an toàn và giữ lại.";
        toast.success(message);
      } else if (action === "Reject") {
        message = "Nội dung vi phạm đã bị ẩn khỏi hệ thống.";
        toast.warning(message);
      } else {
        message = "Đã bỏ qua báo cáo vi phạm này.";
        toast.info(message);
      }

      setReports((prev) => prev.filter((r) => r.id !== reportId));
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
    } catch (err: any) {
      toast.error("Thao tác thất bại. Vui lòng thử lại.");
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filterType === "All") return true;
    return r.contentType.toLowerCase() === filterType.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 dark:bg-slate-900/50">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800 dark:text-white">
            <ShieldAlert className="h-7 w-7 text-brand" />
            Kiểm Duyệt Nội Dung
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Xem xét và xử lý các báo cáo vi phạm tiêu chuẩn cộng đồng từ người dùng.
          </p>
        </div>
        <button
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* Stats and Filter */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {["All", "Moment", "Comment"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                filterType === type
                  ? "bg-brand text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {type === "All" ? "Tất cả" : type === "Moment" ? "Khoảnh khắc" : "Bình luận"}
            </button>
          ))}
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Đang hiển thị <span className="font-bold text-slate-700 dark:text-white">{filteredReports.length}</span> báo cáo chưa xử lý
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Table List (Left 2 cols) */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800">
            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2">
                <RefreshCw className="h-8 w-8 animate-spin text-brand" />
                <span className="text-sm text-slate-500">Đang tải danh sách...</span>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                <CheckCircle className="h-12 w-12 text-emerald-500/80" />
                <span className="text-sm font-medium mt-2">Hộp thư kiểm duyệt trống!</span>
                <span className="text-xs">Không có báo cáo vi phạm nào chưa xử lý.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-700/50 dark:border-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Nội dung</th>
                      <th className="px-6 py-4">Lý do</th>
                      <th className="px-6 py-4">Chi tiết</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className={`cursor-pointer transition-colors duration-150 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 ${
                          selectedReport?.id === report.id
                            ? "bg-brand/5 dark:bg-brand/10 border-l-4 border-l-brand"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                              {report.contentType === "Moment" ? (
                                <ImageIcon className="h-5 w-5 text-indigo-500" />
                              ) : (
                                <MessageSquare className="h-5 w-5 text-teal-500" />
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                #{report.targetId} ({report.contentType === "Moment" ? "Ảnh" : "Bình luận"})
                              </span>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <User className="h-3 w-3" />
                                Người báo cáo: {report.reporterName || `ID: ${report.reporterId}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            {report.reason}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-[180px] truncate text-slate-600 dark:text-slate-300">
                          {report.details || "Không có mô tả chi tiết."}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleResolve(report.id, "Approve")}
                              title="Duyệt sạch (Giữ nội dung)"
                              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleResolve(report.id, "Reject")}
                              title="Vi phạm (Ẩn nội dung)"
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleResolve(report.id, "Dismiss")}
                              title="Bác bỏ báo cáo"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Side Panel (Right 1 col) */}
        <div>
          {selectedReport ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Chi tiết Báo cáo</h3>
              <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                Xem xét kỹ thông tin báo cáo trước khi đưa ra quyết định xử lý.
              </p>

              <div className="mt-6 flex flex-col gap-4">
                {/* Preview Content Area */}
                {selectedReport.contentType === "Moment" ? (
                  <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/30">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block mb-2">Hình ảnh khoảnh khắc</span>
                    {selectedReport.contentImageUrl ? (
                      <div className="relative overflow-hidden rounded-lg bg-slate-100 border border-slate-200 h-48 flex items-center justify-center dark:bg-slate-900 dark:border-slate-800">
                        <img
                          src={getImg(selectedReport.contentImageUrl)}
                          alt="Báo cáo vi phạm"
                          className={`w-full h-full object-cover transition-all duration-300 ${
                            blurImage ? "blur-xl scale-105 select-none" : "blur-0"
                          }`}
                        />
                        {blurImage && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 p-2 text-center">
                            <span className="text-xs font-semibold text-white bg-slate-950/80 px-3 py-1.5 rounded-full shadow-sm">
                              Hình ảnh đang che mờ
                            </span>
                            <span className="text-[10px] text-white/80 mt-1">Giúp giảm căng thẳng cho nhân viên kiểm duyệt</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
                        Không có hình ảnh.
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500">ID Khoảnh khắc: #{selectedReport.targetId}</span>
                      {selectedReport.contentImageUrl && (
                        <button
                          onClick={() => setBlurImage(!blurImage)}
                          className="text-xs font-semibold text-brand hover:underline focus:outline-none"
                        >
                          {blurImage ? "Hiện ảnh" : "Mơ ảnh (Giảm stress)"}
                        </button>
                      )}
                    </div>
                    {selectedReport.contentText && (
                      <div className="mt-3 p-3 bg-white border border-slate-100 rounded-lg text-sm text-slate-700 italic dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                        &ldquo;{selectedReport.contentText}&ldquo;
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/30">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block mb-1">Nội dung bình luận bị báo cáo</span>
                    <div className="p-3 bg-white border border-slate-100 rounded-lg text-sm font-medium text-slate-800 italic dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                      &ldquo;{selectedReport.contentText || "Bình luận trống hoặc không tải được."}&ldquo;
                    </div>
                    <div className="text-xs text-slate-500 mt-2">ID Bình luận: #{selectedReport.targetId}</div>
                  </div>
                )}

                <div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Chi tiết lý do vi phạm</span>
                  <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-amber-800 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-xs mr-2">
                      {selectedReport.reason}
                    </span>
                    {selectedReport.details || "Không có chi tiết mô tả."}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> Người báo cáo: {selectedReport.reporterName || `ID: #${selectedReport.reporterId}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {new Date(selectedReport.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <ActionButton
                    onClick={() => handleResolve(selectedReport.id, "Approve")}
                    variant="primary"
                    className="w-full gap-2 py-2.5"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Nội dung Sạch (Giữ lại)
                  </ActionButton>
                  <ActionButton
                    onClick={() => handleResolve(selectedReport.id, "Reject")}
                    variant="warning"
                    className="w-full gap-2 py-2.5"
                  >
                    <XCircle className="h-4 w-4" />
                    Vi phạm (Ẩn nội dung)
                  </ActionButton>
                  <ActionButton
                    onClick={() => handleResolve(selectedReport.id, "Dismiss")}
                    variant="secondary"
                    className="w-full gap-2 py-2.5"
                  >
                    <Trash2 className="h-4 w-4" />
                    Bác bỏ báo cáo (Bỏ qua)
                  </ActionButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-6 text-slate-400 dark:border-slate-800 dark:text-slate-500">
              <Eye className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <span className="text-sm font-medium mt-2">Chọn một báo cáo</span>
              <span className="text-center text-xs mt-1">Click vào một báo cáo vi phạm ở danh sách bên trái để xem chi tiết thông tin.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModerationDashboard;
