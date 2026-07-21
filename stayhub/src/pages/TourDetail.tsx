import React, { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  Home,
  Tag,
  Ticket,
  Calendar,
  X,
  Users,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
  Phone,
  Send,
} from "lucide-react";
import { usePublicTour } from "../hooks/usePublicTour";
import { ActionButton } from "../components/home/ActionButton";
import { PATH } from "../config/routes/route";
import { useQuery } from "@tanstack/react-query";
import { categoryService } from "../features/content/services/category.service";
import { useToast } from "../contexts/ToastContext";
import { useGroupedItineraries } from "../features/tour/hooks/useGroupedItineraries";
import { ticketTypeService } from "../features/content/services/ticketType.service";
import type { ReadTicketTypeDTO } from "../features/content/types/ticketType";
import { tourismInformationService } from "../features/content/services/tourismInformation.service";
import type { TourismInformation } from "../features/content/types/tourismInformation";
import type { TourSchedule } from "../features/tour/types/tourSchedule";
import type { TourItinerary } from "../features/tour/types/tourItinerary";
import type { TourScheduleTicket } from "../features/tour/types/tourScheduleTicket";
import {
  getNumberValue,
  getScheduleTicketAvailable,
  getScheduleTicketName,
  getScheduleTicketTypeId,
} from "../features/tour/utils/tourScheduleTicket";
import { useTranslation } from "../contexts/LocaleContext";
import { useReview } from "../features/tour/hooks/useReview";
import { MoneyDisplay } from "../features/currency/MoneyDisplay";
import { WishlistToggleButton } from "../features/wishlist/customer/components/WishlistToggleButton";
import { FloatingContactWidget } from "../layouts/shared/FloatingContactWidget";
import { SimilarToursSection } from "../features/ai/components/SimilarToursSection";
import { getTicketEffectivePriceInfo } from "../features/tour/utils/tourPrice";
import { apiClient } from "../utils/axiosClient";

type PublicTourItinerary = TourItinerary & {
  startLocationName?: string | null;
  endLocationName?: string | null;
};

const fmtDate = (d: string, locale: string) => {
  const date = new Date(d);
  if (locale === "vi") {
    return `ngày ${String(date.getDate()).padStart(2, "0")} tháng ${String(date.getMonth() + 1).padStart(2, "0")} năm ${date.getFullYear()}`;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getScheduleTickets = (schedule: TourSchedule) =>
  (schedule.tourScheduleTickets ?? []).filter((ticket) => ticket.isActive !== false);

const getScheduleLowestPrice = (schedule: TourSchedule) => {
  const prices = getScheduleTickets(schedule)
    .map((ticket) => getTicketEffectivePriceInfo(ticket).price)
    .filter((price): price is number => price !== null);

  return prices.length > 0 ? Math.min(...prices) : null;
};

const getSchedulePriceRange = (schedule: TourSchedule) => {
  const prices = getScheduleTickets(schedule)
    .map((ticket) => getTicketEffectivePriceInfo(ticket).price)
    .filter((price): price is number => price !== null);

  if (prices.length === 0) return null;

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return { minPrice, maxPrice };
};

const getScheduleAvailableSeats = (schedule: TourSchedule) =>
  getScheduleTickets(schedule).reduce(
    (sum, ticket) => sum + (getScheduleTicketAvailable(ticket) ?? 0),
    0,
  );

const getTicketDisplayName = (
  ticket: TourScheduleTicket,
  ticketTypeDetails: Record<number, ReadTicketTypeDTO>,
) => {
  const ticketTypeId = getScheduleTicketTypeId(ticket);
  return getScheduleTicketName(
    ticket,
    ticketTypeId ? ticketTypeDetails[ticketTypeId] : undefined,
  );
};

const enrichTicketWithTypeDetail = (
  ticket: TourScheduleTicket,
  ticketTypeDetails: Record<number, ReadTicketTypeDTO>,
): TourScheduleTicket => {
  const ticketTypeId = getScheduleTicketTypeId(ticket);
  const ticketType = ticketTypeId ? ticketTypeDetails[ticketTypeId] : undefined;

  if (!ticketType) return ticket;

  return {
    ...ticket,
    ticketTypeId: ticket.ticketTypeId ?? ticketType.id,
    ticketTypeName: getScheduleTicketName(ticket, ticketType),
    ticketType: {
      ...ticket.ticketType,
      id: ticket.ticketType?.id ?? ticketType.id,
      name: ticketType.name,
      description: ticket.ticketType?.description ?? ticketType.description,
      isActive: ticket.ticketType?.isActive ?? ticketType.isActive,
    },
  };
};

const ExpandableText = ({ 
  text, 
  maxLength = 200,
  showMoreLabel,
  showLessLabel,
  className = "text-slate-600 leading-relaxed whitespace-pre-line"
}: { 
  text: string; 
  maxLength?: number;
  showMoreLabel: string;
  showLessLabel: string;
  className?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const needsExpand = text.length > maxLength;
  const displayText = !needsExpand || isExpanded ? text : `${text.substring(0, maxLength)}...`;

  return (
    <div>
      <p className={className}>{displayText}</p>
      {needsExpand && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand/5 px-3 py-1.5 text-xs font-bold text-brand transition-colors hover:bg-brand/10 hover:text-brand-hover"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              {showLessLabel}
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              {showMoreLabel}
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default function PublicTourDetail() {
  const { t, locale } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tour, isLoading, error } = usePublicTour(id ? Number(id) : undefined);
  const { error: showError, success: showSuccess } = useToast();

  // States cho modal tư vấn
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [isSubmittingConsultation, setIsSubmittingConsultation] = useState(false);
  const [consultationForm, setConsultationForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    note: ""
  });

  const [showFullError, setShowFullError] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [expandedTicketScheduleId, setExpandedTicketScheduleId] = useState<number | null>(null);
  const [selectedDayItinerary, setSelectedDayItinerary] = useState<number | null>(null);
  const [currentTime] = useState(() => Date.now());

  const handleConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tour?.id) return;

    try {
      setIsSubmittingConsultation(true);
      await apiClient.post("/tours/request-consultation", {
        tourId: tour.id,
        ...consultationForm
      });
      showSuccess(t("tour.consultationSuccess", { defaultValue: "Yêu cầu tư vấn đã được gửi thành công!" }));
      setIsConsultationModalOpen(false);
      setConsultationForm({ fullName: "", phone: "", email: "", note: "" });
    } catch (err: any) {
      showError(err?.response?.data?.message || t("tour.consultationError", { defaultValue: "Đã có lỗi xảy ra khi gửi yêu cầu tư vấn." }));
    } finally {
      setIsSubmittingConsultation(false);
    }
  };

  const { data: category } = useQuery({
    queryKey: ["category", tour?.categoryId],
    queryFn: () => categoryService.getCategoryById(Number(tour!.categoryId)),
    enabled: !!tour?.categoryId,
  });

  const { expandedItiIds, toggleIti, groupedItineraries } = useGroupedItineraries(tour?.tourItineraries);

  const sortedSchedules = useMemo(() => {
    const arr = [...(tour?.tourSchedules || [])].filter(
      (s) => new Date(s.departureDate).getTime() > Date.now()
    );
    return arr.sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime());
  }, [tour?.tourSchedules]);

  const ticketTypeIds = useMemo(
    () =>
      Array.from(
        new Set(
          sortedSchedules
            .flatMap(getScheduleTickets)
            .map(getScheduleTicketTypeId)
            .filter((ticketTypeId): ticketTypeId is number => ticketTypeId !== null),
        ),
      ),
    [sortedSchedules],
  );

  const tourismInfoIds = useMemo(
    () =>
      Array.from(
        new Set(
          (tour?.tourItineraries ?? [])
            .map((item) => item.tourismInfoId)
            .filter(
              (tourismInfoId): tourismInfoId is number =>
                typeof tourismInfoId === "number" && Number.isFinite(tourismInfoId),
            ),
        ),
      ),
    [tour?.tourItineraries],
  );

  const { data: ticketTypeDetails = {} } = useQuery({
    queryKey: ["public-tour-ticket-types", ticketTypeIds],
    queryFn: async () => {
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

      return Object.fromEntries(
        details.filter((detail): detail is readonly [number, ReadTicketTypeDTO] => detail !== null),
      );
    },
    enabled: ticketTypeIds.length > 0,
  });

  const { data: tourismInformationDetails = {} } = useQuery({
    queryKey: ["tourism-information-details", tourismInfoIds],
    queryFn: async () => {
      const details = await Promise.all(
        tourismInfoIds.map(async (tourismInfoId) => {
          const tourismInfo = await tourismInformationService.getById(tourismInfoId);
          return tourismInfo ? ([tourismInfoId, tourismInfo] as const) : null;
        }),
      );

      return Object.fromEntries(
        details.filter((detail): detail is readonly [number, TourismInformation] => detail !== null),
      );
    },
    enabled: tourismInfoIds.length > 0,
  });

  const groupedSchedules = useMemo(() => {
    return sortedSchedules.reduce((acc, schedule) => {
      const monthYear = new Date(schedule.departureDate).toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!acc[monthYear]) acc[monthYear] = [];
      acc[monthYear].push(schedule);
      return acc;
    }, {} as Record<string, typeof sortedSchedules>);
  }, [sortedSchedules]);

  const availableMonths = Object.keys(groupedSchedules);
  
  let defaultMonth = availableMonths[0];
  if (availableMonths.length > 0) {
    const currentMonthYear = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (availableMonths.includes(currentMonthYear)) {
      defaultMonth = currentMonthYear;
    } else {
      const futureMonth = availableMonths.find(month => 
        groupedSchedules[month].some(schedule => new Date(schedule.departureDate).getTime() > Date.now())
      );
      defaultMonth = futureMonth || availableMonths[availableMonths.length - 1];
    }
  }

  const activeMonth = selectedMonth && availableMonths.includes(selectedMonth) 
    ? selectedMonth 
    : defaultMonth;

  const availableSchedules = useMemo(() => {
    return sortedSchedules.filter(
      (schedule) =>
        new Date(schedule.departureDate).getTime() > currentTime &&
        getScheduleAvailableSeats(schedule) > 0,
    );
  }, [currentTime, sortedSchedules]);

  const selectedSchedule = sortedSchedules.find((s) => s.id === selectedScheduleId);
  const selectedSchedulePrice = selectedSchedule
    ? getScheduleLowestPrice(selectedSchedule)
    : null;
  const selectedScheduleAvailableSeats = selectedSchedule
    ? getScheduleAvailableSeats(selectedSchedule)
    : 0;
  const selectedScheduleTickets = selectedSchedule
    ? getScheduleTickets(selectedSchedule)
    : [];
  const selectedSchedulePriceRange = selectedSchedule
    ? getSchedulePriceRange(selectedSchedule)
    : null;
  const selectedCheckoutTickets = selectedScheduleTickets.map((ticket) =>
    enrichTicketWithTypeDetail(ticket, ticketTypeDetails),
  );
  const selectedCheckoutSchedule =
    selectedSchedule && selectedSchedulePrice !== null && selectedScheduleAvailableSeats > 0
      ? {
          ...selectedSchedule,
          price: selectedSchedulePrice,
          availableSeats: selectedScheduleAvailableSeats,
          tourScheduleTickets: selectedCheckoutTickets,
        }
      : null;
  
  const displayImageUrl = tour?.imageUrl || "";
  const displayName = tour?.name || t("tour.loadingTourDetails");
  const availablePrices = availableSchedules
    .map(getScheduleLowestPrice)
    .filter((price): price is number => price !== null);
  const allPrices = sortedSchedules
    .map(getScheduleLowestPrice)
    .filter((price): price is number => price !== null);
  const minPrice =
    availablePrices.length > 0
      ? Math.min(...availablePrices)
      : allPrices.length > 0
        ? Math.min(...allPrices)
        : null;

  // ==========================================
  // 💥 ODATA REVIEW FILTER & INFINITE SCROLL (ĐÃ SỬA CHUẨN)
  // ==========================================
  const [reviewPage, setReviewPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [dateSortOrder, setDateSortOrder] = useState<"newest" | "oldest">("newest");
  const [localReviews, setLocalReviews] = useState<any[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);

  const { 
    reviews: fetchedReviews, 
    totalCount, 
    isLoading: isReviewsLoading, 
    fetchReviewsByTour 
  } = useReview();

  // 1. Gọi API khi tham số thay đổi
  useEffect(() => {
    if (id) {
      fetchReviewsByTour(Number(id), {
        page: reviewPage,
        pageSize: 5,
        rating: ratingFilter,
        sortOrder: dateSortOrder
      });
    }
  }, [id, reviewPage, ratingFilter, dateSortOrder, fetchReviewsByTour]);

  // 2. Nối (Append) dữ liệu khi cuộn trang
  useEffect(() => {
    if (reviewPage === 1) {
      setLocalReviews(fetchedReviews || []);
    } else {
      setLocalReviews((prev) => {
        const existingIds = new Set(prev.map((r: any) => r.id));
        const newItems = (fetchedReviews || []).filter((r: any) => !existingIds.has(r.id));
        return [...prev, ...newItems];
      });
    }
  }, [fetchedReviews, reviewPage]);

  // 3. Tự động chuyển trang khi cuộn đến cuối - Đã XÓA thay bằng nút Show More / Show Less

  const visibleReviews = localReviews.filter((review) => !review.isHidden);
  
  const reviewsCount = tour?.totalReviews || 0;
  
  const rating = tour?.averageStar || 0;
  const days = tour?.tourItineraries?.length || 0;

  /* Loading */
  if (isLoading) {
    return (
      <div className="min-h-screen -mt-[88px] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />
          {t("tour.loadingTourDetails")}
        </div>
      </div>
    );
  }

  /* Error */
  if (error || !tour) {
    const errorMessage = error || t("tour.tourNotFound");
    const isLongError = errorMessage.length > 100;
    const displayedError =
      showFullError || !isLongError
        ? errorMessage
        : `${errorMessage.substring(0, 100)}...`;
    return (
      <div className="min-h-screen -mt-[88px] flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full bg-rose-50 rounded-2xl p-8 text-center border border-rose-100 shadow-sm">
          <h2 className="text-xl font-bold text-rose-600 mb-3">
            {t("tour.somethingWentWrong")}
          </h2>
          <p className="text-rose-500 mb-6 whitespace-pre-wrap break-words text-sm leading-relaxed">
            {displayedError}
            {isLongError && (
              <button
                type="button"
                onClick={() => setShowFullError(!showFullError)}
                className="ml-2 font-semibold underline hover:text-rose-700 outline-none transition-colors"
              >
                {showFullError ? t("tour.showLess") : t("tour.showMore")}
              </button>
            )}
          </p>
          <ActionButton
            variant="primary"
            onClick={() => navigate("/")}
            className="w-full gap-2 shadow-sm shadow-rose-200"
          >
            <Home size={18} />
            {t("auth.backToHome")}
          </ActionButton>
        </div>
      </div>
    );
  }

  const tourItineraries = tour.tourItineraries || [];

  return (
    <div className="-mt-[88px] bg-white">
      {/* HERO */}
      <div className="relative h-[75vh] min-h-[560px] w-full overflow-hidden bg-slate-900">
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt={displayName}
            className="absolute inset-0 h-full w-full object-cover scale-105 transition-transform duration-[8s] hover:scale-100"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/20 text-2xl md:text-3xl font-black uppercase tracking-[0.2em] text-center px-4">{t("tour.visualsComingSoon")}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        {/* Wishlist */}
        <div className="absolute top-[100px] right-6 z-10">
          {!isLoading && tour && (
            <WishlistToggleButton tourId={Number(tour.id)} tourStatus={tour.status} variant="hero" />
          )}
        </div>

        {/* Hero text */}
        <div className="absolute bottom-0 left-0 right-0 pb-8 md:pb-12 lg:pb-16 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-300">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            {/* Tags */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-white/90 text-xs font-semibold tracking-wide uppercase">
                <Tag size={11} />
                {category?.name ? category.name : tour.categoryId ? `${t("tour.category")} ${tour.categoryId}` : t("tour.tour")}
              </span>
              {(tour.address || [tour.city, tour.country].filter(Boolean).join(", ")) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-white/90 text-xs font-semibold">
                  <MapPin size={11} />
                  {tour.address || [tour.city, tour.country].filter(Boolean).join(", ")}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6 max-w-4xl">
              {displayName}
            </h1>

            {/* Stats pills */}
            <div className="flex flex-wrap items-center gap-3">
              {rating > 0 && (
                <div className="flex items-center gap-2 bg-amber-400/20 backdrop-blur-md border border-amber-300/30 rounded-full px-4 py-2">
                  <Star
                    className="text-amber-300"
                    fill="currentColor"
                    size={15}
                  />
                  <span className="text-white font-bold text-sm">
                    {rating.toFixed(1)}
                  </span>
                  <span className="text-white/70 text-xs">
                    {t("tour.reviewsLabel", { count: reviewsCount })}
                  </span>
                </div>
              )}
              {days > 0 && (
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-2">
                  <Clock size={14} className="text-white/80" />
                  <span className="text-white font-semibold text-sm">
                    {days} {t("tour.daysStat")}
                  </span>
                </div>
              )}
          {sortedSchedules.length > 0 && (
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-2">
                  <Users size={14} className="text-white/80" />
                  <span className="text-white font-semibold text-sm">
                {t("tour.schedulesLabel", { count: sortedSchedules.length })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 xl:gap-14">
          {/* LEFT */}
          <div className="space-y-16 min-w-0">
            {/* Overview */}
            <section>
              <SectionLabel>{t("tour.overview")}</SectionLabel>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                {t("tour.aboutExperience")}
              </h2>
              <div className="prose prose-sm text-slate-600 leading-relaxed text-[15px]">
                {tour.description ? (
                  <div
                    className="[&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-5 [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: tour.description.replace(/&nbsp;/g, ' ') }}
                  />
                ) : (
                  <p className="italic text-slate-400">{t("tour.noDescription")}</p>
                )}
              </div>
            </section>

            {/* Highlights */}
            <section>
              <SectionLabel>{t("tour.whyChooseTour")}</SectionLabel>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                {t("tour.highlights")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: "🧭", text: t("tour.expertGuide") },
                  { icon: "🚌", text: t("tour.comfortableTransport") },
                  { icon: "🎫", text: t("tour.entranceFeesIncluded") },
                  { icon: "✋", text: t("tour.freeCancellation") },
                ].map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 bg-slate-50 rounded-2xl border border-slate-100 px-5 py-4"
                  >
                    <span className="text-2xl">{h.icon}</span>
                    <span className="font-semibold text-slate-700 text-sm">
                      {h.text}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Itinerary */}
            <section>
              <SectionLabel>{t("tour.yourJourney")}</SectionLabel>
              <h2 className="text-2xl font-bold text-slate-800 mb-8">
                {t("tour.itinerary")}
              </h2>
              
              {tourItineraries.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-brand via-brand-light to-transparent hidden sm:block" />
                  <div className="space-y-6">
                    {Object.entries(groupedItineraries)
                      .map(([dayStr]) => Number(dayStr))
                      .sort((a, b) => a - b)
                      .map((dayNumber) => {
                        const dayItineraries = groupedItineraries[dayNumber] as PublicTourItinerary[];
                        
                        return (
                          <div key={dayNumber} className="flex gap-5 sm:gap-8">
                            <div className="relative z-10 shrink-0 hidden sm:block">
                              <div className="h-10 w-10 rounded-full bg-brand flex items-center justify-center shadow-md shadow-blue-200">
                                <span className="text-white font-black text-xs">
                                  {dayNumber}
                                </span>
                              </div>
                            </div>
                            <button 
                              onClick={() => setSelectedDayItinerary(dayNumber)}
                              className="flex-1 text-left rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand hover:shadow-md transition-all flex items-start justify-between group"
                            >
                              <div className="flex-1 min-w-0 pr-4">
                                <h3 className="text-lg font-black text-slate-800 group-hover:text-brand transition-colors mb-3">
                                  {t("tour.dayLabel", { count: dayNumber })}
                                </h3>
                                <div className="flex flex-col gap-2">
                                  {dayItineraries.map((iti) => (
                                    <div key={iti.id} className="flex items-start gap-2 text-sm font-medium text-slate-600">
                                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/60" />
                                      <span className="line-clamp-2 leading-relaxed">{iti.title}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="h-10 w-10 shrink-0 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all mt-1">
                                <ChevronRight size={20} />
                              </div>
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 bg-slate-50 rounded-xl p-6 text-center">
                  {t("tour.noItineraryDetails")}
                </p>
              )}
            </section>

           {/* Reviews */}
            <section>
              <SectionLabel>{t("tour.whatTravelersSay")}</SectionLabel>
             {/* 💥 BỘ LỌC SAO & NGÀY (DROPDOWN) */}
              <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <h2 className="text-2xl font-bold text-slate-800">
                  {t("tour.reviews")}
                </h2>
                
                <div className="flex flex-wrap items-center gap-3">
                  {/* Dropdown Lọc theo sao */}
                  <div className="relative">
                    <select
                      value={ratingFilter === null ? "" : ratingFilter}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReviewPage(1);
                        setLocalReviews([]);
                        setRatingFilter(val === "" ? null : Number(val));
                      }}
                      className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition-colors hover:border-brand/50 focus:border-brand focus:ring-2 focus:ring-brand/20 cursor-pointer"
                    >
                      <option value="">{t("common.all")} {t("tour.rating")}</option>
                      <option value="5">5 {t("tour.stars") || "Stars"}</option>
                      <option value="4">4 {t("tour.stars") || "Stars"}</option>
                      <option value="3">3 {t("tour.stars") || "Stars"}</option>
                      <option value="2">2 {t("tour.stars") || "Stars"}</option>
                      <option value="1">1 {t("tour.stars") || "Star"}</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>

                  {/* Dropdown Sắp xếp theo ngày */}
                  <div className="relative">
                    <select
                      value={dateSortOrder}
                      onChange={(e) => {
                        setDateSortOrder(e.target.value as "newest" | "oldest");
                        setReviewPage(1);
                        setLocalReviews([]);
                      }}
                      className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition-colors hover:border-brand/50 focus:border-brand focus:ring-2 focus:ring-brand/20 cursor-pointer"
                    >
                      <option value="newest">{t("tour.newestFirst") || "Newest First"}</option>
                      <option value="oldest">{t("tour.oldestFirst") || "Oldest First"}</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Rating summary */}
              <div className="flex items-center gap-8 mb-10 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="text-center shrink-0">
                  <div className="text-5xl font-black text-slate-800">
                    {rating > 0 ? rating.toFixed(1) : "-"}
                  </div>
                  <div className="flex justify-center text-amber-400 mt-2 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        fill="currentColor"
                        size={16}
                        className={i < Math.round(rating) ? "text-amber-400" : "text-slate-200"}
                      />
                    ))}
                  </div>
                  <div className="text-slate-400 text-xs">
                    {reviewsCount === 1 ? t("tour.reviewCount", { count: reviewsCount }) : t("tour.reviewsCount", { count: reviewsCount })}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    let count = 0;
                    if (star === 5) count = tour?.fiveStarCount || 0;
                    if (star === 4) count = tour?.fourStarCount || 0;
                    if (star === 3) count = tour?.threeStarCount || 0;
                    if (star === 2) count = tour?.twoStarCount || 0;
                    if (star === 1) count = tour?.oneStarCount || 0;

                    const pct = reviewsCount > 0 ? (count / reviewsCount) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="w-3">{star}</span>
                        <Star size={11} fill="currentColor" className="text-amber-400 shrink-0" />
                        <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-amber-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-4 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review list */}
              <div className="space-y-6">
                {visibleReviews.length > 0 ? (
                  visibleReviews.map((review) => {
                    const reviewerName = review.customerName || review.CustomerName || (review.customerId ? `Customer #${review.customerId}` : t("tour.anonymousCustomer"));
                    const initials = reviewerName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "A";
                    const reviewRating = review.rating || 0;
                    
                    return (
                      <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full border border-blue-200 bg-blue-100 flex items-center justify-center text-brand font-bold text-lg uppercase shrink-0 overflow-hidden">
                              {review.customerAvatar ? (
                                <img src={review.customerAvatar} alt={reviewerName} className="h-full w-full object-cover" />
                              ) : (
                                initials
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{reviewerName}</div>
                              {review.createdAt && (
                                <div className="text-xs text-slate-400">{fmtDate(review.createdAt, locale)}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} fill="currentColor" size={16} className={i >= reviewRating ? "text-slate-200" : ""} />
                            ))}
                          </div>
                        </div>
                        <ExpandableText
                          text={review.comment || t("tour.noComment")}
                          showMoreLabel={t("tour.showMore", "Xem thêm")}
                          showLessLabel={t("tour.showLess", "Thu gọn")}
                          className="text-slate-600 leading-relaxed"
                        />

                        {review.replies && review.replies.length > 0 && (
                          <div className="mt-4 space-y-4">
                            {review.replies.map((reply: any) => {
                              const replyName = t("tour.tourManager"); 
                              const replyInitial = "TM";

                              return (
                                <div key={reply.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                  <div className="mb-3 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm uppercase">
                                      {replyInitial}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                        <span>{replyName}</span>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-xs font-medium text-slate-500">
                                          {reply.createdAt ? fmtDate(reply.createdAt, locale) : ""}
                                        </span>
                                      </div>
                                      <div className="text-xs text-slate-500">{t("tour.replyToReview")}</div>
                                    </div>
                                  </div>
                                  <ExpandableText
                                    text={reply.content}
                                    showMoreLabel={t("tour.showMore", "Xem thêm")}
                                    showLessLabel={t("tour.showLess", "Thu gọn")}
                                    className="text-sm text-slate-700 leading-relaxed"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  !isReviewsLoading && (
                    <p className="text-slate-500 bg-slate-50 rounded-xl p-6 text-center">
                      {t("tour.noReviewsYet")}
                    </p>
                  )
                )}

                {localReviews.length > 0 && (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-4 border-t border-slate-100 pt-8">
                    {localReviews.length < (totalCount || 0) && (
                      <button
                        onClick={() => setReviewPage(prev => prev + 1)}
                        disabled={isReviewsLoading}
                        className="group relative overflow-hidden rounded-xl bg-white px-8 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-brand hover:ring-brand/50 hover:shadow-md disabled:opacity-50"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {isReviewsLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-brand" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400 transition-colors group-hover:text-brand" />
                          )}
                          {isReviewsLoading ? t("common.loading", "Đang tải...") : t("tour.showMore", "Xem thêm")}
                        </span>
                        <div className="absolute inset-0 z-0 bg-gradient-to-r from-brand/0 via-brand/5 to-brand/0 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    )}
                    {reviewPage > 1 && (
                      <button
                        onClick={() => {
                          setReviewPage(1);
                          setLocalReviews(localReviews.slice(0, 5));
                        }}
                        disabled={isReviewsLoading}
                        className="group flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-sm font-bold text-slate-500 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-700 hover:ring-slate-300 disabled:opacity-50"
                      >
                        <ChevronUp className="h-4 w-4 text-slate-400 transition-colors group-hover:text-slate-600" />
                        {t("tour.showLess", "Ẩn bớt")}
                      </button>
                    )}
                  </div>
                )}
                
                {isReviewsLoading && localReviews.length === 0 && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-brand" />
                  </div>
                )}
              </div>
            </section>
            
            {/* Similar Tours */}
            {tour && <SimilarToursSection tourId={Number(tour.id)} />}
          </div>

          {/* RIGHT: Booking widget */}
          <div className="lg:col-span-1">
            <div>
              <div className="rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
                {/* Price strip */}
                <div className="bg-gradient-to-r from-brand to-brand px-6 py-5">
                  <span className="text-blue-100 text-xs font-semibold uppercase tracking-widest">
                    {t("tour.startingFrom")}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-white">
                      {minPrice !== null ? (
                        <MoneyDisplay amountVnd={minPrice} compact />
                      ) : (
                        t("tour.noPrice")
                      )}
                    </span>
                    {minPrice !== null && (
                      <span className="text-blue-200 text-sm ml-1">
                        / {t("tour.perPerson")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <h3 className="mb-3 font-bold text-slate-800">
                      {t("tour.departureDate")}
                    </h3>

                    {selectedSchedule ? (
                      <div className="rounded-2xl border border-brand bg-brand-light/30 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-500">
                              {t("tour.selectedSchedule")}
                            </div>
                            <div className="font-bold text-slate-900 mt-1 text-sm">
                              {fmtDate(selectedSchedule.departureDate, locale)} -{" "}
                              {fmtDate(selectedSchedule.returnDate, locale)}
                            </div>
                            <div className="text-xs font-medium text-emerald-600 mt-1">
                              {t("tour.seatsLeft", { count: selectedScheduleAvailableSeats })}
                            </div>
                          </div>
                          <button
                            onClick={() => setIsScheduleModalOpen(true)}
                            className="text-sm font-bold text-brand hover:text-brand-hover underline"
                          >
                            {t("tour.change")}
                          </button>
                        </div>
                        <div className="border-t border-brand/20/50 pt-3 flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">
                            {t("tour.priceRangeLabel")}
                          </span>
                          <span className="font-bold text-slate-900">
                            {selectedSchedulePriceRange ? (
                              selectedSchedulePriceRange.minPrice === selectedSchedulePriceRange.maxPrice ? (
                                <MoneyDisplay amountVnd={selectedSchedulePriceRange.minPrice} compact />
                              ) : (
                                <>
                                  <MoneyDisplay amountVnd={selectedSchedulePriceRange.minPrice} compact />
                                  {" - "}
                                  <MoneyDisplay amountVnd={selectedSchedulePriceRange.maxPrice} compact />
                                </>
                              )
                            ) : (
                              t("tour.noPrice")
                            )}
                          </span>
                        </div>
                        {selectedScheduleTickets.length > 0 && (
                          <div className="mt-3 space-y-2 border-t border-brand/20/50 pt-3">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-400">
                              <Ticket className="h-3.5 w-3.5" />
                              {t("tour.ticketOptions")}
                            </div>
                            {selectedScheduleTickets.map((ticket) => {
                              const ticketAvailable = getScheduleTicketAvailable(ticket) ?? 0;

                              return (
                                <div
                                  key={ticket.id}
                                  className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
                                >
                                  <div className="min-w-0">
                                    <div className="truncate font-semibold text-slate-800">
                                      {getTicketDisplayName(ticket, ticketTypeDetails)}
                                    </div>
                                    <div className="text-xs font-medium text-slate-400">
                                      {t("tour.left", { count: ticketAvailable })}
                                    </div>
                                  </div>
                                  <div className="shrink-0 font-bold text-slate-900 text-right">
                                    {getTicketEffectivePriceInfo(ticket).price !== null ? (
                                      <>
                                        {getTicketEffectivePriceInfo(ticket).originalPrice !== null && (
                                          <div className="text-[10px] font-medium text-slate-400 line-through mb-0.5">
                                            <MoneyDisplay amountVnd={getTicketEffectivePriceInfo(ticket).originalPrice!} compact />
                                          </div>
                                        )}
                                        <MoneyDisplay amountVnd={getTicketEffectivePriceInfo(ticket).price!} compact />
                                      </>
                                    ) : (
                                      t("tour.noPrice")
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="w-full flex items-center justify-between rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 hover:border-brand hover:bg-brand-light transition-all group"
                      >
                        <div className="flex items-center gap-3 text-slate-600 group-hover:text-brand">
                          <Calendar className="h-5 w-5" />
                          <span className="font-medium">{t("tour.selectDate")}</span>
                        </div>
                        <ChevronRight
                          size={18}
                          className="text-slate-300 group-hover:text-brand transition-colors"
                        />
                      </button>
                    )}
                  </div>

                  <div className="flex items-stretch gap-3">
                    <ActionButton
                      variant="primary"
                      className="flex-1 py-4 text-base shadow-lg shadow-brand/30 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                      disabled={!selectedCheckoutSchedule}
                      onClick={() => {
                        navigate(PATH.CUSTOMER.CHECKOUT(tour.id), {
                          state: { tour, schedule: selectedCheckoutSchedule },
                        });
                      }}
                    >
                      {t("tour.proceedToBooking")}
                    </ActionButton>

                    <button
                      onClick={() => setIsConsultationModalOpen(true)}
                      className="flex w-[72px] shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand hover:bg-brand hover:text-white transition-colors border border-brand/20 shadow-sm"
                      title={t("tour.requestConsultation", { defaultValue: "Yêu cầu tư vấn" })}
                    >
                      <Phone size={24} className="fill-brand-light/20" />
                    </button>
                  </div>

                  <div className="text-center text-xs font-medium text-slate-400">
                    {t("tour.notChargedYet")}
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-black text-brand">
                    {days || "-"}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    {t("tour.daysStat")}
                  </div>
                </div>
                <div className="border-x border-slate-100">
                  <div className="text-lg font-black text-brand">
                    {reviewsCount || "-"}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    {t("tour.reviewsStat")}
                  </div>
                </div>
                <div>
                  <div className="text-lg font-black text-brand">
                    {rating > 0 ? rating.toFixed(1) : "-"}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    {t("tour.ratingStat")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SCHEDULE MODAL */}
      {isScheduleModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[99998] flex items-end sm:items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
            onClick={(e) =>
              e.target === e.currentTarget && setIsScheduleModalOpen(false)
            }
          >
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {t("tour.selectSchedule")}
                </h3>
                <p className="text-sm text-slate-400 mt-0.5">
              {sortedSchedules.length === 1 ? t("tour.scheduleCount", { count: sortedSchedules.length }) : t("tour.schedulesCount", { count: sortedSchedules.length })}
                </p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {availableMonths.length > 0 && (
              <div className="border-b border-slate-100 px-6 flex items-center gap-6 overflow-x-auto thin-scrollbar">
                {availableMonths.map((month) => (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    className={`whitespace-nowrap py-4 text-sm font-bold border-b-2 transition-colors ${
                      activeMonth === month
                        ? "border-brand text-brand"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}

            <div className="p-6 max-h-[60vh] overflow-y-auto bg-slate-50/30 thin-scrollbar">
              {availableMonths.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {groupedSchedules[activeMonth].map((schedule) => {
                    const isSelected = selectedScheduleId === schedule.id;
                    const depDate = new Date(schedule.departureDate);
                    const retDate = new Date(schedule.returnDate);
                    const nights = Math.round(
                      (retDate.getTime() - depDate.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    const scheduleAvailableSeats = getScheduleAvailableSeats(schedule);
                    const schedulePrice = getScheduleLowestPrice(schedule);
                    const schedulePriceRange = getSchedulePriceRange(schedule);
                    const scheduleTickets = getScheduleTickets(schedule);
                    const isExpandedTickets = expandedTicketScheduleId === schedule.id;
                    const isExpired = depDate.getTime() < currentTime;
                    const isSoldOut = !isExpired && scheduleAvailableSeats <= 0;
                    const hasNoPrice = schedulePrice === null;
                    const isUnavailable = isExpired || isSoldOut || hasNoPrice;

                    return (
                      <div
                        key={schedule.id}
                        className={`relative text-left rounded-2xl border-2 p-5 transition-all
                          ${
                            isSelected
                              ? "border-brand bg-brand-light/50 ring-1 ring-brand shadow-md"
                              : isUnavailable
                              ? "border-slate-100 bg-slate-50/50 opacity-70 cursor-not-allowed grayscale-[50%]"
                              : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm"
                          }`}
                      >
                        {isSelected && (
                          <div className="absolute right-3 top-3 h-5 w-5 rounded-full bg-brand flex items-center justify-center">
                            <CheckCircle2 size={12} className="text-white" />
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                          {/* Left: Date & Info */}
                          <div className="flex items-center gap-5">
                            <div
                              className={`rounded-xl px-3 py-2 text-center min-w-[64px] shrink-0 ${isSelected ? "bg-brand" : "bg-slate-100"}`}
                            >
                              <div
                                className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? "text-blue-200" : "text-slate-400"}`}
                              >
                                {depDate.toLocaleDateString("en", {
                                  month: "short",
                                })}
                              </div>
                              <div
                                className={`text-2xl font-black leading-none mt-1 ${isSelected ? "text-white" : "text-slate-800"}`}
                              >
                                {depDate.getDate()}
                              </div>
                            </div>

                            <div className="min-w-0">
                              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                {t("tour.departureReturn")} • {nights} {nights !== 1 ? t("tour.nightsLabel") : t("tour.night")}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-slate-800">
                                <span>{fmtDate(schedule.departureDate, locale)}</span>
                                <span className="text-slate-300">→</span>
                                <span>{fmtDate(schedule.returnDate, locale)}</span>
                              </div>
                              <div className="mt-2.5">
                                <span
                                  className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shrink-0 ${
                                    isExpired
                                      ? "bg-slate-200 text-slate-500"
                                      : hasNoPrice
                                      ? "bg-slate-200 text-slate-500"
                                      : isSoldOut
                                      ? "bg-rose-100 text-rose-600"
                                      : scheduleAvailableSeats <= 5
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-emerald-50 text-emerald-600"
                                  }`}
                                >
                                  {isExpired
                                    ? t("tour.expired")
                                    : hasNoPrice
                                    ? t("tour.noPrice")
                                    : isSoldOut
                                    ? t("tour.soldOut")
                                    : scheduleAvailableSeats <= 5
                                    ? t("tour.fewSeatsLeft", { count: scheduleAvailableSeats })
                                    : t("tour.seatsLeft", { count: scheduleAvailableSeats })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Price & Actions */}
                          <div className="flex flex-col sm:items-end gap-3 sm:border-l sm:border-slate-100 sm:pl-5 pt-3 sm:pt-0 border-t border-slate-100 sm:border-t-0 mt-3 sm:mt-0">
                            <div className="flex flex-col sm:items-end">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                {t("tour.fromPrice", { defaultValue: "From" })}
                              </span>
                              <span className={`text-lg font-black ${isUnavailable ? "text-slate-400 line-through" : "text-brand"}`}>
                                {schedulePriceRange ? (
                                  schedulePriceRange.minPrice === schedulePriceRange.maxPrice ? (
                                    <MoneyDisplay amountVnd={schedulePriceRange.minPrice} compact />
                                  ) : (
                                    <>
                                      <MoneyDisplay amountVnd={schedulePriceRange.minPrice} compact />
                                      <span className="text-slate-300 mx-1 font-normal">-</span>
                                      <MoneyDisplay amountVnd={schedulePriceRange.maxPrice} compact />
                                    </>
                                  )
                                ) : (
                                  t("tour.noPrice")
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                              {scheduleTickets.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedTicketScheduleId((currentId) =>
                                      currentId === schedule.id ? null : schedule.id,
                                    )
                                  }
                                  className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 rounded-xl bg-slate-100/80 px-3 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
                                >
                                  {isExpandedTickets ? t("tour.hide") : t("tour.tickets")}
                                  {isExpandedTickets ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={isUnavailable}
                                onClick={() => {
                                  if (isExpired) {
                                    showError(t("tour.scheduleExpired"));
                                    return;
                                  }
                                  if (isSoldOut) {
                                    showError(t("tour.scheduleSoldOut"));
                                    return;
                                  }
                                  if (hasNoPrice) {
                                    showError(t("tour.scheduleNoPrice"));
                                    return;
                                  }
                                  setSelectedScheduleId(schedule.id);
                                  setIsScheduleModalOpen(false);
                                }}
                                className="flex-1 sm:flex-none min-w-[120px] rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                              >
                                {isSelected ? t("tour.selected") : t("common.select")}
                              </button>
                            </div>
                          </div>
                        </div>

                        {scheduleTickets.length > 0 && isExpandedTickets && (
                          <div className="mt-4 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
                            {scheduleTickets.map((ticket) => {
                              const ticketPrice = getNumberValue(ticket.price);
                              const ticketAvailable =
                                getScheduleTicketAvailable(ticket) ?? 0;

                              return (
                                <div
                                  key={ticket.id}
                                  className="rounded-xl border border-slate-100 bg-white px-3 py-2"
                                >
                                  <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="min-w-0 truncate font-semibold text-slate-800">
                                      {getTicketDisplayName(ticket, ticketTypeDetails)}
                                    </span>
                                    <span className="shrink-0 font-bold text-slate-900 text-right">
                                      {ticketPrice !== null ? (
                                        <>
                                          {getTicketEffectivePriceInfo(ticket).originalPrice !== null && (
                                            <div className="text-[10px] font-medium text-slate-400 line-through mb-0.5">
                                              <MoneyDisplay amountVnd={getTicketEffectivePriceInfo(ticket).originalPrice!} compact />
                                            </div>
                                          )}
                                          <MoneyDisplay amountVnd={getTicketEffectivePriceInfo(ticket).price!} compact />
                                        </>
                                      ) : (
                                        t("tour.noPrice")
                                      )}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-xs font-medium text-slate-400">
                                    {t("tour.available", { count: ticketAvailable })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-medium text-slate-500 border border-dashed border-slate-200">
                  {t("tour.noUpcomingSchedules")}
                </div>
              )}
            </div>
          </div>
          </div>,
          document.body,
        )}

      {selectedDayItinerary !== null &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setSelectedDayItinerary(null)}>
            <div 
              className="relative flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-white z-10">
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {t("tour.dayLabel", { count: selectedDayItinerary })}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDayItinerary(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-6 overflow-y-auto thin-scrollbar bg-slate-50 relative">
                <div className="space-y-6 relative">
                  {/* Timeline vertical line */}
                  <div className="absolute left-4 top-4 bottom-4 w-[2px] bg-slate-200 hidden sm:block" />
                  
                  {((groupedItineraries[selectedDayItinerary] || []) as PublicTourItinerary[]).map((iti) => {
                    const tourismInfo = iti.tourismInfoId ? tourismInformationDetails[iti.tourismInfoId] : null;
                    return (
                      <div key={iti.id} className="relative sm:pl-14">
                        {/* Timeline icon */}
                        <div className="absolute left-[2px] top-5 hidden sm:flex h-[30px] w-[30px] items-center justify-center rounded-full bg-brand text-white shadow-md ring-4 ring-slate-50 z-10">
                          <MapPin size={14} className="fill-brand-light" />
                        </div>
                        
                        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:border-brand/20 transition-colors">
                          <h4 className="text-lg font-bold text-slate-800 mb-3">{iti.title}</h4>
                          
                          {iti.description && (
                            <div
                              className="prose prose-sm mb-4 text-slate-600 leading-relaxed [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-5 [&_ul]:pl-5"
                              dangerouslySetInnerHTML={{ __html: iti.description.replace(/&nbsp;/g, ' ') }}
                            />
                          )}
                          
                          {(iti.locationName || iti.startLocationName || iti.endLocationName || iti.tourismInfoId) && (
                            <div className="flex flex-col gap-2 text-sm text-slate-500 bg-slate-50/50 border border-slate-100 p-4 rounded-xl">
                              {iti.locationName && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                                  <span className="font-medium text-slate-700">{iti.locationName}</span>
                                </div>
                              )}
                              {iti.startLocationName && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                  <div><span className="font-semibold text-slate-700">{t("tour.start")}:</span> {iti.startLocationName}</div>
                                </div>
                              )}
                              {iti.endLocationName && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                  <div><span className="font-semibold text-slate-700">{t("tour.end")}:</span> {iti.endLocationName}</div>
                                </div>
                              )}
                              
                              {iti.tourismInfoId && (
                                <div className="mt-2 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
                                  {tourismInfo ? (
                                    <div className="grid sm:grid-cols-[120px_1fr]">
                                      <div className="flex min-h-[100px] items-center justify-center bg-slate-100">
                                        {tourismInfo.imageUrl ? (
                                          <img
                                            src={tourismInfo.imageUrl}
                                            alt={tourismInfo.name}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <ImageIcon className="h-6 w-6" />
                                            <span className="text-[10px] font-medium">{t("tour.noImage")}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="p-4 space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="font-bold text-slate-800 text-sm">{tourismInfo.name}</span>
                                          <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold text-brand">
                                            {tourismInfo.type}
                                          </span>
                                        </div>
                                        {tourismInfo.description && (
                                          <p className="text-xs leading-relaxed text-slate-500 line-clamp-2">
                                            {tourismInfo.description}
                                          </p>
                                        )}
                                        {tourismInfo.sourceUrl && (
                                          <a
                                            href={tourismInfo.sourceUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-brand hover:text-brand-hover"
                                          >
                                            {tourismInfo.sourceName || t("tour.source")}
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 p-3 text-xs">
                                      <Tag className="h-3.5 w-3.5 text-brand shrink-0" />
                                      <span className="font-semibold text-slate-700">
                                        {t("tour.tourismInfoId", { id: iti.tourismInfoId })}
                                      </span>
                                    </div>
                                  )}
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
            </div>
          </div>,
          document.body,
        )}

      <FloatingContactWidget />

      {isConsultationModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => !isSubmittingConsultation && setIsConsultationModalOpen(false)}>
            <div 
              className="relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-white">
                <h3 className="text-xl font-black text-slate-900">
                  {t("tour.consultationTitle", { defaultValue: "Yêu cầu tư vấn" })}
                </h3>
                <button
                  onClick={() => !isSubmittingConsultation && setIsConsultationModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  disabled={isSubmittingConsultation}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 bg-slate-50">
                <form onSubmit={handleConsultationSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("tour.fullName", { defaultValue: "Họ và tên" })} *</label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all bg-white"
                      placeholder={t("tour.fullNamePlaceholder", { defaultValue: "Nhập họ và tên của bạn" })}
                      value={consultationForm.fullName}
                      onChange={(e) => setConsultationForm(prev => ({ ...prev, fullName: e.target.value }))}
                      disabled={isSubmittingConsultation}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("tour.phone", { defaultValue: "Số điện thoại" })} *</label>
                    <input
                      type="tel"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all bg-white"
                      placeholder={t("tour.phonePlaceholder", { defaultValue: "Nhập số điện thoại" })}
                      value={consultationForm.phone}
                      onChange={(e) => setConsultationForm(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={isSubmittingConsultation}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("tour.email", { defaultValue: "Email" })} *</label>
                    <input
                      type="email"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all bg-white"
                      placeholder={t("tour.emailPlaceholder", { defaultValue: "Nhập địa chỉ email" })}
                      value={consultationForm.email}
                      onChange={(e) => setConsultationForm(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isSubmittingConsultation}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("tour.note", { defaultValue: "Ghi chú" })}</label>
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all bg-white resize-none"
                      placeholder={t("tour.notePlaceholder", { defaultValue: "Nhập yêu cầu tư vấn cụ thể của bạn..." })}
                      value={consultationForm.note}
                      onChange={(e) => setConsultationForm(prev => ({ ...prev, note: e.target.value }))}
                      disabled={isSubmittingConsultation}
                    ></textarea>
                  </div>
                  
                  <div className="pt-2">
                    <ActionButton
                      type="submit"
                      variant="primary"
                      className="w-full py-3.5 text-base shadow-lg shadow-brand/30 disabled:opacity-50 disabled:shadow-none"
                      disabled={isSubmittingConsultation}
                    >
                      {isSubmittingConsultation ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 size={18} className="animate-spin" />
                          <span>{t("tour.sendingConsultation", { defaultValue: "Đang gửi..." })}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Send size={18} />
                          <span>{t("tour.sendConsultationRequest", { defaultValue: "Gửi yêu cầu" })}</span>
                        </div>
                      )}
                    </ActionButton>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-[2px] w-6 bg-brand rounded-full" />
      <span className="text-[11px] font-black uppercase tracking-[0.15em] text-brand">
        {children}
      </span>
    </div>
  );
}
