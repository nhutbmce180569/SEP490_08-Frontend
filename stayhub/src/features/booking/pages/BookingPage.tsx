import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Download,
  FileSpreadsheet,
  Minus,
  Plus,
  ShieldCheck,
  Smartphone,
  Ticket,
  Upload,
  Users,
  X,
} from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useBookingCheckout } from "../hooks/useBookingCheckout";
import { VoucherCheckoutPanel } from "../../voucher/customer/components/VoucherCheckoutPanel";
import { PATH } from "../../../config/routes/route";
import { useToast } from "../../../contexts/ToastContext";
import { useTranslation } from "../../../contexts/LocaleContext";
import type { Tour } from "../../tour/types/tour";
import type { TourSchedule } from "../../tour/types/tourSchedule";
import type { TourScheduleTicket } from "../../tour/types/tourScheduleTicket";
import type { CreateTicketRequest } from "../types/ticket";
import type { PaymentProvider } from "../services/payment.service";
import {
  getNumberValue,
  getScheduleTicketAvailable,
  getScheduleTicketName,
  getScheduleTicketTypeId,
} from "../../tour/utils/tourScheduleTicket";
import { MoneyDisplay } from "../../currency/MoneyDisplay";
import {
  downloadBookingPassengerExcel,
  parseBookingPassengerExcel,
} from "../utils/bookingPassengerExcel";

type CheckoutSchedule = TourSchedule & {
  price?: number | string | null;
  availableSeats?: number | string | null;
  tourScheduleTickets?: TourScheduleTicket[] | null;
};

type BookingLocationState = {
  tour?: Tour;
  schedule?: CheckoutSchedule;
};

type PassengerTicket = Omit<
  CreateTicketRequest,
  "dateOfBirth" | "gender" | "nationality"
> & {
  passengerKey: string;
  tourScheduleTicketId: number;
  scheduleTicketId: number;
  ticketTypeId?: number | null;
  ticketTypeName: string;
  price: number;
  dateOfBirth: string;
  gender: string;
  nationality: string;
};

type TicketSummaryItem = {
  scheduleTicketId: number;
  name: string;
  price: number;
  quantity: number;
};

const getTicketPrice = (ticket: TourScheduleTicket) => getNumberValue(ticket.price);

const getTicketAvailable = (ticket: TourScheduleTicket) =>
  getScheduleTicketAvailable(ticket) ?? 0;

const getCheckoutTicketOptions = (schedule: CheckoutSchedule) => {
  return (schedule.tourScheduleTickets ?? []).filter(
    (ticket) => ticket.isActive !== false,
  );
};

const getCheckoutScheduleAvailableSeats = (schedule: CheckoutSchedule) => {
  const tickets = schedule.tourScheduleTickets ?? [];
  if (tickets.length > 0) {
    return tickets.reduce((sum, ticket) => sum + getTicketAvailable(ticket), 0);
  }

  return getNumberValue(schedule.availableSeats) ?? 0;
};

export const BookingPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { tour, schedule } = (location.state || {}) as BookingLocationState;

  const {
    handleCreateBooking,
    isSubmitting,
    voucherCode,
    setVoucherCode,
    isApplyingVoucher,
    appliedVoucher,
    handleApplyVoucher,
    handleApplySavedVoucher,
    clearAppliedVoucher,
  } = useBookingCheckout();
  const { success, error: showError } = useToast();

  const [note, setNote] = useState("");
  const [tickets, setTickets] = useState<PassengerTicket[]>([]);
  const [editingTicketIndex, setEditingTicketIndex] = useState<number | null>(null);
  const [ticketErrors, setTicketErrors] = useState<Record<string, string>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [currentTime] = useState(() => Date.now());
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>("vnpay");
  const [isExcelProcessing, setIsExcelProcessing] = useState(false);
  const [excelImportCount, setExcelImportCount] = useState<number | null>(null);

  const errorHandledRef = useRef(false);
  const passengerSequenceRef = useRef(0);
  const passengerExcelInputRef = useRef<HTMLInputElement>(null);
  const maxDate = new Date(currentTime).toISOString().split("T")[0];

  const scheduleTicketOptions = useMemo(
    () => (schedule ? getCheckoutTicketOptions(schedule) : []),
    [schedule],
  );
  const scheduleAvailableSeats = schedule
    ? getCheckoutScheduleAvailableSeats(schedule)
    : 0;
  const ticketCount = tickets.length;
  const totalPrice = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
  const finalPayable = appliedVoucher?.finalAmount ?? totalPrice;
  const paymentProviderLabel = paymentProvider === "momo" ? "MoMo" : "VNPay";

  const ticketQuantities = useMemo(() => {
    return tickets.reduce<Record<number, number>>((acc, ticket) => {
      acc[ticket.tourScheduleTicketId] = (acc[ticket.tourScheduleTicketId] ?? 0) + 1;
      return acc;
    }, {});
  }, [tickets]);

  const ticketSummary = useMemo(() => {
    const summary = new Map<number, TicketSummaryItem>();

    tickets.forEach((ticket) => {
      const current = summary.get(ticket.tourScheduleTicketId);
      if (current) {
        current.quantity += 1;
        return;
      }

      summary.set(ticket.tourScheduleTicketId, {
        scheduleTicketId: ticket.tourScheduleTicketId,
        name: ticket.ticketTypeName,
        price: ticket.price,
        quantity: 1,
      });
    });

    return Array.from(summary.values());
  }, [tickets]);

  const hasBookableTickets = scheduleTicketOptions.some(
    (ticket) => getTicketPrice(ticket) !== null && getTicketAvailable(ticket) > 0,
  );

  useEffect(() => {
    if (!tour || !schedule) {
      navigate(PATH.PUBLIC.HOME);
      return;
    }

    if (errorHandledRef.current) return;

    const departure = new Date(schedule.departureDate);
    if (departure.getTime() < currentTime) {
      errorHandledRef.current = true;
      showError(t("booking.departureExpired"));
      navigate(PATH.PUBLIC.TOUR_DETAIL(tour.id));
      return;
    }

    if (scheduleAvailableSeats <= 0) {
      errorHandledRef.current = true;
      showError(t("booking.departureSoldOut"));
      navigate(PATH.PUBLIC.TOUR_DETAIL(tour.id));
      return;
    }

    if (!hasBookableTickets) {
      errorHandledRef.current = true;
      showError(t("booking.noBookableTicketType"));
      navigate(PATH.PUBLIC.TOUR_DETAIL(tour.id));
    }
  }, [
    tour,
    schedule,
    scheduleAvailableSeats,
    hasBookableTickets,
    currentTime,
    navigate,
    showError,
    t,
  ]);

  if (!tour || !schedule) return null;

  const isExpired = new Date(schedule.departureDate).getTime() < currentTime;
  const isSoldOut = scheduleAvailableSeats <= 0;
  if (isExpired || isSoldOut || !hasBookableTickets) return null;

  const createPassengerTicket = (ticketOption: TourScheduleTicket): PassengerTicket => {
    passengerSequenceRef.current += 1;

    const ticketTypeId = getScheduleTicketTypeId(ticketOption);
    const ticketTypeName = getScheduleTicketName(ticketOption);

    return {
      passengerKey: `${ticketOption.id}-${passengerSequenceRef.current}`,
      tourScheduleTicketId: ticketOption.id,
      scheduleTicketId: ticketOption.id,
      ticketTypeId,
      ticketTypeName,
      price: getTicketPrice(ticketOption) ?? 0,
      attendeeName: "",
      idCard: "",
      dateOfBirth: "",
      gender: "Male",
      nationality: "Vietnam",
    };
  };

  const handleAddTicket = (ticketOption: TourScheduleTicket) => {
    if (isExcelProcessing) return;

    const price = getTicketPrice(ticketOption);
    const available = getTicketAvailable(ticketOption);
    const quantity = ticketQuantities[ticketOption.id] ?? 0;

    if (price === null) {
      showError(t("booking.ticketNoPrice"));
      return;
    }

    if (available <= 0 || quantity >= available) {
      showError(
        t("booking.ticketsAvailable", {
          count: available,
          name: getScheduleTicketName(ticketOption),
        }),
      );
      return;
    }

    setExcelImportCount(null);
    setTickets((currentTickets) => [
      ...currentTickets,
      createPassengerTicket(ticketOption),
    ]);
  };

  const handleRemoveTicket = (ticketOption: TourScheduleTicket) => {
    if (isExcelProcessing) return;

    setExcelImportCount(null);
    setTickets((currentTickets) => {
      for (let index = currentTickets.length - 1; index >= 0; index -= 1) {
        if (currentTickets[index].tourScheduleTicketId === ticketOption.id) {
          return currentTickets.filter((_, currentIndex) => currentIndex !== index);
        }
      }

      return currentTickets;
    });
  };

  const getPassengerExcelRecords = () =>
    tickets.map((ticket) => ({
      ticketTypeName: ticket.ticketTypeName,
      attendeeName: ticket.attendeeName,
      idCard: ticket.idCard,
      dateOfBirth: ticket.dateOfBirth,
      gender: ticket.gender,
      nationality: ticket.nationality,
    }));

  const handleDownloadPassengerExcel = async () => {
    if (tickets.length === 0) {
      showError(t("booking.passengerExcelSelectTickets"));
      return;
    }

    try {
      setIsExcelProcessing(true);
      await downloadBookingPassengerExcel(getPassengerExcelRecords());
      success(t("booking.passengerExcelDownloaded", { count: tickets.length }));
    } catch (error: any) {
      showError(error.message || t("booking.passengerExcelDownloadFailed"));
    } finally {
      setIsExcelProcessing(false);
    }
  };

  const handleImportPassengerExcel = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setIsExcelProcessing(true);
      const importedRecords = await parseBookingPassengerExcel(
        file,
        getPassengerExcelRecords(),
      );

      setTickets((currentTickets) =>
        currentTickets.map((ticket, index) => ({
          ...ticket,
          attendeeName: importedRecords[index].attendeeName,
          idCard: importedRecords[index].idCard,
          dateOfBirth: importedRecords[index].dateOfBirth,
          gender: importedRecords[index].gender,
          nationality: importedRecords[index].nationality,
        })),
      );
      setHasAttemptedSubmit(false);
      setTicketErrors({});
      setEditingTicketIndex(null);
      setExcelImportCount(importedRecords.length);
      success(
        t("booking.passengerExcelImported", {
          count: importedRecords.length,
        }),
      );
    } catch (error: any) {
      showError(error.message || t("booking.passengerExcelImportFailed"));
    } finally {
      setIsExcelProcessing(false);
    }
  };

  const handleTicketFieldChange = (
    index: number,
    field: keyof CreateTicketRequest,
    value: string,
  ) => {
    const newTickets = [...tickets];
    newTickets[index] = { ...newTickets[index], [field]: value };
    setTickets(newTickets);

    if (hasAttemptedSubmit) {
      const errors = { ...ticketErrors };
      if (field === "attendeeName") {
        if (!value.trim()) errors.attendeeName = t("booking.nameRequired");
        else delete errors.attendeeName;
      }
      if (field === "idCard") {
        if (!value.trim()) errors.idCard = t("booking.idCardRequired");
        else delete errors.idCard;
      }
      if (field === "dateOfBirth") {
        if (!value.trim()) errors.dateOfBirth = t("booking.dobRequired");
        else if (new Date(value).getTime() > currentTime) {
          errors.dateOfBirth = t("booking.dobFuture");
        } else {
          delete errors.dateOfBirth;
        }
      }
      if (field === "nationality") {
        if (!value.trim()) errors.nationality = t("booking.nationalityRequired");
        else delete errors.nationality;
      }
      setTicketErrors(errors);
    }
  };

  const openTicketModal = (index: number) => {
    if (hasAttemptedSubmit) {
      const ticket = tickets[index];
      const errors: Record<string, string> = {};
      if (!ticket.attendeeName.trim()) errors.attendeeName = t("booking.nameRequired");
      if (!ticket.idCard.trim()) errors.idCard = t("booking.idCardRequired");
      if (!ticket.dateOfBirth.trim()) errors.dateOfBirth = t("booking.dobRequired");
      else if (new Date(ticket.dateOfBirth).getTime() > currentTime) {
        errors.dateOfBirth = t("booking.dobFuture");
      }
      if (!ticket.nationality.trim()) errors.nationality = t("booking.nationalityRequired");
      setTicketErrors(errors);
    } else {
      setTicketErrors({});
    }
    setEditingTicketIndex(index);
  };

  const onSubmit = () => {
    setHasAttemptedSubmit(true);

    if (new Date(schedule.departureDate).getTime() < currentTime) {
      showError(t("booking.departureExpired"));
      return;
    }

    if (ticketCount <= 0) {
      showError(t("booking.selectAtLeastOne"));
      return;
    }

    if (ticketCount > scheduleAvailableSeats) {
      showError(t("booking.seatsAvailableForDeparture", { count: scheduleAvailableSeats }));
      return;
    }

    for (const ticketOption of scheduleTicketOptions) {
      const quantity = ticketQuantities[ticketOption.id] ?? 0;
      const available = getTicketAvailable(ticketOption);

      if (quantity > available) {
        showError(
        t("booking.ticketsAvailable", {
          count: available,
          name: getScheduleTicketName(ticketOption),
        }),
      );
        return;
      }
    }

    for (let index = 0; index < tickets.length; index += 1) {
      const ticket = tickets[index];
      if (
        !ticket.attendeeName.trim() ||
        !ticket.idCard.trim() ||
        !ticket.dateOfBirth?.trim() ||
        !ticket.nationality?.trim()
      ) {
        showError(t("booking.fillPassengerFields", { count: index + 1 }));
        return;
      }
      if (new Date(ticket.dateOfBirth).getTime() > currentTime) {
        showError(t("booking.dobFuturePassenger", { count: index + 1 }));
        return;
      }
    }

    const orderDetails = Array.from(
      tickets.reduce((groups, ticket) => {
        const current = groups.get(ticket.tourScheduleTicketId);
        const requestTicket = {
          attendeeName: ticket.attendeeName,
          idCard: ticket.idCard,
          dateOfBirth: ticket.dateOfBirth,
          gender: ticket.gender,
          nationality: ticket.nationality,
          ticketTypeId: ticket.ticketTypeId,
        };

        if (current) {
          current.tickets.push(requestTicket);
        } else {
          groups.set(ticket.tourScheduleTicketId, {
            tourScheduleTicketId: ticket.tourScheduleTicketId,
            ticketTypeId: ticket.ticketTypeId,
            unitPrice: Math.round(ticket.price),
            tickets: [requestTicket],
          });
        }

        return groups;
      }, new Map<number, {
        tourScheduleTicketId: number;
        ticketTypeId?: number | null;
        unitPrice: number;
        tickets: {
          attendeeName: string;
          idCard: string;
          dateOfBirth: string;
          gender: string;
          nationality: string;
          ticketTypeId?: number | null;
        }[];
      }>()),
    ).map(([, detail]) => detail);

    handleCreateBooking(
      {
        scheduleId: schedule.id,
        totalQuantity: ticketCount,
        ticketCount,
        note,
        finalAmount: Math.round(finalPayable),
        orderDetails,
      },
      paymentProvider,
    );
  };

  return (
    <div className="bg-white pb-12">
      <div className="container mx-auto max-w-6xl px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> {t("booking.backToTour")}
        </button>

        <h1 className="mb-8 text-3xl font-extrabold text-slate-900">
          {t("booking.completeBooking")}
        </h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
              <h2 className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 text-xl font-bold text-slate-800">
                <Ticket className="text-brand" /> {t("booking.chooseTickets")}
              </h2>

              <div className="space-y-3">
                {scheduleTicketOptions.map((ticketOption) => {
                  const price = getTicketPrice(ticketOption);
                  const available = getTicketAvailable(ticketOption);
                  const quantity = ticketQuantities[ticketOption.id] ?? 0;
                  const isUnavailable = price === null || available <= 0;

                  return (
                    <div
                      key={ticketOption.id}
                      className={`rounded-2xl border p-4 ${
                        isUnavailable
                          ? "border-slate-100 bg-slate-50 opacity-70"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-bold text-slate-900">
                            {getScheduleTicketName(ticketOption)}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                            <span>
                              {price === null ? t("booking.noPrice") : <MoneyDisplay amountVnd={price} compact />}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span>
                              {available > 0 ? t("booking.leftCount", { count: available }) : t("booking.soldOut")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveTicket(ticketOption)}
                            disabled={quantity <= 0 || isExcelProcessing}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center text-lg font-black text-slate-900">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddTicket(ticketOption)}
                            disabled={isUnavailable || quantity >= available || isExcelProcessing}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-500">
                {t("booking.totalSelected")}{" "}
                <span className="font-black text-slate-900">{ticketCount}</span>{" "}
                {ticketCount === 1 ? t("booking.ticket") : t("booking.tickets")} /{" "}
                {scheduleAvailableSeats === 1
                  ? t("booking.seatsAvailable", { count: scheduleAvailableSeats })
                  : t("booking.seatsAvailablePlural", { count: scheduleAvailableSeats })}
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  {t("booking.specialRequests")}
                </label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={t("booking.specialRequestsPlaceholder")}
                  className="h-24 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
              <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-slate-800">
                <Users className="text-brand" /> {t("booking.passengersInfo")}
              </h2>
              <p className="mb-6 border-b border-slate-100 pb-4 text-sm text-slate-500">
                {t("booking.passengersInfoDesc")}
              </p>

              <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white p-2.5 text-indigo-600 shadow-sm">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {t("booking.passengerExcelTitle")}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-600">
                      {t("booking.passengerExcelDescription", {
                        count: ticketCount,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <input
                    ref={passengerExcelInputRef}
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    onChange={handleImportPassengerExcel}
                  />
                  <button
                    type="button"
                    onClick={handleDownloadPassengerExcel}
                    disabled={ticketCount === 0 || isExcelProcessing}
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs font-bold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {t("booking.passengerExcelDownload")}
                  </button>
                  <button
                    type="button"
                    onClick={() => passengerExcelInputRef.current?.click()}
                    disabled={ticketCount === 0 || isExcelProcessing}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    {t("booking.passengerExcelImport")}
                  </button>
                </div>
              </div>

              {excelImportCount !== null && (
                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  {t("booking.passengerExcelReview", {
                    count: excelImportCount,
                  })}
                </div>
              )}

              {tickets.length > 0 ? (
                <div className="space-y-3">
                  {tickets.map((ticket, index) => {
                    const isComplete =
                      ticket.attendeeName.trim() &&
                      ticket.idCard.trim() &&
                      ticket.dateOfBirth?.trim() &&
                      ticket.nationality?.trim() &&
                      new Date(ticket.dateOfBirth).getTime() <= currentTime;

                    return (
                      <div
                        key={ticket.passengerKey}
                        onClick={() => openTicketModal(index)}
                        className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-brand hover:bg-brand-light/30 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${
                              isComplete
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">
                              {ticket.attendeeName || t("booking.passenger", { count: index + 1 })}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500">
                              {ticket.ticketTypeName} -{" "}
                              {ticket.idCard ? `ID: ${ticket.idCard}` : t("booking.detailsRequired")}
                            </div>
                          </div>
                        </div>
                        <div>
                          {isComplete ? (
                            <ShieldCheck className="h-6 w-6 text-emerald-500" />
                          ) : (
                            <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-rose-600">
                              {t("booking.required")}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
                  {t("booking.selectTicketsHint")}
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="sticky top-24 space-y-6">
              <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                <img
                  src={tour.imageUrl || `https://picsum.photos/seed/tour-${tour.id}/800/400`}
                  alt={tour.name}
                  className="h-40 w-full object-cover"
                />
                <div className="p-6">
                  <h3 className="mb-4 text-lg font-extrabold text-slate-900">
                    {tour.name}
                  </h3>

                  <div className="mb-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between text-sm">
                      <div className="flex gap-2 font-medium text-slate-600">
                        <Calendar size={18} className="text-indigo-500" /> {t("booking.startDate")}
                      </div>
                      <div className="text-right font-bold text-slate-900">
                        {new Date(schedule.departureDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-start justify-between border-t border-slate-100 pt-3 text-sm">
                      <div className="flex gap-2 font-medium text-slate-600">
                        <Calendar size={18} className="text-sky-600" /> {t("booking.endDate")}
                      </div>
                      <div className="text-right font-bold text-slate-900">
                        {new Date(schedule.returnDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 space-y-3 text-sm text-slate-600">
                    {ticketSummary.length > 0 ? (
                      ticketSummary.map((item) => (
                        <div
                          key={item.scheduleTicketId}
                          className="flex items-start justify-between gap-3"
                        >
                          <div>
                            <div className="font-semibold text-slate-800">
                              {item.name}
                            </div>
                            <div className="text-xs text-slate-400">
                              <MoneyDisplay amountVnd={item.price} compact /> x {item.quantity}
                            </div>
                          </div>
                          <span className="font-medium text-slate-900">
                            <MoneyDisplay amountVnd={item.price * item.quantity} compact />
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl bg-slate-50 p-3 text-center text-xs font-medium text-slate-400">
                        {t("booking.noTicketsSelected")}
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-100 pt-3">
                      <span>{t("common.quantity")}</span>
                      <span className="font-medium">x {ticketCount}</span>
                    </div>
                  </div>

                  <div className="mb-5">
                    <VoucherCheckoutPanel
                      tourId={tour.id}
                      billAmount={totalPrice}
                      voucherCode={voucherCode}
                      isApplying={isApplyingVoucher}
                      appliedVoucher={appliedVoucher}
                      onCodeChange={setVoucherCode}
                      onApply={() => handleApplyVoucher(tour.id, totalPrice)}
                      onApplySaved={(code) => handleApplySavedVoucher(code, tour.id, totalPrice)}
                      onClear={clearAppliedVoucher}
                    />
                  </div>

                  <div className="mb-6 flex items-center justify-between border-t border-slate-200 pt-4">
                    <span className="font-bold text-slate-800">{t("booking.totalPrice")}</span>
                    <span className="text-2xl font-black text-brand">
                      <MoneyDisplay
                        amountVnd={finalPayable}
                        showVndBacking
                        subTextClassName="mt-1 block text-right text-[11px] font-semibold text-slate-400"
                      />
                    </span>
                  </div>

                  <div className="mb-5">
                    <div className="mb-3 text-sm font-bold text-slate-800">
                      {t("booking.paymentMethod")}
                    </div>
                    <div className="space-y-3" role="radiogroup" aria-label={t("booking.paymentMethod")}>
                      <button
                        type="button"
                        onClick={() => setPaymentProvider("vnpay")}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                          paymentProvider === "vnpay"
                            ? "border-brand bg-brand-light/40"
                            : "border-slate-200 bg-white hover:border-brand/40"
                        }`}
                        role="radio"
                        aria-checked={paymentProvider === "vnpay"}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                          <CreditCard className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-extrabold text-slate-900">
                            VNPay
                          </span>
                          <span className="block text-xs font-medium text-slate-500">
                            {t("booking.vnpayDesc")}
                          </span>
                        </span>
                        <span
                          className={`h-4 w-4 rounded-full border ${
                            paymentProvider === "vnpay"
                              ? "border-brand bg-brand"
                              : "border-slate-300 bg-white"
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentProvider("momo")}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                          paymentProvider === "momo"
                            ? "border-fuchsia-500 bg-fuchsia-50"
                            : "border-slate-200 bg-white hover:border-fuchsia-300"
                        }`}
                        role="radio"
                        aria-checked={paymentProvider === "momo"}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fuchsia-100 text-fuchsia-700">
                          <Smartphone className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-extrabold text-slate-900">
                            MoMo
                          </span>
                          <span className="block text-xs font-medium text-slate-500">
                            {t("booking.momoDesc")}
                          </span>
                        </span>
                        <span
                          className={`h-4 w-4 rounded-full border ${
                            paymentProvider === "momo"
                              ? "border-fuchsia-500 bg-fuchsia-500"
                              : "border-slate-300 bg-white"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <ActionButton
                    variant="primary"
                    onClick={onSubmit}
                    disabled={isSubmitting || ticketCount <= 0}
                    className="w-full gap-2 py-4 text-base shadow-lg shadow-brand/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {paymentProvider === "momo" ? (
                      <Smartphone size={20} />
                    ) : (
                      <CreditCard size={20} />
                    )}
                    {t("booking.payWith", { provider: paymentProviderLabel })}
                  </ActionButton>
                </div>
              </div>

              <div className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <ShieldCheck className="shrink-0 text-emerald-600" />
                <p className="text-xs font-medium leading-relaxed text-emerald-800">
                  {t("booking.securityNote")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LoadingOverlay
        isOpen={isSubmitting || isExcelProcessing}
        message={
          isExcelProcessing
            ? t("booking.passengerExcelProcessing")
            : t("booking.creatingOrderRedirect", { provider: paymentProviderLabel })
        }
      />

      {editingTicketIndex !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[99998] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
            onClick={() => setEditingTicketIndex(null)}
          >
          <div
            className="w-full max-w-lg animate-in overflow-hidden rounded-3xl bg-white shadow-2xl fade-in zoom-in-95 duration-200"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {t("booking.passengerDetails", { count: editingTicketIndex + 1 })}
                </h3>
                <p className="text-xs font-medium text-slate-500">
                  {tickets[editingTicketIndex].ticketTypeName}
                </p>
              </div>
              <button
                onClick={() => setEditingTicketIndex(null)}
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  {t("booking.fullName")} *
                </label>
                <input
                  type="text"
                  placeholder={t("booking.fullNamePlaceholder")}
                  value={tickets[editingTicketIndex].attendeeName}
                  onChange={(event) =>
                    handleTicketFieldChange(
                      editingTicketIndex,
                      "attendeeName",
                      event.target.value,
                    )
                  }
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors ${
                    ticketErrors.attendeeName
                      ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-slate-200 focus:border-brand"
                  }`}
                  required
                />
                {ticketErrors.attendeeName && (
                  <p className="mt-1 text-xs text-rose-500">
                    {ticketErrors.attendeeName}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  {t("booking.idCardPassport")} *
                </label>
                <input
                  type="text"
                  placeholder={t("booking.idCardPlaceholder")}
                  value={tickets[editingTicketIndex].idCard}
                  onChange={(event) =>
                    handleTicketFieldChange(editingTicketIndex, "idCard", event.target.value)
                  }
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors ${
                    ticketErrors.idCard
                      ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-slate-200 focus:border-brand"
                  }`}
                  required
                />
                {ticketErrors.idCard && (
                  <p className="mt-1 text-xs text-rose-500">{ticketErrors.idCard}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  {t("common.dateOfBirth")} *
                </label>
                <input
                  type="date"
                  max={maxDate}
                  value={tickets[editingTicketIndex].dateOfBirth}
                  onChange={(event) =>
                    handleTicketFieldChange(
                      editingTicketIndex,
                      "dateOfBirth",
                      event.target.value,
                    )
                  }
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors ${
                    ticketErrors.dateOfBirth
                      ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-slate-200 focus:border-brand"
                  }`}
                  required
                />
                {ticketErrors.dateOfBirth && (
                  <p className="mt-1 text-xs text-rose-500">
                    {ticketErrors.dateOfBirth}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    {t("common.gender")} *
                  </label>
                  <select
                    value={tickets[editingTicketIndex].gender}
                    onChange={(event) =>
                      handleTicketFieldChange(editingTicketIndex, "gender", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand"
                  >
                    <option value="Male">{t("common.male")}</option>
                    <option value="Female">{t("common.female")}</option>
                    <option value="Other">{t("common.other")}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    {t("booking.nationalityCol")} *
                  </label>
                  <input
                    type="text"
                    placeholder={t("booking.nationalityPlaceholder")}
                    value={tickets[editingTicketIndex].nationality}
                    onChange={(event) =>
                      handleTicketFieldChange(
                        editingTicketIndex,
                        "nationality",
                        event.target.value,
                      )
                    }
                    className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors ${
                      ticketErrors.nationality
                        ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                        : "border-slate-200 focus:border-brand"
                    }`}
                    required
                  />
                  {ticketErrors.nationality && (
                    <p className="mt-1 text-xs text-rose-500">
                      {ticketErrors.nationality}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
              <ActionButton
                variant="primary"
                onClick={() => setEditingTicketIndex(null)}
                className="px-6 py-2.5 text-sm"
              >
                {t("booking.done")}
              </ActionButton>
            </div>
          </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
