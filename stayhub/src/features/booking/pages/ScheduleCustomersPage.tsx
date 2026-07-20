import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Users,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useToast } from "../../../contexts/ToastContext";
import { useTranslation } from "../../../contexts/LocaleContext";
import { getGenderDisplay } from "../../auth/pages/UserList";
import { getApiErrorMessage } from "../../content/utils/apiError";
import { getScheduleCustomersByScheduleId } from "../services/booking.service";
import type { ReadScheduleCustomerDTO } from "../types/booking";
import { PATH } from "../../../config/routes/route";
import { tourScheduleStaffService } from "../../tour/services/tourScheduleStaffService.service";

export const ScheduleCustomersPage: React.FC = () => {
  const { t } = useTranslation();
  const { scheduleId } = useParams<{ scheduleId?: string }>();
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    scheduleId && Number.isFinite(Number(scheduleId)) ? Number(scheduleId) : null,
  );

  // States cho Schedule (Sidebar)
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [debouncedScheduleSearch, setDebouncedScheduleSearch] = useState("");
  const [schedulePage, setSchedulePage] = useState(1);
  const [upcomingOnly, setUpcomingOnly] = useState(true);

  // States cho Customers (Main) — search gọi API thay vì local filter
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [scheduleCustomers, setScheduleCustomers] = useState<ReadScheduleCustomerDTO[]>([]);
  const [isCustomersLoading, setIsCustomersLoading] = useState(false);

  // Debounce search schedule
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedScheduleSearch(scheduleSearch);
      setSchedulePage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [scheduleSearch]);

  // Debounce search customer
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Schedules (Sidebar)
  const {
    data: schedulesResponse,
    isLoading: isScheduleLoading,
  } = useQuery({
    queryKey: ["assignedSchedules", schedulePage, upcomingOnly, debouncedScheduleSearch],
    queryFn: () =>
      tourScheduleStaffService.getAssignedSchedules(
        schedulePage,
        5,
        upcomingOnly,
        debouncedScheduleSearch,
      ),
    staleTime: 1000 * 60,
  });

  const schedules = useMemo(() => schedulesResponse?.data || [], [schedulesResponse]);
  const totalPages = schedulesResponse?.totalPages || 1;

  // Fetch Customers
  const fetchCustomers = React.useCallback(
    async (id: number, attendeeName?: string) => {
      setIsCustomersLoading(true);
      try {
        const data = await getScheduleCustomersByScheduleId(id, { attendeeName });
        setScheduleCustomers(Array.isArray(data) ? data : (data as any)?.data || []);
      } catch (err: unknown) {
        setScheduleCustomers([]);
        showError(getApiErrorMessage(err, t("booking.unableLoadCustomers")));
      } finally {
        setIsCustomersLoading(false);
      }
    },
    [showError, t],
  );

  // Auto select first schedule
  useEffect(() => {
    if (selectedScheduleId == null && schedules.length > 0) {
      setSelectedScheduleId(schedules[0].scheduleId);
    }
  }, [schedules, selectedScheduleId]);

  // Sync route + fetch khi đổi schedule hoặc debouncedSearch thay đổi
  useEffect(() => {
    if (selectedScheduleId) {
      void fetchCustomers(selectedScheduleId, debouncedSearch || undefined);
      navigate(PATH.STAFF.SCHEDULE_CUSTOMERS(selectedScheduleId), { replace: true });
    }
  }, [selectedScheduleId, debouncedSearch, fetchCustomers, navigate]);

  const columns: Column<ReadScheduleCustomerDTO>[] = useMemo(
    () => [
      {
        header: t("common.nameLabel"),
        render: (c) => (
          <div className="font-semibold text-slate-900">{c.attendeeName}</div>
        ),
      },
      {
        header: t("booking.idCardLabel") || "ID/Passport",
        render: (c) => (
          <span className="text-sm font-medium text-slate-600">{c.idCard || "-"}</span>
        ),
      },
      {
        header: t("booking.phoneNumberLabel") || "Phone Number",
        render: (c) => (
          <span className="text-sm text-slate-600">{c.phoneNumber ?? "No number"}</span>
        ),
      },
      {
        header: t("booking.genderLabel"),
        render: (c) => (
          <span className="text-sm capitalize text-slate-600">{getGenderDisplay(c.gender, t)}</span>
        ),
      },
      {
        header: t("common.dateOfBirth"),
        render: (c) => (
          <span className="text-sm text-slate-600">
            {c.dateOfBirth ? new Date(c.dateOfBirth).toLocaleDateString("vi-VN") : "-"}
          </span>
        ),
      },
    ],
    [t],
  );

  const selectedSchedule = useMemo(() => {
    return schedules.find((s) => s.scheduleId === selectedScheduleId);
  }, [schedules, selectedScheduleId]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
        {/* Sidebar Schedule */}
        <div className="flex flex-col gap-4 min-w-0 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm h-[calc(100vh-140px)] sticky top-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
            {t("booking.selectSchedule")}
          </h2>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-brand focus-within:bg-white transition-colors">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input
                value={scheduleSearch}
                onChange={(e) => setScheduleSearch(e.target.value)}
                placeholder={t("booking.searchSchedulePlaceholder")}
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="relative">
              <select
                value={upcomingOnly ? "upcoming" : "all"}
                onChange={(e) => {
                  setUpcomingOnly(e.target.value === "upcoming");
                  setSchedulePage(1);
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none cursor-pointer hover:border-slate-300 transition-colors"
              >
                <option value="upcoming">{t("tour.upcomingOnly")}</option>
                <option value="all">{t("tour.showAll")}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="mt-2 space-y-3 flex-1 overflow-y-auto pr-2">
            {isScheduleLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500">
                {t("booking.noSchedulesAssigned")}
              </div>
            ) : (
              schedules.map((schedule) => (
                <button
                  key={schedule.scheduleId}
                  onClick={() => setSelectedScheduleId(schedule.scheduleId)}
                  className={`w-full rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 ${
                    selectedScheduleId === schedule.scheduleId
                      ? "border-[#0068E0] bg-blue-50/50 shadow-sm ring-1 ring-[#0068E0]/20"
                      : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className={`text-sm font-bold truncate ${selectedScheduleId === schedule.scheduleId ? "text-[#0068E0]" : "text-slate-700"}`}>
                    {schedule.tourName || `Schedule #${schedule.scheduleId}`}
                  </div>
                  <p className={`text-xs mt-1.5 ${selectedScheduleId === schedule.scheduleId ? "text-blue-600/80" : "text-slate-500"}`}>
                    {new Date(schedule.departureDate).toLocaleDateString("vi-VN")} - {new Date(schedule.returnDate).toLocaleDateString("vi-VN")}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
            <ActionButton
              variant="secondary"
              onClick={() => setSchedulePage((p) => Math.max(1, p - 1))}
              disabled={schedulePage === 1}
              className="p-2 h-9 w-9 rounded-xl"
            >
              <ChevronLeft size={16} />
            </ActionButton>
            <span className="text-xs font-bold text-slate-600">
              {schedulePage} / {totalPages}
            </span>
            <ActionButton
              variant="secondary"
              onClick={() => setSchedulePage((p) => Math.min(totalPages, p + 1))}
              disabled={schedulePage >= totalPages}
              className="p-2 h-9 w-9 rounded-xl"
            >
              <ChevronRight size={16} />
            </ActionButton>
          </div>
        </div>

        {/* Main Table Area */}
        <div className="flex flex-col min-w-0 rounded-3xl border border-slate-100 bg-white shadow-sm h-[calc(100vh-140px)] sticky top-6">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-[15px] font-bold text-slate-900" title={selectedSchedule?.tourName || undefined}>
                {selectedSchedule ? (selectedSchedule.tourName || `Schedule #${selectedSchedule.scheduleId}`) : t("booking.tourCustomers")}
              </h2>
              {selectedSchedule && (
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-slate-500">
                    {new Date(selectedSchedule.departureDate).toLocaleDateString("vi-VN")} - {new Date(selectedSchedule.returnDate).toLocaleDateString("vi-VN")}
                  </span>
                  <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-200">
                    <UserCheck className="h-3 w-3" />
                    {t("booking.totalPassengers", { count: scheduleCustomers.length })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition-colors focus-within:border-brand focus-within:bg-white sm:w-56">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("booking.searchCustomerPlaceholder")}
                  className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden min-w-0 flex-1 flex flex-col rounded-b-3xl">
            <Table
              data={scheduleCustomers}
              columns={columns}
              isLoading={isCustomersLoading}
              wrapperClassName="overflow-auto flex-1 w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
