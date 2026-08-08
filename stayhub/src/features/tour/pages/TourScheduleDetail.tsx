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
  Info,
  Globe,
  MapPin,
  Pencil,
  Plus,
  Lock,
  Unlock,
  Ticket,
  Trash2,
  Users,
  Route,
} from "lucide-react";
import Map, { Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
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
import { getScheduleItinerariesBySchedule, deleteScheduleItinerary } from "../services/tourScheduleItinerary.service";
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
import { DynamicText } from "../../../components/DynamicText";

export const TourScheduleDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const {
    currentSchedule: schedule,
    isLoading,
    error,
    fetchScheduleById,
    checkScheduleHasOrders,
  } = useTourSchedule();

  const [hasPaidOrders, setHasPaidOrders] = React.useState(false);
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
    | { type: "activateTicket" | "deactivateTicket"; ticket: TourScheduleTicket }
    | null
  >(null);
  const [selectedDay, setSelectedDay] = React.useState<number | null>(null);
  const [deletingItineraryId, setDeletingItineraryId] = React.useState<number | string | null>(null);
  const [isDeletingItinerary, setIsDeletingItinerary] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"itinerary" | "tickets" | "staff">("itinerary");
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  React.useEffect(() => {
    if (!id) return;

    void Promise.resolve().then(async () => {
      fetchScheduleById(id);
      fetchTickets(id);
      fetchItineraries(id);
      const hasOrders = await checkScheduleHasOrders(id);
      setHasPaidOrders(hasOrders);
    });
  }, [id, fetchScheduleById, fetchTickets, fetchItineraries, checkScheduleHasOrders]);

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

    const ticket = confirmAction.ticket;
    const shouldDeactivate = confirmAction.type === "deactivateTicket";

    try {
      setUpdatingTicketId(ticket.id);
      setConfirmAction(null);
      await tourScheduleTicketService.changeStatus(ticket.id);

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

  const handleDeleteItinerary = async () => {
    if (!deletingItineraryId || !schedule?.id) return;
    try {
      setIsDeletingItinerary(true);
      await deleteScheduleItinerary(deletingItineraryId);
      showSuccess(t("tour.deleteScheduleItinerarySuccess") || "Schedule itinerary deleted successfully!");
      await fetchItineraries(schedule.id);
      setDeletingItineraryId(null);
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, t("tour.failedDeleteScheduleItinerary") || "Failed to delete schedule itinerary."));
    } finally {
      setIsDeletingItinerary(false);
    }
  };

  const confirmTitle =
    confirmAction?.type === "deactivateTicket"
      ? t("tour.deactivateTicket")
      : t("tour.activateTicket");

  const confirmTicket = confirmAction?.ticket ?? null;
  const confirmTicketTypeId = confirmTicket
    ? getScheduleTicketTypeId(confirmTicket)
    : null;
  const confirmTicketName = confirmTicket
    ? getScheduleTicketName(
      confirmTicket,
      confirmTicketTypeId ? ticketTypeDetails[confirmTicketTypeId] : undefined,
    )
    : null;

  const confirmMessage = (
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

  const confirmButtonText = t("common.confirm");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative flex h-32 w-full items-center justify-center bg-gradient-to-r from-blue-500 to-blue-700 sm:h-40 overflow-hidden">
          {schedule.tour?.imageUrl ? (
            <>
              <img
                src={schedule.tour.imageUrl}
                alt={schedule.tour.name || "Tour"}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
            </>
          ) : (
            <Calendar className="h-16 w-16 text-white opacity-20" />
          )}

          {/* Nút Back */}
          <div className="absolute left-4 top-4">
            <button
              onClick={() => navigate(PATH.MANAGER.SCHEDULE_MANAGEMENT)}
              className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-md transition-colors hover:bg-white/30 z-10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("tour.backToSchedules")}
            </button>
          </div>

          <div className="absolute right-4 top-4">
            <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-md">
              {t("tour.scheduleDetail")}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          {/* HEADER SECTION */}
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
                  {schedule.tour?.name ? <DynamicText text={schedule.tour.name} /> : `ID: ${schedule.tourId}`}
                </span>
              </div>
            </div>


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
                <p className="whitespace-pre-wrap text-sm text-slate-600"><DynamicText text={schedule.note} /></p>
              ) : (
                <p className="text-sm italic text-slate-400">
                  {t("tour.noScheduleNotes")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex border-b border-slate-200 bg-slate-50">
          {([
            { key: "itinerary" as const, label: t("tour.scheduleItinerarySection"), icon: <Route className="h-4 w-4" /> },
            { key: "tickets" as const, label: t("tour.scheduleTickets"), icon: <Ticket className="h-4 w-4" /> },
            { key: "staff" as const, label: t("tour.staff") || "Staff", icon: <Users className="h-4 w-4" /> },
          ]).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all border-b-2 ${activeTab === key
                  ? "border-brand text-brand bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8">

          {/* ── TAB: ITINERARY ── */}
          {activeTab === "itinerary" && (
            <div>
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-bold text-slate-900">
                    {t("tour.scheduleItinerarySection")}
                  </h2>
                  {schedule.canEdit && (
                    <ActionButton
                      variant="primary"
                      onClick={() => {
                        if (hasPaidOrders) {
                          showError(t("tour.cannotAddItineraryHasOrders") || "Cannot add new itinerary items to a schedule that has paid orders.");
                          return;
                        }
                        navigate(PATH.MANAGER.CREATE_SCHEDULE_ITINERARY(schedule.id));
                      }}
                      disabled={hasPaidOrders}
                      title={hasPaidOrders ? (t("tour.cannotAddItineraryHasOrders") || "Cannot add new itinerary items to a schedule that has paid orders.") : ""}
                      className={`gap-2 px-4 py-2 text-sm ${hasPaidOrders ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Plus className="h-4 w-4" />
                      {t("tour.createItinerary")}
                    </ActionButton>
                  )}
                </div>
                {missingItineraryDays.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p className="font-semibold">{t("tour.missingItineraryDaysTitle")}</p>
                    <p>{t("tour.missingItineraryDaysMsg", { days: missingItineraryDays.join(`, ${t("tour.day")} `) })}</p>
                  </div>
                )}
              </div>

              {isItinerariesLoading ? (
                <div className="flex justify-center rounded-2xl border border-slate-100 bg-slate-50 p-8 text-sm text-slate-500">
                  {t("tour.loadingScheduleItinerary")}
                </div>
              ) : renderedItineraries.length > 0 ? (
                <div className="space-y-4">
                  {/* Day pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    {Object.entries(groupedItineraries)
                      .map(([dayStr]) => Number(dayStr))
                      .sort((a, b) => a - b)
                      .map((dayNumber) => {
                        const isMissing = missingItineraryDays.includes(dayNumber);
                        const isSelected = (selectedDay ?? Object.entries(groupedItineraries).map(([d]) => Number(d)).sort((a, b) => a - b)[0]) === dayNumber;
                        return (
                          <button
                            key={dayNumber}
                            onClick={() => setSelectedDay(dayNumber)}
                            className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${isSelected
                                ? "bg-brand text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                          >
                            <span className="capitalize">{t("tour.day")}</span> {dayNumber}
                            {isMissing && (
                              <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                            )}
                          </button>
                        );
                      })}
                  </div>

                  {(() => {
                    const sortedDays = Object.entries(groupedItineraries).map(([d]) => Number(d)).sort((a, b) => a - b);
                    const activeDayNumber = selectedDay ?? sortedDays[0];
                    const itemsForDay = groupedItineraries[activeDayNumber] ?? [];
                    const dayDate = itemsForDay[0]?.itineraryDate;

                    return (
                      <div
                        key={activeDayNumber}
                        className="mb-6"
                      >
                        <div className="flex items-center justify-between px-2 py-1">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">
                              Day {activeDayNumber}
                            </h3>
                            {dayDate && (
                              <p className="mt-0.5 text-xs font-medium text-slate-400">
                                {new Date(dayDate).toLocaleDateString("vi-VN")}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="relative ml-5 border-l-2 border-slate-100 pl-6 space-y-3 mt-4 mb-8">
                          {itemsForDay.map((iti, idx) => {
                            const isExpanded = expandedItiIds.includes(iti.id);
                            const timeStr = iti.startDuration && iti.endDuration
                              ? `${iti.startDuration.substring(0, 5)} - ${iti.endDuration.substring(0, 5)}`
                              : iti.startDuration ? iti.startDuration.substring(0, 5) : t("tour.anyTime");
                            const tourismInfo = iti.tourismInfoId ? tourismInformationById[iti.tourismInfoId] : null;

                            return (
                              <div key={iti.id} className="relative">
                                {/* Dot */}
                                <div className="absolute -left-[33px] top-[18px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-brand bg-white">
                                  <div className="h-1.5 w-1.5 rounded-full bg-brand" />
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all">
                                  <div
                                    className="flex cursor-pointer items-center justify-between px-4 py-3.5 transition-colors hover:bg-slate-50"
                                    onClick={() => toggleIti(iti.id)}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                                        {idx + 1}
                                      </span>
                                      <div className="flex flex-col min-w-0">
                                        <h4 className="truncate font-bold text-slate-800">{iti.title ? <DynamicText text={iti.title} /> : t("tour.untitledItinerary")}</h4>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                          <span className="flex items-center gap-0.5">
                                            <Clock className="h-3 w-3" />
                                            {timeStr}
                                          </span>
                                          <span className="text-slate-300">•</span>
                                          <span className="flex items-center gap-0.5">
                                            <MapPin className="h-3 w-3 text-emerald-500" />
                                            {iti.locationName ? <DynamicText text={iti.locationName} /> : t("tour.noLocationSpec")}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2 pl-4">
                                      {schedule.canEdit && (
                                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                          <ActionButton
                                            variant="secondary"
                                            onClick={() => navigate(PATH.MANAGER.EDIT_SCHEDULE_ITINERARY(schedule.id, iti.id))}
                                            className="h-7 w-7 text-brand hover:bg-brand-light"
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </ActionButton>
                                          <ActionButton
                                            variant="warning"
                                            onClick={() => {
                                              if (hasPaidOrders) {
                                                showError(t("tour.cannotDeleteItineraryHasOrders") || "Cannot delete itinerary items from a schedule that has paid orders.");
                                                return;
                                              }
                                              setDeletingItineraryId(iti.id);
                                            }}
                                            disabled={hasPaidOrders}
                                            title={hasPaidOrders ? (t("tour.cannotDeleteItineraryHasOrders") || "Cannot delete itinerary items from a schedule that has paid orders.") : ""}
                                            className={`h-7 w-7 ${hasPaidOrders ? "opacity-50 cursor-not-allowed" : ""}`}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </ActionButton>
                                        </div>
                                      )}
                                      <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                                        <ChevronDown className="h-4 w-4" />
                                      </span>
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <div className="border-t border-slate-100 bg-slate-50/50 px-4 pb-4 pt-3 space-y-4">
                                      {iti.description && (
                                        <div className="prose prose-sm max-w-none leading-relaxed text-slate-600 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
                                          <DynamicText text={iti.description.replace(/&nbsp;/g, " ")} isHtml />
                                        </div>
                                      )}
                                      {iti.tourismInfoId && (
                                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white text-sm">
                                          {tourismInfo ? (
                                            <div className="grid sm:grid-cols-[130px_1fr]">
                                              <div className="flex min-h-28 items-center justify-center bg-slate-100">
                                                {tourismInfo.imageUrl ? (
                                                  <img src={tourismInfo.imageUrl} alt={tourismInfo.name} className="h-full min-h-28 w-full object-cover" />
                                                ) : (
                                                  <div className="flex flex-col items-center gap-1 text-slate-400">
                                                    <ImageIcon className="h-6 w-6" />
                                                    <span className="text-[11px]">{t("tour.noImage")}</span>
                                                  </div>
                                                )}
                                              </div>
                                              <div className="space-y-1.5 p-3">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                  <h5 className="font-bold text-slate-800"><DynamicText text={tourismInfo.name} /></h5>
                                                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-500">
                                                    {t(`content.tourismType${tourismInfo.type}`, { defaultValue: tourismInfo.type })}
                                                  </span>
                                                </div>
                                                {tourismInfo.description && (
                                                  <p className="text-xs leading-relaxed text-slate-500"><DynamicText text={tourismInfo.description} /></p>
                                                )}
                                                <div className="flex items-start gap-1.5 text-xs text-slate-500">
                                                  <Globe className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                                                  <span>{[tourismInfo.address, tourismInfo.city, tourismInfo.country].some(Boolean) ? <DynamicText text={[tourismInfo.address, tourismInfo.city, tourismInfo.country].filter(Boolean).join(", ")} /> : t("common.na")}</span>
                                                </div>
                                                {(tourismInfo.latitude || tourismInfo.longitude) && (
                                                  <div className="flex items-start gap-1.5 text-xs text-slate-500">
                                                    <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                                                    <span>
                                                      {t("tour.latLng", {
                                                        lat: tourismInfo.latitude ?? t("common.na"),
                                                        lng: tourismInfo.longitude ?? t("common.na"),
                                                      })}
                                                    </span>
                                                  </div>
                                                )}
                                                {tourismInfo.sourceUrl && (
                                                  <a href={tourismInfo.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-hover mt-1">
                                                    {tourismInfo.sourceUrl}
                                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                                  </a>
                                                )}
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2 p-3 font-semibold text-slate-600">
                                              <Info className="h-4 w-4 text-indigo-400" />
                                              {t("tour.tourismInfoId", { id: iti.tourismInfoId })}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      {iti.locationLat != null && iti.locationLng != null && mapboxToken && (
                                        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm" style={{ height: "200px" }}>
                                          <Map
                                            initialViewState={{
                                              latitude: iti.locationLat,
                                              longitude: iti.locationLng,
                                              zoom: 14,
                                            }}
                                            mapboxAccessToken={mapboxToken}
                                            mapStyle="mapbox://styles/mapbox/streets-v12"
                                            attributionControl={false}
                                            cooperativeGestures={true}
                                          >
                                            <Marker
                                              latitude={iti.locationLat}
                                              longitude={iti.locationLng}
                                              anchor="center"
                                            >
                                              <div className="flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-brand text-white shadow-lg">
                                                <MapPin className="h-4 w-4" />
                                              </div>
                                            </Marker>
                                          </Map>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
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
          )}

          {/* ── TAB: TICKETS ── */}
          {activeTab === "tickets" && (
            <div>
              <div className="mb-6 flex items-center justify-between gap-3">
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
                        <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          {t("common.price")}
                        </th>
                        <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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

                        let displayPrice = ticket.price;
                        let hasDiscount = false;
                        if (ticket.promotion && ticket.price != null && ticket.promotion.discountValue) {
                          const p = Number(ticket.price);
                          let discountAmount = 0;
                          if (ticket.promotion.discountType?.toLowerCase() === "percentage") {
                            discountAmount = p * (ticket.promotion.discountValue / 100);
                            if (ticket.promotion.maxDiscountAmount && discountAmount > ticket.promotion.maxDiscountAmount) {
                              discountAmount = ticket.promotion.maxDiscountAmount;
                            }
                          } else {
                            discountAmount = ticket.promotion.discountValue;
                          }
                          displayPrice = Math.max(0, p - discountAmount);
                          hasDiscount = true;
                        }

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
                                    <DynamicText text={getScheduleTicketName(ticket, ticketType)} />
                                  </span>
                                  {ticket.note && (
                                    <p className="mt-0.5 max-w-xs truncate text-xs font-medium text-slate-400">
                                      <DynamicText text={ticket.note} />
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2 font-semibold text-emerald-600">
                                  <Banknote className="h-4 w-4" />
                                  {formatTicketCurrency(displayPrice)}
                                </div>
                                {hasDiscount && (
                                  <div className="text-xs font-medium text-slate-400 line-through">
                                    {formatTicketCurrency(ticket.price)}
                                  </div>
                                )}
                                {ticket.promotion && (
                                  <div className="flex items-center justify-end gap-1.5 mt-1">
                                    {ticket.promotion.discountType?.toLowerCase() === "percentage" && ticket.promotion.discountValue && (
                                      <span className="rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-bold text-emerald-700">
                                        -{ticket.promotion.discountValue}%
                                      </span>
                                    )}
                                    <span className="inline-block rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                      {ticket.promotion.code}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="text-sm font-semibold text-slate-800">{quantity}</div>
                              <div className="mt-0.5 text-xs font-medium text-slate-400">
                                {t("tour.soldLeft", { sold: soldQuantity, left: availableQuantity })}
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
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
                                    onClick={() => navigate(PATH.MANAGER.EDIT_SCHEDULE_TICKET(schedule.id, ticket.id))}
                                    className="h-8 w-8"
                                    title={t("tour.editTicket")}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </ActionButton>
                                  <ActionButton
                                    variant={isActive ? "warning" : "secondary"}
                                    onClick={() => setConfirmAction({ type: isActive ? "deactivateTicket" : "activateTicket", ticket })}
                                    disabled={updatingTicketId === ticket.id}
                                    className={`h-8 w-8 ${!isActive ? "text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700" : ""}`}
                                    title={isActive ? t("tour.deactivateTicketAction") : t("tour.activateTicketAction")}
                                  >
                                    {isActive ? (
                                      <Lock className="h-3.5 w-3.5" />
                                    ) : (
                                      <Unlock className="h-3.5 w-3.5" />
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
                </div>
              )}
            </div>
          )}
          {/* ── TAB: STAFF ── */}
          {activeTab === "staff" && (
            <TourScheduleStaffManagement
              scheduleId={Number(id)}
              isReadOnly={!schedule.canEdit}
              noWrapper={true}
            />
          )}

        </div>
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
            <Unlock className="h-6 w-6 text-brand" />
          ) : (
            <Lock className="h-6 w-6 text-rose-500" />
          )
        }
      />

      <ConfirmDialog
        open={!!deletingItineraryId}
        onClose={() => setDeletingItineraryId(null)}
        onConfirm={handleDeleteItinerary}
        title={t("tour.deleteScheduleItineraryConfirm")}
        message={t("tour.deleteItineraryItemWarning")}
        confirmText={isDeletingItinerary ? t("tour.deleting") : t("common.confirm")}
        cancelText={t("common.cancel")}
        variant="warning"
        icon={<Trash2 className="h-6 w-6 text-rose-500" />}
      />
    </div>
  );
};