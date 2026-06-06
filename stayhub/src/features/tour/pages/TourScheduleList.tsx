import React, { useMemo, useState, useEffect } from "react";
import { Plus, Eye, Search, X, Calendar } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{
    scheduleId: number;
    tourName?: string;
  } | null>(null);

  // Debounce: chờ 400ms sau khi user ngừng gõ mới gọi API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ✅ Gọi fetchMySchedules thay vì fetchAllSchedules
  useEffect(() => {
    fetchMySchedules(page, PAGE_SIZE);
  }, [fetchMySchedules, page]);

  const handleCreate = () => navigate(PATH.MANAGER.CREATE_SCHEDULE());
  const handleView = (id: number) => navigate(PATH.MANAGER.SCHEDULE_DETAIL(id));

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    await deleteSchedule(confirmDelete.scheduleId);
    setConfirmDelete(null);
    fetchMySchedules(page, PAGE_SIZE); // ✅
  };

  const handleClearSearch = () => {
    setSearch("");
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // ✅ Filter cục bộ theo search vì API /my chưa hỗ trợ tourName param
  const filteredSchedules = useMemo(() => {
    if (!debouncedSearch.trim()) return schedules;
    const keyword = debouncedSearch.trim().toLowerCase();
    return schedules.filter((item) =>
      (item.tour?.name ?? "").toLowerCase().includes(keyword),
    );
  }, [schedules, debouncedSearch]);

  const sortedSchedules = useMemo(() => {
    return [...filteredSchedules].sort((a, b) => a.tourId - b.tourId);
  }, [filteredSchedules]);

  const columns: Column<TourSchedule>[] = useMemo(
    () => [
      {
        header: t("tour.tourIdCol"),
        render: (item) => (
          <span className="font-semibold text-slate-800">#{item.tourId}</span>
        ),
        className: "w-[120px]",
      },
      {
        header: t("tour.tourNameCol"),
        render: (item) => (
          <span className="line-clamp-2 max-w-[200px] text-sm font-semibold text-slate-800">
            {item.tour?.name ?? "-"}
          </span>
        ),
        className: "min-w-[180px]",
      },
      {
        header: t("tour.departureReturn"),
        render: (item) => (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="font-medium">
              {new Date(item.departureDate).toLocaleDateString("vi-VN")}
            </span>
            <span className="text-slate-300"> - </span>
            <span className="font-medium">
              {new Date(item.returnDate).toLocaleDateString("vi-VN")}
            </span>
          </div>
        ),
      },
      {
        header: t("common.actions"),
        className: "w-[160px]",
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

            {/* {canEditSchedule && (
              <>
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
              </>
            )} */}
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
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div>
            <h2 className="text-[15px] font-bold leading-tight text-slate-900">
              {t("tour.scheduleManagement")}
            </h2>
          </div>
        </div>

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
            {search && (
              <button
                onClick={handleClearSearch}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <ActionButton
            variant="primary"
            onClick={handleCreate}
            className="gap-2 px-4 py-2 text-sm"
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
          skeletonRows={PAGE_SIZE}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("tour.deleteScheduleMgr")}
        message={deleteMessage}
        confirmText={t("tour.delete")}
        cancelText={t("common.cancel")}
        variant="warning"
      />

      {/* Pagination */}
      <PaginationButton
        currentPage={pagination?.currentPage || 1}
        totalPages={pagination?.totalPages || 1}
        totalItems={pagination?.total || 0}
        pageSize={pagination?.pageSize || PAGE_SIZE}
        onPageChange={handlePageChange}
      />
    </div>
  );
};