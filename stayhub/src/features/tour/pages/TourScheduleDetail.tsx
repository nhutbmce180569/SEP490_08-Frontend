import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Banknote,
  Users,
  Hash,
  Pencil,
  Trash2,
  Ticket,
  MapPin,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTourSchedule } from "../hooks/useTourSchedule";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { PATH } from "../../../config/routes/route";
import { useGroupedItineraries } from "../hooks/useGroupedItineraries";

export const TourScheduleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Gọi hook quản lý schedule
  const { currentSchedule: schedule, isLoading, error, fetchScheduleById, deleteSchedule } = useTourSchedule();

  // Tự động fetch data chi tiết của Schedule ID này khi mount trang
  React.useEffect(() => {
    if (id) {
      fetchScheduleById(id);
    }
  }, [id, fetchScheduleById]);

  const { expandedItiIds, toggleIti, groupedItineraries } = useGroupedItineraries(schedule?.tourScheduleItineraries);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Loading schedule details...
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="flex h-64 items-center justify-center text-rose-500 font-semibold">
        {error || "Schedule not found."}
      </div>
    );
  }

  // Tính toán dữ liệu ngày bị thiếu cho Schedule Itinerary
  const itineraryDayNumbers = schedule.tourScheduleItineraries
    ?.map((i) => Number(i.dayNumber))
    .sort((a, b) => a - b) ?? [];
  const missingItineraryDays = [] as number[];
  const maxDay = itineraryDayNumbers.length ? Math.max(...itineraryDayNumbers) : 0;
  for (let i = 1; i <= maxDay; i += 1) {
    if (!itineraryDayNumbers.includes(i)) missingItineraryDays.push(i);
  }

  const handleDeleteSchedule = async () => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      try {
        await deleteSchedule(schedule.id);
        navigate(-1); // Xóa xong quay về trang danh sách
      } catch (err) {
        // Lỗi hệ thống đã được xử lý bằng Toast inside Hook
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl py-6 px-4">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Schedules
      </button>

      {/* Main Content Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Header Area */}
        <div className="relative flex h-32 w-full items-center justify-center bg-gradient-to-r from-[#EB662B] to-orange-600 sm:h-40">
          <Calendar className="h-16 w-16 text-white opacity-20" />
          <div className="absolute right-4 top-4">
            <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-md">
              Schedule Detail
            </span>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6 sm:p-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Schedule #{schedule.id}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Hash className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-slate-700">Tour Name:</span>
                  <span className="text-[#EB662B] font-bold">{schedule.tour?.name || `ID: ${schedule.tourId}`}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex shrink-0 items-start gap-3 flex-wrap">
              <ActionButton
                variant="primary"
                onClick={() => navigate(PATH.MANAGER.SCHEDULE_ORDERS(schedule.id))}
                className="gap-2 px-4 py-2 text-sm !bg-indigo-600 !border-indigo-600 hover:!bg-indigo-700 hover:!border-indigo-700 text-white"
              >
                <Ticket className="h-4 w-4" />
                View Orders
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => navigate(PATH.MANAGER.EDIT_SCHEDULE(schedule.id))}
                className="gap-2 px-4 py-2 text-sm border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </ActionButton>
              <ActionButton
                type="button"
                variant="warning"
                disabled={schedule.soldQuantity > 0}
                onClick={handleDeleteSchedule}
                className="gap-2 px-4 py-2 text-sm !bg-rose-600 !border-rose-600 hover:!bg-rose-700 text-white disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </ActionButton>
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Calendar className="h-4 w-4 text-emerald-500" />
                Departure Date
              </div>
              <div className="text-base font-bold text-slate-900">
                {schedule.departureDate
                  ? new Date(schedule.departureDate).toLocaleString("en-US")
                  : "N/A"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Clock className="h-4 w-4 text-rose-500" />
                Return Date
              </div>
              <div className="text-base font-bold text-slate-900">
                {schedule.returnDate
                  ? new Date(schedule.returnDate).toLocaleString("en-US")
                  : "N/A"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Banknote className="h-4 w-4 text-amber-500" />
                Price
              </div>
              <div className="text-lg font-bold text-[#EB662B]">
                {(schedule.price ?? 0).toLocaleString("vi-VN")} ₫
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Users className="h-4 w-4 text-indigo-500" />
                Capacity & Sales
              </div>
              <div className="text-base font-bold text-slate-900">
                <span className="text-emerald-600">{schedule.soldQuantity ?? 0} Sold</span> /{" "}
                <span className="text-indigo-600">{schedule.availableSeats ?? 0} Available</span>
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-400">
                Max Capacity: {schedule.maxCapacity ?? 0} seats
              </div>
            </div>
          </div>

          {/* Note Section */}
          <div className="mb-8">
            <h2 className="mb-3 text-base font-bold text-slate-900">Schedule Note</h2>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 leading-relaxed text-slate-700">
              {schedule.note ? (
                <p className="whitespace-pre-wrap text-sm text-slate-600">{schedule.note}</p>
              ) : (
                <p className="text-sm italic text-slate-400">
                  No notes provided for this schedule.
                </p>
              )}
            </div>
          </div>

          {/* Itinerary Section */}
          <div className="mt-8 border-t border-slate-100 pt-8">
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-900">
                  Schedule Itinerary
                </h2>
                <ActionButton
                  variant="primary"
                  onClick={() => navigate(PATH.MANAGER.CREATE_SCHEDULE_ITINERARY(schedule.id))}
                  className="gap-2 px-4 py-2 text-sm !bg-[#EB662B] !border-[#EB662B] hover:!bg-[#d4531d] text-white"
                >
                  <Plus className="h-4 w-4" />
                  Add Itineraries
                </ActionButton>
              </div>
              {missingItineraryDays.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold">Missing itinerary days detected:</p>
                  <p>Day {missingItineraryDays.join(", Day ")} is not present in this schedule.</p>
                </div>
              )}
            </div>

            {schedule.tourScheduleItineraries && schedule.tourScheduleItineraries.length > 0 ? (
              <div className="flex flex-col gap-6">
                {Object.entries(groupedItineraries)
                  .map(([dayStr]) => Number(dayStr))
                  .sort((a, b) => a - b)
                  .map((dayNumber) => {
                    const itemsForDay = groupedItineraries[dayNumber];
                    const dayDate = itemsForDay[0]?.itineraryDate;
                    return (
                      <div key={dayNumber} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">Day {dayNumber}</h3>
                            {dayDate && <p className="text-xs font-medium text-slate-400 mt-0.5">{new Date(dayDate).toLocaleDateString()}</p>}
                          </div>
                        </div>
                        
                        <div className="flex flex-col divide-y divide-slate-100">
                          {itemsForDay.map((iti: any) => {
                            const isExpanded = expandedItiIds.includes(iti.id);
                            const timeStr = iti.startDuration && iti.endDuration
                              ? `${iti.startDuration.substring(0, 5)} - ${iti.endDuration.substring(0, 5)}`
                              : iti.startDuration ? iti.startDuration.substring(0, 5) : "Any time";

                            return (
                              <div key={iti.id} className="flex flex-col">
                                <div
                                  className="flex cursor-pointer items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50/60"
                                  onClick={() => toggleIti(iti.id)}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="flex min-w-[110px] items-center justify-center rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600">
                                      <Clock className="mr-1.5 h-3.5 w-3.5" />
                                      {timeStr}
                                    </div>
                                    <h4 className="text-sm font-semibold text-slate-800">{iti.title || "Untitled itinerary"}</h4>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                      <ActionButton variant="secondary" onClick={() => navigate(PATH.MANAGER.EDIT_SCHEDULE_ITINERARY(schedule.id, iti.id))} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                                        <Pencil className="h-3.5 w-3.5" />
                                      </ActionButton>
                                      <ActionButton variant="warning" onClick={() => navigate(PATH.MANAGER.DELETE_SCHEDULE_ITINERARY(schedule.id, iti.id))} className="h-8 w-8">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </ActionButton>
                                    </div>
                                    <div className="text-slate-400">
                                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                    </div>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="bg-slate-50/40 px-5 pb-5 pt-2 sm:pl-[150px] border-t border-slate-50">
                                    {iti.description && (
                                      <p className="mb-3 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                                        {iti.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                      <MapPin className="h-4 w-4 text-emerald-500" />
                                      <span>{iti.locationName || "No location specification"}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
                <MapPin className="mb-3 h-10 w-10 text-slate-400" />
                <h3 className="mb-1 text-sm font-bold text-slate-900">
                  No itinerary items yet
                </h3>
                <p className="mb-4 text-xs text-slate-500">
                  Create an itinerary item for this schedule.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};