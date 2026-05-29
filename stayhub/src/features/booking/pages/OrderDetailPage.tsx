import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Users,
  Banknote,
  ClipboardList,
  MapPin,
  Info,
  QrCode,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Star,
  ChevronRight,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { PATH } from "../../../config/routes/route";
import { useOrderDetail } from "../hooks/useOrderDetail";
import { ActionButton } from "../../../components/home/ActionButton";
// import { ReviewModal } from "../../review/components/ReviewModal"; 
import { useGroupedItineraries } from "../../tour/hooks/useGroupedItineraries";

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

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { order, isLoading, error, refetch } = useOrderDetail(id);
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const { expandedItiIds, toggleIti, groupedItineraries } = useGroupedItineraries(order?.schedule?.tourScheduleItineraries);

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

  const isTourEnded = order.schedule?.returnDate
    ? new Date(order.schedule.returnDate).getTime() < new Date().getTime()
    : false;

  // Giữ canReview = true theo cấu hình test hiện tại của bạn
  const canReview = true;
    // isTourEnded &&
    // (order.status === "Paid" || order.status === "Completed");

  return (
    <div className="mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          to={PATH.CUSTOMER.MY_BOOKINGS}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800 !no-underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Bookings
        </Link>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Order ID:</span>
            <span className="rounded bg-slate-100 px-2 py-1 text-sm font-bold text-slate-800">
              #{order.id}
            </span>
          </div>
          {order.orderedAt && (
            <span className="text-xs font-medium text-slate-400">
              Booked on {dateFormatter.format(new Date(order.orderedAt))}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* CỘT TRÁI (Tour Info, Schedule, Passengers & REVIEW) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tour Card */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col sm:flex-row">
              {order.tour?.imageUrl && (
                <div className="w-full sm:w-48 shrink-0">
                  <img
                    src={order.tour.imageUrl}
                    alt={order.tour.name}
                    className="h-full min-h-[160px] w-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 p-6">
                <div className="mb-2 flex items-start justify-between">
                  <h1 className="text-base font-bold leading-snug text-slate-900">
                    {order.tour?.name || "Tour Booking"}
                  </h1>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-semibold ${
                      order.status === "Completed" || order.status === "Paid"
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}
                  >
                    {order.status === "Completed" || order.status === "Paid" ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <Clock size={12} />
                    )}
                    {order.status || "Pending"}
                  </span>
                </div>

                <p className="mb-4 flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {[order.tour?.city, order.tour?.country]
                    .filter(Boolean)
                    .join(", ") || "Various Locations"}
                </p>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <p className="mb-1 text-xs text-slate-500">Departure</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {order.schedule
                        ? dateFormatter.format(new Date(order.schedule.departureDate))
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-slate-500">Return</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {order.schedule
                        ? dateFormatter.format(new Date(order.schedule.returnDate))
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Cards (Itinerary & Tickets) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {order.schedule?.tourScheduleItineraries && order.schedule.tourScheduleItineraries.length > 0 && (
              <div 
                onClick={() => setIsItineraryModalOpen(true)}
                className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 transition-colors group-hover:bg-indigo-100">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Itinerary</h4>
                    <p className="text-xs font-medium text-slate-500">View daily activities</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500" />
              </div>
            )}

            <div 
              onClick={() => setIsTicketsModalOpen(true)}
              className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-[#EB662B] hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-[#EB662B] transition-colors group-hover:bg-orange-100">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Tickets</h4>
                  <p className="text-xs font-medium text-slate-500">{order.ticketCount} passenger(s) QR</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-[#EB662B]" />
            </div>
          </div>

          {/* ========================================== */}
          {/* KHỐI HIỂN THỊ ĐÁNH GIÁ: ĐÃ CHỈNH STYLE GIỐNG TICKET */}
          {/* ========================================== */}
          {canReview && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 animate-in fade-in duration-300">
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Star className="h-5 w-5 text-[#EB662B]" /> 
                  {order.review ? "Your Review" : "Rate Your Experience"}
                </h4>
                <p className="text-sm font-medium leading-relaxed text-slate-600">
                  {order.review 
                    ? `You rated this tour ${order.review.rating}/5 stars. You can update your feedback anytime.`
                    : "Hope you enjoyed the trip! Let us know how it went by writing a review to improve our services."
                  }
                </p>
              </div>
              <ActionButton
                variant="primary"
                className="w-full sm:w-auto shrink-0 !bg-[#EB662B] !border-[#EB662B] hover:!bg-[#d4531d] px-6 font-bold text-sm shadow-sm transition-colors"
                onClick={() => setIsReviewModalOpen(true)}
              >
                {order.review ? "Edit Review" : "Write a Review"}
              </ActionButton>
            </div>
          )}
        </div>

        {/* CỘT PHẢI (Payment Summary, Notes & Extras) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Payment Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-bold text-slate-900">
              <Banknote className="h-5 w-5 text-emerald-600" /> Payment Summary
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 text-slate-600">
                <span>Tickets</span>
                <span className="whitespace-nowrap text-right">
                  {order.ticketCount} x{" "}
                  {currencyFormatter.format(
                    (order.finalAmount + (order.discountValue || 0)) / order.ticketCount,
                  )}
                </span>
              </div>
              {order.discountValue && order.discountValue > 0 ? (
                <div className="flex justify-between text-rose-600">
                  <span>Discount</span>
                  <span>-{currencyFormatter.format(order.discountValue)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
                <span className="font-bold text-slate-900">Total Paid</span>
                <span className="font-bold text-[#EB662B]">
                  {currencyFormatter.format(order.finalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <Info className="h-5 w-5 text-sky-500" /> Order Notes
            </h4>
            <p className="whitespace-pre-wrap text-sm text-slate-600">
              {order.note ? order.note : <span className="italic text-slate-400">No special requests provided.</span>}
            </p>
          </div>

          {/* Invite Token
          {order.inviteToken && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-indigo-900">
                <QrCode className="h-5 w-5 text-indigo-500" /> Share Invite
              </h4>
              <p className="mb-3 text-sm text-indigo-700">Share this token with your group members.</p>
              <div className="rounded border border-indigo-100 bg-white p-2 text-center font-mono text-sm font-bold text-indigo-600">
                {order.inviteToken}
              </div>
            </div>
          )} */}

          {/* Cancel Booking */}
          {order.status !== "Cancelled" &&
            order.schedule &&
            (() => {
              const departureDate = new Date(order.schedule.departureDate);
              const currentDate = new Date();
              const timeDiff = departureDate.getTime() - currentDate.getTime();
              const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

              if (daysDiff >= 5 && !isTourEnded) {
                return (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-rose-900">
                      <AlertTriangle className="h-5 w-5 text-rose-500" /> Cancel Booking
                    </h4>
                    <p className="mb-4 text-xs font-medium text-rose-700/80 leading-relaxed">
                      You can cancel this booking up to 5 days before departure.
                      Please note that a cancellation fee may be deducted from
                      your refund depending on our policy.
                    </p>
                    <ActionButton
                      variant="outline"
                      className="w-full !border-rose-200 !text-rose-600 hover:!bg-rose-100 hover:!border-rose-300"
                      onClick={() =>
                        window.confirm(
                          "Are you sure you want to cancel this booking? This action cannot be undone and cancellation fees may apply.",
                        )
                      }
                    >
                      Cancel Order
                    </ActionButton>
                  </div>
                );
              }
              return null;
            })()}
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Schedule Itinerary Modal */}
      {isItineraryModalOpen && order.schedule?.tourScheduleItineraries && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsItineraryModalOpen(false)}>
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
                  const itemsForDay = groupedItineraries[dayNumber];
                  const isToday = itemsForDay.some((iti: any) => iti.itineraryDate && new Date(iti.itineraryDate).toDateString() === new Date().toDateString());
                  const dayDate = itemsForDay[0]?.itineraryDate;

                  return (
                    <div
                      key={dayNumber}
                      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${isToday ? "border-[#EB662B] ring-1 ring-[#EB662B]/30" : "border-slate-200"}`}
                    >
                      {/* Day Header */}
                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b ${isToday ? "border-orange-100 bg-orange-50/50" : "border-slate-100 bg-slate-50"}`}>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isToday ? "bg-[#EB662B] text-white shadow-md shadow-orange-200" : "bg-indigo-100 text-indigo-700"}`}>
                            <span className="text-sm font-black">D{dayNumber}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={`text-base font-bold ${isToday ? "text-[#EB662B]" : "text-slate-800"}`}>
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
                        {itemsForDay.map((iti: any) => {
                          const isExpanded = expandedItiIds.includes(iti.id);
                          const timeStr = iti.startDuration && iti.endDuration
                            ? `${iti.startDuration.substring(0, 5)} - ${iti.endDuration.substring(0, 5)}`
                            : iti.startDuration ? iti.startDuration.substring(0, 5) : "Any time";

                          return (
                            <div key={iti.id} className="flex flex-col">
                              <div
                                className="flex cursor-pointer items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50"
                                onClick={() => toggleIti(iti.id)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`flex min-w-[90px] items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold ${isToday ? "bg-orange-50 text-[#EB662B]" : "bg-slate-100 text-slate-600"}`}>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsTicketsModalOpen(false)}>
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-[#EB662B]">
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
              {order.tickets.map((ticket, idx) => {
                const qrData = {
                  orderId: order.id,
                  userId: ticket.userId || null,
                  attendeeName: ticket.attendeeName,
                  idCard: ticket.idCard,
                  dateOfBirth: ticket.dateOfBirth || null,
                  gender: ticket.gender || null,
                  nationality: ticket.nationality || null,
                  qrCode: ticket.qrCode || null,
                  checkInStatus: ticket.checkInStatus || null,
                };
                const qrString = JSON.stringify(qrData);

                return (
                  <div key={ticket.id} className="flex flex-col sm:flex-row gap-4 rounded-lg border border-slate-200 p-4 bg-white">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-sm font-semibold text-slate-800">Passenger {idx + 1}</span>
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
                          <QRCodeSVG value={qrString} size={80} />
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

      {/* Modal Popup Đánh giá
      {order.tour && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          tourId={order.tour.id}
          tourName={order.tour.name}
          initialData={order.review ? {
            id: order.review.id,
            rating: order.review.rating,
            comment: order.review.comment
          } : null}
          onSuccess={() => {
            refetch();
          }}
        />
      )} */}
    </div>
  );
};