import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Image as ImageIcon,
  Search,
  Navigation,
} from "lucide-react";
import { PATH } from "../../../../config/routes/route";
import { useToast } from "../../../../contexts/ToastContext";
import { useTranslation } from "../../../../contexts/LocaleContext";
import { tourScheduleService } from "../../../tour/services/tourSchedule.service";
import { ActionButton } from "../../../../components/dashboard/ActionButton";
import { Table, type Column } from "../../../../components/dashboard/Table";
import { PaginationButton } from "../../../../components/dashboard/PaginationButton";
import type { TourSchedule } from "../../../tour/types/tourSchedule";
import { DynamicText } from "../../../../components/DynamicText";

export const ManagerLocationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [upcomingOnly, setUpcomingOnly] = useState(true);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["managerTrackingSchedules", page, pageSize, upcomingOnly, debouncedSearch],
    queryFn: () => {
      // If upcomingOnly is true, pass today's date to fetch only upcoming/ongoing schedules
      const startDate = upcomingOnly ? new Date().toISOString().split("T")[0] : undefined;
      return tourScheduleService.getMySchedules(
        page,
        pageSize,
        null,
        startDate,
        undefined,
        debouncedSearch
      );
    },
    staleTime: 1000 * 60,
  });

  const schedules = useMemo(() => response?.data || [], [response]);

  useEffect(() => {
    if (error) {
      showError(
        (error as Error)?.message || t("social.trackingLoadSchedulesError") || "Không thể tải danh sách chuyến đi."
      );
    }
  }, [error, showError, t]);

  const filteredSchedules = useMemo(() => {
    let result = schedules;
    
    // Client-side search (as fallback if API search isn't perfect)
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase().trim();
      result = result.filter((s) => 
        s.tour?.name?.toLowerCase().includes(term) || 
        s.id.toString().includes(term)
      );
    }

    return result;
  }, [schedules, debouncedSearch]);

  const sortedSchedules = useMemo(
    () =>
      [...filteredSchedules].sort(
        (a, b) =>
          new Date(a.departureDate).getTime() -
          new Date(b.departureDate).getTime(),
      ),
    [filteredSchedules],
  );

  const columns: Column<TourSchedule>[] = useMemo(
    () => [
      {
        header: "",
        className: "w-24",
        render: (item) =>
          item.tour?.imageUrl ? (
            <img
              src={item.tour.imageUrl}
              alt={item.tour.name ?? ""}
              className="h-10 w-10 min-w-[40px] shrink-0 rounded-lg border border-slate-100 object-cover bg-slate-100"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-100 text-slate-400">
              <ImageIcon className="h-4 w-4" />
            </div>
          ),
      },
      {
        header: t("tour.tourNameCol") || "Tên Tour",
        className: "min-w-[280px]",
        render: (item) => (
          <div>
            <div className="font-semibold text-slate-900">
              {item.tour?.name ? <DynamicText text={item.tour.name} /> : t("social.trackingUntitledTour")}
            </div>
            <div className="text-sm text-slate-500">
              ID: {item.id}
            </div>
          </div>
        ),
      },
      {
        header: t("tour.departureReturn") || "Khởi hành / Trở về",
        render: (item) => (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-medium">
                {new Date(item.departureDate).toLocaleDateString("vi-VN")}
              </span>
              <span className="text-slate-400">{t("tour.to") || "đến"}</span>
              <span className="font-medium">
                {new Date(item.returnDate).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        ),
      },
      {
        header: t("tour.tourIdCol") || "Mã Tour",
        render: (item) => (
          <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600">
            #{item.tourId}
          </span>
        ),
      },
      {
        header: t("common.actions") || "Hành động",
        className: "w-[120px]",
        render: (item) => (
          <div className="flex items-center gap-1.5">
            <ActionButton
              variant="secondary"
              onClick={() =>
                navigate(PATH.MANAGER.TRACK_SCHEDULE_LOCATIONS(item.id))
              }
              className="h-8 w-8 text-brand hover:bg-brand-light hover:text-brand-hover"
              aria-label={t("common.track") || "Theo dõi"}
            >
              <Navigation className="h-3.5 w-3.5" />
            </ActionButton>
          </div>
        ),
      },
    ],
    [t, navigate],
  );

  return (
    <div className="space-y-4">
      {/* Header section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap flex-1 items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white shrink-0 w-full sm:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("tour.searchAssignedPlaceholder") || "Tìm kiếm chuyến đi..."}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Dropdown filter */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white shrink-0">
            <select
              value={upcomingOnly ? "upcoming" : "all"}
              onChange={(e) => {
                setUpcomingOnly(e.target.value === "upcoming");
                setPage(1);
              }}
              className="bg-transparent text-sm text-slate-700 outline-none cursor-pointer"
            >
              <option value="upcoming">{t("tour.upcomingOnly") || "Sắp tới"}</option>
              <option value="all">{t("tour.showAll") || "Tất cả"}</option>
            </select>
          </div>

          {/* Page Size Filter */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white shrink-0">
            <select
              className="bg-transparent text-sm text-slate-700 outline-none"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5 {t("common.perPage") || "/ trang"}</option>
              <option value={10}>10 {t("common.perPage") || "/ trang"}</option>
              <option value={15}>15 {t("common.perPage") || "/ trang"}</option>
              <option value={20}>20 {t("common.perPage") || "/ trang"}</option>
              <option value={50}>50 {t("common.perPage") || "/ trang"}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="p-10 text-center text-sm font-semibold text-rose-600">
        </div>
      ) : (
        <Table
          data={sortedSchedules}
          columns={columns}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage={t("social.trackingNoSchedulesFound") || "Không tìm thấy chuyến đi nào."}
          skeletonRows={pageSize}
        />
      )}

      {/* Pagination */}
      <PaginationButton
        currentPage={response?.currentPage || page}
        totalPages={response?.totalPages || 1}
        totalItems={response?.total || 0}
        pageSize={response?.pageSize || pageSize}
        onPageChange={setPage}
      />
    </div>
  );
};
