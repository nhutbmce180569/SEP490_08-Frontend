import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Ticket,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
} from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { ticketService } from "../services/ticket.service";
import type { ReadTicketDTO } from "../types/ticket";
import { useToast } from "../../../contexts/ToastContext";
import { useTranslation } from "../../../contexts/LocaleContext";
import { tourScheduleStaffService } from "../../tour/services/tourScheduleStaffService.service";

const STATUS_STYLES: Record<string, string> = {
  CheckedIn: "bg-emerald-100 text-emerald-700",
  Checked: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Cancelled: "bg-rose-100 text-rose-700",
};

const getStatusStyle = (status?: string | null) =>
  STATUS_STYLES[status ?? ""] ?? "bg-slate-100 text-slate-600";

export const StaffTicketListPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);

  // 💥 State Server-side cho Schedule
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [debouncedScheduleSearch, setDebouncedScheduleSearch] = useState("");
  const [schedulePage, setSchedulePage] = useState(1);
  const [upcomingOnly, setUpcomingOnly] = useState(true);

  // 💥 State Server-side cho Ticket
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [checkInStatus, setCheckInStatus] = useState("all");

  const { error: showError } = useToast();

  // Debounce cho Schedule Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedScheduleSearch(scheduleSearch);
      setSchedulePage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [scheduleSearch]);

  // 💥 Debounce cho Ticket Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Schedules
  const {
    data: schedulesResponse,
    isLoading: schedulesLoading,
    error: schedulesError,
  } = useQuery({
    queryKey: [
      "assignedSchedules",
      schedulePage,
      upcomingOnly,
      debouncedScheduleSearch,
    ],
    queryFn: () =>
      tourScheduleStaffService.getAssignedSchedules(
        schedulePage,
        5,
        upcomingOnly,
        debouncedScheduleSearch,
      ),
    staleTime: 1000 * 60,
  });

  const schedules = useMemo(
    () => schedulesResponse?.data || [],
    [schedulesResponse],
  );
  const totalPages = schedulesResponse?.totalPages || 1;

  // 💥 Fetch Tickets (Đã tích hợp Tham số Search & Filter)
  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets,
  } = useQuery<ReadTicketDTO[]>({
    queryKey: ["scheduleTickets", selectedScheduleId, debouncedSearch, checkInStatus],
    queryFn: async () => {
      if (selectedScheduleId == null) return [];
      return await ticketService.getByScheduleId(
        selectedScheduleId,
        debouncedSearch,
        checkInStatus
      );
    },
    enabled: selectedScheduleId != null,
    staleTime: 1000 * 30,
  });

  // Tự động select Schedule đầu tiên
  useEffect(() => {
    if (selectedScheduleId == null && schedules.length > 0) {
      setSelectedScheduleId(schedules[0].scheduleId);
    }
  }, [schedules, selectedScheduleId]);

  useEffect(() => {
    if (schedulesError)
      showError((schedulesError as Error).message || t("booking.unableLoadAssignedSchedules"));
  }, [schedulesError, showError, t]);

  useEffect(() => {
    if (ticketsError)
      showError((ticketsError as Error).message || t("booking.unableLoadTickets"));
  }, [ticketsError, showError, t]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const selectedSchedule = useMemo(
    () => schedules.find((item) => item.scheduleId === selectedScheduleId) ?? null,
    [schedules, selectedScheduleId],
  );

  const columns: Column<ReadTicketDTO>[] = useMemo(
    () => [
      {
        header: t("booking.ticketIdCol"),
        accessor: "id",
        className: "w-[90px] whitespace-nowrap",
      },
      {
        header: t("booking.attendee"),
        render: (ticket) => (
          <div className="min-w-[150px]">
            <div className="font-semibold text-slate-900">
              {ticket.attendeeName}
            </div>
            <div className="text-xs text-slate-500">
              {ticket.orderId
                ? t("booking.orderNumberShort", { id: ticket.orderId })
                : t("booking.orderDetailNumberShort", {
                  id: ticket.orderDetailId,
                })}
            </div>
          </div>
        ),
        className: "w-[200px]",
      },
      {
        header: t("booking.checkInStatus"),
        render: (ticket) => (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(ticket.checkInStatus)}`}
          >
            {ticket.checkInStatus || t("common.pending")}
          </span>
        ),
        className: "w-[120px] whitespace-nowrap",
      },
      {
        header: t("booking.ticketTypeCol"),
        accessor: "ticketTypeName",
        className: "text-sm whitespace-nowrap max-w-[150px] truncate",
        render: (ticket) => (
          <span className="font-medium text-slate-700 truncate" title={ticket.ticketTypeName || `Type #${ticket.ticketTypeId}`}>
            {ticket.ticketTypeName || `Type #${ticket.ticketTypeId}`}
          </span>
        ),
      },
      { header: t("booking.nationalityCol"), accessor: "nationality" },
      {
        header: "QR Code",
        className: "w-[150px]",
        render: (ticket) => (
          <div className="flex items-center gap-1.5">
            <div
              className="font-mono text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded max-w-[90px] truncate"
              title={ticket.qrCode}
            >
              {ticket.qrCode || "-"}
            </div>
            {ticket.qrCode && (
              <button
                onClick={() => handleCopy(ticket.qrCode, ticket.id.toString())}
                className="text-slate-400 hover:text-[#0068E0] transition-colors p-1"
                title={t("booking.copyQrCode")}
              >
                {copiedId === ticket.id.toString() ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        ),
      },
    ],
    [t, copiedId],
  );

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
            {schedulesLoading ? (
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
                {selectedSchedule ? (selectedSchedule.tourName || `Schedule #${selectedSchedule.scheduleId}`) : t("booking.ticketListTitle")}
              </h2>
              {selectedSchedule && (
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-slate-500">
                    {new Date(selectedSchedule.departureDate).toLocaleDateString("vi-VN")} - {new Date(selectedSchedule.returnDate).toLocaleDateString("vi-VN")}
                  </span>
                  <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-200">
                    <ShieldCheck className="h-3 w-3" />
                    {t("booking.checkedCount", {
                      count: tickets.filter(
                        (ticket) =>
                          ticket.checkInStatus === "Checked" ||
                          ticket.checkInStatus === "CheckedIn",
                      ).length,
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition-colors focus-within:border-[#0068E0] focus-within:bg-white sm:w-56">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("booking.searchAttendeePlaceholder")}
                  className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="relative">
                <select
                  value={checkInStatus}
                  onChange={(e) => setCheckInStatus(e.target.value)}
                  className="h-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm font-bold text-slate-700 outline-none cursor-pointer hover:border-slate-300 hover:bg-white transition-colors"
                >
                  <option value="all">{t("common.allStatus") || "All Status"}</option>
                  <option value="CheckedIn">Checked In</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="overflow-hidden min-w-0 flex-1 flex flex-col rounded-b-3xl">
            <Table
              data={tickets}
              columns={columns}
              isLoading={ticketsLoading}
              wrapperClassName="overflow-auto flex-1 w-full"
              emptyMessage={
                selectedSchedule
                  ? t("booking.noTicketsForDeparture")
                  : t("booking.chooseScheduleToView")
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};