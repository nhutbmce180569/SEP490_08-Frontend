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
import { useTranslation } from "../../../contexts/LocaleContext";

export const TourScheduleDetail: React.FC = () => {
  const { t } = useTranslation();
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
        showError(getApiErrorMessage(err, t("tour.failedLoadScheduleItineraries")));
      } finally {
        setIsItinerariesLoading(false);
      }
    },
    [showError, t],
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
        showError(getApiErrorMessage(err, t("tour.failedLoadScheduleTickets")));
      } finally {
        setIsTicketsLoading(false);
      }
    },
    [showError, t],
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

    let isMounted = true;

    if (tourismInfoIds.length === 0) {
      void Promise.resolve().then(() => {
        if (isMounted) {
          setTourismInformationById({});
        }
      });

      return () => {
        isMounted = false;
      };
    }

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
        {t("tour.loadingScheduleDetails")}
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="flex h-64 items-center justify-center font-semibold text-rose-500">
        {error || t("tour.scheduleNotFound")}
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
            ? t("tour.failedDeactivateTicket")
            : t("tour.failedActivateTicket"),
        ),
      );
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const confirmTitle =
    confirmAction?.type === "deleteSchedule"
      ? t("tour.deleteScheduleTitle")
      : confirmAction?.type === "deactivateTicket"
        ? t("tour.deactivateTicket")
        : t("tour.activateTicket");

  const confirmTicket =
    confirmAction?.type === "activateTicket" ||
    confirmAction?.type === "deactivateTicket"
      ? confirmAction.ticket
      : null;
  const confirmTicketTypeId = confirmTicket
    ? getScheduleTicketTypeId(confirmTicket)
    : null;
  const confirmTicketName = confirmTicket
    ? getScheduleTicketName(
        confirmTicket,
        confirmTicketTypeId ? ticketTypeDetails[confirmTicketTypeId] : undefined,
      )
    : null;

  const confirmMessage =
    confirmAction?.type === "deleteSchedule" ? (
      t("tour.deleteScheduleQuestion")
    ) : (
      <span>
        {confirmAction?.type === "deactivateTicket"
          ? t("tour.deactivateTicketDesc")
          : t("tour.activateTicketDesc")}
        {confirmTicketName && (
          <span className="mt-2 block font-semibold text-slate-700">
            {confirmTicketName}
          </span>
        )}
      </span>
    );

  const confirmButtonText =
    confirmAction?.type === "deleteSchedule"
      ? t("tour.delete")
      : confirmAction?.type === "deactivateTicket"
        ? t("tour.deactivate")
        : t("tour.activate");

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("tour.backToSchedules")}
      </button>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative flex h-32 w-full items-center justify-center bg-gradient-to-r from-blue-500 to-blue-700 sm:h-40">
          <Calendar className="h-16 w-16 text-white opacity-20" />
          <div className="absolute right-4 top-4">
            <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-md">
              {t("tour.scheduleDetail")}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          {/* HEADER SECTION - Đã xóa 3 nút và căn thẳng hàng */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Schedule {schedule.id}
              </h1>
              <div className="mt-3 flex items-start sm:items-center gap-2 text-sm font-medium text-slate-600">
                <Hash className="h-4 w-4 shrink-0 text-slate-400 mt-0.5 sm:mt-0" />
                <span className="shrink-0 font-semibold text-slate-700">
                  {t("tour.tourNameLabel")}
                </span>
                <span className="font-bold text-brand">
                  {schedule.tour?.name || `ID: ${schedule.tourId}`}
                </span>
              </div>
            </div>

            {schedule.canEdit && (
              <div className="flex shrink-0 items-center gap-3">
                <ActionButton
                  variant="secondary"
                  onClick={() => navigate(PATH.MANAGER.EDIT_SCHEDULE(schedule.id))}
                  className="gap-2 px-4 py-2 text-sm"
                >
                  <Pencil className="h-4 w-4" />
                  {t("tour.edit")}
                </ActionButton>
                <ActionButton
                  type="button"
                  variant="warning"
                  onClick={() => setConfirmAction({ type: "deleteSchedule" })}
                  className="gap-2 px-4 py-2 text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("tour.delete")}
                </ActionButton>
              </div>
            )}
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Calendar className="h-4 w-4 text-emerald-500" />
                {t("tour.departureDate")}
              </div>
              <div className="text-base font-bold text-slate-900">
                {schedule.departureDate
                  ? new Date(schedule.departureDate).toLocaleDateString("vi-VN")
                  : t("common.na")}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Clock className="h-4 w-4 text-rose-500" />
                {t("tour.returnDate")}
              </div>
              <div className="text-base font-bold text-slate-900">
                {schedule.returnDate
                  ? new Date(schedule.returnDate).toLocaleDateString("vi-VN")
                  : t("common.na")}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="mb-3 text-base font-bold text-slate-900">{t("tour.scheduleNote")}</h2>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 leading-relaxed text-slate-700">
              {schedule.note ? (
                <p className="whitespace-pre-wrap text-sm text-slate-600">{schedule.note}</p>
              ) : (
                <p className="text-sm italic text-slate-400">
                  {t("tour.noScheduleNotes")}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">{t("tour.scheduleTickets")}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {tickets.length > 0
                    ? tickets.length === 1
                      ? t("tour.ticketTypesConfigured", { count: tickets.length })
                      : t("tour.ticketTypesConfiguredPlural", { count: tickets.length })
                    : t("tour.noTicketSetupSchedule")}
                </p>
              </div>
              {schedule.canEdit && (
                <ActionButton
                  variant="primary"
                  onClick={() => navigate(PATH.MANAGER.CREATE_SCHEDULE_TICKET(schedule.id))}
                  className="gap-2 px-4 py-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  {t("tour.addTicket")}
                </ActionButton>
              )}
            </div>

            {isTicketsLoading ? (
              <div className="flex justify-center rounded-2xl border border-slate-100 bg-slate-50 p-8 text-sm text-slate-500">
                {t("tour.loadingScheduleTickets")}
              </div>
            ) : tickets.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[760px] border-collapse bg-white">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {t("tour.ticketName")}
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {t("common.price")}
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {t("tour.quantity")}
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {t("common.status")}
                      </th>
                      {schedule.canEdit && (
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          {t("common.actions")}
                        </th>
                      )}
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
                              {t("tour.soldLeft", { sold: soldQuantity, left: availableQuantity })}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                isActive
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {isActive ? t("common.active") : t("common.inactive")}
                            </span>
                          </td>
                          {schedule.canEdit && (
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
                                  title={t("tour.editTicket")}
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
                                  title={isActive ? t("tour.deactivateTicketAction") : t("tour.activateTicketAction")}
                                >
                                  {isActive ? (
                                    <PowerOff className="h-3.5 w-3.5" />
                                  ) : (
                                    <Power className="h-3.5 w-3.5" />
                                  )}
                                </ActionButton>
                              </div>
                            </td>
                          )}
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
                  {t("tour.noTicketsConfigured")}
                </h3>
                <p className="mb-4 text-xs text-slate-500">
                  {t("tour.addTicketHint")}
                </p>
                {/* {schedule.canEdit && (
                  <ActionButton
                    variant="primary"
                    onClick={() => navigate(PATH.MANAGER.CREATE_SCHEDULE_TICKET(schedule.id))}
                    className="gap-2 px-4 py-2 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    {t("tour.addTicket")}
                  </ActionButton>
                )} */}
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-900">
                  {t("tour.scheduleItinerarySection")}
                </h2>
                {schedule.canEdit && (
                  <ActionButton
                    variant="primary"
                    onClick={() => navigate(PATH.MANAGER.CREATE_SCHEDULE_ITINERARY(schedule.id))}
                    className="gap-2 px-4 py-2 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    {t("tour.addItineraries")}
                  </ActionButton>
                )}
              </div>
              {missingItineraryDays.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold">{t("tour.missingItineraryDaysTitle")}</p>
                  <p>{t("tour.missingItineraryDaysMsg", { days: missingItineraryDays.join(", Day ") })}</p>
                </div>
              )}
            </div>

            {isItinerariesLoading ? (
              <div className="flex justify-center rounded-2xl border border-slate-100 bg-slate-50 p-8 text-sm text-slate-500">
                {t("tour.loadingScheduleItinerary")}
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
                                  : t("tour.anyTime");
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
                                      {iti.title || t("tour.untitledItinerary")}
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    {schedule.canEdit && (
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
                                    )}
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
                                      <span>{iti.locationName || t("tour.noLocationSpec")}</span>
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
                                                  <span className="text-xs font-medium">{t("tour.noImage")}</span>
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
                                                    .join(", ") || t("common.na")}
                                                </span>
                                              </div>
                                              {(tourismInfo.latitude || tourismInfo.longitude) && (
                                                <div className="text-xs font-medium text-slate-400">
                                                  {t("tour.latLng", {
                                                    lat: tourismInfo.latitude ?? t("common.na"),
                                                    lng: tourismInfo.longitude ?? t("common.na"),
                                                  })}
                                                </div>
                                              )}
                                              {tourismInfo.sourceUrl && (
                                                <a
                                                  href={tourismInfo.sourceUrl}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-hover"
                                                >
                                                  {tourismInfo.sourceName || t("tour.source")}
                                                  <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2 p-3 font-semibold text-slate-800">
                                            <MapPin className="h-4 w-4 text-brand" />
                                            {t("tour.tourismInfoId", { id: iti.tourismInfoId })}
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
                  {t("tour.noItineraryItemsYet")}
                </h3>
                <p className="mb-4 text-xs text-slate-500">
                  {t("tour.createScheduleItineraryHint")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION: Quản lý Nhân sự */}
      <div className="mt-8">
        <TourScheduleStaffManagement
          scheduleId={Number(id)}
          isReadOnly={!schedule.canEdit}
        />
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
