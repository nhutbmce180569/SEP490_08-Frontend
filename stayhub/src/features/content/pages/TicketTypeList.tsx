import React, { useEffect, useMemo, useState } from "react";
import { Lock, Pencil, Plus, Search, Ticket, Unlock } from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { Table, type Column } from "../../../components/dashboard/Table";
import { useChangeTicketTypeStatus } from "../hooks/useChangeTicketTypeStatus";
import { useTicketTypes } from "../hooks/useTicketTypes";
import type { ReadTicketTypeDTO } from "../types/ticketType";

const formatDate = (date?: string | null) => {
  if (!date) return "N/A";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "N/A";

  return parsed.toLocaleString();
};

export const TicketTypeList: React.FC = () => {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { data, isLoading, error, pageSize, setPage, handleCreate, handleEdit } =
    useTicketTypes(searchTerm);
  const { executeStatusChange, updatingId } = useChangeTicketTypeStatus();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== searchInput) {
        setPage(1);
        setSearchTerm(searchInput);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, searchTerm, setPage]);

  const ticketTypes = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;
  const totalItems = data?.total || 0;

  const columns: Column<ReadTicketTypeDTO>[] = useMemo(
    () => [
      {
        header: "Ticket Type",
        render: (ticketType) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-[#4880ff]">
              <Ticket className="h-5 w-5" />
            </div>
            <span className="font-semibold text-slate-800">{ticketType.name}</span>
          </div>
        ),
      },
      {
        header: "Description",
        render: (ticketType) => (
          <span
            className="block max-w-[320px] truncate text-sm text-slate-500"
            title={ticketType.description || undefined}
          >
            {ticketType.description || "N/A"}
          </span>
        ),
      },
      {
        header: "Status",
        render: (ticketType) => {
          const isActive = ticketType.isActive === true;

          return (
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          );
        },
      },
      {
        header: "Created",
        render: (ticketType) => (
          <span className="text-sm text-slate-500">{formatDate(ticketType.createdAt)}</span>
        ),
      },
      {
        header: "Updated",
        render: (ticketType) => (
          <span className="text-sm text-slate-500">{formatDate(ticketType.updatedAt)}</span>
        ),
      },
      {
        header: "Action",
        render: (ticketType) => {
          const isActive = ticketType.isActive === true;

          return (
            <div className="flex items-center gap-1.5">
              <ActionButton
                variant="secondary"
                onClick={() => executeStatusChange(ticketType.id, isActive)}
                className={`h-8 w-8 ${updatingId === ticketType.id ? "cursor-wait opacity-50" : ""} ${
                  isActive
                    ? "text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    : "text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
                title={isActive ? "Deactivate" : "Activate"}
                disabled={updatingId === ticketType.id}
              >
                {isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => handleEdit(ticketType.id)}
                className="h-8 w-8"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </ActionButton>
            </div>
          );
        },
      },
    ],
    [executeStatusChange, handleEdit, updatingId],
  );

  return (
    <div className="rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[15px] font-bold leading-tight text-slate-900">
          Ticket Type Management
        </h2>
        <ActionButton variant="primary" onClick={handleCreate} className="gap-2 px-4 py-2 text-sm">
          <Plus className="h-4 w-4" /> Add Ticket Type
        </ActionButton>
      </div>

      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket type name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-[#EB662B] focus:bg-white focus:ring-4 focus:ring-[#EB662B]/10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10 text-slate-500">Loading ticket types...</div>
      ) : error ? (
        <div className="flex justify-center p-10 text-rose-500">{error}</div>
      ) : (
        <Table
          data={ticketTypes}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage="No ticket types found."
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
