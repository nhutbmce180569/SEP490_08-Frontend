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

export const AssignedSchedulesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState<AssignedTourSchedule[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 5,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
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
          pageSize,
          upcomingOnly,
          debouncedSearch || undefined,
        );
        setSchedules(res.data || []);
        setPagination({
          total: res.total || 0,
          totalPages: res.totalPages || 1,
          currentPage: res.currentPage || page,
          pageSize: res.pageSize || pageSize,
        });
      } catch (err: any) {
        setError(err?.message || t("tour.failedLoadSchedule"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [page, pageSize, upcomingOnly, debouncedSearch, t]);


  const columns: Column<AssignedTourSchedule>[] = useMemo(
    () => [
      {
        header: "",
        className: "w-24",
        render: (item) =>
          item.tourImageUrl ? (
            <img
              src={item.tourImageUrl}
              alt={item.tourName ?? t("tour.tourImageAlt")}
              className="h-10 w-10 min-w-[40px] shrink-0 rounded-lg border border-slate-100 object-cover bg-slate-100"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-100 text-slate-400">
              <ImageIcon className="h-4 w-4" />
            </div>
          ),
      },
      {
        header: t("tour.tourNameCol"),
        className: "min-w-[280px]",
        render: (item) => (
          <div>
            <div className="font-semibold text-slate-900">
              {item.tourName || t("tour.unnamedTour")}
            </div>
            <div className="text-sm text-slate-500">
              ID: {item.scheduleId}
            </div>
          </div>
        ),
      },
      {
        header: t("tour.departureReturn"),
        render: (item) => (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4 text-slate-400" />
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-medium">
                {new Date(item.departureDate).toLocaleDateString("vi-VN")}
              </span>
              <span className="text-slate-400">{t("tour.to")}</span>
              <span className="font-medium">
                {new Date(item.returnDate).toLocaleDateString("vi-VN")}
              </span>
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
        header: t("common.actions"),
        className: "w-[120px]",
        render: (item) => (
          <div className="flex items-center gap-1.5">
            <ActionButton
              variant="secondary"
              onClick={() =>
                navigate(PATH.STAFF.SCHEDULE_DETAIL(item.scheduleId))
              }
              className="h-8 w-8 text-brand hover:bg-brand-light hover:text-brand-hover"
              aria-label={t("tour.view")}
            >
              <Eye className="h-3.5 w-3.5" />
            </ActionButton>
          </div>
        ),
      },
    ],
    [t, navigate],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap flex-1 items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white shrink-0 w-full sm:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("tour.searchAssignedPlaceholder")}
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
              className="appearance-none bg-transparent text-sm font-semibold text-slate-700 outline-none pr-4 cursor-pointer w-full"
            >
              <option value="upcoming">{t("tour.upcomingOnly")}</option>
              <option value="all">{t("tour.showAll")}</option>
            </select>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          </div>

          {/* Page Size Filter */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white shrink-0">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="appearance-none bg-transparent text-sm font-semibold text-slate-700 outline-none pr-4 cursor-pointer w-full"
            >
              <option value={5}>5 {t("common.perPage")}</option>
              <option value={10}>10 {t("common.perPage")}</option>
              <option value={20}>20 {t("common.perPage")}</option>
              <option value={50}>50 {t("common.perPage")}</option>
            </select>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
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
          data={[...schedules].sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime())}
          columns={columns}
          keyExtractor={(item) => item.scheduleId}
          isLoading={isLoading}
          emptyMessage={t("tour.assignedEmpty")}
          skeletonRows={pageSize}
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
