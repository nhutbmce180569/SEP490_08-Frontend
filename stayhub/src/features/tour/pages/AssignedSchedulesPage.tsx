import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Eye, Image as ImageIcon, Search } from "lucide-react";
import { PATH } from "../../../config/routes/route";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { Table, type Column } from "../../../components/dashboard/Table";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { tourScheduleService } from "../services/tourSchedule.service";
import type { AssignedTourSchedule } from "../types/tourSchedule";
import { useTranslation } from "../../../contexts/LocaleContext";

const PAGE_SIZE = 10;

export const AssignedSchedulesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<AssignedTourSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await tourScheduleService.getAssignedSchedules();
        setSchedules(data);
      } catch (err: any) {
        setError(err?.message || t("tour.failedLoadSchedule"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [t]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filteredSchedules = useMemo(() => {
    if (!search.trim()) return schedules;
    const keyword = search.trim().toLowerCase();
    return schedules.filter((item) => {
      return (
        item.tourName?.toLowerCase().includes(keyword) ||
        item.assignedRole?.toLowerCase().includes(keyword) ||
        item.scheduleId.toString().includes(keyword) ||
        item.tourId.toString().includes(keyword)
      );
    });
  }, [schedules, search]);

  const sortedSchedules = useMemo(
    () => [...filteredSchedules].sort((a, b) => a.scheduleId - b.scheduleId),
    [filteredSchedules],
  );

  const paginatedSchedules = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return sortedSchedules.slice(startIndex, startIndex + PAGE_SIZE);
  }, [sortedSchedules, page]);

  const totalPages = Math.max(Math.ceil(sortedSchedules.length / PAGE_SIZE), 1);

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
              <div className="text-sm font-semibold text-slate-900 line-clamp-2">
                {item.tourName || t("tour.unnamedTour")}
              </div>
              <div className="text-xs text-slate-500">ID: {item.scheduleId}</div>
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
                {t("tour.to")} {new Date(item.returnDate).toLocaleDateString("vi-VN")}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: t("tour.assignedRole"),
        render: (item) => (
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {item.assignedRole || t("tour.staff")}
          </span>
        ),
      },
      {
        header: t("tour.tourIdCol"),
        render: (item) => <span className="font-semibold text-slate-800">#{item.tourId}</span>,
        className: "w-[100px] text-sm",
      },
      {
        header: t("common.actions"),
        className: "w-[120px]",
        render: (item) => (
          <ActionButton
            variant="secondary"
            onClick={() => navigate(PATH.STAFF.SCHEDULE_DETAIL(item.scheduleId))}
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
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-bold leading-tight text-slate-900">{t("tour.assignedSchedulesTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("tour.assignedSchedulesDesc")}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors sm:w-80">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("tour.searchAssignedPlaceholder")}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-10 text-center text-sm font-semibold text-rose-600">{error}</div>
      ) : (
        <Table
          data={paginatedSchedules}
          columns={columns}
          keyExtractor={(item) => item.scheduleId}
          isLoading={isLoading}
          emptyMessage={t("tour.assignedEmpty")}
          skeletonRows={PAGE_SIZE}
        />
      )}

      <PaginationButton
        currentPage={page}
        totalPages={totalPages}
        totalItems={sortedSchedules.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
};
