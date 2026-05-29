import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Users, ArrowLeft, ShieldCheck, Ticket, CreditCard, Percent, X } from "lucide-react";
import { ActionButton } from "../../../components/home/ActionButton";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useCreateBooking } from "../hooks/useCreateBooking";
import { PATH } from "../../../config/routes/route";
import { useToast } from "../../../contexts/ToastContext";
import type { Tour } from "../../tour/types/tour";
import type { TourSchedule } from "../../tour/types/tourSchedule";
import {
  getNumberValue,
  getScheduleTicketAvailable,
} from "../../tour/utils/tourScheduleTicket";

type CheckoutSchedule = TourSchedule & {
  price?: number | string | null;
  availableSeats?: number | string | null;
};

type BookingLocationState = {
  tour?: Tour;
  schedule?: CheckoutSchedule;
};

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")} đ`;

const getCheckoutSchedulePrice = (schedule: CheckoutSchedule) => {
  const directPrice = getNumberValue(schedule.price);
  if (directPrice !== null) return directPrice;

  const prices = (schedule.tourScheduleTickets ?? [])
    .map((ticket) => getNumberValue(ticket.price))
    .filter((price): price is number => price !== null);

  return prices.length > 0 ? Math.min(...prices) : null;
};

const getCheckoutScheduleAvailableSeats = (schedule: CheckoutSchedule) => {
  const directSeats = getNumberValue(schedule.availableSeats);
  if (directSeats !== null) return directSeats;

  return (schedule.tourScheduleTickets ?? []).reduce(
    (sum, ticket) => sum + (getScheduleTicketAvailable(ticket) ?? 0),
    0,
  );
};

export const BookingPage: React.FC = () => {
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
    // handleApplyVoucher 
  } = useCreateBooking();
  const { error: showError } = useToast();

  const [ticketCount, setTicketCount] = useState<number>(1);
  const [note, setNote] = useState<string>("");
  const [tickets, setTickets] = useState([{ attendeeName: "", idCard: "", dateOfBirth: "", gender: "Male", nationality: "Vietnam" }]);
  const [editingTicketIndex, setEditingTicketIndex] = useState<number | null>(null);
  const [ticketErrors, setTicketErrors] = useState<Record<string, string>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
  const [currentTime] = useState(() => Date.now());

  const errorHandledRef = useRef(false);
  const maxDate = new Date(currentTime).toISOString().split("T")[0];

  const schedulePrice = schedule ? getCheckoutSchedulePrice(schedule) : null;
  const scheduleAvailableSeats = schedule
    ? getCheckoutScheduleAvailableSeats(schedule)
    : 0;

  // Nếu không có tour hoặc schedule truyền sang thì cho quay lại
  useEffect(() => {
    if (!tour || !schedule) {
      navigate(PATH.PUBLIC.HOME);
      return;
    }

    if (errorHandledRef.current) return;

    const departure = new Date(schedule.departureDate);
    if (departure.getTime() < currentTime) {
      errorHandledRef.current = true;
      showError("This departure has expired and can no longer be booked.");
      navigate(PATH.PUBLIC.TOUR_DETAIL(tour.id));
      return;
    }

    if (scheduleAvailableSeats <= 0) {
      errorHandledRef.current = true;
      showError("This departure is sold out.");
      navigate(PATH.PUBLIC.TOUR_DETAIL(tour.id));
      return;
    }

    if (schedulePrice === null) {
      errorHandledRef.current = true;
      showError("This departure does not have a ticket price.");
      navigate(PATH.PUBLIC.TOUR_DETAIL(tour.id));
    }
  }, [tour, schedule, scheduleAvailableSeats, schedulePrice, currentTime, navigate, showError]);

  if (!tour || !schedule) return null;

  const isExpired = new Date(schedule.departureDate).getTime() < currentTime;
  const isSoldOut = scheduleAvailableSeats <= 0;
  if (isExpired || isSoldOut || schedulePrice === null) return null;

  const totalPrice = ticketCount * schedulePrice;
  const finalPayable = appliedVoucher?.finalAmount ?? totalPrice;

  const handleTicketCountChange = (count: number) => {
    const newCount = Math.max(1, Math.min(count, scheduleAvailableSeats));
    setTicketCount(newCount);

    // Cập nhật lại mảng thông tin hành khách tương ứng số vé
    const newTickets = [...tickets];
    if (newCount > tickets.length) {
      for (let i = tickets.length; i < newCount; i++) {
        newTickets.push({ attendeeName: "", idCard: "", dateOfBirth: "", gender: "Male", nationality: "Vietnam" });
      }
    } else {
      newTickets.splice(newCount);
    }
    setTickets(newTickets);
  };

  const handleTicketFieldChange = (index: number, field: string, value: string) => {
    const newTickets = [...tickets];
    newTickets[index] = { ...newTickets[index], [field]: value };
    setTickets(newTickets);

    if (hasAttemptedSubmit) {
      const errors = { ...ticketErrors };
      if (field === 'attendeeName') {
        if (!value.trim()) errors.attendeeName = "Name is required.";
        else delete errors.attendeeName;
      }
      if (field === 'idCard') {
        if (!value.trim()) errors.idCard = "ID Card / Passport is required.";
        else delete errors.idCard;
      }
      if (field === 'dateOfBirth') {
        if (!value.trim()) errors.dateOfBirth = "Date of Birth is required.";
        else if (new Date(value).getTime() > currentTime) errors.dateOfBirth = "Date of Birth cannot be in the future.";
        else delete errors.dateOfBirth;
      }
      if (field === 'nationality') {
        if (!value.trim()) errors.nationality = "Nationality is required.";
        else delete errors.nationality;
      }
      setTicketErrors(errors);
    }
  };

  const openTicketModal = (index: number) => {
    if (hasAttemptedSubmit) {
      const ticket = tickets[index];
      const errors: Record<string, string> = {};
      if (!ticket.attendeeName.trim()) errors.attendeeName = "Name is required.";
      if (!ticket.idCard.trim()) errors.idCard = "ID Card / Passport is required.";
      if (!ticket.dateOfBirth.trim()) errors.dateOfBirth = "Date of Birth is required.";
      else if (new Date(ticket.dateOfBirth).getTime() > currentTime) errors.dateOfBirth = "Date of Birth cannot be in the future.";
      if (!ticket.nationality.trim()) errors.nationality = "Nationality is required.";
      setTicketErrors(errors);
    } else {
      setTicketErrors({});
    }
    setEditingTicketIndex(index);
  };

  const onSubmit = () => {
    setHasAttemptedSubmit(true);

    if (new Date(schedule.departureDate).getTime() < currentTime) {
      showError("This departure has expired and can no longer be booked.");
      return;
    }

    if (ticketCount > scheduleAvailableSeats) {
      showError(`Only ${scheduleAvailableSeats} seat(s) available for this departure.`);
      return;
    }

    for (let i = 0; i < tickets.length; i++) {
      if (!tickets[i].attendeeName.trim() || !tickets[i].idCard.trim() || !tickets[i].dateOfBirth.trim() || !tickets[i].nationality.trim()) {
        showError(`Please fill in all required fields for Passenger ${i + 1}`);
        return;
      }
      if (new Date(tickets[i].dateOfBirth).getTime() > currentTime) {
        showError(`Date of Birth for Passenger ${i + 1} cannot be in the future.`);
        return;
      }
    }

    handleCreateBooking({
      scheduleId: schedule.id,
      ticketCount,
      note,
      finalAmount: finalPayable,
      tickets,
    });
  };

  return (
    <div className="bg-white pb-12">
      <div className="container mx-auto px-4 max-w-6xl pt-4">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Back to Tour
        </button>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Complete Your Booking</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Booking Details */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <Ticket className="text-[#EB662B]" /> Order Details
              </h2>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Number of Tickets</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => handleTicketCountChange(ticketCount - 1)} disabled={ticketCount <= 1} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-xl font-bold transition-colors">-</button>
                  <span className="text-xl font-bold w-8 text-center">{ticketCount}</span>
                  <button onClick={() => handleTicketCountChange(ticketCount + 1)} disabled={ticketCount >= scheduleAvailableSeats} className="w-10 h-10 rounded-full flex items-center justify-center bg-[#EB662B] text-white hover:bg-orange-600 disabled:opacity-50 text-xl font-bold transition-colors">+</button>
                  <span className="ml-4 text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-full">{scheduleAvailableSeats} seats remaining</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Special Requests (Note)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="E.g., Dietary requirements, special assistance..." className="w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-[#EB662B] focus:ring-1 focus:ring-[#EB662B] resize-none h-24" />
              </div>
            </div>

            {/* Passenger Forms */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Users className="text-[#EB662B]" /> Passengers Information
              </h2>
              <p className="text-sm text-slate-500 mb-6 border-b border-slate-100 pb-4">Please fill in details for all attendees. Make sure the name matches the ID/Passport.</p>

              <div className="space-y-3">
                {tickets.map((ticket, index) => {
                  const isComplete = ticket.attendeeName.trim() && ticket.idCard.trim() && ticket.dateOfBirth.trim() && ticket.nationality.trim() && new Date(ticket.dateOfBirth).getTime() <= currentTime;
                  return (
                    <div key={index} 
                         onClick={() => openTicketModal(index)}
                         className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-[#EB662B] hover:bg-orange-50/30 hover:shadow-sm">
                      <div className="flex items-center gap-4">
                         <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${isComplete ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                           {index + 1}
                         </div>
                         <div>
                           <div className="font-bold text-slate-800">
                             {ticket.attendeeName || `Passenger ${index + 1}`}
                           </div>
                           <div className="text-xs text-slate-500 mt-0.5">
                             {ticket.idCard ? `ID: ${ticket.idCard}` : "Details required"}
                           </div>
                         </div>
                      </div>
                      <div>
                        {isComplete ? (
                           <ShieldCheck className="h-6 w-6 text-emerald-500" />
                        ) : (
                           <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-rose-600">Required</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="relative">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                <img src={tour.imageUrl || `https://picsum.photos/seed/tour-${tour.id}/800/400`} alt={tour.name} className="h-40 w-full object-cover" />
                <div className="p-6">
                  <h3 className="font-extrabold text-slate-900 text-lg mb-4">{tour.name}</h3>
                  
                  <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start text-sm">
                      <div className="flex gap-2 text-slate-600 font-medium"><Calendar size={18} className="text-indigo-500" /> Start Date</div>
                      <div className="font-bold text-slate-900 text-right">{new Date(schedule.departureDate).toLocaleDateString()}</div>
                    </div>
                    <div className="flex justify-between items-start text-sm border-t border-slate-100 pt-3">
                      <div className="flex gap-2 text-slate-600 font-medium"><Calendar size={18} className="text-rose-500" /> End Date</div>
                      <div className="font-bold text-slate-900 text-right">{new Date(schedule.returnDate).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 mb-6">
                    <div className="flex justify-between">
                      <span>Price per ticket</span>
                      <span className="font-medium">{formatCurrency(schedulePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity</span>
                      <span className="font-medium">x {ticketCount}</span>
                    </div>
                  </div>

                  <div className="mb-5 rounded-2xl border border-slate-200 p-4">
                    <label className="mb-2 block text-xs font-bold text-slate-700">Voucher Code</label>
                    <div className="flex gap-2">
                      <input
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        placeholder="Enter voucher code"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#EB662B]"
                      />
                      <button
                        type="button"
                        // onClick={() => handleApplyVoucher(tour.id, totalPrice)}
                        disabled={isApplyingVoucher}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#4880ff] px-3 py-2 text-sm font-semibold text-white hover:bg-[#336efd] disabled:opacity-60"
                      >
                        <Percent className="h-4 w-4" />
                        Apply
                      </button>
                    </div>
                    {appliedVoucher && (
                      <p className="mt-2 text-xs font-medium text-emerald-700">
                        Applied {appliedVoucher.code}: -{formatCurrency(appliedVoucher.discountAmount)}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-4 flex justify-between items-center mb-6">
                    <span className="font-bold text-slate-800">Total Price</span>
                    <span className="text-2xl font-black text-[#EB662B]">{formatCurrency(finalPayable)}</span>
                  </div>

                  <ActionButton variant="primary" onClick={onSubmit} className="w-full py-4 text-base shadow-lg shadow-orange-500/30 gap-2">
                    <CreditCard size={20} /> Checkout Securely
                  </ActionButton>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-4 flex gap-3 border border-emerald-100">
                <ShieldCheck className="text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-800 leading-relaxed font-medium">Your personal information is encrypted and securely processed by our payment gateway. Free cancellation up to 24h before departure.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LoadingOverlay isOpen={isSubmitting} message="Creating order and redirecting to VNPay..." />

      {/* Ticket Modal */}
      {editingTicketIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => setEditingTicketIndex(null)}>
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
               <h3 className="text-lg font-bold text-slate-800">Passenger {editingTicketIndex + 1} Details</h3>
               <button onClick={() => setEditingTicketIndex(null)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
                 <X size={20} />
               </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                <input type="text" placeholder="John Doe" value={tickets[editingTicketIndex].attendeeName} onChange={e => handleTicketFieldChange(editingTicketIndex, 'attendeeName', e.target.value)} className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors ${ticketErrors.attendeeName ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500" : "border-slate-200 focus:border-[#EB662B]"}`} required />
                {ticketErrors.attendeeName && <p className="mt-1 text-xs text-rose-500">{ticketErrors.attendeeName}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ID Card / Passport *</label>
                <input type="text" placeholder="AB1234567" value={tickets[editingTicketIndex].idCard} onChange={e => handleTicketFieldChange(editingTicketIndex, 'idCard', e.target.value)} className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors ${ticketErrors.idCard ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500" : "border-slate-200 focus:border-[#EB662B]"}`} required />
                {ticketErrors.idCard && <p className="mt-1 text-xs text-rose-500">{ticketErrors.idCard}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Date of Birth *</label>
                <input type="date" max={maxDate} value={tickets[editingTicketIndex].dateOfBirth} onChange={e => handleTicketFieldChange(editingTicketIndex, 'dateOfBirth', e.target.value)} className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors ${ticketErrors.dateOfBirth ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500" : "border-slate-200 focus:border-[#EB662B]"}`} required />
                {ticketErrors.dateOfBirth && <p className="mt-1 text-xs text-rose-500">{ticketErrors.dateOfBirth}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Gender *</label>
                  <select value={tickets[editingTicketIndex].gender} onChange={e => handleTicketFieldChange(editingTicketIndex, 'gender', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#EB662B]">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nationality *</label>
                  <input type="text" placeholder="Vietnam" value={tickets[editingTicketIndex].nationality} onChange={e => handleTicketFieldChange(editingTicketIndex, 'nationality', e.target.value)} className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors ${ticketErrors.nationality ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500" : "border-slate-200 focus:border-[#EB662B]"}`} required />
                  {ticketErrors.nationality && <p className="mt-1 text-xs text-rose-500">{ticketErrors.nationality}</p>}
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end">
              <ActionButton variant="primary" onClick={() => setEditingTicketIndex(null)} className="px-6 py-2.5 text-sm">
                Done
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
