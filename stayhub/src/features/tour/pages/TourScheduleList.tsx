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

const PAGE_SIZE = 10;

export const TourScheduleList: React.FC = () => {
  const navigate = useNavigate();
  
  const { 
    schedules, 
    isLoading, 
    error, 
    fetchAllSchedules, 
    deleteSchedule 
  } = useTourSchedule();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{
    scheduleId: number;
    tourName?: string;
  } | null>(null);

  useEffect(() => {
    fetchAllSchedules();
  }, [fetchAllSchedules]);

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
  };

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

  const paginatedSchedules = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return sortedSchedules.slice(startIndex, startIndex + PAGE_SIZE);
  }, [sortedSchedules, page]);

  const totalPages = Math.ceil(sortedSchedules.length / PAGE_SIZE) || 1;
  const totalItems = sortedSchedules.length;

  const columns: Column<TourSchedule>[] = useMemo(
    () => [
      {
        header: "Tour ID",
        render: (item) => <span className="font-semibold text-slate-800">#{item.tourId}</span>,
        className: "w-[120px]",
      },
      {
        header: "Tour Name",
        render: (item) => (
          <span className="line-clamp-2 max-w-[200px] text-sm font-semibold text-slate-800">
            {item.tour?.name ?? "-"}
          </span>
        ),
        className: "min-w-[180px]",
      },
      {
        header: "Departure - Return",
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
        header: "Action",
        className: "w-[160px]",
        render: (item) => (
          <div className="flex items-center gap-1.5">
            <ActionButton 
              variant="secondary" 
              aria-label="View"
              onClick={() => handleView(item.id)} 
              className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              title="View Detail"
            >
              <Eye className="h-3.5 w-3.5" />
            </ActionButton>
            
            <ActionButton 
              variant="secondary" 
              aria-label="Edit"
              onClick={() => handleEdit(item.id)} 
              className="h-8 w-8"
              title="Edit Schedule"
            >
              <Pencil className="h-3.5 w-3.5" />
            </ActionButton>
            
            <ActionButton 
              variant="warning" 
              aria-label="Delete"
              onClick={() => setConfirmDelete({ scheduleId: item.id, tourName: item.tour?.name })}
              className="h-8 w-8"
              title="Delete Schedule"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </ActionButton>
          </div>
        ),
      },
    ],
    [handleEdit, handleView]
  );

  return (
    <div className="rounded-2xl">
      {/* Card header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div>
            <h2 className="text-[15px] font-bold leading-tight text-slate-900">
              Schedule Management
            </h2>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors sm:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Search schedules..."
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
            Create Schedule
          </ActionButton>
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="flex justify-center p-10 text-rose-500 font-semibold">{error}</div>
      ) : (
        <Table
          data={paginatedSchedules}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage="No schedules found. Click 'Create Schedule' to add one."
          isLoading={isLoading}
          skeletonRows={PAGE_SIZE}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete schedule"
        message={`Are you sure you want to delete schedule #${confirmDelete?.scheduleId}${
          confirmDelete?.tourName ? ` (${confirmDelete.tourName})` : ""
        }? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Footer / Pagination */}
      <PaginationButton
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
};