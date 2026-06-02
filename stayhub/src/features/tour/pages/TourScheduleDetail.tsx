import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Hash,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { ConfirmDialog } from "../../../components/dashboard/ConfirmDialog";
import { useToast } from "../../../contexts/ToastContext";
import { getApiErrorMessage } from "../../content/utils/apiError";
import { ticketTypeService } from "../../content/services/ticketType.service";
import type { ReadTicketTypeDTO } from "../../content/types/ticketType";
import { tourismInformationService } from "../../content/services/tourismInformation.service";
import type { TourismInformation } from "../../content/types/tourismInformation";
import { PATH } from "../../../config/routes/route";
import { useGroupedItineraries } from "../hooks/useGroupedItineraries";
import { useTourSchedule } from "../hooks/useTourSchedule";
import { getScheduleItinerariesBySchedule } from "../services/tourScheduleItinerary.service";
import { tourScheduleTicketService } from "../services/tourScheduleTicket.service";
import type { TourScheduleItinerary } from "../types/tourScheduleItinerary";
import type { TourScheduleTicket } from "../types/tourScheduleTicket";
import { TourScheduleStaffManagement } from "../components/TourScheduleStaffManagement";
import {
  formatTicketCurrency,
  getScheduleTicketAvailable,
  getScheduleTicketCapacity,
  getScheduleTicketName,
  getScheduleTicketTypeId,
} from "../utils/tourScheduleTicket";

export const TourScheduleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const {
    currentSchedule: schedule,
    isLoading,
    error,
    fetchScheduleById,
    deleteSchedule,
  } = useTourSchedule();

  const [tickets, setTickets] = React.useState<TourScheduleTicket[]>([]);
  const [scheduleItineraries, setScheduleItineraries] = React.useState<TourScheduleItinerary[]>([]);
  const [ticketTypeDetails, setTicketTypeDetails] = React.useState<
    Record<number, ReadTicketTypeDTO>
  >({});
  const [tourismInformationById, setTourismInformationById] = React.useState<
    Record<number, TourismInformation>
  >({});
  const [isTicketsLoading, setIsTicketsLoading] = React.useState(false);
  const [isItinerariesLoading, setIsItinerariesLoading] = React.useState(false);
  const [updatingTicketId, setUpdatingTicketId] = React.useState<number | null>(null);
  const [confirmAction, setConfirmAction] = React.useState<
    | { type: "deleteSchedule" }
    | { type: "activateTicket" | "deactivateTicket"; ticket: TourScheduleTicket }
    | null
  >(null);

  const renderedItineraries = React.useMemo(
    () =>
      scheduleItineraries.length > 0
        ? scheduleItineraries
        : schedule?.tourScheduleItineraries ?? [],
    [scheduleItineraries, schedule?.tourScheduleItineraries],
  );

  const { expandedItiIds, toggleIti, groupedItineraries } =
    useGroupedItineraries(renderedItineraries);

  const fetchItineraries = React.useCallback(
    async (scheduleId: number | string) => {
      setIsItinerariesLoading(true);
      try {
        const data = await getScheduleItinerariesBySchedule(scheduleId);
        setScheduleItineraries(data);
      } catch (err: unknown) {
        setScheduleItineraries([]);
        showError(getApiErrorMessage(err, "Failed to load schedule itineraries."));
      } finally {
        setIsItinerariesLoading(false);
      }
    },
    [showError],
  );

  const fetchTickets = React.useCallback(
    async (scheduleId: number | string) => {
      setIsTicketsLoading(true);
      try {
        const data = await tourScheduleTicketService.getBySchedule(scheduleId);
        setTickets(data);

        const ticketTypeIds = Array.from(
          new Set(
            data
              .map(getScheduleTicketTypeId)
              .filter((ticketTypeId): ticketTypeId is number => ticketTypeId !== null),
          ),
        );

        const details = await Promise.all(
          ticketTypeIds.map(async (ticketTypeId) => {
            try {
              const ticketType = await ticketTypeService.getById(ticketTypeId);
              return [ticketTypeId, ticketType] as const;
            } catch {
              return null;
            }
          }),
        );

        setTicketTypeDetails(
          Object.fromEntries(details.filter((detail): detail is readonly [number, ReadTicketTypeDTO] => detail !== null)),
        );
      } catch (err: unknown) {
        setTickets([]);
        setTicketTypeDetails({});
        showError(getApiErrorMessage(err, "Failed to load schedule tickets."));
      } finally {
        setIsTicketsLoading(false);
      }
    },
    [showError],
  );

  React.useEffect(() => {
    if (!id) return;

    void Promise.resolve().then(() => {
      fetchScheduleById(id);
      fetchTickets(id);
      fetchItineraries(id);
    });
  }, [id, fetchScheduleById, fetchTickets, fetchItineraries]);

  React.useEffect(() => {
    const tourismInfoIds = Array.from(
      new Set(
        renderedItineraries
          .map((item) => item.tourismInfoId)
          .filter(
            (tourismInfoId): tourismInfoId is number =>
              typeof tourismInfoId === "number" && Number.isFinite(tourismInfoId),
          ),
      ),
    );

    if (tourismInfoIds.length === 0) {
      setTourismInformationById({});
      return;
    }

    let isMounted = true;

    tourismInformationService.getActiveList().then((activeTourismInformation) => {
      if (!isMounted) return;

      const neededIds = new Set(tourismInfoIds);
      setTourismInformationById(
        Object.fromEntries(
          activeTourismInformation
            .filter((item) => neededIds.has(item.id))
            .map((item) => [item.id, item] as const),
        ),
      );
    });

    return () => {
      isMounted = false;
    };
  }, [renderedItineraries]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Loading schedule details...
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="flex h-64 items-center justify-center font-semibold text-rose-500">
        {error || "Schedule not found."}
      </div>
    );
  }

  const itineraryDayNumbers =
    renderedItineraries
      ?.map((item) => Number(item.dayNumber))
      .sort((a, b) => a - b) ?? [];
  const missingItineraryDays = [] as number[];
  const maxDay = itineraryDayNumbers.length ? Math.max(...itineraryDayNumbers) : 0;
  for (let i = 1; i <= maxDay; i += 1) {
    if (!itineraryDayNumbers.includes(i)) missingItineraryDays.push(i);
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    if (confirmAction.type === "deleteSchedule") {
      try {
        await deleteSchedule(schedule.id);
        navigate(-1);
      } catch {
        // Toast is handled by the hook.
      } finally {
        setConfirmAction(null);
      }
      return;
    }

    const ticket = confirmAction.ticket;
    const shouldDeactivate = confirmAction.type === "deactivateTicket";

    try {
      setUpdatingTicketId(ticket.id);
      setConfirmAction(null);
      if (shouldDeactivate) {
        await tourScheduleTicketService.deactivate(ticket.id);
      } else {
        await tourScheduleTicketService.activate(ticket.id);
      }

      await fetchTickets(schedule.id);
    } catch (err: unknown) {
      showError(
        getApiErrorMessage(
          err,
          shouldDeactivate
            ? "Failed to deactivate schedule ticket."
            : "Failed to activate schedule ticket.",
        ),
      );
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const confirmTitle =
    confirmAction?.type === "deleteSchedule"
      ? "Delete Schedule"
      : confirmAction?.type === "deactivateTicket"
        ? "Deactivate Ticket"
        : "Activate Ticket";

  const confirmMessage =
    confirmAction?.type === "deleteSchedule"
      ? "Are you sure you want to delete this schedule?"
      : confirmAction?.type === "deactivateTicket"
        ? "Customers will no longer see or book this ticket type."
        : "Customers will be able to see and book this ticket type.";

  const confirmButtonText =
    confirmAction?.type === "deleteSchedule"
      ? "Delete"
      : confirmAction?.type === "deactivateTicket"
        ? "Deactivate"
        : "Activate";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Schedules
      </button>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative flex h-32 w-full items-center justify-center bg-gradient-to-r from-blue-500 to-blue-700 sm:h-40">
          <Calendar className="h-16 w-16 text-white opacity-20" />
          <div className="absolute right-4 top-4">
            <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-md">
              Schedule Detail
            </span>
          </div>
        </div>

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
                  <span className="font-bold text-brand">
                    {schedule.tour?.name || `ID: ${schedule.tourId}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-start gap-3">
              <ActionButton
                variant="primary"
                onClick={() => navigate(PATH.MANAGER.SCHEDULE_ORDERS(schedule.id))}
                className="gap-2 px-4 py-2 text-sm"
              >
                <Ticket className="h-4 w-4" />
                View Orders
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => navigate(PATH.STAFF.SCHEDULE_CUSTOMERS(schedule.id))}
                className="gap-2 px-4 py-2 text-sm"
              >
                <Users className="h-4 w-4" />
                View Customers
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => navigate(PATH.STAFF.TRACK_SCHEDULE_LOCATIONS(schedule.id))}
                className="gap-2 px-4 py-2 text-sm"
              >
                <MapPin className="h-4 w-4" />
                Live Tour Map
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => navigate(PATH.MANAGER.EDIT_SCHEDULE(schedule.id))}
                className="gap-2 px-4 py-2 text-sm"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </ActionButton>
              <ActionButton
                type="button"
                variant="warning"
                onClick={() => setConfirmAction({ type: "deleteSchedule" })}
                className="gap-2 px-4 py-2 text-sm"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </ActionButton>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Calendar className="h-4 w-4 text-emerald-500" />
                Departure Date
              </div>
              <div className="text-base font-bold text-slate-900">
                {schedule.departureDate
                  ? new Date(schedule.departureDate).toLocaleDateString("vi-VN")
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
                  ? new Date(schedule.returnDate).toLocaleDateString("vi-VN")
                  : "N/A"}
              </div>
            </div>
          </div>

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

          <div className="mt-8 border-t border-slate-100 pt-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Schedule Tickets</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {tickets.length > 0
                    ? `${tickets.length} ticket ${tickets.length === 1 ? "type" : "types"} configured`
                    : "No ticket setup for this schedule."}
                </p>
              </div>
              <ActionButton
                variant="primary"
                onClick={() => navigate(PATH.MANAGER.CREATE_SCHEDULE_TICKET(schedule.id))}
                className="gap-2 px-4 py-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Ticket
              </ActionButton>
            </div>

            {isTicketsLoading ? (
              <div className="flex justify-center rounded-2xl border border-slate-100 bg-slate-50 p-8 text-sm text-slate-500">
                Loading schedule tickets...
              </div>
            ) : tickets.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[760px] border-collapse bg-white">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Ticket Name
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Price
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Quantity
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => {
                      const ticketTypeId = getScheduleTicketTypeId(ticket);
                      const ticketType = ticketTypeId ? ticketTypeDetails[ticketTypeId] : undefined;
                      const quantity = getScheduleTicketCapacity(ticket) ?? 0;
                      const soldQuantity = ticket.soldQuantity ?? 0;
                      const availableQuantity = getScheduleTicketAvailable(ticket) ?? 0;
                      const isActive = ticket.isActive ?? true;

                      return (
                        <tr
                          key={ticket.id}
                          className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                                <Ticket className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-800">
                                  {getScheduleTicketName(ticket, ticketType)}
                                </span>
                                {ticket.note && (
                                  <p className="mt-0.5 max-w-xs truncate text-xs font-medium text-slate-400">
                                    {ticket.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2 font-semibold text-emerald-600">
                              <Banknote className="h-4 w-4" />
                              {formatTicketCurrency(ticket.price)}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-sm font-semibold text-slate-800">
                              {quantity}
                            </div>
                            <div className="mt-0.5 text-xs font-medium text-slate-400">
                              {soldQuantity} sold / {availableQuantity} left
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                isActive
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <ActionButton
                                variant="secondary"
                                onClick={() =>
                                  navigate(
                                    PATH.MANAGER.EDIT_SCHEDULE_TICKET(
                                      schedule.id,
                                      ticket.id,
                                    ),
                                  )
                                }
                                className="h-8 w-8"
                                title="Edit ticket"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </ActionButton>
                              <ActionButton
                                variant={isActive ? "warning" : "secondary"}
                                onClick={() =>
                                  setConfirmAction({
                                    type: isActive ? "deactivateTicket" : "activateTicket",
                                    ticket,
                                  })
                                }
                                disabled={updatingTicketId === ticket.id}
                                className={`h-8 w-8 ${
                                  !isActive
                                    ? "text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                    : ""
                                }`}
                                title={isActive ? "Deactivate ticket" : "Activate ticket"}
                              >
                                {isActive ? (
                                  <PowerOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Power className="h-3.5 w-3.5" />
                                )}
                              </ActionButton>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
                <Ticket className="mb-3 h-10 w-10 text-slate-400" />
                <h3 className="mb-1 text-sm font-bold text-slate-900">
                  No tickets configured
                </h3>
                <p className="mb-4 text-xs text-slate-500">
                  Add ticket types, prices, and quantities for this schedule.
                </p>
                <ActionButton
                  variant="primary"
                  onClick={() => navigate(PATH.MANAGER.CREATE_SCHEDULE_TICKET(schedule.id))}
                  className="gap-2 px-4 py-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Ticket
                </ActionButton>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-900">
                  Schedule Itinerary
                </h2>
                <ActionButton
                  variant="primary"
                  onClick={() => navigate(PATH.MANAGER.CREATE_SCHEDULE_ITINERARY(schedule.id))}
                  className="gap-2 px-4 py-2 text-sm"
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

            {isItinerariesLoading ? (
              <div className="flex justify-center rounded-2xl border border-slate-100 bg-slate-50 p-8 text-sm text-slate-500">
                Loading schedule itinerary...
              </div>
            ) : renderedItineraries.length > 0 ? (
              <div className="flex flex-col gap-6">
                {Object.entries(groupedItineraries)
                  .map(([dayStr]) => Number(dayStr))
                  .sort((a, b) => a - b)
                  .map((dayNumber) => {
                    const itemsForDay = groupedItineraries[dayNumber];
                    const dayDate = itemsForDay[0]?.itineraryDate;

                    return (
                      <div
                        key={dayNumber}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">
                              Day {dayNumber}
                            </h3>
                            {dayDate && (
                              <p className="mt-0.5 text-xs font-medium text-slate-400">
                                {new Date(dayDate).toLocaleDateString("vi-VN")}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col divide-y divide-slate-100">
                          {itemsForDay.map((iti) => {
                            const isExpanded = expandedItiIds.includes(iti.id);
                            const timeStr =
                              iti.startDuration && iti.endDuration
                                ? `${iti.startDuration.substring(0, 5)} - ${iti.endDuration.substring(0, 5)}`
                                : iti.startDuration
                                  ? iti.startDuration.substring(0, 5)
                                  : "Any time";
                            const tourismInfo = iti.tourismInfoId
                              ? tourismInformationById[iti.tourismInfoId]
                              : null;

                            return (
                              <div key={iti.id} className="flex flex-col">
                                <div
                                  className="flex cursor-pointer items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50/60"
                                  onClick={() => toggleIti(iti.id)}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="flex min-w-[110px] items-center justify-center rounded-lg bg-brand-light px-3 py-1.5 text-xs font-bold text-brand">
                                      <Clock className="mr-1.5 h-3.5 w-3.5" />
                                      {timeStr}
                                    </div>
                                    <h4 className="text-sm font-semibold text-slate-800">
                                      {iti.title || "Untitled itinerary"}
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div
                                      className="flex gap-2"
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      <ActionButton
                                        variant="secondary"
                                        onClick={() =>
                                          navigate(
                                            PATH.MANAGER.EDIT_SCHEDULE_ITINERARY(
                                              schedule.id,
                                              iti.id,
                                            ),
                                          )
                                        }
                                        className="h-8 w-8 text-brand hover:bg-brand-light"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </ActionButton>
                                      <ActionButton
                                        variant="warning"
                                        onClick={() =>
                                          navigate(
                                            PATH.MANAGER.DELETE_SCHEDULE_ITINERARY(
                                              schedule.id,
                                              iti.id,
                                            ),
                                          )
                                        }
                                        className="h-8 w-8"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </ActionButton>
                                    </div>
                                    <div className="text-slate-400">
                                      {isExpanded ? (
                                        <ChevronUp className="h-5 w-5" />
                                      ) : (
                                        <ChevronDown className="h-5 w-5" />
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="border-t border-slate-50 bg-slate-50/40 px-5 pb-5 pt-2 sm:pl-[150px]">
                                    {iti.description && (
                                      <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                                        {iti.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                      <MapPin className="h-4 w-4 text-brand" />
                                      <span>{iti.locationName || "No location specification"}</span>
                                    </div>
                                    {iti.tourismInfoId && (
                                      <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-white text-sm text-slate-600">
                                        {tourismInfo ? (
                                          <div className="grid sm:grid-cols-[180px_1fr]">
                                            <div className="flex min-h-36 items-center justify-center bg-slate-100">
                                              {tourismInfo.imageUrl ? (
                                                <img
                                                  src={tourismInfo.imageUrl}
                                                  alt={tourismInfo.name}
                                                  className="h-full min-h-36 w-full object-cover"
                                                />
                                              ) : (
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                  <ImageIcon className="h-8 w-8" />
                                                  <span className="text-xs font-medium">No image</span>
                                                </div>
                                              )}
                                            </div>

                                            <div className="space-y-2 p-4">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <h5 className="font-bold text-slate-900">{tourismInfo.name}</h5>
                                                <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-bold text-brand">
                                                  {tourismInfo.type}
                                                </span>
                                              </div>
                                              {tourismInfo.description && (
                                                <p className="text-xs leading-relaxed text-slate-500">
                                                  {tourismInfo.description}
                                                </p>
                                              )}
                                              <div className="flex items-start gap-2 text-xs font-medium text-slate-600">
                                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                                                <span>
                                                  {[tourismInfo.address, tourismInfo.city, tourismInfo.country]
                                                    .filter(Boolean)
                                                    .join(", ") || "N/A"}
                                                </span>
                                              </div>
                                              {(tourismInfo.latitude || tourismInfo.longitude) && (
                                                <div className="text-xs font-medium text-slate-400">
                                                  Lat/Lng: {tourismInfo.latitude ?? "N/A"}, {tourismInfo.longitude ?? "N/A"}
                                                </div>
                                              )}
                                              {tourismInfo.sourceUrl && (
                                                <a
                                                  href={tourismInfo.sourceUrl}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-hover"
                                                >
                                                  {tourismInfo.sourceName || "Source"}
                                                  <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2 p-3 font-semibold text-slate-800">
                                            <MapPin className="h-4 w-4 text-brand" />
                                            Tourism info ID #{iti.tourismInfoId}
                                          </div>
                                        )}
                                      </div>
                                    )}
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

      {/* SECTION: Quản lý Nhân sự */}
      <div className="mt-8">
        <TourScheduleStaffManagement scheduleId={Number(id)} />
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={confirmButtonText}
        variant={confirmAction?.type === "activateTicket" ? "primary" : "warning"}
        icon={
          confirmAction?.type === "activateTicket" ? (
            <Power className="h-6 w-6 text-brand" />
          ) : confirmAction?.type === "deactivateTicket" ? (
            <PowerOff className="h-6 w-6 text-rose-500" />
          ) : (
            <Trash2 className="h-6 w-6 text-rose-500" />
          )
        }
      />
    </div>
  );
};
