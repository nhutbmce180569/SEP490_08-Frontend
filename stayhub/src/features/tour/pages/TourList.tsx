import React, { useCallback, useMemo, useState } from "react";
import { Search, Pencil, Trash2, Plus, Eye, Star, Power, PowerOff, ListFilter, X } from "lucide-react";
import { Table, type Column } from "../../../components/dashboard/Table";
import { PaginationButton } from "../../../components/dashboard/PaginationButton";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { ConfirmDialog } from "../../../components/dashboard/ConfirmDialog";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useToast } from "../../../contexts/ToastContext";
import { useTours } from "../hooks/useTours";
import { type Tour } from "../types/tour";

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-600",
  Draft: "bg-slate-100 text-slate-600",
  Full: "bg-amber-50 text-amber-600",
  Banned: "bg-rose-50 text-rose-600",
};

export const TourList: React.FC = () => {
  const { t } = useTranslation();
  const { error: showError } = useToast();
  const [pageSize, setPageSize] = useState(5);
  const {
    data,
    isLoading,
    error,
    setPage,
    search,
    setSearch,
    categoryId,
    setCategoryId,
    createdByMe,
    setCreatedByMe,
    clearFilters,
    categories,
    isCategoryLoading,
    handleCreate,
    handleEdit,
    handleDelete,
    handleView,
    handleToggleStatus,
    togglingTourId,
  } = useTours(pageSize);
  const [tourStatusAction, setTourStatusAction] = useState<Tour | null>(null);

  const tours = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;
  const totalItems = data?.total || 0;
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const hasActiveFilters =
    search.trim() !== "" || categoryId !== null || createdByMe;

  const getStatusLabel = useCallback((status?: string | null) => {
    const map: Record<string, string> = {
      Active: t("common.active"),
      Draft: t("tour.draft"),
      Full: t("tour.full"),
      Banned: t("tour.banned"),
    };
    return map[status || "Draft"] ?? status ?? t("tour.draft");
  }, [t]);

  const handleEditClick = useCallback(
    (tour: Tour) => {
      if (tour.status === "Active") {
        showError(t("tour.inactiveBeforeEdit"));
        return;
      }

      handleEdit(tour.id);
    },
    [handleEdit, showError, t],
  );

  const handleConfirmToggleStatus = useCallback(async () => {
    if (!tourStatusAction) return;

    try {
      await handleToggleStatus(tourStatusAction);
    } finally {
      setTourStatusAction(null);
    }
  }, [handleToggleStatus, tourStatusAction]);

  const shouldActivateSelectedTour = tourStatusAction?.status !== "Active";

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
              <span className="text-[10px] font-medium">{t("tour.noImg")}</span>
            </div>
          ),
      },
      {
        header: t("tour.tourNameCol"),
        render: (tour) => (
          <span className="line-clamp-2 max-w-[200px] text-sm font-semibold text-slate-800">
            {tour.name}
          </span>
        ),
      },
      {
        header: t("tour.category"),
        render: (tour) => (
          <span className="text-sm text-slate-600">
            {categoryNameById.get(tour.categoryId) ?? `ID ${tour.categoryId}`}
          </span>
        ),
      },
      {
        header: t("common.status"),
        render: (tour) => (
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              STATUS_STYLES[tour.status || "Draft"] ??
              "bg-slate-100 text-slate-500"
            }`}
          >
            {getStatusLabel(tour.status)}
          </span>
        ),
      },
      {
        header: t("tour.rating"),
        render: (tour) => {
          const rating = tour.averageStar ?? 0;
          const displayRating = rating > 0 ? rating.toFixed(1) : t("tour.noRatings");
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
        header: t("common.actions"),
        render: (tour) => (
          <div className="flex items-center gap-1.5">
            <ActionButton
              variant="secondary"
              aria-label={t("tour.view")}
              onClick={() => handleView(tour.id)}
              className="h-8 w-8 text-brand hover:bg-brand-light hover:text-brand-hover"
            >
              <Eye className="h-3.5 w-3.5" />
            </ActionButton>
            {tour.status !== "Banned" && tour.canEdit && (
              <>
                <ActionButton
                  variant="secondary"
                  aria-label={tour.status === "Active" ? t("tour.deactivate") : t("tour.activate")}
                  title={tour.status === "Active" ? t("tour.deactivateTour") : t("tour.activateTour")}
                  onClick={() => setTourStatusAction(tour)}
                  disabled={togglingTourId === tour.id}
                  className={`h-8 w-8 ${
                    tour.status === "Active"
                      ? "text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                      : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                  } ${togglingTourId === tour.id ? "cursor-wait opacity-60" : ""}`}
                >
                  {tour.status === "Active" ? (
                    <PowerOff className="h-3.5 w-3.5" />
                  ) : (
                    <Power className="h-3.5 w-3.5" />
                  )}
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  aria-label={t("tour.edit")}
                  onClick={() => handleEditClick(tour)}
                  className="h-8 w-8"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </ActionButton>
                <ActionButton
                  variant="warning"
                  aria-label={t("tour.delete")}
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
    [
      t,
      getStatusLabel,
      categoryNameById,
      handleEditClick,
      handleDelete,
      handleView,
      togglingTourId,
    ],
  );

  return (
    <div className="rounded-2xl">
      {/* Card header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors sm:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder={t("tour.searchToursPlaceholderMgr")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors sm:w-56">
            <ListFilter className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <select
              className="w-full bg-transparent text-sm text-slate-700 outline-none disabled:text-slate-400"
              value={categoryId ?? ""}
              disabled={isCategoryLoading}
              onChange={(e) =>
                setCategoryId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">
                {isCategoryLoading ? t("tour.loadingCategories") : t("tour.allCategories")}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-white">
            <input
              type="checkbox"
              checked={createdByMe}
              onChange={(e) => setCreatedByMe(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand focus:ring-brand"
            />
            {t("tour.createdByMe")}
          </label>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 focus-within:bg-white transition-colors">
            <select
              className="bg-transparent text-sm text-slate-700 outline-none"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          <ActionButton
            variant="secondary"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="gap-2 px-4 py-2 text-sm"
          >
            <X className="h-4 w-4" />
            {t("tour.clear")}
          </ActionButton>
        </div>

        <div className="flex items-center shrink-0 mt-3 sm:mt-0">
          <ActionButton
            variant="primary"
            onClick={handleCreate}
            className="gap-2 px-4 py-2 text-sm whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            {t("tour.createTourBtn")}
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
          emptyMessage={t("tour.noToursFound")}
          isLoading={isLoading}
          skeletonRows={pageSize}
        />
      )}

      {/* Footer / Pagination */}
      <PaginationButton
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={!!tourStatusAction}
        onClose={() => setTourStatusAction(null)}
        onConfirm={handleConfirmToggleStatus}
        title={
          shouldActivateSelectedTour
            ? t("tour.activateTour")
            : t("tour.deactivateTour")
        }
        message={
          shouldActivateSelectedTour
            ? t("tour.activateTourConfirm", { name: tourStatusAction?.name ?? "" })
            : t("tour.deactivateTourConfirm", { name: tourStatusAction?.name ?? "" })
        }
        confirmText={
          shouldActivateSelectedTour ? t("tour.activate") : t("tour.deactivate")
        }
        variant={shouldActivateSelectedTour ? "primary" : "warning"}
        icon={
          shouldActivateSelectedTour ? (
            <Power className="h-6 w-6 text-brand" />
          ) : (
            <PowerOff className="h-6 w-6 text-rose-500" />
          )
        }
      />
    </div>
  );
};
