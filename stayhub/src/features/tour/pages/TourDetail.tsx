import React from "react";
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
  Power,
  Tag,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import { useTour } from "../hooks/useTour";
import { useGroupedItineraries } from "../hooks/useGroupedItineraries";
import { PATH } from "../../../config/routes/route";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useToast } from "../../../contexts/ToastContext";

export const TourDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const { tour, categoryName, isLoading, error, isToggling, toggleTourStatus } =
    useTour(id);

  const { expandedItiIds, toggleIti, groupedItineraries } = useGroupedItineraries(tour?.tourItineraries);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Loading tour details...
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="flex h-64 items-center justify-center text-rose-500">
        {error || "Tour not found."}
      </div>
    );
  }

  // Tính toán dữ liệu Thống kê nhanh
  const itineraryCount = tour.tourItineraries?.length || 0;
  const durationText =
    itineraryCount > 0
      ? `${itineraryCount} ${itineraryCount === 1 ? "day" : "days"}`
      : "No itinerary";

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
  const prices = tour.tourSchedules?.map((s) => s.price) || [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const priceText =
    prices.length === 0
      ? "Unscheduled"
      : minPrice === maxPrice
        ? `${minPrice.toLocaleString("vi-VN")} ₫`
        : `From ${minPrice.toLocaleString("vi-VN")} ₫`;

  return (
    <div className="mx-auto max-w-4xl py-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tour List
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
              <span className="text-sm font-medium">No image available</span>
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
              {tour.status || "Draft"}
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
                  <span>Tour ID: {tour.id}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>
                    {[tour.address, tour.city, tour.country]
                      .filter(Boolean)
                      .join(", ") || "N/A Location"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-slate-400" />
                  <span>
                    Category: {categoryName || `ID ${tour.categoryId}`}
                  </span>
                </div>
                {(tour.createdByName || tour.createdAt) && (
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>
                      Created{tour.createdByName && ` by ${tour.createdByName}`}
                      {tour.createdAt && ` on ${new Date(tour.createdAt).toLocaleDateString()}`}
                    </span>
                  </div>
                )}
                {(tour.updatedByName || tour.updatedAt) && (
                  <div className="flex items-center gap-1.5">
                    <Pencil className="h-4 w-4 text-slate-400" />
                    <span>
                      Last updated{tour.updatedByName && ` by ${tour.updatedByName}`}
                      {tour.updatedAt && ` on ${new Date(tour.updatedAt).toLocaleDateString()}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {tour.status !== "Banned" && (
              <div className="flex shrink-0 items-start gap-3">
                <ActionButton
                  variant="secondary"
                  onClick={toggleTourStatus}
                  disabled={isToggling}
                  className={`gap-2 px-4 py-2 text-sm ${tour.status === "Active" ? "!bg-amber-500 !text-white !border-amber-500 hover:!bg-amber-600" : "!bg-emerald-500 !text-white !border-emerald-500 hover:!bg-emerald-600"}`}
                >
                  <Power className="h-4 w-4" />
                  {isToggling
                    ? "Processing..."
                    : tour.status === "Active"
                      ? "Deactivate"
                      : "Activate"}
                </ActionButton>
                <ActionButton
                  variant="primary"
                  onClick={() => {
                    if (tour.status === "Active") {
                      showError("Please inactive tour before edit");
                    } else {
                      navigate(PATH.MANAGER.EDIT_TOUR(tour.id));
                    }
                  }}
                  className="gap-2 px-4 py-2 text-sm"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Tour
                </ActionButton>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5 transition-colors hover:bg-slate-100/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  Duration
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
                  Schedules
                </p>
                <p className="break-words text-base font-bold text-slate-900 sm:text-lg">
                  {scheduleCount} {scheduleCount === 1 ? "trip" : "trips"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5 transition-colors hover:bg-slate-100/50">
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
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5 transition-colors hover:bg-slate-100/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  Rating
                </p>
                <p className="break-words text-base font-bold text-amber-600 sm:text-lg">
                  {tour.averageStar && tour.averageStar > 0 ? `${tour.averageStar.toFixed(1)}/5` : "No ratings"}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="mb-3 text-lg font-bold text-slate-900">
              Description
            </h2>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 leading-relaxed text-slate-700">
              {tour.description ? (
                <p className="whitespace-pre-wrap text-sm">
                  {tour.description}
                </p>
              ) : (
                <p className="text-sm italic text-slate-400">
                  No description provided for this tour.
                </p>
              )}
            </div>
          </div>

          {/* Itineraries Section */}
          <div className="mt-8 border-t border-slate-100 pt-8">
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">Itineraries</h2>
                {tour.status !== "Banned" && (
                  <ActionButton
                    variant="primary"
                    onClick={() =>
                      navigate(PATH.MANAGER.CREATE_ITINERARY(tour.id))
                    }
                    className="gap-2 px-4 py-2 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Itinerary
                  </ActionButton>
                )}
              </div>
              {missingItineraryDays.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold">Missing itinerary days detected:</p>
                  <p>Day {missingItineraryDays.join(", Day ")} is not present in this tour.</p>
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
                      {/* Day Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
                        <h3 className="text-lg font-bold text-slate-900">Day {dayNumber}</h3>
                      </div>
                      
                      {/* Danh sách các khung giờ trong 1 ngày */}
                      <div className="flex flex-col divide-y divide-slate-100">
                        {groupedItineraries[dayNumber].map((iti) => {
                          const isExpanded = expandedItiIds.includes(iti.id);
                          const timeStr = iti.startDuration && iti.endDuration
                            ? `${iti.startDuration.substring(0, 5)} - ${iti.endDuration.substring(0, 5)}`
                            : iti.startDuration ? iti.startDuration.substring(0, 5) : "Any time";

                          return (
                            <div key={iti.id} className="flex flex-col">
                              {/* Dòng Tab Giờ (Bấm để xổ) */}
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
                                      <ActionButton variant="secondary" onClick={() => navigate(PATH.MANAGER.EDIT_ITINERARY(tour.id, iti.id))} className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
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

                              {/* Detail Mở Rộng */}
                              {isExpanded && (
                                <div className="bg-slate-50/50 px-5 pb-5 pt-2 sm:pl-[150px]">
                                  {iti.description && (
                                    <p className="mb-3 text-sm leading-relaxed text-slate-600">
                                      {iti.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                    <MapPin className="h-4 w-4 text-emerald-500" />
                                    <span>{iti.locationName || "N/A"}</span>
                                  </div>
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
                  No itineraries yet
                </h3>
                <p className="mb-4 text-sm text-slate-500">
                  Create an itinerary to let your customers know what to expect.
                </p>
              </div>
            )}
          </div>

          {/* Schedules Section */}
          <div className="mt-8 border-t border-slate-100 pt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Schedules</h2>
              {tour.status !== "Banned" && (
                <ActionButton
                  variant="primary"
                  onClick={() => navigate(PATH.MANAGER.CREATE_SCHEDULE(tour.id))}
                  className="gap-2 px-4 py-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Schedule
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
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
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
                        <span className="text-slate-500">Departure</span>
                        <span className="font-medium text-slate-900">
                          {new Date(
                            schedule.departureDate,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Price</span>
                        <span className="font-semibold text-emerald-600">
                          {schedule.price.toLocaleString("vi-VN")} ₫
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Availability</span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-900">
                          {schedule.availableSeats} / {schedule.maxCapacity}
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
                  No schedules yet
                </h3>
                <p className="mb-4 text-sm text-slate-500">
                  Create a schedule to start accepting bookings.
                </p>
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="mt-8 border-t border-slate-100 pt-8">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">Reviews</h2>
            </div>

            {tour.reviews && tour.reviews.length > 0 ? (
              <div className="flex flex-col gap-4">
                {tour.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {review.customerName || "Anonymous Customer"}
                        </h3>
                        <div className="mt-1 flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < (review.rating || 0)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300"
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-medium text-slate-600">
                            {review.rating || 0}/5
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
                <Star className="mb-3 h-10 w-10 text-slate-400" />
                <h3 className="mb-1 font-semibold text-slate-900">
                  No reviews yet
                </h3>
                <p className="mb-4 text-sm text-slate-500">
                  Reviews from customers will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
