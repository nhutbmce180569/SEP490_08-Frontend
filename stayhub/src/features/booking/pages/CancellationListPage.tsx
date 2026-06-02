import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useCancellationRequests } from "../hooks/useCancellationRequests";
import type { CancellationRequestListDTO } from "../types/cancellation";
import { MANAGER_ROUTES } from "../../../config/routes/manager.routes";

const formatDate = (date?: string) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleString();
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

export const CancellationListPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data: requests, isLoading, error } = useCancellationRequests(statusFilter);
  const navigate = useNavigate();

  const columns: Column<CancellationRequestListDTO>[] = useMemo(
    () => [
      {
        header: "Request ID",
        render: (item) => (
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <FileText className="h-4 w-4 text-slate-400" /> #{item.id}
          </div>
        ),
      },
      {
        header: "Order ID",
        render: (item) => <span className="text-sm font-medium">#{item.orderId}</span>,
      },
      {
        header: "Requested At",
        render: (item) => <span className="text-sm text-slate-500">{formatDate(item.requestedAt)}</span>,
      },
      {
        header: "Refund Amount",
        render: (item) => <span className="font-semibold text-emerald-600">{formatCurrency(item.refundAmount)}</span>,
      },
      {
        header: "Status",
        render: (item) => {
          const isPending = item.status === "Pending";
          const isApproved = item.status === "Approved";
          return (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                isPending ? "bg-amber-50 text-amber-600" : isApproved ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
            >
              {isPending && <Clock className="h-3 w-3" />}
              {isApproved && <CheckCircle className="h-3 w-3" />}
              {!isPending && !isApproved && <XCircle className="h-3 w-3" />}
              {item.status}
            </span>
          );
        },
      },
      {
        header: "Action",
        render: (item) => (
          <ActionButton 
            variant="secondary" 
            className="h-8 w-8"
            title="Process Request"
            onClick={() => navigate(MANAGER_ROUTES.PROCESS_CANCELLATION(item.id))}
          >
            <Eye className="h-4 w-4" />
          </ActionButton>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div className="rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[15px] font-bold leading-tight text-slate-900">Tour Cancellation Requests</h2>
      </div>

      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10 text-slate-500">Loading requests...</div>
      ) : error ? (
        <div className="flex justify-center p-10 text-rose-500">Failed to load requests.</div>
      ) : (
        <Table data={requests || []} columns={columns} keyExtractor={(item) => item.id} emptyMessage="No cancellation requests found." />
      )}
    </div>
  );
};