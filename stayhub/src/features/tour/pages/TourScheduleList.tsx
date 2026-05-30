import React, { useMemo, useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Calendar, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../config/routes/route";

// 💥 Đảm bảo import đúng đường dẫn đến 2 component xịn của bạn
import { Table, type Column } from "../../../components/dashboard/Table";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";

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

  useEffect(() => {
    fetchAllSchedules();
  }, [fetchAllSchedules]);

  const handleCreate = () => navigate(PATH.MANAGER.CREATE_SCHEDULE());
  const handleEdit = (id: number) => navigate(PATH.MANAGER.EDIT_SCHEDULE(id));

  // Cắt dữ liệu cho trang hiện tại
  const paginatedSchedules = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return schedules.slice(startIndex, startIndex + PAGE_SIZE);
  }, [schedules, page]);

  const totalPages = Math.ceil(schedules.length / PAGE_SIZE) || 1;
  const totalItems = schedules.length;

  // 💥 Cấu hình các cột truyền vào Component Table của bạn
  const columns: Column<TourSchedule>[] = useMemo(
    () => [
      {
        header: "Tour ID",
        // Dùng render thay vì accessor để custom UI dễ dàng
        render: (item) => <span className="font-semibold text-slate-800">#{item.tourId}</span>,
        className: "w-[120px]", // Có thể truyền thêm class để fix độ rộng cột
      },
      {
        header: "Departure - Return",
        render: (item) => (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="font-medium">{new Date(item.departureDate).toLocaleDateString("en-US")}</span>
            <span className="text-slate-300"> - </span>
            <span className="font-medium">{new Date(item.returnDate).toLocaleDateString("en-US")}</span>
          </div>
        ),
      },
      {
        header: "Action",
        className: "w-[160px]", // Fix độ rộng cột action
        render: (item) => (
          <div className="flex items-center gap-2">
            <ActionButton 
              variant="secondary" 
              onClick={() => navigate(PATH.MANAGER.SCHEDULE_DETAIL(item.id))} 
              className="h-8 w-8"
              title="View Detail"
            >
              <Eye className="h-3.5 w-3.5" />
            </ActionButton>
            
            <ActionButton 
              variant="secondary" 
              onClick={() => handleEdit(item.id)} 
              className="h-8 w-8"
              title="Edit Schedule"
            >
              <Pencil className="h-3.5 w-3.5" />
            </ActionButton>
            
            <ActionButton 
              variant="warning" 
              onClick={async () => {
                if (window.confirm("Are you sure you want to delete this schedule?")) {
                  await deleteSchedule(item.id);
                }
              }} 
              className="h-8 w-8"
              title="Delete Schedule"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </ActionButton>
          </div>
        ),
      },
    ],
    [navigate, deleteSchedule]
  );

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-[15px] font-bold text-slate-900">Schedule Management</h2>
        
        {/* Nút Create dùng ActionButton */}
        <ActionButton 
          variant="primary" 
          onClick={handleCreate} 
          className="gap-2 px-4 py-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          Create Schedule
        </ActionButton>
      </div>

      {error ? (
        <div className="p-10 text-center text-rose-500 font-semibold">{error}</div>
      ) : (
        /* 💥 Gọi Component Table của bạn vào đây, truyền đủ Props */
        <Table 
          data={paginatedSchedules}
          columns={columns} 
          keyExtractor={(item) => item.id} 
          emptyMessage="No schedules found. Click 'Create Schedule' to add one."
          isLoading={isLoading}
          skeletonRows={PAGE_SIZE}
        />
      )}

      {/* Phân trang */}
      {schedules.length > 0 && (
        <PaginationButton
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};