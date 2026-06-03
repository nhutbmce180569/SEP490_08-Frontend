import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Ticket, ShieldCheck } from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { tourScheduleService } from "../../tour/services/tourSchedule.service";
import { ticketService } from "../services/ticket.service";
import type { AssignedTourSchedule } from "../../tour/types/tourSchedule";
import type { ReadTicketDTO } from "../types/ticket";
import { useToast } from "../../../contexts/ToastContext";
import { useTranslation } from "../../../contexts/LocaleContext";

const STATUS_STYLES: Record<string, string> = {
  Checked: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Cancelled: "bg-rose-100 text-rose-700",
};

const getStatusStyle = (status?: string | null) =>
  STATUS_STYLES[status ?? ""] ?? "bg-slate-100 text-slate-600";

export const StaffTicketListPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [scheduleSearch, setScheduleSearch] = useState(""); // State mới cho tìm kiếm schedule
  const { error: showError } = useToast();

  const { data: schedules = [], isLoading: schedulesLoading, error: schedulesError } = useQuery<AssignedTourSchedule[]>({
    queryKey: ["assignedSchedules"],
    queryFn: tourScheduleService.getAssignedSchedules,
    staleTime: 1000 * 60,
  });

  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets,
  } = useQuery<ReadTicketDTO[]>({
    queryKey: ["scheduleTickets", selectedScheduleId],
    queryFn: async () => {
      if (selectedScheduleId == null) return [];
      return await ticketService.getByScheduleId(selectedScheduleId);
    },
    enabled: selectedScheduleId != null,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (selectedScheduleId == null && schedules.length > 0) {
      setSelectedScheduleId(schedules[0].scheduleId);
    }
  }, [schedules, selectedScheduleId]);

  useEffect(() => {
    if (schedulesError) {
      showError(
        typeof schedulesError === "string"
          ? schedulesError
          : (schedulesError as Error).message || t("booking.unableLoadAssignedSchedules"),
      );
    }
  }, [schedulesError, showError, t]);

  useEffect(() => {
    if (ticketsError) {
      showError(
        typeof ticketsError === "string"
          ? ticketsError
          : (ticketsError as Error).message || t("booking.unableLoadTickets"),
      );
    }
  }, [ticketsError, showError, t]);

  const selectedSchedule = useMemo(
    () => schedules.find((item) => item.scheduleId === selectedScheduleId) ?? null,
    [schedules, selectedScheduleId],
  );

  // Lọc Schedule dựa trên scheduleSearch
  const filteredSchedules = useMemo(() => {
    if (!scheduleSearch.trim()) return schedules;
    const keyword = scheduleSearch.trim().toLowerCase();
    return schedules.filter((schedule) => {
      return (
        schedule.tourName?.toLowerCase().includes(keyword) ||
        schedule.scheduleId.toString().includes(keyword)
      );
    });
  }, [schedules, scheduleSearch]);

  const filteredTickets = useMemo(() => {
    if (!search.trim()) return tickets;
    const keyword = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      return (
        ticket.attendeeName.toLowerCase().includes(keyword) ||
        ticket.idCard.toLowerCase().includes(keyword) ||
        ticket.checkInStatus?.toLowerCase().includes(keyword) ||
        ticket.id.toString().includes(keyword) ||
        ticket.orderId.toString().includes(keyword)
      );
    });
  }, [tickets, search]);

  const columns: Column<ReadTicketDTO>[] = useMemo(
    () => [
      {
        header: t("booking.ticketIdCol"),
        accessor: "id",
        className: "w-[90px]",
      },
      {
        header: t("booking.attendee"),
        render: (ticket) => (
          <div className="min-w-[200px]">
            <div className="font-semibold text-slate-900">{ticket.attendeeName}</div>
            <div className="text-xs text-slate-500">{t("booking.orderNumberShort", { id: ticket.orderId })}</div>
          </div>
        ),
      },
      {
        header: t("booking.checkInStatus"),
        render: (ticket) => (
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(ticket.checkInStatus)}`}>
            {ticket.checkInStatus || t("common.pending")}
          </span>
        ),
        className: "w-[170px]",
      },
      {
        header: t("booking.ticketTypeCol"),
        accessor: "ticketTypeId",
        className: "text-sm",
      },
      {
        header: t("booking.nationalityCol"),
        accessor: "nationality",
      },
    ],
    [t],
  );

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Ticket className="text-[#0068E0]" size={24} />
          <div>
            <h2 className="text-[15px] font-bold leading-tight text-slate-900">
              {t("booking.ticketManagement")}
            </h2>
            <p className="text-sm text-slate-500">{t("booking.ticketManagementDesc")}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors sm:w-72">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("booking.searchAttendeePlaceholder")}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
          <ActionButton
            variant="primary"
            onClick={() => refetchTickets()}
            className="gap-2 px-4 py-2 text-sm"
          >
            {t("common.refresh")}
          </ActionButton>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
          <div className="space-y-4 min-w-0 rounded-3xl border border-slate-100 bg-slate-50 p-5">
            <div className="rounded-3xl bg-white p-4 shadow-sm flex flex-col h-full">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {t("booking.selectSchedule")}
              </h2>

              {/* Thanh tìm kiếm Schedule */}
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-brand focus-within:bg-white transition-colors">
                <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <input
                  value={scheduleSearch}
                  onChange={(e) => setScheduleSearch(e.target.value)}
                  placeholder={t("booking.searchSchedulePlaceholder")}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Danh sách Schedule có thể scroll */}
              <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                {schedulesLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                  </div>
                ) : filteredSchedules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-500 text-sm text-center">
                    {scheduleSearch.trim() ? t("booking.noSchedulesFound") || "No schedules found." : t("booking.noSchedulesAssigned")}
                  </div>
                ) : (
                  filteredSchedules.map((schedule) => (
                    <button
                      key={schedule.scheduleId}
                      type="button"
                      onClick={() => setSelectedScheduleId(schedule.scheduleId)}
                      className={`w-full rounded-2xl border px-4 py-3.5 text-left transition ${
                        selectedScheduleId === schedule.scheduleId
                          ? "border-[#0068E0] bg-blue-50/30 shadow-sm"
                          : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {schedule.tourName || `Schedule #${schedule.scheduleId}`}
                          </div>
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {new Date(schedule.departureDate).toLocaleDateString("vi-VN")} - {new Date(schedule.returnDate).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                        <span className="shrink-0 inline-flex rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 shadow-sm">
                          #{schedule.scheduleId}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 min-w-0">
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm min-w-0">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t("booking.ticketListTitle")}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedSchedule
                      ? t("booking.showingTicketsFor", { id: selectedSchedule.scheduleId })
                      : t("booking.selectScheduleToView")}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  {t("booking.checkedCount", {
                    count: tickets.filter((ticket) => ticket.checkInStatus === "Checked").length,
                  })}
                </div>
              </div>
              <div className="overflow-x-auto min-w-0">
                <Table
                  data={filteredTickets}
                  columns={columns}
                  isLoading={ticketsLoading}
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
      </div>
    </div>
  );
};