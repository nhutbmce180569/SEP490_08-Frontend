import React, { useMemo } from "react";
import { Search, Pencil, Trash2, Plus, Eye, Star, Power } from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useTours } from "../hooks/useTours";
import { type Tour } from "../types/tour";

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-600",
  Draft: "bg-slate-100 text-slate-600",
  Full: "bg-amber-50 text-amber-600",
  Banned: "bg-rose-50 text-rose-600",
};

const PAGE_SIZE = 5;

export const TourList: React.FC = () => {
  const {
    data,
    isLoading,
    error,
    page,
    setPage,
    search,
    setSearch,
    handleCreate,
    handleEdit,
    handleDelete,
    handleView,
    handleToggleStatus,
    togglingTourId,
  } = useTours(PAGE_SIZE);

  const tours = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;
  const totalItems = data?.total || 0;

  const columns: Column<Tour>[] = useMemo(
    () => [
      {
        header: "",
        className: "w-24",
        render: (tour) =>
          tour.imageUrl ? (
            <img
              src={tour.imageUrl}
              alt={tour.name}
              className="h-10 w-10 min-w-[40px] shrink-0 rounded-lg border border-slate-100 object-cover bg-slate-100"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-100 text-slate-400">
              <span className="text-[10px] font-medium">No img</span>
            </div>
          ),
      },
      {
        header: "Tour Name",
        render: (tour) => (
          <span className="line-clamp-2 max-w-[200px] text-sm font-semibold text-slate-800">
            {tour.name}
          </span>
        ),
      },
      {
        header: "Description",
        render: (tour) => (
          <span className="line-clamp-2 max-w-[250px] text-sm text-slate-600">
            {tour.description || "No description"}
          </span>
        ),
      },
      // {
      //   header: "Category ID",
      //   render: (tour) => (
      //     <span className="text-sm text-slate-600">{tour.categoryId}</span>
      //   ),
      // },
      {
        header: "Status",
        render: (tour) => (
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              STATUS_STYLES[tour.status || "Draft"] ??
              "bg-slate-100 text-slate-500"
            }`}
          >
            {tour.status || "Draft"}
          </span>
        ),
      },
      {
        header: "Rating",
        render: (tour) => {
          const rating = tour.averageStar ?? 0;
          const displayRating = rating > 0 ? rating.toFixed(1) : "No ratings";
          return (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < Math.floor(rating)
                        ? "fill-amber-400 text-amber-400"
                        : i < rating
                          ? "fill-amber-200 text-amber-400"
                          : "text-slate-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-slate-600">
                {displayRating}
              </span>
            </div>
          );
        },
      },
      {
        header: "Action",
        render: (tour) => (
          <div className="flex items-center gap-1.5">
            <ActionButton
              variant="secondary"
              aria-label="View"
              onClick={() => handleView(tour.id)}
              className="h-8 w-8 text-brand hover:bg-brand-light hover:text-brand-hover"
            >
              <Eye className="h-3.5 w-3.5" />
            </ActionButton>
            {tour.status !== "Banned" && (
              <>
                <ActionButton
                  variant="secondary"
                  aria-label={tour.status === "Active" ? "Deactivate" : "Activate"}
                  title={tour.status === "Active" ? "Deactivate tour" : "Activate tour"}
                  onClick={() => handleToggleStatus(tour)}
                  disabled={togglingTourId === tour.id}
                  className={`h-8 w-8 ${
                    tour.status === "Active"
                      ? "text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                      : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                  } ${togglingTourId === tour.id ? "cursor-wait opacity-60" : ""}`}
                >
                  <Power className="h-3.5 w-3.5" />
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  aria-label="Edit"
                  onClick={() => handleEdit(tour.id)}
                  className="h-8 w-8"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </ActionButton>
                <ActionButton
                  variant="warning"
                  aria-label="Delete"
                  onClick={() => handleDelete(tour.id)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </ActionButton>
              </>
            )}
          </div>
        ),
      },
    ],
    [handleEdit, handleDelete, handleToggleStatus, handleView, togglingTourId],
  );

  return (
    <div className="rounded-2xl">
      {/* Card header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div>
            <h2 className="text-[15px] font-bold leading-tight text-slate-900">
              Tour Management
            </h2>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors sm:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Search tours..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
          </div>

          <ActionButton
            variant="primary"
            onClick={handleCreate}
            className="gap-2 px-4 py-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Create Tour
          </ActionButton>
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="flex justify-center p-10 text-rose-500">{error}</div>
      ) : (
        <Table
          data={tours}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage="No tours found."
          isLoading={isLoading}
          skeletonRows={PAGE_SIZE}
        />
      )}

      {/* Footer / Pagination */}
      <PaginationButton
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
};
