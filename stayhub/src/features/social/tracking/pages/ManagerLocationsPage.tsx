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

const PAGE_SIZE = 10;

export const ManagerLocationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

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
    queryKey: ["managerTrackingSchedules", page, debouncedSearch],
    queryFn: () => tourScheduleService.getMySchedules(page, PAGE_SIZE),
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

  // Lọc theo tên tour trên client nếu người dùng tìm kiếm (vì API getMySchedules chưa hỗ trợ search term)
  const filteredSchedules = useMemo(() => {
    if (!debouncedSearch.trim()) return schedules;
    const term = debouncedSearch.toLowerCase().trim();
    return schedules.filter((s) => 
      s.tour?.name?.toLowerCase().includes(term) || 
      s.id.toString().includes(term)
    );
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
              className="h-14 w-20 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <ImageIcon className="h-5 w-5" />
            </div>
          ),
      },
      {
        header: t("tour.tourNameCol") || "Tên Tour",
        className: "min-w-[280px]",
        render: (item) => (
          <div>
            <div className="font-semibold text-slate-900">
              {item.tour?.name || t("social.trackingUntitledTour") || "Tour chưa đặt tên"}
            </div>
            <div className="text-sm text-slate-500">
              ID Chuyến đi: {item.id}
            </div>
          </div>
        ),
      },
      {
        header: t("tour.departureReturn") || "Khởi hành / Trở về",
        render: (item) => (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4 text-slate-400" />
            <div>
              <div className="font-medium">
                {new Date(item.departureDate).toLocaleDateString("vi-VN")}
              </div>
              <div className="text-slate-400">
                {t("tour.to") || "đến"}{" "}
                {new Date(item.returnDate).toLocaleDateString("vi-VN")}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: t("tour.tourIdCol") || "Mã Tour",
        render: (item) => (
          <span className="font-semibold text-slate-800">#{item.tourId}</span>
        ),
        className: "w-[100px] text-sm",
      },
      {
        header: t("common.actions") || "Hành động",
        className: "w-[120px]",
        render: (item) => (
          <ActionButton
            variant="secondary"
            onClick={() =>
              navigate(PATH.MANAGER.TRACK_SCHEDULE_LOCATIONS(item.id))
            }
            className="h-9 w-full"
            aria-label={t("common.track") || "Theo dõi"}
          >
            <Navigation className="h-4 w-4" />
          </ActionButton>
        ),
      },
    ],
    [t, navigate],
  );

  return (
    <div className="rounded-2xl">
      {/* Header section */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div>
            <h2 className="text-[15px] font-bold leading-tight text-slate-900">
              {t("social.trackingLocationsTitle") || "Bản đồ định vị"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("social.trackingLocationsDesc") || "Xem vị trí thời gian thực của nhân viên và khách hàng trong các chuyến đi."}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white sm:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("tour.searchAssignedPlaceholder") || "Tìm kiếm chuyến đi..."}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="p-10 text-center text-sm font-semibold text-rose-600">
          Đã xảy ra lỗi khi tải dữ liệu chuyến đi.
        </div>
      ) : (
        <Table
          data={sortedSchedules}
          columns={columns}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage={t("social.trackingNoSchedulesFound") || "Không tìm thấy chuyến đi nào."}
          skeletonRows={PAGE_SIZE}
        />
      )}

      {/* Pagination */}
      <PaginationButton
        currentPage={response?.currentPage || page}
        totalPages={response?.totalPages || 1}
        totalItems={response?.total || 0}
        pageSize={response?.pageSize || PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
};
