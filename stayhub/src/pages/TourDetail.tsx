import { useState, useMemo, useContext } from "react";
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
} from "lucide-react";
import { usePublicTour } from "../hooks/usePublicTour";
import { ActionButton } from "../components/home/ActionButton";
import { PATH } from "../config/routes/route";
import { WishlistToggleButton } from "../features/wishlist/customer/components/WishlistToggleButton";
import { useQuery } from "@tanstack/react-query";
import { categoryService } from "../features/content/services/category.service";
import { useToast } from "../contexts/ToastContext";
import { AuthContext } from "../contexts/AuthContext";
import { useGroupedItineraries } from "../features/tour/hooks/useGroupedItineraries";
import { useGetTourItineraries } from "../features/social/tours/hooks/useTourItineraries";
import { TourItineraryMap } from "../features/social/tours/components/TourItineraryMap";
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

type PublicTourItinerary = TourItinerary & {
  startLocationName?: string | null;
  endLocationName?: string | null;
};


const fmt = (n: number) => n.toLocaleString("vi-VN");
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const getReviewCustomerName = (review: any) =>
  review.customerName || review.CustomerName || review.customerId
    ? String(review.customerName || review.CustomerName || `Customer #${review.customerId}`)
    : "Anonymous Customer";

const getReviewReplyName = (reply: any) =>
  reply.userName || reply.UserName || reply.userId
    ? String(reply.userName || reply.UserName || `Staff #${reply.userId}`)
    : "Staff";

const getScheduleTickets = (schedule: TourSchedule) =>
  (schedule.tourScheduleTickets ?? []).filter((ticket) => ticket.isActive !== false);

const getScheduleLowestPrice = (schedule: TourSchedule) => {
  const prices = getScheduleTickets(schedule)
    .map((ticket) => getNumberValue(ticket.price))
    .filter((price): price is number => price !== null);

  return prices.length > 0 ? Math.min(...prices) : null;
};

const getSchedulePriceText = (schedule: TourSchedule) => {
  const prices = getScheduleTickets(schedule)
    .map((ticket) => getNumberValue(ticket.price))
    .filter((price): price is number => price !== null);

  if (prices.length === 0) return "No price";

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return minPrice === maxPrice
    ? `${fmt(minPrice)} đ`
    : `${fmt(minPrice)} - ${fmt(maxPrice)} đ`;
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

export default function PublicTourDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tour, isLoading, error } = usePublicTour(id);
  const { error: showError } = useToast();
  const { user } = useContext(AuthContext);
  const currentUserId = user?.id;

  const { data: itineraries = [], isLoading: isItinerariesLoading } = useGetTourItineraries(Number(id));

  const [showFullError, setShowFullError] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null,
  );
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [expandedTicketScheduleId, setExpandedTicketScheduleId] = useState<
    number | null
  >(null);
  const [currentTime] = useState(() => Date.now());

  const { data: category } = useQuery({
    queryKey: ["category", tour?.categoryId],
    queryFn: () => categoryService.getCategoryById(Number(tour!.categoryId)),
    enabled: !!tour?.categoryId,
  });

  const { expandedItiIds, toggleIti, groupedItineraries } = useGroupedItineraries(tour?.tourItineraries);

  const sortedSchedules = useMemo(() => {
    const arr = [...(tour?.tourSchedules || [])];
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
        details.filter(
          (detail): detail is readonly [number, ReadTicketTypeDTO] => detail !== null,
        ),
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
        details.filter(
          (detail): detail is readonly [number, TourismInformation] => detail !== null,
        ),
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
  const activeMonth = selectedMonth && availableMonths.includes(selectedMonth) ? selectedMonth : availableMonths[0];

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
  const displayName = tour?.name || "Loading details...";
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

  // 💥 BỘ LỌC REVIEW: Chỉ lấy những Review không bị ẩn
  const visibleReviews = (tour?.reviews || []).filter((review) => {
    const isHiddenValue = review.isHidden ?? (review as any).IsHidden;
    return isHiddenValue !== true && isHiddenValue !== 1 && isHiddenValue !== "true";
  });

  const rating = tour?.averageStar || 0;
  // 💥 Số lượng review bây giờ sẽ dựa vào mảng đã lọc
  const reviews = visibleReviews.length; 
  const days = tour?.tourItineraries?.length || 0;

  /* Loading */
  if (isLoading) {
    return (
      <div className="min-h-screen -mt-[88px] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#EB662B]" />
          Loading tour details...
        </div>
      </div>
    );
  }

  /* Error */
  if (error || !tour) {
    const errorMessage = error || "Tour not found";
    const isLongError = errorMessage.length > 100;
    const displayedError =
      showFullError || !isLongError
        ? errorMessage
        : `${errorMessage.substring(0, 100)}...`;
    return (
      <div className="min-h-screen -mt-[88px] flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full bg-rose-50 rounded-2xl p-8 text-center border border-rose-100 shadow-sm">
          <h2 className="text-xl font-bold text-rose-600 mb-3">
            Oops! Something went wrong
          </h2>
          <p className="text-rose-500 mb-6 whitespace-pre-wrap break-words text-sm leading-relaxed">
            {displayedError}
            {isLongError && (
              <button
                type="button"
                onClick={() => setShowFullError(!showFullError)}
                className="ml-2 font-semibold underline hover:text-rose-700 outline-none transition-colors"
              >
                {showFullError ? "Show less" : "Show more"}
              </button>
            )}
          </p>
          <ActionButton
            variant="primary"
            onClick={() => navigate("/")}
            className="w-full gap-2 shadow-sm shadow-rose-200"
          >
            <Home size={18} />
            Back to Home
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
            <span className="text-white/20 text-2xl md:text-3xl font-black uppercase tracking-[0.2em] text-center px-4">Visuals Coming Soon</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        {/* Wishlist */}
        <div className="absolute top-[100px] right-6 z-10">
          {!isLoading && tour && (
            <WishlistToggleButton
              tourId={Number(tour.id)}
              tourStatus={tour.status}
              variant="hero"
            />
          )}
        </div>

        {/* Hero text */}
        <div className="absolute bottom-0 left-0 right-0 pb-8 md:pb-12 lg:pb-16 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-300">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            {/* Tags */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-white/90 text-xs font-semibold tracking-wide uppercase">
                <Tag size={11} />
                {category?.name ? category.name : tour.categoryId ? `Category ${tour.categoryId}` : "Tour"}
              </span>
              {tour.address && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-white/90 text-xs font-semibold">
                  <MapPin size={11} />
                  {tour.address}
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
                    ({reviews} reviews)
                  </span>
                </div>
              )}
              {days > 0 && (
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-2">
                  <Clock size={14} className="text-white/80" />
                  <span className="text-white font-semibold text-sm">
                    {days} Days
                  </span>
                </div>
              )}
          {sortedSchedules.length > 0 && (
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-2">
                  <Users size={14} className="text-white/80" />
                  <span className="text-white font-semibold text-sm">
                {sortedSchedules.length} Schedules
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
          <div className="space-y-16">
            {/* Overview */}
            <section>
              <SectionLabel>Overview</SectionLabel>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                About This Experience
              </h2>
              {tour.description ? (
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-[15px]">
                  {tour.description}
                </p>
              ) : (
                <p className="italic text-slate-400">
                  No description available for this tour.
                </p>
              )}
            </section>

            {/* Highlights */}
            <section>
              <SectionLabel>Why Choose This Tour</SectionLabel>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Highlights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: "🧭", text: "Expert local guide" },
                  { icon: "🚌", text: "Comfortable transportation" },
                  { icon: "🎫", text: "All entrance fees included" },
                  { icon: "✋", text: "Free cancellation up to 24h" },
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
              <SectionLabel>Your Journey</SectionLabel>
              <h2 className="text-2xl font-bold text-slate-800 mb-8">
                Itinerary
              </h2>
              
              <div className="mb-10">
                <h2 className="mb-6 text-2xl font-bold text-slate-900">Itinerary Map</h2>
                {isItinerariesLoading ? (
                  <div className="flex h-[400px] items-center justify-center rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
                  </div>
                ) : itineraries.length > 0 ? (
                  <TourItineraryMap itineraries={itineraries} />
                ) : (
                  <p className="text-slate-500 italic">No map data available.</p>
                )}
              </div>

              {tourItineraries.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-[#EB662B] via-orange-200 to-transparent hidden sm:block" />
                  <div className="space-y-6">
                    {Object.entries(groupedItineraries)
                      .map(([dayStr]) => Number(dayStr))
                      .sort((a, b) => a - b)
                      .map((dayNumber) => (
                      <div key={dayNumber} className="flex gap-5 sm:gap-8">
                        <div className="relative z-10 shrink-0 hidden sm:block">
                          <div className="h-10 w-10 rounded-full bg-[#EB662B] flex items-center justify-center shadow-md shadow-orange-200">
                            <span className="text-white font-black text-xs">
                              {dayNumber}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-orange-200 transition-colors overflow-hidden">
                          <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <span className="sm:hidden inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#EB662B] text-white font-black text-[10px]">
                                 {dayNumber}
                               </span>
                               <h3 className="text-lg font-bold text-slate-800">
                                 Day {dayNumber}
                               </h3>
                            </div>
                          </div>
                          <div className="flex flex-col divide-y divide-slate-100">
                            {(groupedItineraries[dayNumber] as PublicTourItinerary[]).map((iti) => {
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
                                       <div className="flex min-w-[90px] items-center justify-center rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-bold text-[#EB662B]">
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
                                          {iti.tourismInfoId && (
                                            <div className="mt-1 overflow-hidden rounded-xl border border-slate-100 bg-white text-slate-600">
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
                                                      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-[#EB662B]">
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
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#EB662B] hover:text-orange-700"
                                                      >
                                                        {tourismInfo.sourceName || "Source"}
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                      </a>
                                                    )}
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="flex items-start gap-2 p-3">
                                                  <Tag className="h-4 w-4 text-[#EB662B] shrink-0 mt-0.5" />
                                                  <span className="font-semibold text-slate-700">
                                                    Tourism info ID #{iti.tourismInfoId}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                   )}
                                 </div>
                               );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 bg-slate-50 rounded-xl p-6 text-center">
                  No itinerary details available.
                </p>
              )}
            </section>

            {/* Reviews */}
            <section>
              <SectionLabel>What Travelers Say</SectionLabel>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Reviews
              </h2>

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
                        className={
                          i < Math.round(rating)
                            ? "text-amber-400"
                            : "text-slate-200"
                        }
                      />
                    ))}
                  </div>
                  <div className="text-slate-400 text-xs">
                    {reviews} review{reviews !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    // 💥 Tính số lượng cho từng mốc sao dựa trên mảng visibleReviews
                    const count =
                      visibleReviews.filter(
                        (r) => Math.round(r.rating || 0) === star,
                      ).length;
                    const pct = reviews > 0 ? (count / reviews) * 100 : 0;
                    return (
                      <div
                        key={star}
                        className="flex items-center gap-2 text-xs text-slate-500"
                      >
                        <span className="w-3">{star}</span>
                        <Star
                          size={11}
                          fill="currentColor"
                          className="text-amber-400 shrink-0"
                        />
                        <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-4 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review list */}
              <div className="space-y-6">
                {/* 💥 Lặp qua mảng visibleReviews thay vì tour.reviews */}
                {visibleReviews.length > 0 ? (
                  visibleReviews.map((review) => {
                    const reviewerName = getReviewCustomerName(review);
                    const initials =
                      reviewerName
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase() || "A";
                    const reviewRating = review.rating || 0;
                    
                    return (
                      <div
                        key={review.id}
                        className="border-b border-slate-100 pb-6 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-[#EB662B] font-bold text-lg uppercase shrink-0 overflow-hidden border border-orange-200">
                              {review.customerAvatar ? (
                                <img 
                                  src={review.customerAvatar} 
                                  alt={reviewerName} 
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    // Fallback if avatar fails
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerText = initials;
                                  }}
                                />
                              ) : (
                                initials
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{reviewerName}</div>
                              {review.createdAt && (
                                <div className="text-xs text-slate-400">
                                  {fmtDate(review.createdAt)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                fill="currentColor"
                                size={16}
                                className={
                                  i >= reviewRating ? "text-slate-200" : ""
                                }
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          {review.comment || "No comment."}
                        </p>

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
                                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                                >
                                  <div className="mb-3 flex items-center gap-3">
                                    <div className="h-10 w-10 overflow-hidden rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm uppercase border border-indigo-200">
                                      {reply.userAvatar ? (
                                        <img
                                          src={reply.userAvatar}
                                          alt={replyName}
                                          className="h-full w-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
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
                                            ? fmtDate(reply.createdAt)
                                            : ""}
                                        </span>
                                      </div>
                                      <div className="text-xs text-slate-500">Reply to customer review</div>
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
                    );
                  })
                ) : (
                  <p className="text-slate-500 bg-slate-50 rounded-xl p-6 text-center">
                    No reviews available yet.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT: Booking widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
                {/* Price strip */}
                <div className="bg-gradient-to-r from-[#EB662B] to-orange-400 px-6 py-5">
                  <span className="text-orange-100 text-xs font-semibold uppercase tracking-widest">
                    Starting from
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-white">
                      {minPrice !== null ? fmt(minPrice) : "No price"}
                    </span>
                    {minPrice !== null && (
                      <span className="text-orange-200 font-semibold ml-1">
                        đ
                      </span>
                    )}
                    {minPrice !== null && (
                      <span className="text-orange-200 text-sm ml-1">
                        / person
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <h3 className="mb-3 font-bold text-slate-800">
                      Departure Date
                    </h3>

                    {selectedSchedule ? (
                      <div className="rounded-2xl border border-[#EB662B] bg-orange-50/30 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-500">
                              Selected Schedule
                            </div>
                            <div className="font-bold text-slate-900 mt-1 text-sm">
                              {fmtDate(selectedSchedule.departureDate)} -{" "}
                              {fmtDate(selectedSchedule.returnDate)}
                            </div>
                            <div className="text-xs font-medium text-emerald-600 mt-1">
                              {selectedScheduleAvailableSeats} seats left
                            </div>
                          </div>
                          <button
                            onClick={() => setIsScheduleModalOpen(true)}
                            className="text-sm font-bold text-[#EB662B] hover:text-orange-700 underline"
                          >
                            Change
                          </button>
                        </div>
                        <div className="border-t border-orange-200/50 pt-3 flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">
                            Price range
                          </span>
                          <span className="font-bold text-slate-900">
                            {getSchedulePriceText(selectedSchedule)}
                          </span>
                        </div>
                        {selectedScheduleTickets.length > 0 && (
                          <div className="mt-3 space-y-2 border-t border-orange-200/50 pt-3">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-400">
                              <Ticket className="h-3.5 w-3.5" />
                              Ticket options
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
                                      {ticketAvailable} left
                                    </div>
                                  </div>
                                  <div className="shrink-0 font-bold text-slate-900">
                                    {getNumberValue(ticket.price) !== null
                                      ? `${fmt(getNumberValue(ticket.price) ?? 0)} đ`
                                      : "No price"}
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
                        className="w-full flex items-center justify-between rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 hover:border-[#EB662B] hover:bg-orange-50 transition-all group"
                      >
                        <div className="flex items-center gap-3 text-slate-600 group-hover:text-[#EB662B]">
                          <Calendar className="h-5 w-5" />
                          <span className="font-medium">Select a date</span>
                        </div>
                        <ChevronRight
                          size={18}
                          className="text-slate-300 group-hover:text-[#EB662B] transition-colors"
                        />
                      </button>
                    )}
                  </div>

                  {/* ActionButton - same as original */}
                  <ActionButton
                    variant="primary"
                    className="w-full py-4 text-base shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                    disabled={!selectedCheckoutSchedule}
                    onClick={() => {
                      navigate(PATH.CUSTOMER.CHECKOUT(tour.id), {
                        state: { tour, schedule: selectedCheckoutSchedule },
                      });
                    }}
                  >
                    Proceed to Booking
                  </ActionButton>

                  <div className="text-center text-xs font-medium text-slate-400">
                    You won't be charged yet.
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-black text-[#EB662B]">
                    {days || "-"}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Days
                  </div>
                </div>
                <div className="border-x border-slate-100">
                  <div className="text-lg font-black text-[#EB662B]">
                    {reviews || "-"}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Reviews
                  </div>
                </div>
                <div>
                  <div className="text-lg font-black text-[#EB662B]">
                    {rating > 0 ? rating.toFixed(1) : "-"}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Rating
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={(e) =>
            e.target === e.currentTarget && setIsScheduleModalOpen(false)
          }
        >
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Select Schedule
                </h3>
                <p className="text-sm text-slate-400 mt-0.5">
              {sortedSchedules.length} schedule
              {sortedSchedules.length !== 1 ? "s" : ""}
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
              <div className="border-b border-slate-100 px-6 flex items-center gap-6 overflow-x-auto">
                {availableMonths.map((month) => (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    className={`whitespace-nowrap py-4 text-sm font-bold border-b-2 transition-colors ${
                      activeMonth === month
                        ? "border-[#EB662B] text-[#EB662B]"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}

            <div className="p-6 max-h-[60vh] overflow-y-auto bg-slate-50/30">
              {availableMonths.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    const scheduleTickets = getScheduleTickets(schedule);
                    const isExpandedTickets = expandedTicketScheduleId === schedule.id;
                    const isExpired = depDate.getTime() < currentTime;
                    const isSoldOut = !isExpired && scheduleAvailableSeats <= 0;
                    const hasNoPrice = schedulePrice === null;
                    const isUnavailable = isExpired || isSoldOut || hasNoPrice;

                    return (
                      <div
                        key={schedule.id}
                        className={`relative text-left rounded-2xl border-2 p-4 transition-all
                          ${
                            isSelected
                              ? "border-[#EB662B] bg-orange-50/50 ring-1 ring-[#EB662B] shadow-md"
                              : isUnavailable
                              ? "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed grayscale-[50%]"
                              : "border-slate-200 bg-white hover:shadow-md"
                          }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-[#EB662B] flex items-center justify-center">
                            <CheckCircle2 size={12} className="text-white" />
                          </div>
                        )}

                        {/* Calendar date badge + info */}
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`rounded-xl px-2.5 py-1.5 text-center min-w-[48px] shrink-0 ${isSelected ? "bg-[#EB662B]" : "bg-slate-100"}`}
                          >
                            <div
                              className={`text-[10px] font-bold uppercase tracking-wide ${isSelected ? "text-orange-200" : "text-slate-400"}`}
                            >
                              {depDate.toLocaleDateString("en", {
                                month: "short",
                              })}
                            </div>
                            <div
                              className={`text-xl font-black leading-tight ${isSelected ? "text-white" : "text-slate-800"}`}
                            >
                              {depDate.getDate()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-slate-400 font-medium">
                              to
                            </div>
                            <div className="font-bold text-slate-700 text-sm truncate">
                              {fmtDate(schedule.returnDate)}
                            </div>
                            <div className="text-xs text-slate-400">
                              {nights} night{nights !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                              isExpired
                                ? "bg-slate-200 text-slate-500"
                                : hasNoPrice
                                ? "bg-slate-200 text-slate-500"
                                : isSoldOut
                                ? "bg-rose-100 text-rose-600"
                                : scheduleAvailableSeats <= 5
                                ? "bg-amber-100 text-amber-600"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            {isExpired
                              ? "Expired"
                              : hasNoPrice
                              ? "No price"
                              : isSoldOut
                              ? "Sold Out"
                              : scheduleAvailableSeats <= 5
                              ? `Few seats left: ${scheduleAvailableSeats}`
                              : `${scheduleAvailableSeats} seats left`}
                          </span>
                          <span className={`font-bold text-sm ${isUnavailable ? "text-slate-400 line-through" : "text-slate-900"}`}>
                            {getSchedulePriceText(schedule)}
                          </span>
                        </div>

                        {scheduleTickets.length > 0 && (
                          <div className="mt-3 border-t border-slate-100 pt-3">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedTicketScheduleId((currentId) =>
                                  currentId === schedule.id ? null : schedule.id,
                                )
                              }
                              className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
                            >
                              <span>
                                {isExpandedTickets ? "Hide" : "Show"} ticket prices
                              </span>
                              {isExpandedTickets ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>

                            {isExpandedTickets && (
                              <div className="mt-2 space-y-2">
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
                                        <span className="shrink-0 font-bold text-slate-900">
                                          {ticketPrice !== null
                                            ? `${fmt(ticketPrice)} đ`
                                            : "No price"}
                                        </span>
                                      </div>
                                      <div className="mt-1 text-xs font-medium text-slate-400">
                                        {ticketAvailable} available
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={isUnavailable}
                          onClick={() => {
                            if (isExpired) {
                              showError("This schedule has expired.");
                              return;
                            }
                            if (isSoldOut) {
                              showError("This schedule is sold out.");
                              return;
                            }
                            if (hasNoPrice) {
                              showError("This schedule does not have a ticket price.");
                              return;
                            }
                            setSelectedScheduleId(schedule.id);
                            setIsScheduleModalOpen(false);
                          }}
                          className="mt-4 w-full rounded-xl bg-[#EB662B] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                        >
                          {isSelected ? "Selected" : "Select schedule"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-medium text-slate-500 border border-dashed border-slate-200">
                  No upcoming schedules available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-[2px] w-6 bg-[#EB662B] rounded-full" />
      <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#EB662B]">
        {children}
      </span>
    </div>
  );
}