import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Ticket, ShieldCheck, Users, ArrowRight } from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { tourScheduleService } from "../../tour/services/tourSchedule.service";
import { ticketService } from "../services/ticket.service";
import type { AssignedTourSchedule } from "../../tour/types/tourSchedule";
import type { ReadTicketDTO } from "../types/ticket";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import { Link } from "react-router-dom";

const STATUS_STYLES: Record<string, string> = {
  Checked: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Cancelled: "bg-rose-100 text-rose-700",
};

const getStatusStyle = (status?: string | null) =>
  STATUS_STYLES[status ?? ""] ?? "bg-slate-100 text-slate-600";

export const StaffTicketListPage: React.FC = () => {
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
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
          : (schedulesError as Error).message || "Unable to load assigned schedules.",
      );
    }
  }, [schedulesError, showError]);

  useEffect(() => {
    if (ticketsError) {
      showError(
        typeof ticketsError === "string"
          ? ticketsError
          : (ticketsError as Error).message || "Unable to load tickets for the selected schedule.",
      );
    }
  }, [ticketsError, showError]);

  const selectedSchedule = useMemo(
    () => schedules.find((item) => item.scheduleId === selectedScheduleId) ?? null,
    [schedules, selectedScheduleId],
  );

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
        header: "Ticket ID",
        accessor: "id",
        className: "w-[90px]",
      },
      {
        header: "Attendee",
        render: (ticket) => (
          <div className="min-w-[200px]">
            <div className="font-semibold text-slate-900">{ticket.attendeeName}</div>
            <div className="text-xs text-slate-500">Order #{ticket.orderId}</div>
          </div>
        ),
      },
      {
        header: "ID / Passport",
        accessor: "idCard",
        className: "w-[220px] text-sm",
      },
      {
        header: "Check-in Status",
        render: (ticket) => (
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(ticket.checkInStatus)}`}>
            {ticket.checkInStatus || "Pending"}
          </span>
        ),
        className: "w-[170px]",
      },
      {
        header: "Ticket Type",
        accessor: "ticketTypeId",
        className: "text-sm",
      },
      {
        header: "Nationality",
        accessor: "nationality",
      },
      {
        header: "Details",
        render: (ticket) => (
          <Link
            to={PATH.STAFF.TICKET_DETAIL(ticket.id)}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            View
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ),
        className: "w-[110px]",
      },
    ],
    [],
  );

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Ticket className="text-[#0068E0]" size={24} />
          <div>
            <h2 className="text-[15px] font-bold leading-tight text-slate-900">
              Ticket Management
            </h2>
            <p className="text-sm text-slate-500">
              Xem vé theo lịch trình và quản lý trạng thái check-in.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors sm:w-72">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search attendee, ID, status..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
          <ActionButton
            variant="primary"
            onClick={() => refetchTickets()}
            className="gap-2 px-4 py-2 text-sm"
          >
            Refresh
          </ActionButton>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
          <div className="space-y-4 min-w-0 rounded-3xl border border-slate-100 bg-slate-50 p-5">
            <div className="rounded-3xl bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Select Schedule
              </h2>
              <div className="mt-3 space-y-3">
                {schedulesLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="h-12 animate-pulse rounded-2xl bg-slate-200" />
                    ))}
                  </div>
                ) : schedules.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No schedules assigned yet. Please check back later.
                  </p>
                ) : (
                  schedules.map((schedule) => (
                    <button
                      key={schedule.scheduleId}
                      type="button"
                      onClick={() => setSelectedScheduleId(schedule.scheduleId)}
                      className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                        selectedScheduleId === schedule.scheduleId
                          ? "border-[#0068E0] bg-white shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {schedule.tourName || `Schedule #${schedule.scheduleId}`}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(schedule.departureDate).toLocaleDateString("vi-VN")} - {new Date(schedule.returnDate).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
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
                  <p className="text-sm font-semibold text-slate-900">Ticket List</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedSchedule
                      ? `Showing tickets for schedule #${selectedSchedule.scheduleId}`
                      : "Select a schedule to view tickets."}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  {tickets.filter((ticket) => ticket.checkInStatus === "Checked").length} Checked
                </div>
              </div>
              <div className="overflow-x-auto min-w-0">
                <Table
                  data={filteredTickets}
                  columns={columns}
                  isLoading={ticketsLoading}
                  emptyMessage={
                    selectedSchedule
                      ? "No tickets sold for this departure yet."
                      : "Choose a schedule to view tickets."
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
