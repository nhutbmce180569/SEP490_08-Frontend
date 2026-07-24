import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useCancellationRequests } from "../hooks/useCancellationRequests";
import type { CancellationRequestListDTO } from "../types/cancellation";
import { MANAGER_ROUTES } from "../../../config/routes/manager.routes";
import { MoneyDisplay } from "../../currency/MoneyDisplay";
import { tourService } from "../../tour/services/tour.service";
import { DynamicText } from "../../../components/DynamicText";

const formatDate = (date?: string) => {
  if (!date) return "";
  return new Date(date).toLocaleString();
};



const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error && error.message ? error.message : fallback;
};

const getStatusDisplay = (status: string, t: any) => {
  if (!status) return "";
  const normalized = status.toLowerCase();
  if (normalized === "pending") return t("common.pending");
  if (normalized === "approved") return t("common.approved");
  if (normalized === "rejected") return t("common.rejected");
  if (normalized === "refunded") return t("common.refunded");
  if (normalized === "active") return t("common.active");
  if (normalized === "inactive") return t("common.inactive");
  if (normalized === "cancelled" || normalized === "canceled") return t("common.cancelled");
  if (normalized === "completed") return t("common.completed");
  if (normalized === "draft") return t("common.draft") || "Bản nháp";
  return status;
};

export const CancellationListPage: React.FC = () => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [tourIdFilter, setTourIdFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { data, isLoading, error } = useCancellationRequests(statusFilter, dateFilter, tourIdFilter, page, pageSize);
  const navigate = useNavigate();

  const { data: myTours = [] } = useQuery({
    queryKey: ["myToursDropdown"],
    queryFn: () => tourService.getAllToursForDropdown(),
  });

  const rawRequests = data?.data ?? [];
  const requests = useMemo(() => {
    if (!dateFilter) return rawRequests;
    return rawRequests.filter((item) => {
      if (!item.requestedAt) return false;
      try {
        const itemDate = new Date(item.requestedAt).toISOString().slice(0, 10);
        return itemDate === dateFilter;
      } catch {
        return false;
      }
    });
  }, [rawRequests, dateFilter]);

  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.currentPage ?? page;
  const totalItems = data?.total ?? 0;

  const columns: Column<CancellationRequestListDTO>[] = useMemo(
    () => [
      {
        header: t("booking.orderId"),
        render: (item) => (
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <FileText className="h-4 w-4 text-slate-400" /> #{item.orderId}
          </div>
        ),
      },
      {
        header: t("booking.tour") || "Tour",
        render: (item) => (
          <div className="flex flex-col max-w-[220px]">
            <span className="font-medium text-slate-800 text-sm truncate" title={item.tourName || ""}>
              {item.tourName ? <DynamicText text={item.tourName} /> : t("common.na")}
            </span>
            {item.tourId && <span className="text-[11px] text-slate-400">ID: #{item.tourId}</span>}
          </div>
        ),
      },
      {
        header: t("booking.requestedAt"),
        className: "text-right",
        render: (item) => <div className="text-sm text-slate-500">{formatDate(item.requestedAt) || t("common.na")}</div>,
      },
      {
        header: t("booking.refundAmount"),
        className: "text-right",
        render: (item) => <div className="font-semibold text-emerald-600"><MoneyDisplay amountVnd={item.refundAmount ?? 0} compact /></div>,
      },
      {
        header: t("common.status"),
        render: (item) => {
          const normalizedStatus = item.status?.toLowerCase();
          const isPending = normalizedStatus === "pending";
          const isApproved = normalizedStatus === "approved";
          const isRefunded = normalizedStatus === "refunded";

          return (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                isPending
                  ? "bg-amber-50 text-amber-600"
                  : isApproved || isRefunded
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
              }`}
            >
              {isPending ? (
                <Clock className="h-3 w-3" />
              ) : isApproved || isRefunded ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {getStatusDisplay(item.status, t)}
            </span>
          );
        },
      },
      {
        header: t("common.actions"),
        render: (item) => {
          return (
            <div className="flex items-center gap-2">
              <ActionButton
                variant="secondary"
                className="h-9 w-9"
                title={t("booking.processRequest")}
                onClick={() => navigate(MANAGER_ROUTES.PROCESS_CANCELLATION(item.id))}
              >
                <Eye className="h-4 w-4" />
              </ActionButton>
            </div>
          );
        },
      },
    ],
    [t, navigate],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap flex-1 items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white shrink-0">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="bg-transparent text-sm text-slate-700 outline-none"
            >
              <option value="">{t("booking.allStatuses")}</option>
              <option value="Pending">{getStatusDisplay("Pending", t)}</option>
              <option value="Approved">{getStatusDisplay("Approved", t)}</option>
              <option value="Rejected">{getStatusDisplay("Rejected", t)}</option>
              <option value="Refunded">{getStatusDisplay("Refunded", t)}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white shrink-0 w-full sm:w-64">
            <select
              value={tourIdFilter}
              onChange={(event) => {
                setTourIdFilter(event.target.value);
                setPage(1);
              }}
              className="bg-transparent text-sm text-slate-700 outline-none w-full truncate"
              title={t("booking.filterByTour") || "Lọc theo tour"}
            >
              <option value="">{t("booking.allTours") || "Tất cả các tour"}</option>
              {myTours.map((tour) => (
                <option key={tour.id} value={tour.id}>
                  #{tour.id} - <DynamicText text={tour.name} />
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white shrink-0">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-sm text-slate-700 outline-none"
              title={t("booking.requestedAt")}
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => {
                  setDateFilter("");
                  setPage(1);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold"
                title={t("common.clearFilter") || "Clear"}
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-slate-400 focus-within:bg-white shrink-0">
            <select
              className="bg-transparent text-sm text-slate-700 outline-none"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5 {t("common.perPage")}</option>
              <option value={10}>10 {t("common.perPage")}</option>
              <option value={20}>20 {t("common.perPage")}</option>
              <option value={50}>50 {t("common.perPage")}</option>
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex justify-center p-10 text-rose-500">
          {getErrorMessage(error, t("booking.failedLoadRequests"))}
        </div>
      ) : (
        <Table
          data={requests}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage={t("booking.noCancellationRequests")}
          isLoading={isLoading}
          skeletonRows={pageSize}
        />
      )}

      <PaginationButton
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
};
