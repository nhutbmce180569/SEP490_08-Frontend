import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Image as ImageIcon, Search } from "lucide-react";
import { PATH } from "../../../../config/routes/route";
import { tourScheduleService } from "../../../tour/services/tourSchedule.service";
import type { AssignedTourSchedule } from "../../../tour/types/tourSchedule";
import { useToast } from "../../../../contexts/ToastContext";

export const LocationTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const [schedules, setSchedules] = useState<AssignedTourSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await tourScheduleService.getAssignedSchedules();
        setSchedules(data || []);
      } catch (err: any) {
        showError(err?.message || "Không thể tải danh sách chuyến tour.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [showError]);

  const filteredSchedules = useMemo(() => {
    if (!search.trim()) return schedules;
    const keyword = search.trim().toLowerCase();
    return schedules.filter((item) => {
      return (
        item.tourName?.toLowerCase().includes(keyword) ||
        item.scheduleId.toString().includes(keyword) ||
        item.tourId.toString().includes(keyword)
      );
    });
  }, [schedules, search]);

  const sortedSchedules = useMemo(
    () => [...filteredSchedules].sort((a, b) => new Date(b.departureDate).getTime() - new Date(a.departureDate).getTime()),
    [filteredSchedules],
  );

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0068E0] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-[#0068E0]" />
          <h1 className="text-3xl font-black text-slate-900">Theo dõi vị trí chuyến tour</h1>
        </div>
        <p className="text-sm text-slate-600">
          Chọn một chuyến tour để xem bản đồ thực tế và vị trí của các khách hàng đang tham gia.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo tên tour, ID schedule..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Schedules Grid */}
      {sortedSchedules.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedSchedules.map((schedule) => (
            <button
              key={schedule.scheduleId}
              onClick={() => navigate(PATH.STAFF.TRACK_SCHEDULE_LOCATIONS(schedule.scheduleId))}
              className="group rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-[#0068E0] hover:shadow-md active:scale-95"
            >
              {/* Tour Image */}
              <div className="mb-4 h-40 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                {schedule.tourImageUrl ? (
                  <img
                    src={schedule.tourImageUrl}
                    alt={schedule.tourName ?? "Tour image"}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </div>

              {/* Tour Name & ID */}
              <div className="mb-3 min-h-14">
                <h3 className="font-semibold text-slate-900 line-clamp-2 mb-1">
                  {schedule.tourName || "Chuyến tour không tên"}
                </h3>
                <p className="text-xs text-slate-500">Schedule #{schedule.scheduleId} • Tour #{schedule.tourId}</p>
              </div>

              {/* Dates */}
              <div className="mb-3 space-y-1.5 rounded-xl bg-slate-50 p-2.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {new Date(schedule.departureDate).toLocaleDateString("vi-VN")} -{" "}
                    {new Date(schedule.returnDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>

              {/* Role Badge & CTA */}
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  {schedule.assignedRole || "Staff"}
                </span>
                <div className="flex items-center gap-1 text-[10px] font-bold text-[#0068E0] opacity-0 group-hover:opacity-100 transition-opacity">
                  <MapPin className="h-3 w-3" />
                  Mở bản đồ
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-slate-100 p-4">
              <MapPin className="h-6 w-6 text-slate-400" />
            </div>
          </div>
          <p className="font-semibold text-slate-600">Không tìm thấy chuyến tour nào</p>
          <p className="text-sm text-slate-500">
            {search ? "Hãy thử tìm kiếm với từ khóa khác." : "Bạn chưa được gán cho chuyến tour nào."}
          </p>
        </div>
      )}
    </div>
  );
};
