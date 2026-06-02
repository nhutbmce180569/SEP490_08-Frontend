import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import {
  Calendar,
  Users,
  Banknote,
  ClipboardList,
  MapPin,
  Info,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowLeft,
  Star,
  ChevronRight,
  X,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { PATH } from "../../../config/routes/route";
import { useOrderDetail } from "../hooks/useOrderDetail";
import { ActionButton } from "../../../components/home/ActionButton";
import { useGroupedItineraries } from "../../tour/hooks/useGroupedItineraries";
import { ReviewForm } from "../../tour/pages/ReviewForm"; 
import { useQuery } from "@tanstack/react-query";
import { ticketTypeService } from "../../content/services/ticketType.service";
import { tourismInformationService } from "../../content/services/tourismInformation.service";
import { useNavigate } from "react-router-dom";
import type { TourScheduleItinerary } from "../../tour/types/tourScheduleItinerary";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const tripDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const tripTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
});

type OrderItineraryItem = TourScheduleItinerary & {
  startLocationName?: string | null;
  endLocationName?: string | null;
};

const toValidDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getCancellationFeePercent = (daysUntilDeparture: number) => {
  if (daysUntilDeparture <= 1) return null;
  if (daysUntilDeparture <= 2) return 10;
  if (daysUntilDeparture <= 5) return 15;
  if (daysUntilDeparture <= 10) return 10;
  if (daysUntilDeparture <= 15) return 5;
  return 0;
};

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { order, isLoading, error, refetch } = useOrderDetail(id);
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCancellationPolicyOpen, setIsCancellationPolicyOpen] = useState(false);

  const { expandedItiIds, toggleIti, groupedItineraries } = useGroupedItineraries(order?.schedule?.tourScheduleItineraries);

  const tourismInfoIds = useMemo(() => {
    return Array.from(
      new Set(
        (order?.schedule?.tourScheduleItineraries ?? [])
          .map((item) => item.tourismInfoId)
          .filter(
            (tourismInfoId): tourismInfoId is number =>
              typeof tourismInfoId === "number" && Number.isFinite(tourismInfoId),
          ),
      ),
    );
  }, [order?.schedule?.tourScheduleItineraries]);

  const { data: tourismInformationDetails = {} } = useQuery({
    queryKey: ["order-tourism-information-details", tourismInfoIds],
    queryFn: async () => {
      const activeTourismInformation = await tourismInformationService.getActiveList();
      const neededIds = new Set(tourismInfoIds);

      return Object.fromEntries(
        activeTourismInformation
          .filter((item) => neededIds.has(item.id))
          .map((item) => [item.id, item] as const),
      );
    },
    enabled: tourismInfoIds.length > 0,
  });

  const ticketTypeIds = useMemo(() => {
    if (!order) return [];

    return Array.from(
      new Set(
        [
          ...(order.orderDetails ?? []).map((detail) => detail.ticketTypeId),
          ...(order.tickets ?? []).map((ticket) => ticket.ticketTypeId),
        ].filter((ticketTypeId): ticketTypeId is number => Number.isFinite(ticketTypeId)),
      ),
    );
  }, [order]);

  const { data: ticketTypeNames = {} } = useQuery({
    queryKey: ["order-ticket-types", ticketTypeIds],
    queryFn: async () => {
      const entries = await Promise.all(
        ticketTypeIds.map(async (ticketTypeId) => {
          try {
            const ticketType = await ticketTypeService.getById(ticketTypeId);
            return [ticketTypeId, ticketType.name] as const;
          } catch {
            return [ticketTypeId, `Ticket type #${ticketTypeId}`] as const;
          }
        }),
      );

      return Object.fromEntries(entries) as Record<number, string>;
    },
    enabled: ticketTypeIds.length > 0,
  });

  if (isLoading) {  
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <ClipboardList size={48} className="mx-auto mb-4 text-slate-300" />
        <h4 className="text-xl font-bold text-slate-900 mb-2">
          Order not found
        </h4>
        <p className="text-slate-500">
          {error ||
            "The order you requested does not exist or has already been removed."}
        </p>
        <Link
          to={PATH.CUSTOMER.MY_BOOKINGS}
          className="mt-6 inline-flex rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 !no-underline"
        >
          Go back to My Bookings
        </Link>
      </div>
    );
  }

  // Giữ canReview = true theo cấu hình test hiện tại của bạn
  const canReview = true;
    // isTourEnded &&
    // (order.status === "Paid" || order.status === "Completed");

  const orderDetails = order.orderDetails ?? [];
  const tickets = order.tickets ?? [];
  const ticketCount =
    order.ticketCount ??
    tickets.length ??
    order.totalQuantity ??
    orderDetails.reduce((sum, detail) => sum + detail.quantity, 0);
  const bookedDate = toValidDate(order.orderedAt);
  const departureDate = toValidDate(order.schedule?.departureDate);
  const returnDate = toValidDate(order.schedule?.returnDate);
  const itineraryDayCount = Object.keys(groupedItineraries).length;
  const tripDurationDays =
    departureDate && returnDate
      ? Math.max(
          1,
          Math.ceil(
            (returnDate.getTime() - departureDate.getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1,
        )
      : null;
  const normalizedStatus = (order.status ?? "Pending").toLowerCase();
  const compactStatus = normalizedStatus.replace(/[\s_-]+/g, "");
  const isCancellationBlockedStatus =
    compactStatus === "requesttocancelled" || compactStatus === "cancelled";
  const isSettled =
    normalizedStatus === "paid" || normalizedStatus === "completed";
  const statusClasses =
    normalizedStatus === "cancelled"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : isSettled
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-amber-200 bg-amber-50 text-amber-700";
  const canRequestCancellation =
    normalizedStatus === "paid" && !isCancellationBlockedStatus;
  const subtotalAmount =
    order.totalAmount ??
    orderDetails.reduce((sum, detail) => sum + detail.totalPrice, 0);
  const daysUntilDeparture = departureDate
    ? Math.ceil((departureDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const cancellationFeePercent =
    daysUntilDeparture === null
      ? null
      : getCancellationFeePercent(daysUntilDeparture);
  const canCancelByDepartureDate =
    cancellationFeePercent !== null && daysUntilDeparture !== null && daysUntilDeparture > 1;
  const cancellationFeeAmount =
    cancellationFeePercent === null
      ? null
      : Math.round(subtotalAmount * (cancellationFeePercent / 100));
  const estimatedRefundAmount =
    cancellationFeeAmount === null
      ? null
      : Math.max(0, order.finalAmount - cancellationFeeAmount);

  const getTicketTypeName = (ticketTypeId?: number | null) => {
    if (!ticketTypeId) return "Ticket";
    return ticketTypeNames[ticketTypeId] ?? `Ticket type #${ticketTypeId}`;
  };

  const getTicketDetail = (ticket: (typeof tickets)[number]) =>
    orderDetails.find((detail) => detail.id === ticket.orderDetailId) ??
    orderDetails.find((detail) => detail.ticketTypeId === ticket.ticketTypeId);

  const handleRequestCancellation = () => {
    setIsCancellationPolicyOpen(true);
  };

  const handleConfirmCancellationPolicy = () => {
    if (!canCancelByDepartureDate) return;
    setIsCancellationPolicyOpen(false);
    navigate(PATH.CUSTOMER.REQUEST_CANCELLATION(order.id));
  };

  return (
    <div className="w-full">
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate(PATH.CUSTOMER.MY_BOOKINGS)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-brand/30 hover:bg-brand-light/40 hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Bookings
        </button>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid">
            <div className="relative min-h-[220px] bg-slate-100 sm:min-h-[260px]">
              {order.tour?.imageUrl ? (
                <img
                  src={order.tour.imageUrl}
                  alt={order.tour.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[260px] items-center justify-center text-slate-400">
                  <ImageIcon className="h-12 w-12" />
                </div>
              )}
              <div className="absolute left-4 top-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-sm ${statusClasses}`}
                >
                  {isSettled ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                  {order.status || "Pending"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-5 p-5 sm:p-6">
              <div className="space-y-3">
                {bookedDate && (
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Booked {dateFormatter.format(bookedDate)}
                  </p>
                )}
                <h1 className="text-xl font-bold leading-tight text-slate-950 sm:text-2xl">
                  {order.tour?.name || "Tour Booking"}
                </h1>
                <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0 text-brand" />
                  <span className="truncate">
                    {[order.tour?.city, order.tour?.country]
                      .filter(Boolean)
                      .join(", ") || "Various Locations"}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Tickets
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {ticketCount}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Days
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {(tripDurationDays ?? itineraryDayCount) || "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Plan
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {itineraryDayCount || "N/A"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-emerald-700">
                      <Calendar className="h-4 w-4" />
                      Departure
                    </div>
                    <p className="text-base font-bold leading-snug text-slate-950">
                      {departureDate
                        ? tripDateFormatter.format(departureDate)
                        : "N/A"}
                    </p>
                    {departureDate && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                        <Clock className="h-4 w-4 text-emerald-600" />
                        {tripTimeFormatter.format(departureDate)}
                      </p>
                    )}
                  </div>

                  <div className="hidden h-px w-10 bg-slate-200 xl:block" />

                  <div className="rounded-xl bg-sky-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-sky-700">
                      <Calendar className="h-4 w-4" />
                      Return
                    </div>
                    <p className="text-base font-bold leading-snug text-slate-950">
                      {returnDate ? tripDateFormatter.format(returnDate) : "N/A"}
                    </p>
                    {returnDate && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                        <Clock className="h-4 w-4 text-sky-600" />
                        {tripTimeFormatter.format(returnDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-950">
                  Trip Documents
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Itinerary details and passenger QR tickets.
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {order.schedule?.tourScheduleItineraries &&
                  order.schedule.tourScheduleItineraries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsItineraryModalOpen(true)}
                      className="group flex min-h-[118px] items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-indigo-300 hover:bg-white hover:shadow-sm"
                    >
                      <span className="flex min-w-0 items-center gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                          <Calendar className="h-6 w-6" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-slate-950">
                            Itinerary
                          </span>
                          <span className="mt-1 block text-sm text-slate-500">
                            {itineraryDayCount} day plan
                          </span>
                        </span>
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600" />
                    </button>
                  )}

                <button
                  type="button"
                  onClick={() => setIsTicketsModalOpen(true)}
                  className="group flex min-h-[118px] items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-blue-300 hover:bg-white hover:shadow-sm"
                >
                  <span className="flex min-w-0 items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-brand">
                      <Users className="h-6 w-6" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-950">
                        Passenger Tickets
                      </span>
                      <span className="mt-1 block text-sm text-slate-500">
                        {ticketCount} QR ticket{ticketCount === 1 ? "" : "s"}
                      </span>
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand" />
                </button>
              </div>
            </section>

            {canReview && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 space-y-2">
                    <h2 className="flex items-center gap-2 text-base font-bold text-slate-950">
                      <Star className="h-5 w-5 shrink-0 text-brand" />
                      {order.review ? "Your Review" : "Rate Your Experience"}
                    </h2>
                    <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                      {order.review
                        ? `You rated this tour ${order.review.rating}/5 stars. You can update your feedback anytime.`
                        : "Share your feedback after the trip so the host can improve future tours."}
                    </p>
                  </div>
                  <ActionButton
                    variant="primary"
                    className="w-full shrink-0 !border-brand !bg-brand px-6 text-sm font-bold hover:!bg-[var(--color-brand-hover)] xl:w-auto"
                    onClick={() => setIsReviewModalOpen(true)}
                  >
                    {order.review ? "Edit Review" : "Write a Review"}
                  </ActionButton>
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-slate-950">
                <Banknote className="h-5 w-5 text-emerald-600" />
                Payment Summary
              </h2>

              <div className="space-y-4 text-sm">
                {orderDetails.length > 0 ? (
                  <div className="space-y-3">
                    {orderDetails.map((detail) => (
                      <div
                        key={detail.id}
                        className="flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold leading-snug text-slate-800">
                            {getTicketTypeName(detail.ticketTypeId)}
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-slate-400">
                            Quantity {detail.quantity}
                          </p>
                        </div>
                        <p className="shrink-0 whitespace-nowrap font-bold text-slate-950">
                          {currencyFormatter.format(detail.totalPrice)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4 text-slate-600">
                    <span>Tickets</span>
                    <span className="whitespace-nowrap text-right">
                      {ticketCount} x{" "}
                      {currencyFormatter.format(
                        (order.finalAmount + (order.discountValue || 0)) /
                          Math.max(ticketCount, 1),
                      )}
                    </span>
                  </div>
                )}

                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex justify-between gap-4 text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-950">
                      {currencyFormatter.format(subtotalAmount)}
                    </span>
                  </div>
                  {order.discountValue && order.discountValue > 0 ? (
                    <div className="flex justify-between gap-4 text-rose-600">
                      <span>Discount</span>
                      <span>-{currencyFormatter.format(order.discountValue)}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl bg-brand-light px-4 py-3">
                  <span className="font-bold text-slate-950">Total Paid</span>
                  <span className="whitespace-nowrap text-lg font-bold text-brand">
                    {currencyFormatter.format(order.finalAmount)}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-950">
                <Info className="h-5 w-5 text-sky-500" />
                Booking Notes
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {order.note ? (
                  order.note
                ) : (
                  <span className="italic text-slate-400">
                    No special requests provided.
                  </span>
                )}
              </p>
            </section>

            {canRequestCancellation && (
              <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm sm:p-6">
                <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-rose-900">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  Cancellation Request
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-rose-700">
                  You can request cancellation for paid bookings before the
                  last day. A cancellation fee may be deducted based on the
                  departure date.
                </p>
                <ActionButton
                  variant="outline"
                  className="w-full !border-rose-200 !text-rose-600 hover:!border-rose-300 hover:!bg-rose-100"
                  onClick={handleRequestCancellation}
                >
                  Request Cancellation
                </ActionButton>
              </section>
            )}
          </aside>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODALS SECTION */}
      {/* ======================================================== */}
      {createPortal(
        <>

      {isCancellationPolicyOpen && (
        <div
          className="fixed inset-0 z-[9000] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsCancellationPolicyOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-100 bg-rose-50 px-6 py-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-950">
                    Cancellation policy
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Please review the estimated fee before creating a
                    cancellation request.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Departure</span>
                  <span className="text-right font-semibold text-slate-900">
                    {departureDate ? dateFormatter.format(departureDate) : "N/A"}
                  </span>
                </div>
                <div className="mt-3 flex justify-between gap-4">
                  <span className="text-slate-500">Time remaining</span>
                  <span className="font-semibold text-slate-900">
                    {daysUntilDeparture === null
                      ? "N/A"
                      : `${Math.max(daysUntilDeparture, 0)} day(s)`}
                  </span>
                </div>
              </div>

              {canCancelByDepartureDate ? (
                <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex justify-between gap-4">
                    <span className="text-amber-800">Cancellation fee</span>
                    <span className="font-bold text-amber-900">
                      {cancellationFeePercent}% (
                      {currencyFormatter.format(cancellationFeeAmount ?? 0)})
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-amber-800">Estimated refund</span>
                    <span className="font-bold text-emerald-700">
                      {currencyFormatter.format(estimatedRefundAmount ?? 0)}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-amber-700">
                    Fee rule: within 15 days is 5%, within 10 days is 10%,
                    within 5 days is 15%, and within 2 days is 20%.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="font-semibold text-rose-800">
                    This booking cannot be cancelled.
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-rose-700">
                    Cancellation is not allowed when the tour starts within 1
                    day, or when the departure date cannot be verified.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsCancellationPolicyOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!canCancelByDepartureDate}
                onClick={handleConfirmCancellationPolicy}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Schedule Itinerary Modal */}
      {isItineraryModalOpen && order.schedule?.tourScheduleItineraries && (
        <div className="fixed inset-0 z-[2147483646] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsItineraryModalOpen(false)}>
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Schedule Itinerary</h3>
                  <p className="text-xs font-medium text-slate-500">{Object.keys(groupedItineraries).length} days of activities</p>
                </div>
              </div>
              <button onClick={() => setIsItineraryModalOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-6 bg-slate-50/50 space-y-6">
              {Object.entries(groupedItineraries)
                .map(([dayStr]) => Number(dayStr))
                .sort((a, b) => a - b)
                .map((dayNumber) => {
                  const itemsForDay = groupedItineraries[dayNumber] as OrderItineraryItem[];
                  const isToday = itemsForDay.some((iti) => iti.itineraryDate && new Date(iti.itineraryDate).toDateString() === new Date().toDateString());
                  const dayDate = itemsForDay[0]?.itineraryDate;

                  return (
                    <div
                      key={dayNumber}
                      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${isToday ? "border-brand ring-1 ring-brand/30" : "border-slate-200"}`}
                    >
                      {/* Day Header */}
                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b ${isToday ? "border-blue-100 bg-brand-light/50" : "border-slate-100 bg-slate-50"}`}>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isToday ? "bg-brand text-white shadow-md shadow-blue-200" : "bg-indigo-100 text-indigo-700"}`}>
                            <span className="text-sm font-black">D{dayNumber}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={`text-base font-bold ${isToday ? "text-brand" : "text-slate-800"}`}>
                                Day {dayNumber}
                              </h3>
                              {isToday && (
                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-600 animate-pulse">
                                  Today
                                </span>
                              )}
                            </div>
                            {dayDate && (
                              <p className="text-xs font-medium text-slate-500 mt-0.5">
                                {new Date(dayDate).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Danh sách các khung giờ */}
                      <div className="flex flex-col divide-y divide-slate-100">
                        {itemsForDay.map((iti) => {
                          const isExpanded = expandedItiIds.includes(iti.id);
                          const timeStr = iti.startDuration && iti.endDuration
                            ? `${iti.startDuration.substring(0, 5)} - ${iti.endDuration.substring(0, 5)}`
                            : iti.startDuration ? iti.startDuration.substring(0, 5) : "Any time";
                          const tourismInfo = iti.tourismInfoId
                            ? tourismInformationDetails[iti.tourismInfoId]
                            : null;

                          return (
                            <div key={iti.id} className="flex flex-col">
                              <div
                                className="flex cursor-pointer items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50"
                                onClick={() => toggleIti(iti.id)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`flex min-w-[90px] items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold ${isToday ? "bg-brand-light text-brand" : "bg-slate-100 text-slate-600"}`}>
                                    <Clock className="mr-1.5 h-3.5 w-3.5" />
                                    {timeStr}
                                  </div>
                                  <h4 className="font-semibold text-slate-800 text-sm sm:text-base">{iti.title}</h4>
                                </div>
                                <div className="text-slate-400 shrink-0 ml-4">
                                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="bg-slate-50/50 px-5 pb-5 pt-2 sm:pl-[130px]">
                                  {iti.description && (
                                    <p className="mb-4 text-sm leading-relaxed text-slate-600">
                                      {iti.description}
                                    </p>
                                  )}
                                  
                                  {(iti.startLocationName || iti.endLocationName || iti.locationName) && (
                                    <div className="flex flex-col gap-2 text-sm text-slate-500 bg-white border border-slate-100 p-3 rounded-xl w-fit">
                                      {iti.locationName && (
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                                          <span className="font-medium text-slate-700">{iti.locationName}</span>
                                        </div>
                                      )}
                                      {iti.startLocationName && (
                                        <div className="flex items-start gap-2">
                                          <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                          <div><span className="font-semibold text-slate-700">Start:</span> {iti.startLocationName}</div>
                                        </div>
                                      )}
                                      {iti.endLocationName && (
                                        <div className="flex items-start gap-2">
                                          <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                          <div><span className="font-semibold text-slate-700">End:</span> {iti.endLocationName}</div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {iti.tourismInfoId && (
                                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-white text-sm text-slate-600">
                                      {tourismInfo ? (
                                        <div className="grid sm:grid-cols-[160px_1fr]">
                                          <div className="flex min-h-32 items-center justify-center bg-slate-100">
                                            {tourismInfo.imageUrl ? (
                                              <img
                                                src={tourismInfo.imageUrl}
                                                alt={tourismInfo.name}
                                                className="h-full min-h-32 w-full object-cover"
                                              />
                                            ) : (
                                              <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <ImageIcon className="h-7 w-7" />
                                                <span className="text-xs font-medium">No image</span>
                                              </div>
                                            )}
                                          </div>
                                          <div className="space-y-2 p-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className="font-bold text-slate-800">{tourismInfo.name}</span>
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
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                              >
                                                {tourismInfo.sourceName || "Source"}
                                                <ExternalLink className="h-3.5 w-3.5" />
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-start gap-2 p-3">
                                          <MapPin className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                                          <span className="font-semibold text-slate-700">
                                            Tourism info ID #{iti.tourismInfoId}
                                          </span>
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
          </div>
        </div>
      )}

      {/* 2. Passenger Tickets Modal */}
      {isTicketsModalOpen && (
        <div className="fixed inset-0 z-[2147483646] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsTicketsModalOpen(false)}>
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-brand">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Passenger Tickets</h3>
                  <p className="text-xs font-medium text-slate-500">{order.ticketCount} passenger(s) booked</p>
                </div>
              </div>
              <button onClick={() => setIsTicketsModalOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-6 bg-slate-50/50 space-y-4">
              {tickets.map((ticket, idx) => {
                const detail = getTicketDetail(ticket);
                const ticketTypeName = getTicketTypeName(
                  detail?.ticketTypeId ?? ticket.ticketTypeId,
                );

                return (
                  <div key={ticket.id} className="flex flex-col sm:flex-row gap-4 rounded-lg border border-slate-200 p-4 bg-white">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-800">
                            Passenger {idx + 1}
                          </span>
                          <span className="mt-0.5 block truncate text-xs font-medium text-brand">
                            {ticketTypeName}
                          </span>
                        </div>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold ${
                            ticket.checkInStatus === "CheckedIn" || ticket.checkInStatus === "Checked"
                              ? "bg-emerald-100 text-emerald-700"
                              : ticket.checkInStatus === "Cancelled"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {ticket.checkInStatus === "CheckedIn" || ticket.checkInStatus === "Checked"
                            ? "Checked In"
                            : ticket.checkInStatus === "Cancelled"
                              ? "Cancelled"
                              : "Pending"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Name</p>
                          <p className="font-medium text-slate-900">{ticket.attendeeName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Ticket Type</p>
                          <p className="font-medium text-slate-900">{ticketTypeName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">ID / Passport</p>
                          <p className="font-medium text-slate-900">{ticket.idCard}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Nationality</p>
                          <p className="font-medium text-slate-900">{ticket.nationality || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">DOB</p>
                          <p className="font-medium text-slate-900">
                            {ticket.dateOfBirth ? new Date(ticket.dateOfBirth).toLocaleDateString() : "—"}
                          </p>
                       </div>
                      </div>
                    </div>
                    {ticket.qrCode && (
                      <div className="flex shrink-0 flex-col items-center justify-center border-t border-slate-100 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                        <div className="mb-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                          <QRCodeSVG value={ticket.qrCode} size={80} />
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">{ticket.qrCode}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 💥 3. Review Modal Wrapper */}
      {isReviewModalOpen && order.tour && (
        <div 
          className="fixed inset-0 z-[2147483646] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200" 
          onClick={() => setIsReviewModalOpen(false)}
        >
          <div 
            className="w-full max-w-xl animate-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()} // Chặn click xuyên thủng
          >
            {/* Vì ReviewForm đã tự có background, padding và bo góc rất đẹp, ta chỉ việc nhét thẳng vào đây */}
            <ReviewForm
              tourId={order.tour.id}
              customerId={order.customerId} // Truyền customerId từ order
              existingReview={
                order.review
                  ? {
                      ...order.review,
                      customerId: order.customerId,
                      tourId: order.tour.id,
                    }
                  : null
              } // Tự động bật chế độ Edit nếu order đã có review
              onSuccess={() => {
                setIsReviewModalOpen(false); // Đóng Modal
                refetch(); // Cập nhật lại data order (để hiện dòng "Your Review...")
              }}
              onCancel={() => setIsReviewModalOpen(false)} // Nút Hủy
            />
          </div>
        </div>
      )}

        </>,
        document.body,
      )}

    </div>
  );
};
