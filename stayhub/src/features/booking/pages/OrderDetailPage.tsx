import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams, useNavigate } from "react-router-dom";
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
  Copy,
} from "lucide-react";
import MapboxMap, { Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { QRCodeSVG } from "qrcode.react";
import { PATH } from "../../../config/routes/route";
import { useOrderDetail } from "../hooks/useOrderDetail";
import { ActionButton } from "../../../components/home/ActionButton";
import { useGroupedItineraries } from "../../tour/hooks/useGroupedItineraries";
import { ReviewForm } from "../../tour/pages/ReviewForm";
import { useTranslation } from "../../../contexts/LocaleContext";
import { cancelOrder } from "../services/booking.service";
import { useQuery } from "@tanstack/react-query";
import { ticketTypeService } from "../../content/services/ticketType.service";
import { tourismInformationService } from "../../content/services/tourismInformation.service";
import type { TourScheduleItinerary } from "../../tour/types/tourScheduleItinerary";
import { MoneyDisplay } from "../../currency/MoneyDisplay";
import { useToast } from "../../../contexts/ToastContext";
import { DynamicText } from "../../../components/DynamicText";

const formatDate = (date: Date, locale: string) => new Intl.DateTimeFormat(locale, {
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
}).format(date);

const isReviewEditable = (createdAt?: string | null) => {
  if (!createdAt) return false;
  const createdTime = new Date(createdAt).getTime();
  const currentTime = new Date().getTime();
  const oneDayInMs = 24 * 60 * 60 * 1000; // 24 giờ
  return currentTime - createdTime <= oneDayInMs;
};

const formatTripDate = (date: Date, locale: string) => new Intl.DateTimeFormat(locale, {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
}).format(date);

const formatTripTime = (date: Date, locale: string) => new Intl.DateTimeFormat(locale, {
  hour: "2-digit",
  minute: "2-digit",
}).format(date);

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

const getTranslatedStatus = (status: string | null | undefined, t: any) => {
  if (!status) return t("common.pending");
  switch (status) {
    case "Paid": return t("common.paid");
    case "Cancelled": return t("common.cancelled");
    case "Request to Cancel": return t("booking.requestToCancel");
    case "Completed": return t("common.completed");
    case "Pending": return t("common.pending");
    default: return status;
  }
};

export const OrderDetailPage: React.FC = () => {
  const { t, locale } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { order, isLoading, error, refetch } = useOrderDetail(id);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);
  const { success, error: showError } = useToast();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCancellationPolicyOpen, setIsCancellationPolicyOpen] =
    useState(false);
  const [isCancelOrderConfirmOpen, setIsCancelOrderConfirmOpen] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);

  const handleCancelPendingOrderClick = () => {
    setIsCancelOrderConfirmOpen(true);
  };

  const handleConfirmCancelPendingOrder = async () => {
    if (!order) return;
    setIsCancellingOrder(true);
    try {
      await cancelOrder(order.id);
      success(t("booking.orderCancelledSuccess") || "Đơn hàng đã được hủy thành công!");
      setIsCancelOrderConfirmOpen(false);
      refetch();
    } catch (err: any) {
      showError(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const { expandedItiIds, toggleIti, groupedItineraries } =
    useGroupedItineraries(order?.schedule?.tourScheduleItineraries);

  const tourismInfoIds = useMemo(() => {
    return Array.from(
      new Set(
        (order?.schedule?.tourScheduleItineraries ?? [])
          .map((item) => item.tourismInfoId)
          .filter(
            (tourismInfoId): tourismInfoId is number =>
              typeof tourismInfoId === "number" &&
              Number.isFinite(tourismInfoId),
          ),
      ),
    );
  }, [order?.schedule?.tourScheduleItineraries]);

  const { data: tourismInformationDetails = {} } = useQuery({
    queryKey: ["order-tourism-information-details", tourismInfoIds],
    queryFn: async () => {
      const activeTourismInformation =
        await tourismInformationService.getActiveList();
      const neededIds = new Set(tourismInfoIds);

      return Object.fromEntries(
        activeTourismInformation
          .filter((item) => neededIds.has(item.id))
          .map((item) => [item.id, item] as const),
      );
    },
    enabled: tourismInfoIds.length > 0,
  });

  const normalizedTickets = useMemo(() => {
    if (!order) return [];

    const detailTickets = (order.orderDetails ?? []).flatMap((detail) =>
      (detail.tickets ?? []).map((ticket) => ({
        ...ticket,
        orderId: ticket.orderId ?? detail.orderId,
        orderDetailId: ticket.orderDetailId ?? detail.id,
        ticketTypeId: ticket.ticketTypeId ?? detail.ticketTypeId,
      })),
    );

    return detailTickets.length > 0 ? detailTickets : (order.tickets ?? []);
  }, [order]);

  const ticketTypeIds = useMemo(() => {
    if (!order) return [];

    return Array.from(
      new Set(
        [
          ...(order.orderDetails ?? []).map((detail) => detail.ticketTypeId),
          ...normalizedTickets.map((ticket) => ticket.ticketTypeId),
        ].filter((ticketTypeId): ticketTypeId is number =>
          Number.isFinite(ticketTypeId),
        ),
      ),
    );
  }, [order, normalizedTickets]);

  const { data: ticketTypeNames = {} } = useQuery({
    queryKey: ["order-ticket-types", ticketTypeIds, t],
    queryFn: async () => {
      const entries = await Promise.all(
        ticketTypeIds.map(async (ticketTypeId) => {
          try {
            const ticketType = await ticketTypeService.getById(ticketTypeId);
            return [ticketTypeId, ticketType.name] as const;
          } catch {
            return [
              ticketTypeId,
              t("booking.ticketTypeFallback", { id: ticketTypeId }),
            ] as const;
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
        {t("booking.loadingOrderDetails")}
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <ClipboardList size={48} className="mx-auto mb-4 text-slate-300" />
        <h4 className="text-xl font-bold text-slate-900 mb-2">
          {t("booking.orderNotFound")}
        </h4>
        <p className="text-slate-500">
          {error || t("booking.orderNotFoundDesc")}
        </p>
        <Link
          to={PATH.CUSTOMER.MY_BOOKINGS}
          className="mt-6 inline-flex rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 !no-underline"
        >
          {t("booking.backToMyBookings")}
        </Link>
      </div>
    );
  }

  const canReview = true;

  const orderDetails = order.orderDetails ?? [];
  const tickets = normalizedTickets;
  const detailTicketCount = orderDetails.reduce(
    (sum, detail) => sum + detail.quantity,
    0,
  );
  const ticketCount =
    order.ticketCount ??
    order.totalQuantity ??
    (tickets.length > 0 ? tickets.length : detailTicketCount);
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
    cancellationFeePercent !== null &&
    daysUntilDeparture !== null &&
    daysUntilDeparture > 1;
  const cancellationFeeAmount =
    cancellationFeePercent === null
      ? null
      : Math.round(subtotalAmount * (cancellationFeePercent / 100));
  const estimatedRefundAmount =
    cancellationFeeAmount === null
      ? null
      : Math.max(0, order.finalAmount - cancellationFeeAmount);

  const getTicketTypeName = (ticketTypeId?: number | null) => {
    if (!ticketTypeId) return t("booking.ticketFallback");
    return (
      ticketTypeNames[ticketTypeId] ??
      t("booking.ticketTypeFallback", { id: ticketTypeId })
    );
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

  const handleCopyQrCode = (qrCode?: string | null) => {
    if (!qrCode) return;
    navigator.clipboard.writeText(qrCode).then(
      () => {
        success(t("booking.qrCodeCopied"));
      },
      () => {
        showError(t("booking.qrCodeCopyFailed"));
      },
    );
  };

  const safeTourId = order.tour?.id || order.schedule?.tourId || 0;

  return (
    <div className="w-full">
      <div className="space-y-6">
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
              
              <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => navigate(PATH.CUSTOMER.MY_BOOKINGS)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200/50 bg-white/95 backdrop-blur-sm px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-white hover:text-brand"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{t("booking.backToMyBookings")}</span>
                </button>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold shadow-sm backdrop-blur-md ${statusClasses}`}
                >
                  {isSettled ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  {getTranslatedStatus(order.status, t)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-5 p-5 sm:p-6">
              <div className="space-y-3">
                {bookedDate && (
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    {t("booking.booked", {
                      date: formatDate(bookedDate, locale),
                    })}
                  </p>
                )}
                <h1 className="text-xl font-bold leading-tight text-slate-950 sm:text-2xl">
                  {order.tour?.name ? <DynamicText text={order.tour.name} /> : t("booking.tourBooking")}
                </h1>
                <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0 text-brand" />
                  <span className="truncate">
                    {[order.tour?.city, order.tour?.country].filter(Boolean).length > 0 
                      ? <DynamicText text={[order.tour?.city, order.tour?.country].filter(Boolean).join(", ")} /> 
                      : t("booking.variousLocations")}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    {t("booking.tickets")}
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {ticketCount}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    {t("booking.days")}
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {(tripDurationDays ?? itineraryDayCount) || t("common.na")}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    {t("booking.plan")}
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {itineraryDayCount || t("common.na")}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-emerald-700">
                      <Calendar className="h-4 w-4" />
                      {t("booking.departure")}
                    </div>
                    <p className="text-base font-bold leading-snug text-slate-950">
                      {departureDate
                        ? formatTripDate(departureDate, locale)
                        : t("common.na")}
                    </p>
                    {departureDate && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                        <Clock className="h-4 w-4 text-emerald-600" />
                        {formatTripTime(departureDate, locale)}
                      </p>
                    )}
                  </div>

                  <div className="hidden h-px w-10 bg-slate-200 xl:block" />

                  <div className="rounded-xl bg-sky-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-sky-700">
                      <Calendar className="h-4 w-4" />
                      {t("booking.return")}
                    </div>
                    <p className="text-base font-bold leading-snug text-slate-950">
                      {returnDate
                        ? formatTripDate(returnDate, locale)
                        : t("common.na")}
                    </p>
                    {returnDate && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                        <Clock className="h-4 w-4 text-sky-600" />
                        {formatTripTime(returnDate, locale)}
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
                  {t("booking.tripDocuments")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t("booking.tripDocumentsDesc")}
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
                            {t("booking.itinerary")}
                          </span>
                          <span className="mt-1 block text-sm text-slate-500">
                            {t("booking.dayPlan", { count: itineraryDayCount })}
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
                        {t("booking.passengerTickets")}
                      </span>
                      <span className="mt-1 block text-sm text-slate-500">
                        {ticketCount === 1
                          ? t("booking.qrTicket", { count: ticketCount })
                          : t("booking.qrTickets", { count: ticketCount })}
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
                      {order.review
                        ? t("booking.yourReview")
                        : t("booking.rateExperience")}
                    </h2>
                    <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                      {order.review
                        ? t("booking.reviewedStars", {
                            rating: order.review.rating,
                          })
                        : t("booking.shareFeedback")}
                    </p>
                  </div>
                  {/* 💥 KIỂM TRA ĐIỀU KIỆN REVIEW BẰNG HÀM TỰ TÍNH 24 GIỜ */}
                  {order.review ? (
                    isReviewEditable(order.review.createdAt) ? (
                      <ActionButton
                        variant="primary"
                        className="w-full shrink-0 !border-brand !bg-brand px-6 text-sm font-bold hover:!bg-[var(--color-brand-hover)] xl:w-auto"
                        onClick={() => setIsReviewModalOpen(true)}
                      >
                        {t("booking.editReview") || "Sửa đánh giá"}
                      </ActionButton>
                    ) : (
                      <ActionButton
                        variant="primary"
                        className="w-full shrink-0 !border-brand !bg-brand px-6 text-sm font-bold hover:!bg-[var(--color-brand-hover)] xl:w-auto"
                        onClick={() => setIsReviewModalOpen(true)}
                      >
                        {t("booking.viewReview") || "Xem đánh giá"}
                      </ActionButton>
                    )
                  ) : (
                    <ActionButton
                      variant="primary"
                      className="w-full shrink-0 !border-brand !bg-brand px-6 text-sm font-bold hover:!bg-[var(--color-brand-hover)] xl:w-auto"
                      onClick={() => setIsReviewModalOpen(true)}
                    >
                      {t("booking.writeReview") || "Viết đánh giá"}
                    </ActionButton>
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-slate-950">
                <Banknote className="h-5 w-5 text-emerald-600" />
                {t("booking.paymentSummary")}
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
                          <div className="flex items-baseline gap-2">
                            <p className="font-semibold leading-snug text-slate-800">
                              {getTicketTypeName(detail.ticketTypeId)}
                            </p>
                            <span className="text-xs text-slate-400">
                              x{detail.quantity}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="shrink-0 whitespace-nowrap font-bold text-slate-950">
                            <MoneyDisplay amountVnd={detail.totalPrice} compact />
                          </p>
                          {detail.promotionDiscountValue && detail.promotionDiscountValue > 0 ? (
                            <p className="mt-1 text-xs font-medium text-emerald-600">
                              - <MoneyDisplay amountVnd={detail.promotionDiscountValue} compact />
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4 text-slate-600">
                    <span>{t("booking.tickets")}</span>
                    <span className="whitespace-nowrap text-right">
                      {ticketCount} x{" "}
                      <MoneyDisplay
                        amountVnd={
                          (order.finalAmount + (order.discountValue || 0) + (order.promotionDiscountValue || 0)) /
                          Math.max(ticketCount, 1)
                        }
                        compact
                      />
                    </span>
                  </div>
                )}

                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex justify-between gap-4 text-slate-600">
                    <span>{t("booking.subtotal")}</span>
                    <span className="font-semibold text-slate-950">
                      <MoneyDisplay amountVnd={subtotalAmount} compact />
                    </span>
                  </div>
                  {order.promotionDiscountValue && order.promotionDiscountValue > 0 ? (
                    <div className="flex justify-between gap-4 text-emerald-600">
                      <span>{t("booking.promotionDiscount", { defaultValue: "Promotion Discount" })}</span>
                      <span>
                        -
                        <MoneyDisplay amountVnd={order.promotionDiscountValue} compact />
                      </span>
                    </div>
                  ) : null}
                  {order.discountValue && order.discountValue > 0 ? (
                    <div className="flex justify-between gap-4 text-rose-600">
                      <span>{t("booking.voucherDiscount", { defaultValue: "Voucher Discount" })}</span>
                      <span>
                        -
                        <MoneyDisplay amountVnd={order.discountValue} compact />
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl bg-brand-light px-4 py-3">
                  <span className="font-bold text-slate-950">
                    {t("booking.totalPaid")}
                  </span>
                  <span className="whitespace-nowrap text-lg font-bold text-brand">
                    <MoneyDisplay
                      amountVnd={order.finalAmount}
                      showVndBacking
                      subTextClassName="mt-0.5 block text-right text-[11px] font-semibold text-slate-500"
                    />
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-950">
                <Info className="h-5 w-5 text-sky-500" />
                {t("booking.bookingNotes")}
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {order.note ? (
                  order.note
                ) : (
                  <span className="italic text-slate-400">
                    {t("booking.noSpecialRequests")}
                  </span>
                )}
              </p>
            </section>

            {canRequestCancellation && (
              <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm sm:p-6">
                <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-rose-900">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  {t("booking.cancellationRequest")}
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-rose-700">
                  {t("booking.cancellationRequestDesc")}
                </p>
                <ActionButton
                  variant="outline"
                  className="w-full !border-rose-200 !text-rose-600 hover:!border-rose-300 hover:!bg-rose-100"
                  onClick={handleRequestCancellation}
                >
                  {t("booking.requestCancellation")}
                </ActionButton>
              </section>
            )}

            {normalizedStatus === "pending" && (
              <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm sm:p-6">
                <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-rose-900">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  {t("booking.cancelUnpaidOrder") || "Hủy đơn hàng chưa thanh toán"}
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-rose-700">
                  {t("booking.cancelUnpaidOrderDesc") || "Nếu không muốn tiếp tục đặt tour này, bạn có thể hủy đơn hàng."}
                </p>
                <ActionButton
                  variant="outline"
                  className="w-full !border-rose-200 !text-rose-600 hover:!border-rose-300 hover:!bg-rose-100"
                  onClick={handleCancelPendingOrderClick}
                >
                  {t("booking.cancelOrder")}
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
                        {t("booking.cancellationPolicy")}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {t("booking.reviewFeeBeforeCancel")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 px-6 py-5 text-sm">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">
                        {t("booking.departure")}
                      </span>
                      <span className="text-right font-semibold text-slate-900">
                        {departureDate
                          ? formatDate(departureDate, locale)
                          : t("common.na")}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-between gap-4">
                      <span className="text-slate-500">
                        {t("booking.timeRemaining")}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {daysUntilDeparture === null
                          ? t("common.na")
                          : t("booking.daysRemaining", {
                              count: Math.max(daysUntilDeparture, 0),
                            })}
                      </span>
                    </div>
                  </div>

                  {canCancelByDepartureDate ? (
                    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex justify-between gap-4">
                        <span className="text-amber-800">
                          {t("booking.cancellationFee")}
                        </span>
                        <span className="font-bold text-amber-900">
                          {cancellationFeePercent}% (
                          <MoneyDisplay
                            amountVnd={cancellationFeeAmount ?? 0}
                            compact
                          />
                          )
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-amber-800">
                          {t("booking.estimatedRefund")}
                        </span>
                        <span className="font-bold text-emerald-700">
                          <MoneyDisplay
                            amountVnd={estimatedRefundAmount ?? 0}
                            compact
                          />
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-amber-700">
                        {t("booking.feeRule")}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <p className="font-semibold text-rose-800">
                        {t("booking.cannotCancel")}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-rose-700">
                        {t("booking.cannotCancelDesc")}
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
                    {t("common.close")}
                  </button>
                  <button
                    type="button"
                    disabled={!canCancelByDepartureDate}
                    onClick={handleConfirmCancellationPolicy}
                    className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {t("booking.continue")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1. Schedule Itinerary Modal */}
          {isItineraryModalOpen && order.schedule?.tourScheduleItineraries && (
            <div
              className="fixed inset-0 z-[99998] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setIsItineraryModalOpen(false)}
            >
              <div
                className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {t("booking.scheduleItinerary")}
                      </h3>
                      <p className="text-xs font-medium text-slate-500">
                        {t("booking.daysOfActivities", {
                          count: Object.keys(groupedItineraries).length,
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsItineraryModalOpen(false)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="overflow-y-auto p-6 bg-slate-50/50 space-y-6">
                  {Object.entries(groupedItineraries)
                    .map(([dayStr]) => Number(dayStr))
                    .sort((a, b) => a - b)
                    .map((dayNumber) => {
                      const itemsForDay = groupedItineraries[
                        dayNumber
                      ] as OrderItineraryItem[];
                      const isToday = itemsForDay.some(
                        (iti) =>
                          iti.itineraryDate &&
                          new Date(iti.itineraryDate).toDateString() ===
                            new Date().toDateString(),
                      );
                      const dayDate = itemsForDay[0]?.itineraryDate;

                      return (
                        <div
                          key={dayNumber}
                          className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${isToday ? "border-brand ring-1 ring-brand/30" : "border-slate-200"}`}
                        >
                          {/* Day Header */}
                          <div
                            className={`flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b ${isToday ? "border-blue-100 bg-brand-light/50" : "border-slate-100 bg-slate-50"}`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isToday ? "bg-brand text-white shadow-md shadow-blue-200" : "bg-indigo-100 text-indigo-700"}`}
                              >
                                <span className="text-sm font-black">
                                  D{dayNumber}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3
                                    className={`text-base font-bold ${isToday ? "text-brand" : "text-slate-800"}`}
                                  >
                                    {t("booking.dayNumber", {
                                      count: dayNumber,
                                    })}
                                  </h3>
                                  {isToday && (
                                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-600 animate-pulse">
                                      {t("booking.today")}
                                    </span>
                                  )}
                                </div>
                                {dayDate && (
                                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                                    {new Date(dayDate).toLocaleDateString(
                                      "en-US",
                                      {
                                        weekday: "short",
                                        month: "long",
                                        day: "numeric",
                                      },
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Danh sách các khung giờ */}
                          <div className="flex flex-col divide-y divide-slate-100">
                            {itemsForDay.map((iti) => {
                              const isExpanded = expandedItiIds.includes(
                                iti.id,
                              );
                              const timeStr =
                                iti.startDuration && iti.endDuration
                                  ? `${iti.startDuration.substring(0, 5)} - ${iti.endDuration.substring(0, 5)}`
                                  : iti.startDuration
                                    ? iti.startDuration.substring(0, 5)
                                    : t("booking.anyTime");
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
                                      <div
                                        className={`flex min-w-[90px] items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold ${isToday ? "bg-brand-light text-brand" : "bg-slate-100 text-slate-600"}`}
                                      >
                                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                                        {timeStr}
                                      </div>
                                      <h4 className="font-semibold text-slate-800 text-sm sm:text-base">
                                        <DynamicText text={iti.title} />
                                      </h4>
                                    </div>
                                    <div className="text-slate-400 shrink-0 ml-4">
                                      {isExpanded ? (
                                        <ChevronUp className="h-5 w-5" />
                                      ) : (
                                        <ChevronDown className="h-5 w-5" />
                                      )}
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <div className="bg-slate-50/50 px-5 pb-5 pt-2 sm:pl-[130px]">
                                      {iti.description && (
                                        <div className="prose prose-sm mb-4 max-w-none text-sm leading-relaxed text-slate-600 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
                                          <DynamicText text={iti.description.replace(/&nbsp;/g, ' ')} isHtml={true} />
                                        </div>
                                      )}

                                      {(iti.startLocationName ||
                                        iti.endLocationName ||
                                        iti.locationName) && (
                                        <div className="flex flex-col gap-2 text-sm text-slate-500 bg-white border border-slate-100 p-3 rounded-xl w-fit">
                                          {iti.locationName && (
                                            <div className="flex items-center gap-2">
                                              <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                                              <span className="font-medium text-slate-700">
                                                <DynamicText text={iti.locationName} />
                                              </span>
                                            </div>
                                          )}
                                          {iti.startLocationName && (
                                            <div className="flex items-start gap-2">
                                              <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                              <div>
                                                <span className="font-semibold text-slate-700">
                                                  {t("booking.startLocation")}
                                                </span>{" "}
                                                <DynamicText text={iti.startLocationName} />
                                              </div>
                                            </div>
                                          )}
                                          {iti.endLocationName && (
                                            <div className="flex items-start gap-2">
                                              <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                              <div>
                                                <span className="font-semibold text-slate-700">
                                                  {t("booking.endLocation")}
                                                </span>{" "}
                                                <DynamicText text={iti.endLocationName} />
                                              </div>
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
                                                    <span className="text-xs font-medium">
                                                      {t("content.noImage")}
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                              <div className="space-y-2 p-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                  <span className="font-bold text-slate-800">
                                                    <DynamicText text={tourismInfo.name} />
                                                  </span>
                                                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-600">
                                                    <DynamicText text={tourismInfo.type} />
                                                  </span>
                                                </div>
                                                {tourismInfo.description && (
                                                  <p className="text-xs leading-relaxed text-slate-500">
                                                    <DynamicText text={tourismInfo.description} />
                                                  </p>
                                                )}
                                                <div className="flex items-start gap-2 text-xs font-medium text-slate-600">
                                                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                                  <span>
                                                    {[
                                                      tourismInfo.address,
                                                      tourismInfo.city,
                                                      tourismInfo.country,
                                                    ]
                                                      .filter(Boolean)
                                                      .join(", ") ||
                                                      t("common.na")}
                                                  </span>
                                                </div>
                                                {(tourismInfo.latitude ||
                                                  tourismInfo.longitude) && (
                                                  <div className="text-xs font-medium text-slate-400">
                                                    {t("booking.latLng", {
                                                      lat: String(
                                                        tourismInfo.latitude ??
                                                          t("common.na"),
                                                      ),
                                                      lng: String(
                                                        tourismInfo.longitude ??
                                                          t("common.na"),
                                                      ),
                                                    })}
                                                  </div>
                                                )}
                                                {tourismInfo.sourceUrl && (
                                                  <a
                                                    href={tourismInfo.sourceUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                                  >
                                                    {tourismInfo.sourceUrl}
                                                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                                  </a>
                                                )}
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex items-start gap-2 p-3">
                                              <MapPin className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                                              <span className="font-semibold text-slate-700">
                                                {t("booking.tourismInfoId", {
                                                  id: iti.tourismInfoId,
                                                })}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      
                                      {iti.locationLat != null && iti.locationLng != null && mapboxToken && (
                                        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 shadow-sm" style={{ height: "200px" }}>
                                          <MapboxMap
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
                                          </MapboxMap>
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
            <div
              className="fixed inset-0 z-[99998] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setIsTicketsModalOpen(false)}
            >
              <div
                className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-brand">
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {t("booking.passengerTickets")}
                      </h3>
                      <p className="text-xs font-medium text-slate-500">
                        {t("booking.passengerBooked", {
                          count: ticketCount,
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsTicketsModalOpen(false)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                  >
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
                      <div
                        key={ticket.id}
                        className="flex flex-col sm:flex-row gap-4 rounded-lg border border-slate-200 p-4 bg-white"
                      >
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="min-w-0">
                              <span className="block text-sm font-semibold text-slate-800">
                                {t("booking.passenger", { count: idx + 1 })}
                              </span>
                              <span className="mt-0.5 block truncate text-xs font-medium text-brand">
                                <DynamicText text={ticketTypeName} />
                              </span>
                            </div>
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                ticket.checkInStatus === "CheckedIn" ||
                                ticket.checkInStatus === "Checked"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : ticket.checkInStatus === "Cancelled"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {ticket.checkInStatus === "CheckedIn" ||
                              ticket.checkInStatus === "Checked"
                                ? t("booking.checkedIn")
                                : ticket.checkInStatus === "Cancelled"
                                  ? t("common.cancelled")
                                  : t("common.pending")}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-slate-500">
                                {t("common.nameLabel")}
                              </p>
                              <p className="font-medium text-slate-900">
                                {ticket.attendeeName}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">
                                {t("booking.ticketType")}
                              </p>
                              <p className="font-medium text-slate-900">
                                <DynamicText text={ticketTypeName} />
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">
                                {t("booking.idPassport")}
                              </p>
                              <p className="font-medium text-slate-900">
                                {ticket.idCard}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">
                                {t("booking.nationalityCol")}
                              </p>
                              <p className="font-medium text-slate-900">
                                {ticket.nationality || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">
                                {t("booking.dob")}
                              </p>
                              <p className="font-medium text-slate-900">
                                {ticket.dateOfBirth
                                  ? new Date(
                                      ticket.dateOfBirth,
                                    ).toLocaleDateString()
                                  : "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                        {ticket.qrCode && (
                          <div className="flex shrink-0 flex-col items-center justify-center border-t border-slate-100 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                            <div className="mb-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                              <QRCodeSVG value={ticket.qrCode} size={80} />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyQrCode(ticket.qrCode)}
                                className="flex items-center gap-1.5 text-slate-400 hover:text-brand transition-colors"
                                title={t("booking.copyQrCode")}
                              >
                                <span className="font-mono text-[10px] text-slate-500">
                                  {ticket.qrCode}
                                </span>
                                <Copy size={12} />
                              </button>
                            </div>
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
          {isReviewModalOpen && safeTourId > 0 && (
            <div
              className="fixed inset-0 z-[99998] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setIsReviewModalOpen(false)}
            >
              <div
                className="w-full max-w-xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()} // Chặn click xuyên thủng
              >
                {/* Vì ReviewForm đã tự có background, padding và bo góc rất đẹp, ta chỉ việc nhét thẳng vào đây */}
                <ReviewForm
                  tourId={safeTourId}
                  customerId={order.customerId} // Truyền customerId từ order
                  existingReview={
                    order.review
                      ? {
                          ...order.review,
                          customerId: order.customerId,
                          tourId: safeTourId,
                        }
                      : null
                  } // Tự động bật chế độ Edit nếu order đã có review
                  isReadOnly={
                    order.review
                      ? !isReviewEditable(order.review.createdAt)
                      : false
                  }
                  onSuccess={() => {
                    setIsReviewModalOpen(false); // Đóng Modal
                    refetch(); // Cập nhật lại data order (để hiện dòng "Your Review...")
                  }}
                  onCancel={() => setIsReviewModalOpen(false)} // Nút Hủy
                />
              </div>
            </div>
          )}

          {/* Unpaid Order Cancellation Confirmation Modal */}
          {isCancelOrderConfirmOpen && (
            <div
              className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setIsCancelOrderConfirmOpen(false)}
            >
              <div
                className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="border-b border-slate-100 bg-rose-50 px-6 py-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-950">
                        {t("booking.confirmCancellationTitle") || "Xác nhận hủy đơn hàng"}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        {t("booking.confirmCancellationMessage") || "Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác."}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsCancelOrderConfirmOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                    disabled={isCancellingOrder}
                  >
                    {t("common.back") || "Quay lại"}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCancelPendingOrder}
                    disabled={isCancellingOrder}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCancellingOrder && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    {t("booking.confirmCancelOrder") || "Xác nhận hủy"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body,
      )}
    </div>
  );
};
