import React, { useMemo, useState, useEffect, useRef } from "react";
import { Plus, Eye, Search, X, Calendar, Pencil, Trash2, Filter, ListFilter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../config/routes/route";
import { Table, type Column } from "../../../components/dashboard/Table";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { ConfirmDialog } from "../../../components/dashboard/ConfirmDialog";
import { useTourSchedule } from "../hooks/useTourSchedule";
import { type TourSchedule } from "../types/tourSchedule";
import { useTranslation } from "../../../contexts/LocaleContext";

const PAGE_SIZE = 10;

export const TourScheduleList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    schedules,
    pagination,
    isLoading,
    error,
    fetchMySchedules, // ✅ Đổi sang fetchMySchedules
    deleteSchedule,
  } = useTourSchedule();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [confirmDelete, setConfirmDelete] = useState<{
    scheduleId: number;
    tourName?: string;
  } | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilter(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Debounce: chờ 400ms sau khi user ngừng gõ
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when other filters change
  useEffect(() => {
    setPage(1);
  }, [selectedTourId, startDate, endDate, pageSize]);

  // ✅ Gọi fetchMySchedules với các tham số filter
  useEffect(() => {
    fetchMySchedules(page, pageSize, selectedTourId, startDate, endDate, debouncedSearch);
  }, [fetchMySchedules, page, pageSize, selectedTourId, startDate, endDate, debouncedSearch]);

  const handleCreate = () => navigate(PATH.MANAGER.CREATE_SCHEDULE());
  const handleView = (id: number) => navigate(PATH.MANAGER.SCHEDULE_DETAIL(id));
  const handleEdit = (id: number) => navigate(PATH.MANAGER.EDIT_SCHEDULE(id));

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    await deleteSchedule(confirmDelete.scheduleId);
    setConfirmDelete(null);
    fetchMySchedules(page, pageSize, selectedTourId, startDate, endDate, debouncedSearch);
  };

  const hasActiveFilters = search.trim() !== "" || selectedTourId !== null || startDate !== "" || endDate !== "";

  const handleClearFilters = () => {
    setSearch("");
    setSelectedTourId(null);
    setStartDate("");
    setEndDate("");
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Lấy danh sách tour để lọc
  const [availableTours, setAvailableTours] = useState<{id: number, name: string}[]>([]);
  useEffect(() => {
    import("../services/tour.service").then(({ tourService }) => {
      tourService.getAllToursForDropdown()
        .then(res => {
          setAvailableTours(res.map(t => ({ id: t.id, name: t.name })));
        })
        .catch(console.error);
    });
  }, []);

  // Backend đã filter & sort (thường là order by departureDate descending)
  const sortedSchedules = schedules;

  const columns: Column<TourSchedule>[] = useMemo(
    () => [
      {
        header: "",
        className: "w-24",
        skeletonClassName: "h-10 w-10",
        render: (item) =>
          item.tour?.imageUrl ? (
            <img
              src={item.tour.imageUrl}
              alt={item.tour?.name ?? ""}
              className="h-10 w-10 min-w-[40px] shrink-0 rounded-lg border border-slate-100 object-cover bg-slate-100"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-100 text-slate-400">
              <span className="text-[10px] font-medium">{t("tour.noImg") || "No Image"}</span>
            </div>
          ),
      },
      {
        header: t("tour.scheduleId") || "Schedule ID",
        className: "w-32 whitespace-nowrap",
        render: (item) => (
          <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">#{item.id}</span>
        ),
      },
      {
        header: t("tour.tourNameCol"),
        className: "w-1/3 min-w-[250px]",
        render: (item) => (
          <div className="line-clamp-2 max-w-[200px] text-sm font-semibold text-slate-800">
            {item.tour?.name ?? "-"}
          </div>
        ),
      },
      {
        header: t("tour.departureReturn"),
        className: "min-w-[200px]",
        render: (item) => (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="font-medium whitespace-nowrap">
              {new Date(item.departureDate).toLocaleDateString("vi-VN")}
            </span>
            <span className="text-slate-300"> - </span>
            <span className="font-medium whitespace-nowrap">
              {new Date(item.returnDate).toLocaleDateString("vi-VN")}
            </span>
          </div>
        ),
      },
      {
        header: t("common.actions"),
        className: "w-[160px] min-w-[160px]",
        skeletonClassName: "h-8 w-24",
        render: (item) => (
          <div className="flex items-center gap-1.5">
            <ActionButton
              variant="secondary"
              aria-label={t("tour.view")}
              onClick={() => handleView(item.id)}
              className="h-8 w-8 text-brand hover:bg-brand-light hover:text-brand-hover"
              title={t("tour.viewDetail")}
            >
              <Eye className="h-3.5 w-3.5" />
            </ActionButton>

            <ActionButton
              variant="secondary"
              aria-label={t("tour.edit")}
              onClick={() => handleEdit(item.id)}
              className="h-8 w-8"
              title={t("tour.editSchedule")}
            >
              <Pencil className="h-3.5 w-3.5" />
            </ActionButton>

            <ActionButton
              variant="warning"
              aria-label={t("tour.delete")}
              onClick={() =>
                setConfirmDelete({ scheduleId: item.id, tourName: item.tour?.name })
              }
              className="h-8 w-8"
              title={t("tour.deleteSchedule")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </ActionButton>
          </div>
        ),
      },
    ],
    [t],
  );

  const deleteMessage = confirmDelete
    ? t("tour.deleteScheduleCannotUndo", {
        id: confirmDelete.scheduleId,
        tourName: confirmDelete.tourName ? ` (${confirmDelete.tourName})` : "",
      })
    : "";

  return (
    <div className="rounded-2xl">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search input */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors sm:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder={t("tour.searchSchedules")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative" ref={filterRef}>
            <button
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white"
              onClick={() => setShowFilter((v) => !v)}
            >
              <Filter className="h-3.5 w-3.5" />
              {t("tour.filter") || "Filter"}
            </button>
            {showFilter && (
              <div className="glass-dropdown absolute left-0 top-full z-50 mt-2 w-[320px] p-5 shadow-xl">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500">{t("tour.tourNameCol")}</label>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-slate-400 focus-within:bg-white transition-colors">
                      <ListFilter className="h-4 w-4 shrink-0 text-slate-400" />
                      <select
                        className="w-full bg-transparent text-sm text-slate-700 outline-none truncate"
                        value={selectedTourId ?? ""}
                        onChange={(e) =>
                          setSelectedTourId(e.target.value ? Number(e.target.value) : null)
                        }
                      >
                        <option value="">{t("tour.allTours") || "All Tours"}</option>
                        {availableTours.map((tour) => (
                          <option key={tour.id} value={tour.id} className="truncate">
                            {tour.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500">{t("tour.departureDate") || "Departure Date"}</label>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-10 text-xs font-semibold text-slate-400">{t("tour.from") || "Từ"}</span>
                        <input 
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus-within:border-slate-400 focus-within:bg-white transition-colors"
                          title={t("tour.startDate") || "Start Date"}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-10 text-xs font-semibold text-slate-400">{t("tour.to") || "Đến"}</span>
                        <input 
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus-within:border-slate-400 focus-within:bg-white transition-colors"
                          title={t("tour.endDate") || "End Date"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

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

          <ActionButton
            variant="secondary"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            className="gap-2 px-4 py-2 text-sm"
          >
            <X className="h-4 w-4" />
            {t("tour.clear") || "Clear"}
          </ActionButton>
        </div>

        <div className="flex items-center shrink-0 mt-3 sm:mt-0">
          <ActionButton
            variant="primary"
            onClick={handleCreate}
            className="gap-2 px-4 py-2 text-sm whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            {t("tour.createSchedule")}
          </ActionButton>
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="flex justify-center p-10 text-rose-500 font-semibold">
          {error}
        </div>
      ) : (
        <Table
          data={sortedSchedules}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage={t("tour.noSchedulesFound")}
          isLoading={isLoading}
          skeletonRows={pageSize}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("tour.deleteScheduleMgr")}
        message={deleteMessage}
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        variant="warning"
      />

      {/* Pagination */}
      <PaginationButton
        currentPage={pagination?.currentPage || 1}
        totalPages={pagination?.totalPages || 1}
        totalItems={pagination?.total || 0}
        pageSize={pagination?.pageSize || pageSize}
        onPageChange={handlePageChange}
      />
    </div>
  );
};