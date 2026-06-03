import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Hash,
  Info,
  Image as ImageIcon,
  Calendar,
  Clock,
  Star,
  Pencil,
  Plus,
  Map,
  Trash2,
  Banknote,
  Tag,
  ChevronDown,
  ChevronUp,
  User,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useTour } from "../hooks/useTour";
import { useGroupedItineraries } from "../hooks/useGroupedItineraries";
import { useReview } from "../hooks/useReview"; 
import { PATH } from "../../../config/routes/route";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useToast } from "../../../contexts/ToastContext";
import type { TourSchedule } from "../types/tourSchedule";
import type { TourScheduleTicket } from "../types/tourScheduleTicket";
import { tourismInformationService } from "../../content/services/tourismInformation.service";
import type { TourismInformation } from "../../content/types/tourismInformation";
import { useTranslation } from "../../../contexts/LocaleContext";

const getNumberValue = (value?: number | string | null) => {
  if (value === undefined || value === null || value === "") return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")} đ`;

const getTicketPrice = (ticket: TourScheduleTicket) => getNumberValue(ticket.price);

const getTicketCapacity = (ticket: TourScheduleTicket) =>
  getNumberValue(ticket.quantity ?? ticket.totalQuantity ?? ticket.maxCapacity);

const getTicketAvailable = (ticket: TourScheduleTicket) =>
  getNumberValue(
    ticket.availableQuantity ??
      ticket.availableSeats ??
      ticket.quantity ??
      ticket.totalQuantity ??
      ticket.maxCapacity,
  );

const getScheduleTickets = (schedule: TourSchedule) => schedule.tourScheduleTickets ?? [];

export const TourDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const [tourismInformationById, setTourismInformationById] = useState<Record<number, TourismInformation>>({});
  
  const { tour, categoryName, isLoading, error } =
    useTour(id);

  const getStatusLabel = (status?: string) => {
    const map: Record<string, string> = {
      Active: t("common.active"),
      Draft: t("tour.draft"),
      Full: t("tour.full"),
      Banned: t("tour.banned"),
    };
    return map[status || "Draft"] ?? status ?? t("tour.draft");
  };

  const getSchedulePriceText = (schedule: TourSchedule) => {
    const prices = getScheduleTickets(schedule)
      .map(getTicketPrice)
      .filter((price): price is number => price !== null);

    if (prices.length === 0) return t("tour.noTicketPrice");

    const minPrice = Math.min(...prices);
    return minPrice === Math.max(...prices)
      ? formatCurrency(minPrice)
      : t("tour.priceFrom", { price: formatCurrency(minPrice) });
  };

  const getScheduleAvailabilityText = (schedule: TourSchedule) => {
    const tickets = getScheduleTickets(schedule);
    if (tickets.length === 0) return t("tour.noTicketSetup");

    const available = tickets.reduce(
      (sum, ticket) => sum + (getTicketAvailable(ticket) ?? 0),
      0,
    );
    const capacity = tickets.reduce(
      (sum, ticket) => sum + (getTicketCapacity(ticket) ?? 0),
      0,
    );

    return capacity > 0
      ? t("tour.availabilityCount", { available, capacity })
      : t("tour.available", { count: available });
  };

  const getReviewCustomerName = (review: any) =>
    review.customerName || review.CustomerName || review.customerId
      ? String(review.customerName || review.CustomerName || t("tour.customerHash", { id: review.customerId }))
      : t("tour.anonymousCustomer");

  const getReviewReplyName = (reply: any) =>
    reply.userName || reply.UserName || reply.userId
      ? String(reply.userName || reply.UserName || t("tour.staffHash", { id: reply.userId }))
      : t("tour.staff");

  const { expandedItiIds, toggleIti, groupedItineraries } = useGroupedItineraries(tour?.tourItineraries);

  const { 
    reviews: fetchedReviews, 
    isLoading: isReviewsLoading, 
    fetchReviewsByTour 
  } = useReview();

  useEffect(() => {
    if (id) {
      fetchReviewsByTour(Number(id));
    }
  }, [id, fetchReviewsByTour]);

  useEffect(() => {
    const tourismInfoIds = Array.from(
      new Set(
        (tour?.tourItineraries ?? [])
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

    Promise.all(
      tourismInfoIds.map(async (tourismInfoId) => {
        const tourismInfo = await tourismInformationService.getById(tourismInfoId);
        return tourismInfo ? ([tourismInfoId, tourismInfo] as const) : null;
      }),
    ).then((entries) => {
      if (!isMounted) return;

      setTourismInformationById(
        Object.fromEntries(
          entries.filter(
            (entry): entry is readonly [number, TourismInformation] => entry !== null,
          ),
        ),
      );
    });

    return () => {
      isMounted = false;
    };
  }, [tour?.tourItineraries]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        {t("tour.loadingTourDetailsMgr")}
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="flex h-64 items-center justify-center text-rose-500">
        {error || t("tour.tourNotFound")}
      </div>
    );
  }

  const itineraryCount = tour.tourItineraries?.length || 0;
  const durationText =
    itineraryCount > 0
      ? itineraryCount === 1
        ? t("tour.daysCount", { count: itineraryCount })
        : t("tour.daysCountPlural", { count: itineraryCount })
      : t("tour.noItinerary");

  const itineraryDayNumbers = tour.tourItineraries
    ?.map((i) => Number(i.dayNumber))
    .sort((a, b) => a - b) ?? [];
  const missingItineraryDays = [] as number[];
  for (
    let i = 1;
    i <= (itineraryDayNumbers.length ? Math.max(...itineraryDayNumbers) : 0);
    i += 1
  ) {
    if (!itineraryDayNumbers.includes(i)) missingItineraryDays.push(i);
  }
  const scheduleCount = tour.tourSchedules?.length || 0;
  const prices =
    tour.tourSchedules
      ?.flatMap((schedule) => getScheduleTickets(schedule).map(getTicketPrice))
      .filter((price): price is number => price !== null) || [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const priceText =
    prices.length === 0
      ? t("tour.noTicketPrice")
      : minPrice === maxPrice
        ? formatCurrency(minPrice)
        : t("tour.priceFrom", { price: formatCurrency(minPrice) });

  // 💥 LỌC BỎ CÁC REVIEW BỊ ẨN
  const visibleReviews = fetchedReviews.filter((review) => !review.isHidden);

  return (
    <div className="mx-auto max-w-4xl py-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("tour.backToTourListMgr")}
      </button>

      {/* Main Content Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Header Image Section */}
        <div className="relative flex h-64 w-full items-center justify-center bg-slate-100 sm:h-80 lg:h-96">
          {tour.imageUrl ? (
            <img
              src={tour.imageUrl}
              alt={tour.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-slate-400">
              <ImageIcon className="mb-2 h-12 w-12 opacity-50" />
              <span className="text-sm font-medium">{t("tour.noImageAvailable")}</span>
            </div>
          )}

          <div className="absolute right-4 top-4">
            <span
              className={`inline-block rounded-full px-4 py-1.5 text-xs font-bold shadow-sm backdrop-blur-md ${
                tour.status === "Active"
                  ? "bg-emerald-500/90 text-white"
                  : tour.status === "Banned"
                    ? "bg-rose-500/90 text-white"
                    : tour.status === "Full"
                      ? "bg-amber-500/90 text-white"
                      : "bg-slate-800/80 text-white"
              }`}
            >
              {getStatusLabel(tour.status || "")}
            </span>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6 sm:p-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                {tour.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Hash className="h-4 w-4 text-slate-400" />
                  <span>{t("tour.tourIdLabel")}: {tour.id}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>
                    {[tour.address, tour.city, tour.country]
                      .filter(Boolean)
                      .join(", ") || t("tour.naLocation")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-slate-400" />
                  <span>
                    {t("tour.categoryLabel")}: {categoryName || `ID ${tour.categoryId}`}
                  </span>
                </div>
                {(tour.createdByName || tour.createdAt) && (
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>
                      {t("tour.createdBy")}{tour.createdByName && ` by ${tour.createdByName}`}
                      {tour.createdAt && ` on ${new Date(tour.createdAt).toLocaleDateString("vi-VN")}`}
                    </span>
                  </div>
                )}
                {(tour.updatedByName || tour.updatedAt) && (
                  <div className="flex items-center gap-1.5">
                    <Pencil className="h-4 w-4 text-slate-400" />
                    <span>
                      {t("tour.lastUpdated")}{tour.updatedByName && ` by ${tour.updatedByName}`}
                      {tour.updatedAt && ` on ${new Date(tour.updatedAt).toLocaleDateString("vi-VN")}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {tour.status !== "Banned" && (
              <div className="flex shrink-0 items-start gap-3">
                <ActionButton
                  variant="primary"
                  onClick={() => {
                    if (tour.status === "Active") {
                      showError(t("tour.inactiveBeforeEdit"));
                    } else {
                      navigate(PATH.MANAGER.EDIT_TOUR(tour.id));
                    }
                  }}
                  className="gap-2 px-4 py-2 text-sm"
                >
                  <Pencil className="h-4 w-4" />
                  {t("tour.editTour")}
                </ActionButton>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5 transition-colors hover:bg-slate-100/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-brand">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  {t("tour.durationStat")}
                </p>
                <p className="break-words text-base font-bold text-slate-900 sm:text-lg">
                  {durationText}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5 transition-colors hover:bg-slate-100/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  {t("tour.schedules")}
                </p>
                <p className="break-words text-base font-bold text-slate-900 sm:text-lg">
                  {scheduleCount} {scheduleCount === 1 ? t("tour.trips") : t("tour.tripsPlural")}
                </p>
              </div>
            </div>

            {/* <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5 transition-colors hover:bg-slate-100/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  Lowest Price
                </p>
                <p className="break-words text-base font-bold text-emerald-600 sm:text-lg">
                  {priceText}
                </p>
              </div>
            </div> */}

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5 transition-colors hover:bg-slate-100/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  {t("tour.rating")}
                </p>
                <p className="break-words text-base font-bold text-amber-600 sm:text-lg">
                  {tour.averageStar && tour.averageStar > 0 ? `${tour.averageStar.toFixed(1)}/5` : t("tour.noRatings")}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="mb-3 text-lg font-bold text-slate-900">
              {t("common.description")}
            </h2>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 leading-relaxed text-slate-700">
              {tour.description ? (
                <p className="whitespace-pre-wrap text-sm">
                  {tour.description}
                </p>
              ) : (
                <p className="text-sm italic text-slate-400">
                  {t("tour.noDescriptionProvided")}
                </p>
              )}
            </div>
          </div>

          {/* Itineraries Section */}
          <div className="mt-8 border-t border-slate-100 pt-8">
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">{t("tour.itineraries")}</h2>
                {tour.status !== "Banned" && (
                  <ActionButton
                    variant="primary"
                    onClick={() =>
                      navigate(PATH.MANAGER.CREATE_ITINERARY(tour.id))
                    }
                    className="gap-2 px-4 py-2 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    {t("tour.addItinerary")}
                  </ActionButton>
                )}
              </div>
              {missingItineraryDays.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold">{t("tour.missingItineraryDaysTitle")}</p>
                  <p>{t("tour.missingItineraryDaysTourMsg", { days: missingItineraryDays.join(", Day ") })}</p>
                </div>
              )}
            </div>

            {tour.tourItineraries && tour.tourItineraries.length > 0 ? (
              <div className="flex flex-col gap-6">
                {Object.entries(groupedItineraries)
                  .map(([dayStr]) => Number(dayStr))
                  .sort((a, b) => a - b)
                  .map((dayNumber) => (
                    <div key={dayNumber} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
                        <h3 className="text-lg font-bold text-slate-900">Day {dayNumber}</h3>
                      </div>
                      
                      <div className="flex flex-col divide-y divide-slate-100">
                        {groupedItineraries[dayNumber].map((iti) => {
                          const isExpanded = expandedItiIds.includes(iti.id);
                          const timeStr = iti.startDuration && iti.endDuration
                            ? `${iti.startDuration.substring(0, 5)} - ${iti.endDuration.substring(0, 5)}`
                            : iti.startDuration ? iti.startDuration.substring(0, 5) : t("tour.anyTime");
                          const tourismInfo = iti.tourismInfoId
                            ? tourismInformationById[iti.tourismInfoId]
                            : null;

                          return (
                            <div key={iti.id} className="flex flex-col">
                              <div
                                className="flex cursor-pointer items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50"
                                onClick={() => toggleIti(iti.id)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="flex min-w-[110px] items-center justify-center rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-600">
                                    <Clock className="mr-1.5 h-4 w-4" />
                                    {timeStr}
                                  </div>
                                  <h4 className="font-semibold text-slate-800">{iti.title}</h4>
                                </div>
                                <div className="flex items-center gap-4">
                                  {tour.status !== "Banned" && (
                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                      <ActionButton variant="secondary" onClick={() => navigate(PATH.MANAGER.EDIT_ITINERARY(tour.id, iti.id))} className="h-8 w-8 text-brand hover:bg-brand-light hover:text-brand-hover">
                                        <Pencil className="h-3.5 w-3.5" />
                                      </ActionButton>
                                      <ActionButton variant="warning" onClick={() => navigate(PATH.MANAGER.DELETE_ITINERARY(tour.id, iti.id))} className="h-8 w-8">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </ActionButton>
                                    </div>
                                  )}
                                  <div className="text-slate-400">
                                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                  </div>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="bg-slate-50/50 px-5 pb-5 pt-2 sm:pl-[150px]">
                                  {iti.description && (
                                    <p className="mb-3 text-sm leading-relaxed text-slate-600">
                                      {iti.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                    <MapPin className="h-4 w-4 text-emerald-500" />
                                    <span>{iti.locationName || t("common.na")}</span>
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
                                              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-600">
                                                {tourismInfo.type}
                                              </span>
                                            </div>
                                            {tourismInfo.description && (
                                              <p className="text-xs leading-relaxed text-slate-500">
                                                {tourismInfo.description}
                                              </p>
                                            )}
                                            <div className="flex items-start gap-2 text-xs font-medium text-slate-600">
                                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
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
                                          <Info className="h-4 w-4 text-indigo-500" />
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
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
                <Map className="mb-3 h-10 w-10 text-slate-400" />
                <h3 className="mb-1 font-semibold text-slate-900">
                  {t("tour.noItinerariesYet")}
                </h3>
                <p className="mb-4 text-sm text-slate-500">
                  {t("tour.createItineraryHint")}
                </p>
              </div>
            )}
          </div>

          {/* Schedules Section */}
          <div className="mt-8 border-t border-slate-100 pt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{t("tour.schedules")}</h2>
              {tour.status !== "Banned" && (
                <ActionButton
                  variant="primary"
                  onClick={() => navigate(PATH.MANAGER.CREATE_SCHEDULE(tour.id))}
                  className="gap-2 px-4 py-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  {t("tour.addSchedule")}
                </ActionButton>
              )}
            </div>

            {tour.tourSchedules && tour.tourSchedules.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {tour.tourSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="mb-4 flex items-center justify-between border-b border-slate-50 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-slate-900">
                          #{schedule.id}
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <ActionButton
                          variant="secondary"
                          onClick={() =>
                            navigate(
                              PATH.MANAGER.SCHEDULE_DETAIL(schedule.id),
                              { state: { schedule, tourName: tour.name } },
                            )
                          }
                          className="h-8 w-8 text-brand hover:bg-brand-light hover:text-brand-hover"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </ActionButton>
                        {tour.status !== "Banned" && (
                          <ActionButton
                            variant="secondary"
                            onClick={() =>
                              navigate(PATH.MANAGER.EDIT_SCHEDULE(schedule.id))
                            }
                            className="h-8 w-8"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </ActionButton>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">{t("tour.departure")}</span>
                        <span className="font-medium text-slate-900">
                          {new Date(
                            schedule.departureDate,
                          ).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">{t("common.price")}</span>
                        <span className="font-semibold text-emerald-600">
                          {getSchedulePriceText(schedule)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">{t("tour.availability")}</span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-900">
                          {getScheduleAvailabilityText(schedule)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
                <Calendar className="mb-3 h-10 w-10 text-slate-400" />
                <h3 className="mb-1 font-semibold text-slate-900">
                  {t("tour.noSchedulesYet")}
                </h3>
                <p className="mb-4 text-sm text-slate-500">
                  {t("tour.createScheduleHint")}
                </p>
              </div>
            )}
          </div>

          {/* 💥 Reviews Section (Sử dụng visibleReviews) */}
          <div className="mt-8 border-t border-slate-100 pt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{t("tour.reviews")} ({visibleReviews.length})</h2>
            </div>

            {isReviewsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-sm font-medium">{t("tour.loadingReviewsMgr")}</p>
              </div>
            ) : visibleReviews.length > 0 ? (
              <div className="flex flex-col gap-4">
                {visibleReviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
                          {review.customerAvatar ? (
                            <img src={review.customerAvatar} alt={getReviewCustomerName(review)} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-indigo-600">
                              <User className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {getReviewCustomerName(review)}
                          </h3>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${
                                    i < (review.rating || 0)
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-200"
                                  }`}
                                />
                              ))}
                            </div>
                            {review.createdAt && (
                              <span className="text-[11px] font-medium text-slate-400">
                                • {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                        {review.comment}
                      </p>
                    )}

                    {review.replies && review.replies.length > 0 && (
                      <div className="mt-4 space-y-4">
                        {review.replies.map((reply) => {
                          const replyName = getReviewReplyName(reply);
                          const replyInitial = replyName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase();

                          return (
                            <div
                              key={reply.id}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="mb-3 flex items-center gap-3">
                                <div className="h-10 w-10 overflow-hidden rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm uppercase border border-indigo-200">
                                  {reply.userAvatar ? (
                                    <img
                                      src={reply.userAvatar}
                                      alt={replyName}
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                        e.currentTarget.parentElement!.innerText = replyInitial;
                                      }}
                                    />
                                  ) : (
                                    replyInitial
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                    <span>{replyName}</span>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-xs font-medium text-slate-500">
                                      {reply.createdAt
                                        ? new Date(reply.createdAt).toLocaleDateString("vi-VN")
                                        : ""}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500">{t("tour.replyToReview")}</div>
                                </div>
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {reply.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
                <Star className="mb-3 h-10 w-10 text-slate-400" />
                <h3 className="mb-1 font-semibold text-slate-900">
                  {t("tour.noReviews")}
                </h3>
                <p className="mb-4 text-sm text-slate-500">
                  {t("tour.reviewsFromCustomers")}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
