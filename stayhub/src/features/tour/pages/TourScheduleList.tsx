import React, { useMemo, useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Calendar, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../config/routes/route";
import { Table, type Column } from "../../../components/dashboard/Table";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useTourSchedule } from "../hooks/useTourSchedule";
import { type TourSchedule } from "../types/tourSchedule";

const PAGE_SIZE = 10;

export const TourScheduleList: React.FC = () => {
  const navigate = useNavigate();
  
  // 1. Lấy chính xác những gì hook useTourSchedule đang return
  const { 
    schedules, 
    isLoading, 
    error, 
    fetchAllSchedules, 
    deleteSchedule 
  } = useTourSchedule();

  // 2. Tự quản lý phân trang (Pagination) ở local
  const [page, setPage] = useState(1);

  // 3. Gọi API lấy dữ liệu khi vừa vào trang
  useEffect(() => {
    fetchAllSchedules();
  }, [fetchAllSchedules]);

  // 4. Tự định nghĩa các hàm điều hướng
  const handleCreate = () => navigate(PATH.MANAGER.CREATE_SCHEDULE());
  const handleEdit = (id: number) => navigate(PATH.MANAGER.EDIT_SCHEDULE(id));

  // Tính toán dữ liệu hiển thị cho trang hiện tại
  const paginatedSchedules = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return schedules.slice(startIndex, startIndex + PAGE_SIZE);
  }, [schedules, page]);

  const totalPages = Math.ceil(schedules.length / PAGE_SIZE) || 1;
  const totalItems = schedules.length;

  const columns: Column<TourSchedule>[] = useMemo(
    () => [
      {
        header: "Tour ID",
        render: (item) => <span className="font-semibold text-slate-800">#{item.tourId}</span>,
      },
      {
        header: "Departure - Return",
        render: (item) => (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>{new Date(item.departureDate).toLocaleDateString("en-US")}</span>
            <span className="text-slate-300"> - </span>
            <span>{new Date(item.returnDate).toLocaleDateString("en-US")}</span>
          </div>
        ),
      },
      {
        header: "Price",
        render: (item) => (
          <span className="text-sm font-bold text-[#EB662B]">
            {item.price.toLocaleString("vi-VN")} ₫
          </span>
        ),
      },
      {
        header: "Seats (Sold/Avail)",
        render: (item) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-emerald-600">{item.soldQuantity} Sold</span>
            <span className="text-xs font-semibold text-slate-400">
              {item.availableSeats} Avail / <span className="text-slate-500">{item.maxCapacity} Max</span>
            </span>
          </div>
        ),
      },
      {
        header: "Action",
        render: (item) => (
          <div className="flex items-center gap-1.5">
            <ActionButton 
              variant="secondary" 
              aria-label="View" 
              onClick={() => navigate(PATH.MANAGER.SCHEDULE_DETAIL(item.id))} 
              className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            >
              <Eye className="h-3.5 w-3.5" />
            </ActionButton>
            
            <ActionButton 
              variant="secondary" 
              onClick={() => handleEdit(item.id)} 
              className="h-8 w-8"
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
              className="h-8 w-8 disabled:opacity-30 disabled:hover:bg-transparent"
              disabled={item.soldQuantity > 0} 
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
        <ActionButton 
          variant="primary" 
          onClick={handleCreate} 
          className="gap-2 px-4 py-2 text-sm !bg-[#EB662B] !border-[#EB662B] hover:!bg-[#d4531d] text-white"
        >
          <Plus className="h-4 w-4" />
          Create Schedule
        </ActionButton>
      </div>

      {error ? (
        <div className="p-10 text-center text-rose-500 font-semibold">{error}</div>
      ) : (
        <Table 
          data={paginatedSchedules} // Truyền dữ liệu đã cắt phân trang vào đây
          columns={columns} 
          keyExtractor={(item) => item.id} 
          emptyMessage="No schedules found."
          isLoading={isLoading}
          skeletonRows={PAGE_SIZE}
        />
      )}

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