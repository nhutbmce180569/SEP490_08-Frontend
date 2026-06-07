import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Users, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown 
} from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useToast } from "../../../contexts/ToastContext";
import { useTranslation } from "../../../contexts/LocaleContext";
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

  // States cho Customers (Main)
  const [search, setSearch] = useState("");
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

  // Fetch Schedules (Sidebar)
  const { 
    data: schedulesResponse, 
    isLoading: isScheduleLoading 
  } = useQuery({
    queryKey: ["assignedSchedules", schedulePage, upcomingOnly, debouncedScheduleSearch],
    queryFn: () => tourScheduleStaffService.getAssignedSchedules(schedulePage, 5, upcomingOnly, debouncedScheduleSearch),
    staleTime: 1000 * 60,
  });

  const schedules = useMemo(() => schedulesResponse?.data || [], [schedulesResponse]);
  const totalPages = schedulesResponse?.totalPages || 1;

  // Fetch Customers
  const fetchCustomers = React.useCallback(async (id: number) => {
    setIsCustomersLoading(true);
    try {
      const data = await getScheduleCustomersByScheduleId(id);
      setScheduleCustomers(Array.isArray(data) ? data : (data as any)?.data || []);
    } catch (err: unknown) {
      setScheduleCustomers([]);
      showError(getApiErrorMessage(err, t("booking.unableLoadCustomers")));
    } finally {
      setIsCustomersLoading(false);
    }
  }, [showError, t]);

  // Auto select first schedule
  useEffect(() => {
    if (selectedScheduleId == null && schedules.length > 0) {
      setSelectedScheduleId(schedules[0].scheduleId);
    }
  }, [schedules, selectedScheduleId]);

  // Sync route
  useEffect(() => {
    if (selectedScheduleId) {
      void fetchCustomers(selectedScheduleId);
      navigate(PATH.STAFF.SCHEDULE_CUSTOMERS(selectedScheduleId), { replace: true });
    }
  }, [selectedScheduleId, fetchCustomers, navigate]);

  const selectedSchedule = useMemo(() => schedules.find((item) => item.scheduleId === selectedScheduleId) ?? null, [schedules, selectedScheduleId]);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return scheduleCustomers;
    const keyword = search.trim().toLowerCase();
    return scheduleCustomers.filter((c) => 
      c.attendeeName?.toLowerCase().includes(keyword) ||
      c.idCard?.toLowerCase().includes(keyword) ||
      c.ticketId?.toString().includes(keyword) ||
      c.orderId?.toString().includes(keyword)
    );
  }, [scheduleCustomers, search]);

  const columns: Column<ReadScheduleCustomerDTO>[] = useMemo(() => [
    { header: t("common.nameLabel"), render: (c) => <div className="font-semibold text-slate-900">{c.attendeeName}</div> },
    { header: t("booking.idCardLabel") || "ID/Passport", render: (c) => <span className="text-sm font-medium text-slate-600">{c.idCard || "-"}</span> },
    { header: t("booking.genderLabel"), render: (c) => <span className="text-sm capitalize text-slate-600">{c.gender ?? "-"}</span> },
    { header: t("common.dateOfBirth"), render: (c) => <span className="text-sm text-slate-600">{c.dateOfBirth ? new Date(c.dateOfBirth).toLocaleDateString("vi-VN") : "-"}</span> },
  ], [t]);

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Users className="text-[#0068E0]" size={24} />
          <div>
            <h2 className="text-[15px] font-bold leading-tight text-slate-900">{t("booking.scheduleCustomerCenter")}</h2>
            <p className="text-sm text-slate-500">{t("booking.scheduleCustomerDesc")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("booking.searchCustomerPlaceholder")} className="w-full bg-transparent text-sm outline-none" />
        </div>
      </div>

      <div className="p-6 grid gap-6 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
        {/* Sidebar Schedule */}
        <div className="space-y-4 min-w-0 rounded-3xl border border-slate-100 bg-slate-50 p-5">
          <div className="rounded-3xl bg-white p-4 shadow-sm flex flex-col h-full">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t("booking.selectSchedule")}</h2>
            
            <div className="mt-3 flex gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <input value={scheduleSearch} onChange={(e) => setScheduleSearch(e.target.value)} placeholder={t("booking.searchSchedulePlaceholder")} className="w-full bg-transparent text-sm outline-none" />
                </div>
                <div className="relative">
                    <select value={upcomingOnly ? "upcoming" : "all"} onChange={(e) => setUpcomingOnly(e.target.value === "upcoming")} className="h-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none cursor-pointer hover:border-slate-300">
                        <option value="upcoming">{t("tour.upcomingOnly")}</option>
                        <option value="all">{t("tour.showAll")}</option>
                    </select>
                </div>
            </div>

            <div className="mt-4 space-y-3 flex-1 overflow-y-auto">
              {isScheduleLoading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)
              ) : schedules.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-500">{t("booking.noSchedulesAssigned")}</div>
              ) : (
                schedules.map((s) => (
                  <button key={s.scheduleId} onClick={() => setSelectedScheduleId(s.scheduleId)} className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedScheduleId === s.scheduleId ? "border-[#0068E0] bg-blue-50/30" : "border-slate-100 bg-slate-50"}`}>
                    <div className="text-sm font-semibold truncate">{s.tourName}</div>
                    <p className="text-xs text-slate-500 mt-1">{new Date(s.departureDate).toLocaleDateString("vi-VN")} - {new Date(s.returnDate).toLocaleDateString("vi-VN")}</p>
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <ActionButton variant="secondary" onClick={() => setSchedulePage(p => Math.max(1, p - 1))} disabled={schedulePage === 1} className="p-2"><ChevronLeft size={16}/></ActionButton>
              <span className="text-xs font-semibold text-slate-600">{schedulePage} / {totalPages}</span>
              <ActionButton variant="secondary" onClick={() => setSchedulePage(p => Math.min(totalPages, p + 1))} disabled={schedulePage >= totalPages} className="p-2"><ChevronRight size={16}/></ActionButton>
            </div>
          </div>
        </div>

        {/* Customer Table */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">{t("booking.tourCustomers")}</p>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                {t("booking.totalPassengers", { count: scheduleCustomers.length })}
            </div>
          </div>
          <Table data={filteredCustomers} columns={columns} isLoading={isCustomersLoading} />
        </div>
      </div>
    </div>
  );
};