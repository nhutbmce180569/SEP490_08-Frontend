import React, { useContext, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { AuthContext } from "../../../contexts/AuthContext";
import { PATH } from "../../../config/routes/route";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useCustomerOrders } from "../hooks/useCustomerOrders";
import {
  Ticket,
  Calendar,
  ClipboardList,
  AlertCircle,
  Users,
  Banknote,
  ArrowRight,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const STATUS_STYLES: Record<string, string> = {
  Completed: "bg-emerald-100 text-emerald-700",
  Paid: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Cancelled: "bg-rose-100 text-rose-700",
  "Request to Cancel": "bg-violet-100 text-violet-700",
};

const getStatusStyle = (status?: string | null) =>
  STATUS_STYLES[status ?? ""] ?? "bg-slate-100 text-slate-600";

type OrderStatusFilter = "All" | "Paid" | "Cancelled" | "Request to Cancel";

export const MyBookingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();

  const ORDER_STATUS_FILTERS = useMemo(
    (): { label: string; value: OrderStatusFilter }[] => [
      { label: t("common.all"), value: "All" },
      { label: t("common.paid"), value: "Paid" },
      { label: t("common.cancelled"), value: "Cancelled" },
      { label: t("booking.requestToCancel"), value: "Request to Cancel" },
    ],
    [t],
  );

  const getValidStatusFilter = (status: string | null): OrderStatusFilter => {
    const match = ORDER_STATUS_FILTERS.find((item) => item.value === status);
    return match?.value ?? "All";
  };

  const activeStatus = getValidStatusFilter(searchParams.get("status"));
  const orderStatus = activeStatus === "All" ? undefined : activeStatus;
  const { orders, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } = useCustomerOrders(user?.id, orderStatus);
  const { error: showError } = useToast();

  const { ref, inView } = useInView({ threshold: 0.5 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (searchParams.get("payment") === "cancelled") {
      showError(t("booking.paymentCancelledToast"));
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("payment");
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams, showError, t]);

  if (!user) return null;

  const handleStatusFilterChange = (status: OrderStatusFilter) => {
    const nextParams = new URLSearchParams(searchParams);
    if (status === "All") {
      nextParams.delete("status");
    } else {
      nextParams.set("status", status);
    }
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-slate-900">
            <Ticket className="text-brand" size={24} />
            {t("booking.myBookings")}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">{t("booking.myBookingsDesc")}</p>
        </div>
        {!isLoading && !error && (
          <span className="rounded-2xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
            {orders.length === 1
              ? t("booking.bookingCount", { count: orders.length })
              : t("booking.bookingsCount", { count: orders.length })}
          </span>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {ORDER_STATUS_FILTERS.map((filter) => {
          const isActive = activeStatus === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => handleStatusFilterChange(filter.value)}
              className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
                isActive
                  ? "border-brand bg-brand text-white shadow-sm shadow-brand/20"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-12 text-center text-rose-700">
          <AlertCircle size={28} className="text-rose-400" />
          <p className="font-semibold">{t("booking.unableToLoadBookings")}</p>
          <p className="text-sm text-rose-500">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 py-16 text-center">
          <ClipboardList size={36} className="text-slate-300" />
          <p className="font-semibold text-slate-700">
            {activeStatus === "All"
              ? t("booking.noBookingsYet")
              : t("booking.noStatusBookings", { status: activeStatus })}
          </p>
          <p className="text-sm text-slate-400">
            {activeStatus === "All" ? t("booking.futureBookingsHint") : t("booking.tryAnotherFilter")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-start gap-4">
                  {order.tour?.imageUrl ? (
                    <img
                      src={order.tour.imageUrl}
                      alt={order.tour.name}
                      className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-2xl object-cover shadow-sm border border-slate-100"
                    />
                  ) : (
                    <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-light border border-blue-100">
                      <Ticket size={24} className="text-brand" />
                    </div>
                  )}
                  <div className="min-w-0 flex flex-col justify-center py-0.5">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="truncate text-base font-bold text-slate-900">
                        {order.tour?.name || t("booking.tourBooking")}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(order.status)}`}
                      >
                        {order.status ?? t("common.pending")}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400 mb-2.5">
                      <span>{t("booking.orderNumber", { id: order.id })}</span>
                      {order.orderedAt && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                          <span>
                            {t("booking.bookedOn", {
                              date: new Date(order.orderedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }),
                            })}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <Calendar size={13} className="text-indigo-500" />
                        {order.schedule
                          ? new Date(order.schedule.departureDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : t("common.na")}
                        {" - "}
                        {order.schedule
                          ? new Date(order.schedule.returnDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : t("common.na")}
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <Users size={13} className="text-slate-400" />
                        {order.ticketCount}{" "}
                        {order.ticketCount === 1 ? t("booking.ticket") : t("booking.tickets")}
                      </span>
                      <span className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 font-bold text-emerald-600">
                        <Banknote size={13} />
                        {currencyFormatter.format(order.finalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  to={PATH.CUSTOMER.BOOKING_DETAIL(order.id)}
                  className="mt-2 sm:mt-0 flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700 !no-underline"
                >
                  {t("booking.details")}
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
          <div ref={ref} className="mt-4 flex w-full justify-center py-6">
            {isFetchingNextPage ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />
            ) : hasNextPage ? (
              <div className="h-8 w-8" />
            ) : (
              <div className="text-center text-sm font-medium text-slate-400">
                {t("booking.endOfBookings")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
