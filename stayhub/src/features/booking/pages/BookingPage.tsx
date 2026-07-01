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
  PackageCheck,
  Plus,
  ShieldCheck,
  Smartphone,
  Ticket,
  Upload,
  Users,
  X,
  AlertTriangle,
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

type CountryOption = {
  code: string;
  name: string;
  region?: string;
  aliases?: string[];
};

type CountriesNowStatesResponse = {
  data?: {
    name?: string;
    iso2?: string;
    states?: {
      name?: string;
      state_code?: string;
    }[];
  }[];
};

const DEFAULT_NATIONALITY = "Vietnam";
const COUNTRY_API_URL = "https://countriesnow.space/api/v0.1/countries/states";
const UK_CONSTITUENT_COUNTRIES = new Set([
  "England",
  "Northern Ireland",
  "Scotland",
  "Wales",
]);
const FALLBACK_COUNTRIES: CountryOption[] = [
  { code: "VN", name: DEFAULT_NATIONALITY, region: "Asia" },
  {
    code: "GB",
    name: "United Kingdom",
    region: "Europe",
    aliases: ["UK", "Britain", "Great Britain", "British"],
  },
  { code: "GB", name: "England", region: "Europe", aliases: ["English"] },
  { code: "GB", name: "Scotland", region: "Europe", aliases: ["Scottish"] },
  { code: "GB", name: "Wales", region: "Europe", aliases: ["Welsh"] },
  {
    code: "GB",
    name: "Northern Ireland",
    region: "Europe",
    aliases: ["Irish", "Northern Irish"],
  },
  { code: "US", name: "United States", region: "North America" },
  { code: "JP", name: "Japan", region: "Asia" },
  { code: "KR", name: "Korea, Republic of", region: "Asia" },
  { code: "CN", name: "China", region: "Asia" },
  { code: "SG", name: "Singapore", region: "Asia" },
  { code: "TH", name: "Thailand", region: "Asia" },
  { code: "FR", name: "France", region: "Europe" },
  { code: "DE", name: "Germany", region: "Europe" },
  { code: "AU", name: "Australia", region: "Oceania" },
];

const getCountryFlag = (countryCode: string) => {
  if (!/^[A-Z]{2}$/.test(countryCode)) return "🌐";

  return countryCode
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
};

const getCountryDisplayName = (countryCode: string, countryName: string) =>
  countryCode === "VN" ? DEFAULT_NATIONALITY : countryName.trim();

const mergeCountryOptions = (options: CountryOption[]) => {
  const countryByName = new Map<string, CountryOption>();

  [...FALLBACK_COUNTRIES, ...options].forEach((option) => {
    const name = option.name.trim();
    if (!name) return;

    countryByName.set(name.toLowerCase(), {
      ...option,
      code: option.code.toUpperCase(),
      name,
    });
  });

  return Array.from(countryByName.values()).sort((a, b) => {
    if (a.name === DEFAULT_NATIONALITY) return -1;
    if (b.name === DEFAULT_NATIONALITY) return 1;
    return a.name.localeCompare(b.name);
  });
};

const getCountriesNowOptions = (payload: CountriesNowStatesResponse) =>
  (payload.data ?? []).flatMap((country) => {
    const countryCode = country.iso2?.trim().toUpperCase() ?? "";
    const countryName = getCountryDisplayName(
      countryCode,
      country.name?.trim() ?? "",
    );

    const options: CountryOption[] = countryName
      ? [
          {
            code: countryCode,
            name: countryName,
          },
        ]
      : [];

    if (countryCode === "GB") {
      country.states
        ?.filter(
          (state) => state.name && UK_CONSTITUENT_COUNTRIES.has(state.name),
        )
        .forEach((state) => {
          options.push({
            code: countryCode,
            name: state.name!,
            region: "Europe",
          });
        });
    }

    return options;
  });

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

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
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>(
    () => mergeCountryOptions([]),
  );
  const [isCountryLoading, setIsCountryLoading] = useState(false);
  const [isNationalityOptionsOpen, setIsNationalityOptionsOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAgreedToTerms, setIsAgreedToTerms] = useState(false);
  const [isTermsPolicyOpen, setIsTermsPolicyOpen] = useState(false);

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

  const nationalitySearch =
    editingTicketIndex !== null
      ? (tickets[editingTicketIndex]?.nationality ?? "")
      : "";

  const filteredCountryOptions = useMemo(() => {
    const normalizedSearch = nationalitySearch.trim().toLowerCase();

    const matches = normalizedSearch
      ? countryOptions.filter((country) =>
          `${country.name} ${country.code} ${country.region ?? ""} ${
            country.aliases?.join(" ") ?? ""
          } ${
            country.code === "VN" ? "Viet Nam Việt Nam" : ""
          }`
            .toLowerCase()
            .includes(normalizedSearch),
        )
      : countryOptions;

    return matches.slice(0, 12);
  }, [countryOptions, nationalitySearch]);

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

  useEffect(() => {
    const controller = new AbortController();

    const loadCountries = async () => {
      setIsCountryLoading(true);
      try {
        const response = await fetch(COUNTRY_API_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load countries.");
        }

        const payload = (await response.json()) as CountriesNowStatesResponse;
        const loadedCountries = getCountriesNowOptions(payload);

        setCountryOptions(mergeCountryOptions(loadedCountries));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCountryLoading(false);
        }
      }
    };

    loadCountries();

    return () => controller.abort();
  }, []);

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
      nationality: DEFAULT_NATIONALITY,
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
    } catch (error: unknown) {
      showError(getErrorMessage(error, t("booking.passengerExcelDownloadFailed")));
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
    } catch (error: unknown) {
      showError(getErrorMessage(error, t("booking.passengerExcelImportFailed")));
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
        else if (value.length > 100) errors.attendeeName = t("booking.nameTooLong");
        else delete errors.attendeeName;
      }
      if (field === "idCard") {
        if (!value.trim()) errors.idCard = t("booking.idCardRequired");
        else if (value.length > 20) {
          errors.idCard = t("booking.idCardTooLong");
        } else delete errors.idCard;
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
      else if (ticket.attendeeName.length > 100) errors.attendeeName = t("booking.nameTooLong");
      if (!ticket.idCard.trim()) errors.idCard = t("booking.idCardRequired");
      else if (ticket.idCard.length > 20) {
        errors.idCard = t("booking.idCardTooLong");
      }
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

  const handlePaymentClick = () => {
    setHasAttemptedSubmit(true);

    if (!isAgreedToTerms) {
      showError(t("booking.cancellationTermsRequired"));
      return;
    }

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
        openTicketModal(index);
        return;
      }
      if (ticket.attendeeName.length > 100) {
        showError(t("booking.nameTooLong"));
        openTicketModal(index);
        return;
      }
      if (ticket.idCard.length > 20) {
        showError(t("booking.idCardTooLong"));
        openTicketModal(index);
        return;
      }
      if (new Date(ticket.dateOfBirth).getTime() > currentTime) {
        showError(t("booking.dobFuturePassenger", { count: index + 1 }));
        openTicketModal(index);
        return;
      }
    }

    setIsConfirmModalOpen(true);
  };

  const handleConfirmPayment = async () => {
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

    try {
      await handleCreateBooking(
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
      setIsConfirmModalOpen(false);
    } catch (err: unknown) {
      const error = err as any;
      if (error.validationErrors) {
        // Lỗi validation từ backend
        setIsConfirmModalOpen(false); // Đóng popup xác nhận

        // Tìm hành khách đầu tiên bị lỗi và mở modal chỉnh sửa
        const firstErrorKey = Object.keys(error.validationErrors)[0];
        const match = firstErrorKey.match(/OrderDetails\[\d+\]\.Tickets\[(\d+)\]/);
        if (match) {
          const passengerIndex = Number(match[1]);
          showError(t("booking.fillPassengerFields", { count: passengerIndex + 1 }));

          // Dịch lỗi từ backend sang state ticketErrors để hiển thị dưới input
          const newTicketErrors: Record<string, string> = {};
          for (const key in error.validationErrors) {
            if (key.includes(`Tickets[${passengerIndex}]`)) {
              const fieldMatch = key.match(/\.(\w+)$/);
              if (fieldMatch) {
                const fieldName = fieldMatch[1].charAt(0).toLowerCase() + fieldMatch[1].slice(1);
                newTicketErrors[fieldName] = error.validationErrors[key][0];
              }
            }
          }
          
          setTicketErrors(newTicketErrors);
          setEditingTicketIndex(passengerIndex);
        }
      }
    }
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

                  <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <input
                      type="checkbox"
                      id="cancellation-terms-checkbox"
                      checked={isAgreedToTerms}
                      onChange={(e) => setIsAgreedToTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand cursor-pointer"
                    />
                    <label
                      htmlFor="cancellation-terms-checkbox"
                      className="text-xs font-medium leading-relaxed text-slate-600 select-none cursor-pointer"
                    >
                      {t("booking.agreeToCancellationTerms")}{" "}
                      <button
                        type="button"
                        onClick={() => setIsTermsPolicyOpen(true)}
                        className="font-bold text-brand hover:underline"
                      >
                        {t("booking.cancellationPolicy") || "Chính sách hủy"}
                      </button>
                    </label>
                  </div>

                  <ActionButton
                    variant="primary"
                    onClick={handlePaymentClick}
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
                  <div className="relative">
                    <input
                      type="search"
                      autoComplete="off"
                      placeholder={t("booking.nationalitySearchPlaceholder")}
                      value={tickets[editingTicketIndex].nationality}
                      onFocus={() => setIsNationalityOptionsOpen(true)}
                      onBlur={() => {
                        window.setTimeout(
                          () => setIsNationalityOptionsOpen(false),
                          100,
                        );
                      }}
                      onChange={(event) => {
                        setIsNationalityOptionsOpen(true);
                        handleTicketFieldChange(
                          editingTicketIndex,
                          "nationality",
                          event.target.value,
                        );
                      }}
                      className={`w-full rounded-xl border bg-white px-4 py-2.5 pr-12 text-sm outline-none transition-colors ${
                        ticketErrors.nationality
                          ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                          : "border-slate-200 focus:border-brand"
                      }`}
                      required
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm">
                      {getCountryFlag(
                        countryOptions.find(
                          (country) =>
                            country.name.toLowerCase() ===
                            tickets[editingTicketIndex].nationality.trim().toLowerCase(),
                        )?.code ?? "",
                      )}
                    </span>

                    {isNationalityOptionsOpen && (
                      <div className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-xl">
                        {isCountryLoading ? (
                          <div className="px-3 py-2 text-xs font-semibold text-slate-500">
                            {t("booking.loadingNationalities")}
                          </div>
                        ) : filteredCountryOptions.length > 0 ? (
                          filteredCountryOptions.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                handleTicketFieldChange(
                                  editingTicketIndex,
                                  "nationality",
                                  country.name,
                                );
                                setIsNationalityOptionsOpen(false);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-brand-light hover:text-brand"
                            >
                              <span>{getCountryFlag(country.code)}</span>
                              <span className="min-w-0 flex-1 truncate">
                                {country.name}
                              </span>
                              <span className="text-[10px] font-black uppercase text-slate-400">
                                {country.code}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-xs font-semibold text-slate-500">
                            {t("booking.noNationalityMatches")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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

      {isConfirmModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99998] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
            onClick={() => setIsConfirmModalOpen(false)}
          >
            <div
              className="w-full max-w-lg animate-in overflow-hidden rounded-3xl bg-white shadow-2xl fade-in zoom-in-95 duration-200"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-brand">
                    <PackageCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {t("booking.confirmBookingTitle")}
                    </h3>
                    <p className="text-xs font-medium text-slate-500">
                      {t("booking.confirmBookingDesc")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="max-h-[60vh] space-y-4 overflow-y-auto p-6">
                <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between text-sm">
                    <span className="font-medium text-slate-600">{tour.name}</span>
                    <span className="text-right font-bold text-slate-900">
                      {t("booking.passengerCount", { count: ticketCount })}
                    </span>
                  </div>
                  <div className="flex items-start justify-between border-t border-slate-100 pt-3 text-sm">
                    <span className="font-medium text-slate-600">{t("booking.departure")}</span>
                    <span className="text-right font-bold text-slate-900">
                      {new Date(schedule.departureDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Passenger Info section */}
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Users size={16} className="text-slate-500" />
                    {t("booking.passengerDetails") || "Thông tin hành khách"}
                  </h4>
                  <div className="max-h-[150px] overflow-y-auto space-y-3 pr-1 divide-y divide-slate-100">
                    {tickets.map((ticket, idx) => (
                      <div key={ticket.passengerKey || idx} className="text-xs text-slate-600 pt-2.5 first:pt-0">
                        <div className="flex justify-between font-semibold text-slate-800">
                          <span>{idx + 1}. {ticket.attendeeName}</span>
                          <span className="text-slate-500">{ticket.ticketTypeName}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 mt-1 text-[11px] text-slate-500">
                          <div>{t("booking.idPassport")}: <span className="font-medium text-slate-700">{ticket.idCard}</span></div>
                          <div>{t("booking.dob")}: <span className="font-medium text-slate-700">{ticket.dateOfBirth ? new Date(ticket.dateOfBirth).toLocaleDateString() : ""}</span></div>
                          <div>{t("booking.genderLabel")}: <span className="font-medium text-slate-700">{ticket.gender}</span></div>
                          <div>{t("booking.nationalityCol")}: <span className="font-medium text-slate-700">{ticket.nationality}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4">
                  {ticketSummary.map((item) => (
                    <div
                      key={item.scheduleTicketId}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-400">
                          <MoneyDisplay amountVnd={item.price} compact /> x {item.quantity}
                        </div>
                      </div>
                      <span className="font-medium text-slate-900">
                        <MoneyDisplay amountVnd={item.price * item.quantity} compact />
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-slate-100 pt-3 text-sm">
                    <span className="font-medium text-slate-600">{t("booking.subtotal")}</span>
                    <span className="font-bold text-slate-900">
                      <MoneyDisplay amountVnd={totalPrice} compact />
                    </span>
                  </div>
                  {appliedVoucher && (
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-rose-600">{t("booking.discount")}</span>
                      <span className="font-bold text-rose-600">
                        -
                        <MoneyDisplay amountVnd={appliedVoucher.discountAmount} compact />
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between rounded-xl bg-brand-light px-4 py-3">
                    <span className="font-bold text-slate-950">{t("booking.totalPrice")}</span>
                    <span className="whitespace-nowrap text-lg font-bold text-brand">
                      <MoneyDisplay amountVnd={finalPayable} compact />
                    </span>
                  </div>
                </div>

                {appliedVoucher && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                      <p className="text-xs font-medium leading-relaxed text-amber-800">
                        {t("booking.voucherLossWarning")}
                      </p>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
                      <p className="text-xs font-bold leading-relaxed text-rose-800">
                        {t("booking.cancellationWarningVoucherNote")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  {t("booking.backToEdit")}
                </button>
                <ActionButton
                  variant="primary"
                  onClick={handleConfirmPayment}
                  disabled={isSubmitting}
                  className="gap-2 px-5 py-2.5 text-sm"
                >
                  {t("booking.confirmAndPay", { provider: paymentProviderLabel })}
                </ActionButton>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isTermsPolicyOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsTermsPolicyOpen(false)}
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-950">
                  {t("booking.cancellationPolicy") || "Chính sách hủy và hoàn tiền"}
                </h3>
                <button
                  onClick={() => setIsTermsPolicyOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4 text-sm text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-800">
                  {t("booking.refundPolicyTitle")}
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    {t("booking.refund7Days")}
                  </li>
                  <li>
                    {t("booking.refund3To7Days")}
                  </li>
                  <li>
                    {t("booking.refundUnder3Days")}
                  </li>
                </ul>
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-xs text-amber-800">
                  <span className="font-bold block mb-1">{t("booking.voucherWarningTitle")}</span>
                  {t("booking.voucherWarningDetail")}
                </div>
              </div>
              <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsTermsPolicyOpen(false)}
                  className="rounded-xl bg-brand px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-hover"
                >
                  {t("booking.gotIt")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
