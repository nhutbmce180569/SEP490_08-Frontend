import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  MapPin,
  Image as ImageIcon,
  Search,
  ChevronDown,
  Navigation,
} from "lucide-react";
import { PATH } from "../../../../config/routes/route";
import { useToast } from "../../../../contexts/ToastContext";
import { useTranslation } from "../../../../contexts/LocaleContext";
import { tourScheduleStaffService } from "../../../tour/services/tourScheduleStaffService.service";
import { ActionButton } from "../../../../components/dashboard/ActionButton";
import { Table, type Column } from "../../../../components/dashboard/Table";
import { PaginationButton } from "../../../../components/dashboard/PaginationButton";
import type { AssignedTourSchedule } from "../../../tour/types/tourScheduleStaff";

export const LocationTrackingPage: React.FC = () => {
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
    queryKey: ["trackingSchedules", page, pageSize, upcomingOnly, debouncedSearch],
    queryFn: () =>
      tourScheduleStaffService.getAssignedSchedules(
        page,
        pageSize,
        upcomingOnly,
        debouncedSearch,
      ),
    staleTime: 1000 * 60,
  });

  const schedules = useMemo(() => response?.data || [], [response]);

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
          new Date(a.departureDate).getTime() -
          new Date(b.departureDate).getTime(),
      ),
    [schedules],
  );

  const columns: Column<AssignedTourSchedule>[] = useMemo(
    () => [
      {
        header: "",
        className: "w-24",
        render: (item) =>
          item.tourImageUrl ? (
            <img
              src={item.tourImageUrl}
              alt={item.tourName ?? ""}
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
              {item.tourName || t("social.trackingUntitledTour")}
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
            <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
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
                                : "bg-slate-100 text-slate-600";

          return (
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}
            >
              {role || t("common.staff")}
            </span>
          );
        },
      },

      {
        header: t("common.actions"),
        className: "w-[120px]",
        render: (item) => (
          <ActionButton
            variant="secondary"
            onClick={() =>
              navigate(PATH.STAFF.TRACK_SCHEDULE_LOCATIONS(item.scheduleId))
            }
            className="h-9 w-full"
            aria-label={t("common.track")}
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
      <div className="flex flex-col gap-3 border-b border-slate-100 py-4 sm:flex-row sm:items-center sm:justify-between">
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

          {/* Dropdown filter */}
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

          {/* Page Size Filter */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors">
            <select
              className="bg-transparent text-sm text-slate-700 outline-none"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5 {t("common.perPage")}</option>
              <option value={10}>10 {t("common.perPage")}</option>
              <option value={15}>15 {t("common.perPage")}</option>
              <option value={20}>20 {t("common.perPage")}</option>
              <option value={50}>50 {t("common.perPage")}</option>
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
          keyExtractor={(item) => item.scheduleId}
          isLoading={isLoading}
          emptyMessage={t("social.trackingNoSchedulesFound")}
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

