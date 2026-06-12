import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronDown,
  Eye,
  Image as ImageIcon,
  Search,
} from "lucide-react";
import { PATH } from "../../../config/routes/route";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { Table, type Column } from "../../../components/dashboard/Table";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { tourScheduleStaffService } from "../services/tourScheduleStaffService.service";
import { useTranslation } from "../../../contexts/LocaleContext";
import type { AssignedTourSchedule } from "../types/tourScheduleStaff";

const PAGE_SIZE = 10;

export const AssignedSchedulesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState<AssignedTourSchedule[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: PAGE_SIZE,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [upcomingOnly, setUpcomingOnly] = useState(true);

  // Debounce search 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch mỗi khi page / upcomingOnly thay đổi
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await tourScheduleStaffService.getAssignedSchedules(
          page,
          PAGE_SIZE,
          upcomingOnly,
          debouncedSearch || undefined,
        );
        setSchedules(res.data || []);
        setPagination({
          total: res.total || 0,
          totalPages: res.totalPages || 1,
          currentPage: res.currentPage || page,
          pageSize: res.pageSize || PAGE_SIZE,
        });
      } catch (err: any) {
        setError(err?.message || t("tour.failedLoadSchedule"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [page, upcomingOnly, debouncedSearch, t]);


  const columns: Column<AssignedTourSchedule>[] = useMemo(
    () => [
      {
        header: t("tour.scheduleCol"),
        className: "min-w-[220px]",
        render: (item) => (
          <div className="flex items-center gap-3">
            <div className="h-14 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {item.tourImageUrl ? (
                <img
                  src={item.tourImageUrl}
                  alt={item.tourName ?? t("tour.tourImageAlt")}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="line-clamp-2 text-sm font-semibold text-slate-900">
                {item.tourName || t("tour.unnamedTour")}
              </div>
              <div className="text-xs text-slate-500">
                ID: {item.scheduleId}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: t("tour.departureReturn"),
        render: (item) => (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4 text-slate-400" />
            <div>
              <div className="font-medium">
                {new Date(item.departureDate).toLocaleDateString("vi-VN")}
              </div>
              <div className="text-slate-400">
                {t("tour.to")}{" "}
                {new Date(item.returnDate).toLocaleDateString("vi-VN")}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: t("tour.assignedRole"),
        render: (item) => {
          const role = item.assignedRole?.trim() || "";
          const colorClass =
            role === "Lead Tour Guide"
              ? "bg-blue-100 text-blue-700"
              : role === "Logistics"
                ? "bg-slate-100 text-slate-600"
                : role === "Driver"
                  ? "bg-amber-100 text-amber-700"
                  : role === "Local Guide"
                    ? "bg-emerald-100 text-emerald-700"
                    : role === "Cruise Coordinator"
                      ? "bg-cyan-100 text-cyan-700"
                      : role === "Trekking Guide"
                        ? "bg-orange-100 text-orange-700"
                        : role === "Food Tour Guide"
                          ? "bg-rose-100 text-rose-700"
                          : role === "Resort Coordinator"
                            ? "bg-purple-100 text-purple-700"
                            : role === "Photo Guide"
                              ? "bg-pink-100 text-pink-700"
                              : role === "Island Tour Guide"
                                ? "bg-teal-100 text-teal-700"
                                : "bg-slate-100 text-slate-600"; // default

          return (
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}
            >
              {role || t("tour.staff")}
            </span>
          );
        },
      },
      {
        header: t("tour.tourIdCol"),
        render: (item) => (
          <span className="font-semibold text-slate-800">#{item.tourId}</span>
        ),
        className: "w-[100px] text-sm",
      },
      {
        header: t("common.actions"),
        className: "w-[120px]",
        render: (item) => (
          <ActionButton
            variant="secondary"
            onClick={() =>
              navigate(PATH.STAFF.SCHEDULE_DETAIL(item.scheduleId))
            }
            className="h-9 w-full"
            aria-label={t("tour.view")}
          >
            <Eye className="h-4 w-4" />
          </ActionButton>
        ),
      },
    ],
    [t, navigate],
  );

  return (
    <div className="rounded-2xl">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-bold leading-tight text-slate-900">
            {t("tour.assignedSchedulesTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("tour.assignedSchedulesDesc")}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white sm:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("tour.searchAssignedPlaceholder")}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          {/* ✅ Dropdown filter */}
          <div className="relative">
            <select
              value={upcomingOnly ? "upcoming" : "all"}
              onChange={(e) => {
                setUpcomingOnly(e.target.value === "upcoming");
                setPage(1);
              }}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none transition-colors hover:border-slate-300 hover:bg-white cursor-pointer"
            >
              <option value="upcoming">{t("tour.upcomingOnly")}</option>
              <option value="all">{t("tour.showAll")}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="p-10 text-center text-sm font-semibold text-rose-600">
          {error}
        </div>
      ) : (
        <Table
          data={schedules}
          columns={columns}
          keyExtractor={(item) => item.scheduleId}
          isLoading={isLoading}
          emptyMessage={t("tour.assignedEmpty")}
          skeletonRows={PAGE_SIZE}
        />
      )}

      {/* Pagination từ API */}
      <PaginationButton
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        pageSize={pagination.pageSize}
        onPageChange={setPage}
      />
    </div>
  );
};
