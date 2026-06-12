import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  MapPin,
  Image as ImageIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Navigation,
} from "lucide-react";
import { PATH } from "../../../../config/routes/route";
import { useToast } from "../../../../contexts/ToastContext";
import { useTranslation } from "../../../../contexts/LocaleContext";
import { tourScheduleStaffService } from "../../../tour/services/tourScheduleStaffService.service";
import { ActionButton } from "../../../../components/dashboard/ActionButton";

const PAGE_SIZE = 12;

export const LocationTrackingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { error: showError } = useToast();

  // States quản lý tìm kiếm, bộ lọc và phân trang (Server-side)
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [upcomingOnly, setUpcomingOnly] = useState(true); // Default là Sắp tới

  // Debounce tìm kiếm
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Schedules
  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["trackingSchedules", page, upcomingOnly, debouncedSearch],
    queryFn: () =>
      tourScheduleStaffService.getAssignedSchedules(
        page,
        PAGE_SIZE,
        upcomingOnly,
        debouncedSearch,
      ),
    staleTime: 1000 * 60,
  });

  const schedules = useMemo(() => response?.data || [], [response]);
  const totalPages = response?.totalPages || 1;

  useEffect(() => {
    if (error) {
      showError(
        (error as Error)?.message || t("social.trackingLoadSchedulesError"),
      );
    }
  }, [error, showError, t]);

  const sortedSchedules = useMemo(
    () =>
      [...schedules].sort(
        (a, b) =>
          new Date(b.departureDate).getTime() -
          new Date(a.departureDate).getTime(),
      ),
    [schedules],
  );

  return (
    <div className="space-y-6">
      {/* HEADER: Tiêu đề + Thanh công cụ (Search & Filter) */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0068E0]">
              <MapPin className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900">
              {t("social.trackingLocationsTitle")}
            </h1>
          </div>
          <p className="text-sm text-slate-500 font-medium ml-12">
            {t("social.trackingLocationsDesc")}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Thanh tìm kiếm */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition-colors focus-within:border-[#0068E0] focus-within:bg-white sm:w-64">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("social.trackingSearchPlaceholder")}
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Bộ lọc Sắp tới / Tất cả */}
          <div className="relative">
            <select
              value={upcomingOnly ? "upcoming" : "all"}
              onChange={(e) => {
                setUpcomingOnly(e.target.value === "upcoming");
                setPage(1);
              }}
              className="h-full w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm font-bold text-slate-700 outline-none cursor-pointer hover:border-slate-300 hover:bg-white transition-colors"
            >
              <option value="upcoming">
                {t("tour.upcomingOnly") || "Chỉ sắp tới"}
              </option>
              <option value="all">
                {t("tour.showAll") || "Tất cả lịch trình"}
              </option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* NỘI DUNG CHÍNH */}
      {isLoading ? (
        <div className="flex h-[400px] flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0068E0]/20 border-t-[#0068E0]"></div>
          <p className="text-sm font-semibold text-slate-500 animate-pulse">
            Đang tải dữ liệu...
          </p>
        </div>
      ) : sortedSchedules.length > 0 ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedSchedules.map((schedule) => (
              <button
                key={schedule.scheduleId}
                onClick={() =>
                  navigate(
                    PATH.STAFF.TRACK_SCHEDULE_LOCATIONS(schedule.scheduleId),
                  )
                }
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#0068E0]/50 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98]"
              >
                {/* Ảnh cover */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  {schedule.tourImageUrl ? (
                    <img
                      src={schedule.tourImageUrl}
                      alt={schedule.tourName ?? ""}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

                  {/* Badge Chức vụ */}
                  <div className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#0068E0] shadow-sm">
                    {schedule.assignedRole || t("common.staff")}
                  </div>

                  {/* ID */}
                  <div className="absolute bottom-3 left-4">
                    <p className="text-xs font-bold text-white/80">
                      ID: #{schedule.scheduleId}
                    </p>
                  </div>
                </div>

                {/* Thông tin */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-3 font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#0068E0] transition-colors">
                    {schedule.tourName || t("social.trackingUntitledTour")}
                  </h3>

                  <div className="mt-auto flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 border border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <Calendar className="h-4 w-4 text-[#0068E0]" />
                      <span>
                        {new Date(schedule.departureDate).toLocaleDateString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                    {/* Icon Map ẩn/hiện */}
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 text-[#0068E0] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                      <Navigation className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <ActionButton
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-10 w-10 p-0 rounded-full"
              >
                <ChevronLeft size={18} />
              </ActionButton>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 border border-slate-200 shadow-sm">
                {page} / {totalPages}
              </span>
              <ActionButton
                variant="secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-10 w-10 p-0 rounded-full"
              >
                <ChevronRight size={18} />
              </ActionButton>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white py-16 px-4 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
            <MapPin className="h-8 w-8" />
          </div>
          <p className="text-lg font-bold text-slate-700">
            {t("social.trackingNoSchedulesFound")}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-500 max-w-sm">
            {search
              ? t("social.trackingTryOtherSearch")
              : t("social.trackingNotAssigned")}
          </p>
        </div>
      )}
    </div>
  );
};
