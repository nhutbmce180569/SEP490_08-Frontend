import React, { useMemo, useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Calendar, Eye, Search } from "lucide-react";
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
    pagination, // 💥 Lấy thông tin phân trang từ API Backend trả về
    isLoading,
    error,
    fetchAllSchedules,
    deleteSchedule,
  } = useTourSchedule();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{
    scheduleId: number;
    tourName?: string;
  } | null>(null);

  // 💥 Gọi API lại mỗi khi 'page' thay đổi
  useEffect(() => {
    fetchAllSchedules(page, PAGE_SIZE);
  }, [fetchAllSchedules, page]);

  // Reset trang về 1 khi gõ tìm kiếm
  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleCreate = () => navigate(PATH.MANAGER.CREATE_SCHEDULE());
  const handleEdit = (id: number) => navigate(PATH.MANAGER.EDIT_SCHEDULE(id));
  const handleView = (id: number) => navigate(PATH.MANAGER.SCHEDULE_DETAIL(id));
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    await deleteSchedule(confirmDelete.scheduleId);
    setConfirmDelete(null);
    // Reload lại dữ liệu sau khi xóa
    fetchAllSchedules(page, PAGE_SIZE);
  };

  // Tìm kiếm cục bộ (Trên dữ liệu của trang hiện tại)
  const filteredSchedules = useMemo(() => {
    if (!search.trim()) return schedules;
    const keyword = search.trim().toLowerCase();
    return schedules.filter((item) => {
      const tourName = item.tour?.name ?? "";
      return (
        tourName.toLowerCase().includes(keyword) ||
        item.tourId.toString().includes(keyword) ||
        item.id.toString().includes(keyword)
      );
    });
  }, [schedules, search]);

  const sortedSchedules = useMemo(() => {
    return [...filteredSchedules].sort((a, b) => a.tourId - b.tourId);
  }, [filteredSchedules]);

  const columns: Column<TourSchedule>[] = useMemo(
    () => [
      {
        header: t("tour.tourIdCol"),
        render: (item) => <span className="font-semibold text-slate-800">#{item.tourId}</span>,
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
            <span className="font-medium">{new Date(item.departureDate).toLocaleDateString("vi-VN")}</span>
            <span className="text-slate-300"> - </span>
            <span className="font-medium">{new Date(item.returnDate).toLocaleDateString("vi-VN")}</span>
          </div>
        ),
      },
      {
        header: t("common.actions"),
        className: "w-[160px]",
        render: (item) => {
          // const canEditSchedule = item.canEdit ?? item.tour?.canEdit ?? false;

          return (
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
                    onClick={() => setConfirmDelete({ scheduleId: item.id, tourName: item.tour?.name })}
                    className="h-8 w-8"
                    title={t("tour.deleteSchedule")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </ActionButton>
                </>
              )} */}
            </div>
          );
        },
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
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div>
            <h2 className="text-[15px] font-bold leading-tight text-slate-900">
              {t("tour.scheduleManagement")}
            </h2>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors sm:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder={t("tour.searchSchedules")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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

      {error ? (
        <div className="flex justify-center p-10 text-rose-500 font-semibold">{error}</div>
      ) : (
        <Table
          data={sortedSchedules} // 💥 Truyền thẳng sortedSchedules vì Backend đã cắt trang sẵn
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage={t("tour.noSchedulesFound")}
          isLoading={isLoading}
          skeletonRows={PAGE_SIZE}
        />
      )}

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

      {/* 💥 Truyền data từ pagination API vào PaginationButton */}
      <PaginationButton
        currentPage={pagination?.currentPage || 1}
        totalPages={pagination?.totalPages || 1}
        totalItems={pagination?.total || 0}
        pageSize={pagination?.pageSize || PAGE_SIZE}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </div>
  );
};